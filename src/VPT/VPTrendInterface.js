/**
 * Created by Jan on 11.1.2019
 */

M3D.VPTrendInterface = class {
    // ============================ LIFECYCLE ============================ //
    constructor(vptGlobalData, gl, glManager) {
        CommonUtils.extend(this);
        this._setupVars();
        this._vptGData = vptGlobalData;
        this._gl = gl;
        this._glManager = glManager;
    }

    setup() {
        var gl = this._gl;
        this._extColorBufferFloat = gl.getExtension('EXT_color_buffer_float');

        if (!this._extColorBufferFloat) {
            console.error('EXT_color_buffer_float not supported!');
        }

        this._program = WebGLUtils.compileShaders(gl, {
            quad: SHADERS.quad
        }, MIXINS).quad;

        this._clipQuad = WebGLUtils.createClipQuad(gl);

        //First selection
        this._renderer_EAM = new V_EAMRenderer(this._gl);
        this._renderer_ISO = new V_ISORenderer(this._gl);
        this._renderer_MCS = new V_MCSRenderer(this._gl);
        this._renderer_MIP = new V_MIPRenderer(this._gl);
        this._renderers = [null, this._renderer_EAM, this._renderer_ISO, this._renderer_MCS, this._renderer_MIP, null]
        this._RHToneMapper = new ReinhardToneMapper(this._gl, null);
        this._RaToneMapper = new RangeToneMapper(this._gl, null);
    }

    /**
     * Cleans up assets for new scene.
     */
    reset() {
        var objects = this._vptGData.vptBundle.objects;
        while (objects.length !== 0) {
            var object = objects.pop();
            object.switchRenderModes(false);
            var tex = object.material.maps[0];
            this._glManager._textureManager.clearTexture(tex);
        }
        this._vptGData.vptBundle.mccStatus = false;
        this._vptGData.vptBundle.resetBuffers = true;
        this._vptGData._updateUIsidebar();
    }

    _setupVars() {
        this._lastCamera = null;
        this._cameraListener = new M3D.UpdateListener(function (update) { this._isDirty = true; }, null, null, null, function (update) { this._isDirty = true; });
        this._renderer_EAM = null;
        this._renderer_ISO = null;
        this._renderer_MCS = null;
        this._renderer_MIP = null;
        this._renderers = null;
        this._RHToneMapper = null;
        this._RaToneMapper = null;
        this._program = null;
        this._clipQuad = null;
        this._extColorBufferFloat = null;
        this._softReset = false;
    }

    // ============================ M3D controls ============================ //
    renderObjects(objects, camera, viewport, restoreFB) {
        //Init
        if (camera instanceof M3D.OrthographicCamera)
            return;

        // == Camera updates setup == //
        if (this._lastCamera != camera) {
            //Unsubscribe from last camera
            if (this._lastCamera) {
                this._lastCamera.removeOnChangeListener(this._cameraListener);
            }
            this._lastCamera = camera;
            this._lastCamera._isDirty = true;
            this._lastCamera.addOnChangeListener(this._cameraListener);
        }
        //
        var gl = this._gl;

        //Parses VPT's objects - In collaboration, objects might change...
        this._parseObjects(objects);
        //Parse UI settings - Set renderer according to UI settings.
        this._parseSettings();

        var renderer = this._renderers[this._vptGData.vptBundle.rendererChoiceID];

        //var savedState = this._saveGLstate(gl);
        //console.time("rendVPT");

        for (var i = 0; i < objects.length; i++) {
            var object = objects[i];

            object.switchRenderModes(this._vptGData.vptBundle.useMCC && this._vptGData.vptBundle.mccStatus);
            if (!renderer) continue;

            //Set flags for mesh renderer. Skip object if no work in vpt renderer is needed.. ex. blendMeshRatio = 100%
            if (!this._setMeshRenderFlags(renderer, object)) {
                continue;
            }

            //Different renderer than last time - hardResetBuffers
            if (this._vptGData.vptBundle.resetBuffers || this._vptGData.vptBundle.rendererChoiceID != object.lastRenderTypeID || renderer._bufferSize !== this._RHToneMapper._bufferSize) {
                this._hardResetBuffers(renderer, object);
            }

            //Remake output buffer if canvas viewport size changes
            if (!object._outputBuffer || viewport.width  != object._outputBuffer._bufferOptions.width || viewport.height  != object._outputBuffer._bufferOptions.height) {
                this._hardResetOutputBuffer(object, viewport.width, viewport.height);
            }

            //Link object's render FB texture to tonemapper(s)
            this._RHToneMapper.setTexture(object.renderBuffer.getTexture());
            this._RaToneMapper.setTexture(this._RHToneMapper.getTexture());

            //set  matrix
            if (camera._isDirty || object._isDirty || this._softReset) {
                var cameraProjectionWorldMatrix = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
                var centerTranslation = new THREE.Matrix4().makeTranslation(-0.5, -0.5, -0.5);
                var volumeTranslation = new THREE.Matrix4().makeTranslation(object.positionX, object.positionY, object.positionZ);
                var volumeScale = new THREE.Matrix4().makeScale(object.scale.x, object.scale.y, object.scale.z);

                var tr = new THREE.Matrix4();   //MVP projection matrix
                tr.multiplyMatrices(volumeScale, centerTranslation);
                tr.multiplyMatrices(volumeTranslation, tr);
                tr.multiplyMatrices(cameraProjectionWorldMatrix, tr);

                tr.getInverse(tr, true);
                object.lastMVPMatrix = new Matrix(tr.elements);

                //reset object's accumulation
                gl.bindBuffer(gl.ARRAY_BUFFER, this._clipQuad);
                gl.enableVertexAttribArray(0); // position always bound to attribute 0
                gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

                object.accumulationBuffer.use();
                renderer._resetFrame();
                object.accumulationBuffer.swap();
                //


                camera._isDirty = false;
                object._isDirty = false;
            }

            //Bind object references
            this._linkObjectReferencedToRenderer(renderer, object);
            renderer.render();
            this._unlinkObjectFromRenderer(renderer);
            this._RHToneMapper.render();
            this._RaToneMapper.render();


            var program = this._program;
            gl.useProgram(program.program);
            object._outputBuffer.use();
            gl.bindBuffer(gl.ARRAY_BUFFER, this._clipQuad);
            var aPosition = program.attributes.aPosition;
            gl.enableVertexAttribArray(aPosition);
            gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this._RaToneMapper.getTexture());
            gl.uniform1i(program.uniforms.uTexture, 0);
            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

            gl.disableVertexAttribArray(aPosition);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindTexture(gl.TEXTURE_2D, null);

            //Update object's texture.
            this._setObjectMaterialTexture(object);
        }
        //console.timeEnd("rendVPT");
        this._vptGData.vptBundle.resetBuffers = false;
        this._softReset = false;

        if(restoreFB){
            gl.bindFramebuffer(gl.FRAMEBUFFER, restoreFB)
        }
        //this._restoreGLstate(gl, savedState);
    }

    // ============================ INSTANCE METHODS ============================ //

    // ==== Pre and post render methods, that link and unlink object's buffers to render ==== //

    _linkObjectReferencedToRenderer(renderer, object) {
        renderer._mvpInverseMatrix = object.lastMVPMatrix;
        renderer._frameBuffer = object.frameBuffer;
        renderer._accumulationBuffer = object.accumulationBuffer;
        renderer._renderBuffer = object.renderBuffer;
        renderer._clipQuad = this._clipQuad;
        renderer._volumeTexture = object.volumeTexture;
        renderer._environmentTexture = object.environmentTexture;
    }

    _unlinkObjectFromRenderer(renderer) {
        renderer._mvpInverseMatrix = null;
        renderer._frameBuffer = null;
        renderer._accumulationBuffer = null;
        renderer._renderBuffer = null;
        renderer._clipQuad = null;
        renderer._volumeTexture = null;
        renderer._environmentTexture = null;
    }


    // ==== Volume object setup and un setup ==== //

    __setupVolumeTexture(object) {
        var gl = this._gl;
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        object._volumeTexture = WebGLUtils.createTexture(gl, {
            target: gl.TEXTURE_3D,
            width: 1,
            height: 1,
            depth: 1,
            data: new Float32Array([1]),
            format: gl.RED,
            internalFormat: gl.R16F,
            type: gl.FLOAT,
            wrapS: gl.CLAMP_TO_EDGE,
            wrapT: gl.CLAMP_TO_EDGE,
            wrapR: gl.CLAMP_TO_EDGE,
            min: gl.LINEAR,
            mag: gl.LINEAR
        });

        object._environmentTexture = WebGLUtils.createTexture(gl, {
            width: 1,
            height: 1,
            data: new Uint8Array([255, 255, 255, 255]),
            format: gl.RGBA,
            internalFormat: gl.RGBA, // TODO: HDRI & OpenEXR support
            type: gl.UNSIGNED_BYTE,
            wrapS: gl.CLAMP_TO_EDGE,
            wrapT: gl.CLAMP_TO_EDGE,
            min: gl.LINEAR,
            max: gl.LINEAR
        });

        // TODO: texture class, to avoid duplicating texture specs
        gl.bindTexture(gl.TEXTURE_3D, object._volumeTexture);
        gl.texImage3D(gl.TEXTURE_3D, 0, gl.R16F,
            object._width, object._height, object._depth,
            0, gl.RED, gl.FLOAT, object._data);
        gl.bindTexture(gl.TEXTURE_3D, null);
    }

    __setupBuffers(renderer, object) {
        //Buffers set => destroy old ones
        if (object._frameBuffer) {
            object._frameBuffer.destroy();
            object._accumulationBuffer.destroy();
            object._renderBuffer.destroy();
            this._gl.deleteBuffer(this._clipQuad);
        }

        //set new ones
        object._frameBuffer = new SingleBuffer(this._gl, renderer._getFrameBufferOptions());
        object._accumulationBuffer = new DoubleBuffer(this._gl, renderer._getAccumulationBufferOptions());
        object._renderBuffer = new SingleBuffer(this._gl, renderer._getRenderBufferOptions());
        this._clipQuad = new WebGLUtils.createClipQuad(this._gl);
    }

    __resizeToneMapperBuffer(toneMapper, newBufferSize) {
        if (toneMapper._bufferSize !== newBufferSize) {
            toneMapper._renderBuffer.destroy();
            toneMapper._bufferSize = newBufferSize;
            toneMapper._renderBuffer = new SingleBuffer(toneMapper._gl, toneMapper._getRenderBufferOptions());
        }
    }

    _hardResetBuffers(renderer, object) {
        this.__setupBuffers(renderer, object);
        this.__setupVolumeTexture(object);
        //Resize toneMappers if needed
        this.__resizeToneMapperBuffer(this._RHToneMapper, renderer._bufferSize);
        this.__resizeToneMapperBuffer(this._RaToneMapper, renderer._bufferSize)

        object._lastRendererTypeID = renderer._type_id;
        this._vptGData.vptBundle.resetMVP = true;
    }

    _hardResetOutputBuffer(object, viewportWidth, viewportHeight) {
        if (object._outputBuffer) {
            object._outputBuffer.destroy();
        }

        object._outputBuffer = new SingleBuffer(this._gl, {
            width: viewportWidth,
            height: viewportHeight,
            min: this._gl.LINEAR,
            mag: this._gl.LINEAR,
            wrapS: this._gl.CLAMP_TO_EDGE,
            wrapT: this._gl.CLAMP_TO_EDGE,
            format: this._gl.RGBA,
            internalFormat: this._gl.RGBA16F,
            type: this._gl.FLOAT
        });
    }

    // ==== Saved and restore GL state ==== //

    _saveGLstate(gl) {
        return {
            viewport: gl.getParameter(gl.VIEWPORT),
            framebuffer: gl.getParameter(gl.FRAMEBUFFER_BINDING),
            cullFace: gl.getParameter(gl.CULL_FACE),
            cullFaceMode: gl.getParameter(gl.CULL_FACE_MODE)
        };
    }

    _restoreGLstate(gl, state) {
        gl.viewport(state.viewport[0], state.viewport[1], state.viewport[2], state.viewport[3]);
        gl.bindFramebuffer(gl.FRAMEBUFFER, state.framebuffer);
        if (state.cullFace) {
            gl.enable(gl.CULL_FACE);
            gl.cullFace(state.cullFaceMode);
        } else {
            gl.disable(gl.CULL_FACE);
        }
    }

    /**
     * Checks for object changes
     * @param {VPT} objects 
     */
    _parseObjects(objects) { //TODO
        if (objects.length !== this._vptGData.vptBundle.objects.length) {   //Maybe not a good method
            this._vptGData.vptBundle.objects = objects; //This causes angularjs to not update UI values for ng-disabled
            this._vptGData._updateUIsidebar();
        }

    }

    /**
     * Parses vptGData for new settings
     */
    _parseSettings() {
        var settings = this._vptGData.vptBundle;

        this._softReset = settings.resetMVP;
        this._vptGData.vptBundle.resetMVP = false;

        this._renderer_EAM._background = settings.eam.background;
        this._renderer_EAM._blendMeshRatio = settings.eam.blendMeshRatio;
        this._renderer_EAM._meshLightning = settings.eam.meshLight;
        this._renderer_EAM._blendMeshColor[0] = settings.eam.blendMeshColor.r;
        this._renderer_EAM._blendMeshColor[1] = settings.eam.blendMeshColor.g;
        this._renderer_EAM._blendMeshColor[2] = settings.eam.blendMeshColor.b;
        this._renderer_EAM._bufferSize = settings.eam.resolution;
        this._renderer_EAM._stepSize = 1 / settings.eam.steps;
        this._renderer_EAM._alphaCorrection = settings.eam.alphaCorrection;
        if (settings.eam.tfBundle.uuid != this._renderer_EAM._lastTFuuid) {
            this._renderer_EAM.setTransferFunction(settings.eam.tfBundle.bumps.length > 0 ? settings.eam.tf : null);
            this._renderer_EAM._lastTFuuid = settings.eam.tfBundle.uuid;
        }

        this._renderer_ISO._background = settings.iso.background;
        this._renderer_ISO._blendMeshRatio = settings.iso.blendMeshRatio;
        this._renderer_ISO._meshLightning = settings.iso.meshLight;
        this._renderer_ISO._blendMeshColor[0] = settings.iso.blendMeshColor.r;
        this._renderer_ISO._blendMeshColor[1] = settings.iso.blendMeshColor.g;
        this._renderer_ISO._blendMeshColor[2] = settings.iso.blendMeshColor.b;
        this._renderer_ISO._bufferSize = settings.iso.resolution;
        this._renderer_ISO._stepSize = 1 / settings.iso.steps
        this._renderer_ISO._isovalue = settings.iso.isoVal;
        this._renderer_ISO._diffuse[0] = settings.iso.color.r;
        this._renderer_ISO._diffuse[1] = settings.iso.color.g;
        this._renderer_ISO._diffuse[2] = settings.iso.color.b;

        if (this._renderer_MCS._background != settings.mcs.background)
            this._softReset = true;
        this._renderer_MCS._background = settings.mcs.background;
        this._renderer_MCS._blendMeshRatio = settings.mcs.blendMeshRatio;
        this._renderer_MCS._meshLightning = settings.mcs.meshLight;
        this._renderer_MCS._blendMeshColor[0] = settings.mcs.blendMeshColor.r;
        this._renderer_MCS._blendMeshColor[1] = settings.mcs.blendMeshColor.g;
        this._renderer_MCS._blendMeshColor[2] = settings.mcs.blendMeshColor.b;
        this._renderer_MCS._bufferSize = settings.mcs.resolution;
        this._renderer_MCS._sigmaMax = settings.mcs.sigma
        this._renderer_MCS._alphaCorrection = settings.mcs.alphaCorrection;
        if (settings.mcs.tfBundle.uuid != this._renderer_MCS._lastTFuuid) {
            this._renderer_MCS.setTransferFunction(settings.mcs.tfBundle.bumps.length > 0 ? settings.mcs.tf : null);
            this._renderer_MCS._lastTFuuid = settings.mcs.tfBundle.uuid;
        }

        this._renderer_MIP._background = settings.mip.background;
        this._renderer_MIP._blendMeshRatio = settings.mip.blendMeshRatio;
        this._renderer_MIP._meshLightning = settings.mip.meshLight;
        this._renderer_MIP._blendMeshColor[0] = settings.mip.blendMeshColor.r;
        this._renderer_MIP._blendMeshColor[1] = settings.mip.blendMeshColor.g;
        this._renderer_MIP._blendMeshColor[2] = settings.mip.blendMeshColor.b;
        this._renderer_MIP._bufferSize = settings.mip.resolution;
        this._renderer_MIP._stepSize = 1 / settings.mip.steps;

        this._RHToneMapper._exposure = settings.reinhard.exposure;
        this._RaToneMapper._min = 1 - settings.range.rangeHigher;
        this._RaToneMapper._max = 1 - settings.range.rangeLower;
    }

    /**
     * Sets flags for mesh renderer, returns false if no further work is needed in renderer. 
     * @param renderer 
     * @param  object 
     */
    _setMeshRenderFlags(renderer, object) {
        object.material.color = renderer._blendMeshColor;   //TODO: only if changed?
        object.material.setUniform("material.diffuse", object.material.color)
        object.material.setUniform("meshBlendRatio", renderer._blendMeshRatio);
        object.material.setUniform("meshLight", renderer._meshLightning);
        object.material.setUniform("background", renderer._background);
        return renderer._blendMeshRatio < 0.995 ? true : false;
    }


    /**
     * Updates object's texture to match it's vpt output buffer.
     * @param {M3D.VPTVolume} object 
     */
    _setObjectMaterialTexture(object) {
        var tex = object.material.maps[0];

        tex._glTex = object._outputBuffer.getTexture();
        tex._dirty = false;
        this._glManager._textureManager._cached_textures.set(tex, tex._glTex); //todo: better way....
    }

    /**
     * Sets mcc geometry to object. Importantly it releases old one and gc it.
     * @param {} VPTVolume 
     * @param {*} geometry 
     */
    setMCCGeometryToObject(object, geometry) {
        if (!object instanceof M3D.VPTVolume) return;

        if (object._mccGeometry) {
            let geometry = object._mccGeometry;
            if (geometry.indices !== null)
                this._glManager.cleanAttributeBuffer(geometry.indices);
            if (geometry.vertices !== null)
                this._glManager.cleanAttributeBuffer(geometry.vertices);
            if (geometry.drawWireframe)
                this._glManager.cleanAttributeBuffer(geometry.wireframeIndices);
            if (geometry.normals !== null)
                this._glManager.cleanAttributeBuffer(geometry.normals);
            if (geometry._vertColor !== null)
                this._glManager.cleanAttributeBuffer(geometry._vertColor);
            if (geometry._uv !== null)
                this._glManager.cleanAttributeBuffer(geometry._uv);
        }
        object._mccGeometry = geometry;
    }
}
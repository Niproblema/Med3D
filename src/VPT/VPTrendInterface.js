/**
 * Created by Jan on 11.1.2019
 */

M3D.VPTrendInterface = class {
    // ============================ LIFECYCLE ============================ //
    constructor(prd, gl) {
        CommonUtils.extend(this);
        this._setupVars();
        this._publicRenderData = prd;
        this._gl = gl;
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
        this._renderers = [null, this._renderer_EAM, this._renderer_ISO, this._renderer_MCS, this._renderer_MIP]
        this._toneMapper = new ReinhardToneMapper(this._gl, null);
    }

    _setupVars() {
        this._lastCamera = null;
        this._cameraListener = new M3D.UpdateListener(function (update) { this._isDirty = true; });
        this._renderer_EAM = null;
        this._renderer_ISO = null;
        this._renderer_MCS = null;
        this._renderer_MIP = null;
        this._renderers = null;
        this._toneMapper = null;
        this._transferFunction = null;  //TODO - This should be set for each object individually
        this._program = null;
        this._clipQuad = null;
        this._extColorBufferFloat = null;
        this._softReset = false;
    }

    // ============================ M3D controls ============================ //
    renderObjects(objects, camera, glManager) {
        //Init
        if (camera instanceof M3D.OrthographicCamera)
            return;

        if (this._publicRenderData.vptRendererChoice == 0) {
            console.error("Volume renderer not selected by the UI, cannot render.");
            return;
        }

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
        var renderer = this._renderers[this._publicRenderData.vptBundle.rendererChoiceID];

        var savedState = this._saveGLstate(gl);

        this._parseSettings();

        for (var i = 0; i < objects.length; i++) {
            var object = objects[i];

            //Different renderer than last time - hardResetBuffers
            if (this._publicRenderData.vptBundle.rendererChoiceID != object.lastRenderTypeID) {
                this._hardResetBuffers(renderer, object);
            }

            this._toneMapper.setTexture(object.renderBuffer.getTexture());


            //set  matrix
            if (camera._isDirty || object._isDirty || this._softReset) {    //TODO: condition camera == dirty || object == dirty
                var cameraProjectionWorldMatrix = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
                var centerTranslation = new THREE.Matrix4().makeTranslation(-0.5, -0.5, -0.5); //todo: does this scale?
                var volumeTranslation = new THREE.Matrix4().makeTranslation(object.positionX, object.positionY, object.positionZ);
                var volumeScale = new THREE.Matrix4().makeScale(object.scale.x, object.scale.y, object.scale.z);

                var tr = new THREE.Matrix4();   //MVP projection matrix
                tr.multiplyMatrices(volumeScale, centerTranslation);
                tr.multiplyMatrices(volumeTranslation, tr);
                tr.multiplyMatrices(cameraProjectionWorldMatrix, tr);

                tr.getInverse(tr, true);
                object.lastMVPMatrix = new Matrix(tr.elements);

                //reset object's accumulation
                gl.bindBuffer(gl.ARRAY_BUFFER, object.clipQuad);
                gl.enableVertexAttribArray(0); // position always bound to attribute 0
                gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

                object.accumulationBuffer.use();
                renderer._resetFrame();
                object.accumulationBuffer.swap();
                camera._isDirty = false;
                object._isDirty = false;
                this._softReset = false;
            }
            //Bind object references
            this._linkObjectReferencedToRenderer(renderer, object);
            renderer.render();
            this._unlinkObjectFromRenderer(renderer);
            this._toneMapper.render();

            //gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);   
            var program = this._program;
            gl.useProgram(program.program);
            //gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            object._outputBuffer.use();
            gl.bindBuffer(gl.ARRAY_BUFFER, object.clipQuad);
            var aPosition = program.attributes.aPosition;
            gl.enableVertexAttribArray(aPosition);
            gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this._toneMapper.getTexture());
            gl.uniform1i(program.uniforms.uTexture, 0);
            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

            gl.disableVertexAttribArray(aPosition);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindTexture(gl.TEXTURE_2D, null);

            //Update object's texture.
            this._setObjectMaterialTexture(object, glManager);
        }
        this._restoreGLstate(gl, savedState);
    }


    getRenderer() {
        return this._renderer;
    }

    getToneMapper() {
        return this._toneMapper;
    }


    // ============================ INSTANCE METHODS ============================ //

    // ==== Pre and post render methods, that link and unlink object's buffers to render ==== //

    _linkObjectReferencedToRenderer(renderer, object) {
        renderer._mvpInverseMatrix = object.lastMVPMatrix;
        renderer._frameBuffer = object.frameBuffer;
        renderer._accumulationBuffer = object.accumulationBuffer;
        renderer._renderBuffer = object.renderBuffer;
        renderer._clipQuad = object._clipQuad;
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
            object._outputBuffer.destroy();
        }

        //set new ones
        object._frameBuffer = new SingleBuffer(this._gl, renderer._getFrameBufferOptions());
        object._accumulationBuffer = new DoubleBuffer(this._gl, renderer._getAccumulationBufferOptions());
        object._renderBuffer = new SingleBuffer(this._gl, renderer._getRenderBufferOptions());
        object._outputBuffer = new SingleBuffer(this._gl, {
            width: this._gl.drawingBufferWidth,
            height: this._gl.drawingBufferHeight,
            min: this._gl.LINEAR,
            mag: this._gl.LINEAR,
            wrapS: this._gl.CLAMP_TO_EDGE,
            wrapT: this._gl.CLAMP_TO_EDGE,
            format: this._gl.RGBA,
            internalFormat: this._gl.RGBA16F,
            type: this._gl.FLOAT
        });
        object._clipQuad = new WebGLUtils.createClipQuad(this._gl);
    }

    _hardResetBuffers(renderer, object) {
        this.__setupBuffers(renderer, object);
        this.__setupVolumeTexture(object);
        object._lastRendererTypeID = renderer._type_id;
    }

    // ==== Saved and restore GL state ==== //

    _saveGLstate(gl) {
        return {
            viewport: gl.getParameter(gl.VIEWPORT),
            framebuffer: gl.getParameter(gl.FRAMEBUFFER_BINDING)
        };
    }

    _restoreGLstate(gl, state) {

        gl.viewport(state.viewport[0], state.viewport[1], state.viewport[2], state.viewport[3]);
        gl.bindFramebuffer(gl.FRAMEBUFFER, state.framebuffer);
    }

    /**
     * Parses publicRenderData for new settings
     */
    _parseSettings() {
        var settings = this._publicRenderData.vptBundle;

        this._softReset = settings.resetRequest;
        this._publicRenderData.vptBundle.resetRequest = false;

        this._renderer_EAM._stepSize = 1 / settings.eam.steps;
        this._renderer_EAM._alphaCorrection = settings.eam.alphaCorrection;
        if (settings.eam.tf)
            this._renderer_EAM.setTransferFunction(settings.eam.tf);

        this._renderer_ISO._stepSize = 1 / settings.iso.steps
        this._renderer_ISO._isovalue = settings.iso.isoVal;
        this._renderer_ISO._diffuse[0] = settings.iso.color.r;
        this._renderer_ISO._diffuse[1] = settings.iso.color.g;
        this._renderer_ISO._diffuse[2] = settings.iso.color.b;

        this._renderer_MCS._sigmaMax = settings.mcs.sigma
        this._renderer_MCS._alphaCorrection = settings.mcs.alphaCorrection;
        if (settings.mcs.tf)
            this._renderer_MCS.setTransferFunction = settings.mcs.tf;

        this._renderer_MIP._stepSize = 1/settings.mip.steps;

        this._toneMapper._exposure = settings.reinhard.exposure;
        //todo: rangeToneMapper is not enabled.
        //this._toneMapper._min  = settings.range.rangeLower;
        //this._toneMapper._max  = settings.range.rangeHigher;
    }


    /**
     * Updates object's texture to match it's vpt output buffer.
     * @param {M3D.VPTVolume} object 
     */
    _setObjectMaterialTexture(object, glManager){
        var tex = object.material.maps[0];


        tex._glTex = object._outputBuffer.getTexture();
        tex._dirty = false;
        glManager._textureManager._cached_textures.set(tex, tex._glTex); //todo: better way....
    }
}
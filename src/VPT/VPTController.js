/**
 * Created by Jan on 2.7.2018.
 */


/**  
 * Controller for Volumetric path tracing tool - VPT
 * @class VPT
 */
M3D.VPTController = class {
    // ============================ LIFECYCLE ============================ //
    constructor(PublicRenderData) {
        CommonUtils.extend(this);
        this._render = this._render.bind(this);
        this.publicRenderData = PublicRenderData;
        this._webglcontextlostHandler = this._webglcontextlostHandler.bind(this);
        this._webglcontextrestoredHandler = this._webglcontextrestoredHandler.bind(this);
        this._nullify();

        this._canvas = document.createElement('canvas');
        //TODO: test only
        this._canvas.style.right = "0px";
        this._canvas.style.left = "50%";
        this._canvas.style.float = "right";

        $(document.body).append(this._canvas);
        $(window).resize(function () {
            var width = window.innerWidth;
            var height = window.innerHeight;
        }.bind(this));
        $(window).resize();
        //
        this._initGL();

        this._contextRestorable = true;

        this._canvas.addEventListener('webglcontextlost', this._webglcontextlostHandler);
        this._canvas.addEventListener('webglcontextrestored', this._webglcontextrestoredHandler);

        this._renderer = new MCSRenderer(this._gl, this._volumeTexture, this._environmentTexture);
        this._toneMapper = new ReinhardToneMapper(this._gl, this._renderer.getTexture());

        this._activeCameraListener = new M3D.UpdateListener(function (update) { this.isDirty = true; });
    }

    _nullify() {
        this._canvas = null;
        this.isRunning = false;
        this._camera = null;
        this._renderer = null;
        this._toneMapper = null;
        this._m3dVolumeObject = null;
        this._sceneReady = false;
        this._isMvpSet = false;
        this._nullifyGL();
    }

    destroy() {
        this.stopRendering();
        this._destroyGL();
        this._canvas.removeEventListener('webglcontextlost', this._webglcontextlostHandler);
        this._canvas.removeEventListener('webglcontextrestored', this._webglcontextrestoredHandler);
        if (this._canvas.parentNode) {
            this._canvas.parentNode.removeChild(this._canvas);
        }
        this._toneMapper.destroy();
        this._renderer.destroy();
        this._nullify();
    }

    // ============================ M3D controls ============================ //

    resetScene() {
        if (this._render != null) {
            this.stopRendering();
            this.publicRenderData.vptSceneChangedListener();    //Notifies sidebar directive - disables buttons
        }
        this._m3dVolumeObject = null;
        this._sceneReady = false;
    }

    setNewActiveCamera(camera) {
        if (this._camera != null)
            this._camera._updateListenerManager.removeListener(this._activeCameraListener);

        this._camera = camera;
        this._camera.addOnChangeListener(this._activeCameraListener, false);
        this._camera.isDirty = true;
    }

    /**
     * Parses M3D scene, camera and volume objects. Starts render or logs error.
     * @param camera 
     */
    loadNewScene() {
        this.resetScene();

        //Parse Volumtric data from PublicRenderData.contentRenderGroup
        var items = this.publicRenderData.contentRenderGroup;
        var volObjectFound = false;
        var volObj;
        items.traverse(function (child) {
            if (child instanceof M3D.VPTVolume) {
                volObjectFound = true;
                volObj = child;      //todo?multiple objects?
            }
        });
        if (!volObjectFound) {
            console.error('Failed to load volumetric data. No data parsed.');
            return;
        }
        this._m3dVolumeObject = volObj;
        this.setVolInputData(this._m3dVolumeObject.data, { x: this._m3dVolumeObject.dimensions[0], y: this._m3dVolumeObject.dimensions[1], z: this._m3dVolumeObject.dimensions[2] }, this._m3dVolumeObject.meta.bitSize);
        this._sceneReady = true;
        this.startRendering();
    }

    chooseRenderer(renderer) {
        this._renderer.destroy();
        switch (renderer) {
            case 'MIP':
                this._renderer = new MIPRenderer(this._gl, this._volumeTexture, this._environmentTexture);
                break;
            case 'ISO':
                this._renderer = new ISORenderer(this._gl, this._volumeTexture, this._environmentTexture);
                break;
            case 'EAM':
                this._renderer = new EAMRenderer(this._gl, this._volumeTexture, this._environmentTexture);
                break;
            case 'MCS':
                this._renderer = new MCSRenderer(this._gl, this._volumeTexture, this._environmentTexture);
                break;
        }
        this._toneMapper.setTexture(this._renderer.getTexture());
        this._isMvpSet = false;
    };

    // ============================ WEBGL LIFECYCLE ============================ //

    _nullifyGL() {
        this._gl = null;
        this._volumeTexture = null;
        this._environmentTexture = null;
        this._transferFunction = null;
        this._program = null;
        this._clipQuad = null;
        this._extLoseContext = null;
        this._extColorBufferFloat = null;
    }

    _initGL() {
        this._nullifyGL();

        this._gl = WebGLUtils.getContext(this._canvas, ['webgl2'], {
            alpha: false,
            depth: false,
            stencil: false,
            antialias: false,
            preserveDrawingBuffer: true
        });
        var gl = this._gl;
        this._extLoseContext = gl.getExtension('WEBGL_lose_context');
        this._extColorBufferFloat = gl.getExtension('EXT_color_buffer_float');

        if (!this._extColorBufferFloat) {
            console.error('EXT_color_buffer_float not supported!');
        }

        this._volumeTexture = WebGLUtils.createTexture(gl, {
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

        this._environmentTexture = WebGLUtils.createTexture(gl, {
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

        this._program = WebGLUtils.compileShaders(gl, {
            quad: SHADERS.quad
        }, MIXINS).quad;

        this._clipQuad = WebGLUtils.createClipQuad(gl);
    }

    _destroyGL() {
        var gl = this._gl;
        if (!gl) {
            return;
        }

        gl.deleteProgram(this._program.program);
        gl.deleteBuffer(this._clipQuad);
        gl.deleteTexture(this._volumeTexture);

        this._contextRestorable = false;
        if (this._extLoseContext) {
            this._extLoseContext.loseContext();
        }
        this._nullifyGL();
    }

    _webglcontextlostHandler() {
        if (this._contextRestorable) {
            event.preventDefault();
        }
        this._nullifyGL();
    }

    _webglcontextrestoredHandler() {
        this._initGL();
    }

    // ============================ SETTERS and GETTERS ============================ //
    resize(width, height) {

        if (!this._gl) {
            return;
        }

        this._canvas.width = width;
        this._canvas.height = height;
        if (this._camera){
            this._camera.aspect = width/height;
        }
    }

    setVolume(volume) {
        var gl = this._gl;
        if (!gl) {
            return;
        }

        // TODO: texture class, to avoid duplicating texture specs
        gl.bindTexture(gl.TEXTURE_3D, this._volumeTexture);
        gl.texImage3D(gl.TEXTURE_3D, 0, gl.R16F,
            volume.width, volume.height, volume.depth,
            0, gl.RED, gl.FLOAT, volume.data);
        gl.bindTexture(gl.TEXTURE_3D, null);
    }

    setEnvironmentMap(image) {
        var gl = this._gl;
        if (!gl) {
            return;
        }

        // TODO: texture class, to avoid duplicating texture specs
        gl.bindTexture(gl.TEXTURE_2D, this._environmentTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
            image.width, image.height,
            0, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    getCanvas() {
        return this._canvas;
    }

    getRenderer() {
        return this._renderer;
    }

    getToneMapper() {
        return this._toneMapper;
    }


    setVolInputData(data, size, bits) {
        var volume = new Volume(data, size.x, size.y, size.z, bits);
        this.setVolume(volume);
        this.getRenderer().reset();
    }

    setEnvInputData(image) {
        this.setEnvironmentMap(image);
        this.getRenderer().reset();
    }

    getIsRunning() {
        return this.isRunning;
    }

    // ============================ INSTANCE METHODS ============================ //


    _updateMvpInverseMatrix() {
        if ((this._camera.isDirty || !this._isMvpSet) && this._sceneReady) {
            this._camera.updateMatrices();

            var centerTranslation = new THREE.Matrix4().makeTranslation(-0.5, -0.5, -0.5); //cube center offset ? 
            var volumeTranslation = new THREE.Matrix4().makeTranslation(this._m3dVolumeObject.positionX, this._m3dVolumeObject.positionY, this._m3dVolumeObject.positionZ);
            var volumeScale = new THREE.Matrix4().makeScale(this._m3dVolumeObject.scale.x, this._m3dVolumeObject.scale.y, this._m3dVolumeObject.scale.z);

            var tr = new THREE.Matrix4();
            tr.multiplyMatrices(volumeScale, centerTranslation);
            tr.multiplyMatrices(volumeTranslation, tr);
            tr.multiplyMatrices(this._camera.transformationMatrix, tr);

            tr.getInverse(tr, true);
            this._renderer._mvpInverseMatrix = new Matrix(tr.elements);
            this._isMvpSet = true;
            this._renderer.reset();
        }
    }

    _render() {
        var gl = this._gl;
        if (!gl) {
            return;
        }

        this._updateMvpInverseMatrix();

        this._renderer.render();
        this._toneMapper.render();

        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        var program = this._program;
        gl.useProgram(program.program);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._clipQuad);
        var aPosition = program.attributes.aPosition;
        gl.enableVertexAttribArray(aPosition);
        gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this._toneMapper.getTexture());
        gl.uniform1i(program.uniforms.uTexture, 0);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

        gl.disableVertexAttribArray(aPosition);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    startRendering() {
        if (this._sceneReady) {
            this.isRunning = true;
            Ticker.add(this._render);
        } else {
            console.error('Cannot render, scene not set up.');
        }
    }

    stopRendering() {
        this.isRunning = false;
        Ticker.remove(this._render);
    }

}
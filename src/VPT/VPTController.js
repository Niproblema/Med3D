/**
 * Created by Jan on 2.7.2018.
 */


/**  
 * Controller for Volumetric path tracing tool - VPT
 * @class VPT
 */
M3D.VPTController = class {
    // ============================ LIFECYCLE ============================ //
    constructor(canvas){
        CommonUtils.extend(this);
        //this._canvas = canvas;
        this._render = this._render.bind(this);
        this._webglcontextlostHandler = this._webglcontextlostHandler.bind(this);
        this._webglcontextrestoredHandler = this._webglcontextrestoredHandler.bind(this);
        this._init();
    }

    _nullify(){
        this._canvas                = null;
        this.isRunning              = false;
        this._camera                = null;
        //this._cameraController      = null;
        this._renderer              = null;
        this._toneMapper            = null;
        this._scale                 = null;
        this._translation           = null;
        this._isTransformationDirty = null;
    
        this._nullifyGL();
    }

    _init(){
        this._nullify();

        this._canvas = document.createElement('canvas');
        //TODO: test only
        $(document.body).append(this._canvas);
        $(window).resize(function() {
            var width = window.innerWidth;
            var height = window.innerHeight;
            this.resize(width, height);
        }.bind(this));
        $(window).resize();
        //

        this._initGL();
    
        this._camera = new M3D.VPTsharedPerspectiveCamera(60, this._canvas.width / this._canvas.height, 0.1, 5);
        //this._cameraController = new OrbitCameraController(this._camera, this._canvas);
        this._renderer = new MCSRenderer(this._gl, this._volumeTexture, this._environmentTexture);   
        this._toneMapper = new ReinhardToneMapper(this._gl, this._renderer.getTexture());
    
        this._contextRestorable = true;
    
        this._canvas.addEventListener('webglcontextlost', this._webglcontextlostHandler);
        this._canvas.addEventListener('webglcontextrestored', this._webglcontextrestoredHandler);
    
        this._scale = new Vector(1, 1, 1);
        this._translation = new Vector(0, 0, 0);
        this._isTransformationDirty = true;
    
        this._camera.positionZ = 1.5;
        //this._camera.fovX = 0.3;
        //this._camera.fovY = 0.3;
    
        this._camera.updateMatrices();
        this._updateMvpInverseMatrix();
    }
    
    destroy(){
        this.stopRendering();
        this._destroyGL();
    
        this._canvas.removeEventListener('webglcontextlost', this._webglcontextlostHandler);
        this._canvas.removeEventListener('webglcontextrestored', this._webglcontextrestoredHandler);
    
        if (this._canvas.parentNode) {
            this._canvas.parentNode.removeChild(this._canvas);
        }
    
        this._toneMapper.destroy();
        this._renderer.destroy();
        //this._cameraController.destroy();
        this._camera.destroy();
    
        this._nullify();
    }
    // ============================ WEBGL LIFECYCLE ============================ //

    _nullifyGL(){
        this._gl                  = null;
        this._volumeTexture       = null;
        this._environmentTexture  = null;
        this._transferFunction    = null;
        this._program             = null;
        this._clipQuad            = null;
        this._extLoseContext      = null;
        this._extColorBufferFloat = null;
    }

    _initGL(){
        this._nullifyGL();
    
        this._gl = WebGLUtils.getContext(this._canvas, ['webgl2'], {
            alpha                 : false,
            depth                 : false,
            stencil               : false,
            antialias             : false,
            preserveDrawingBuffer : true
        });
        var gl = this._gl;
        this._extLoseContext = gl.getExtension('WEBGL_lose_context');
        this._extColorBufferFloat = gl.getExtension('EXT_color_buffer_float');
    
        if (!this._extColorBufferFloat) {
            console.error('EXT_color_buffer_float not supported!');
        }
    
        this._volumeTexture = WebGLUtils.createTexture(gl, {
            target         : gl.TEXTURE_3D,
            width          : 1,
            height         : 1,
            depth          : 1,
            data           : new Float32Array([1]),
            format         : gl.RED,
            internalFormat : gl.R16F,
            type           : gl.FLOAT,
            wrapS          : gl.CLAMP_TO_EDGE,
            wrapT          : gl.CLAMP_TO_EDGE,
            wrapR          : gl.CLAMP_TO_EDGE,
            min            : gl.LINEAR,
            mag            : gl.LINEAR
        });
    
        this._environmentTexture = WebGLUtils.createTexture(gl, {
            width          : 1,
            height         : 1,
            data           : new Uint8Array([255, 255, 255, 255]),
            format         : gl.RGBA,
            internalFormat : gl.RGBA, // TODO: HDRI & OpenEXR support
            type           : gl.UNSIGNED_BYTE,
            wrapS          : gl.CLAMP_TO_EDGE,
            wrapT          : gl.CLAMP_TO_EDGE,
            min            : gl.LINEAR,
            max            : gl.LINEAR
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
    resize(width, height){
        var gl = this._gl;
        if (!gl) {
            return;
        }
    
        this._canvas.width = width;
        this._canvas.height = height;
        this._camera.resize(width, height);
    }

    setVolume(volume){
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

    setEnvironmentMap(image){
        var gl = this._gl;
        if (!gl) {
            return;
        }
    
        // TODO: texture class, to avoid duplicating texture specs
        gl.bindTexture(gl.TEXTURE_2D, this._environmentTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl. RGBA,
            image.width, image.height,
            0, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    getCanvas(){
        return this._canvas;
    }

    getRenderer(){
        return this._renderer;
    }

    getToneMapper(){
        return this._toneMapper;
    }

    getScale(){
        return this._scale;
    }

    setScale(x,y,z){
        this._scale.set(x, y, z);
        this._isTransformationDirty = true;
    }

    getTranslation(){
        return this._translation;
    }

    setTranslation(x,y,z){
        this._translation.set(x,y,z);
        this._isTransformationDirty = true;
    }

    setVolInputData(data, size, bits){
        var volume = new Volume(data, size.x, size.y, size.z, bits);
        this.setVolume(volume);
        this.getRenderer().reset(); 
    }
    
    setEnvInputData(image){
        this.setEnvironmentMap(image);
        this.getRenderer().reset();
    }

    getIsRunning(){
        return this.isRunning;
    }

    // ============================ INSTANCE METHODS ============================ //

    _chooseRenderer(renderer) {
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
        this._isTransformationDirty = true;
    };
    
    _updateMvpInverseMatrix(){
        if (this._camera.isDirty || this._isTransformationDirty) {
            this._camera.isDirty = false;
            this._isTransformationDirty = false;
            this._camera.updateMatrices();
    
            var centerTranslation = new THREE.Matrix4().makeTranslation(-0.5, -0.5, -0.5);
            var volumeTranslation = new THREE.Matrix4().makeTranslation(this._translation.x, this._translation.y, this._translation.z);
            var volumeScale = new THREE.Matrix4().makeScale(this._scale.x, this._scale.y, this._scale.z);
    
            var tr = new THREE.Matrix4();
            tr.multiplyMatrices(volumeScale, centerTranslation);
            tr.multiplyMatrices(volumeTranslation, tr);
            tr.multiplyMatrices(this._camera.transformationMatrix(), tr);
    
            tr.getInverse(tr, true).transpose();
            this._renderer._mvpInverseMatrix =  new Matrix(tr.elements);//setMvpInverseMatrixM3D(tr);
            this._renderer.reset();
        }
    }

    _render(){
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

    startRendering(){
        this.isRunning = true;
        Ticker.add(this._render);
    }

    stopRendering(){
        this.isRunning = false;
        Ticker.remove(this._render);
    }

}
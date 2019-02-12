//@@../utils/Utils.js
//@@../WebGLUtils.js
//@@../SingleBuffer.js
//@@../DoubleBuffer.js
//@@../math/Matrix.js

(function (global) {
    'use strict';

    var Class = global.V_AbstractRenderer = V_AbstractRenderer;
    CommonUtils.inherit(Class, AbstractRenderer);
    var _ = Class.prototype;

    // ========================== CLASS DECLARATION ============================ //

    function V_AbstractRenderer(gl, options) {
        CommonUtils.extend(this, Class.defaults, options);

        this._gl = gl;
        this._type_id = 0;
        this._type = "abstractVPTrenderer";

        _._init.call(this);
    };

    Class.defaults = {
        _bufferSize: 512,
        _background: true,
        _blendMeshRatio: 0.0,
        _meshLightning: true
    };

    // ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

    _._nullify = function () {
        this._frameBuffer = null;
        this._accumulationBuffer = null;
        this._renderBuffer = null;
        this._transferFunctionDefault = null;
        this._transferFunction = null;
        this._mvpInverseMatrix = null;
        this._clipQuad = null;
        this._clipQuadProgram = null;
        this._volumeTexture = null;
        this._environmentTexture = null;
    };

    _._init = function () {
        _._nullify.call(this);

        var gl = this._gl;


        this._transferFunctionDefault = WebGLUtils.createTexture(gl, {
            width: 2,
            height: 1,
            data: new Uint8Array([255, 0, 0, 0, 255, 0, 0, 255]),
            wrapS: gl.CLAMP_TO_EDGE,
            wrapT: gl.CLAMP_TO_EDGE,
            min: gl.LINEAR,
            mag: gl.LINEAR
        });

        this._transferFunction = this._transferFunctionDefault;

        this._mvpInverseMatrix = null;

        this._clipQuadProgram = WebGLUtils.compileShaders(gl, {
            quad: SHADERS.quad
        }).quad;
    };

    _.destroy = function () {
        var gl = this._gl;
        if(this.transferFunction == this._transferFunctionDefault){
            gl.deleteTexture(this._transferFunctionDefault);
        }
        gl.deleteTexture(this._transferFunction);
        gl.deleteProgram(this._clipQuadProgram.program);

        _._nullify.call(this);
    };


    _.setTransferFunction = function (transferFunction) {
        if (transferFunction) {
            var gl = this._gl;
            gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);
            gl.texImage2D(gl.TEXTURE_2D, 0,
                gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, transferFunction);
            gl.bindTexture(gl.TEXTURE_2D, null);
        }else{
            this._transferFunction = this._transferFunctionDefault;
        }
    };



})(this);

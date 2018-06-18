/**
 * Created by Ziga on 25.3.2016.
 */


/**
 * @class VolumeRenderer
 */
M3D.VolumeRenderer = class extends M3D.Renderer {

    constructor(canvas, gl_version) {
        // Call abstract Renderer constructor
        super(canvas, gl_version);

        // region CONSTRUCT QUAD
        this.quadVtx = new M3D.Float32Attribute([
            -1, -1, 0,
             1, -1, 0,
             1,  1, 0,
            -1,  1, 0
        ], 3);
        this.quadIdx = new M3D.Uint32Attribute([0, 1, 2, 0, 2, 3], 1);
        this.quadUv = new M3D.Float32Attribute([
            0, 0,
            1, 0,
            1, 1,
            0, 1
        ], 2);

        this._glManager.updateBufferAttribute(this.quadVtx, false);
        this._glManager.updateBufferAttribute(this.quadIdx, true);
        this._glManager.updateBufferAttribute(this.quadUv, false);
        // endregion

        // Set the selected renderer
        this._selectedRenderer = this._volumeRender;

        //VPT settings 
        this.defaults = {
            _bufferSize      : 512,
            _lightPosition   : [2, 2, 2],
            _lightColor      : [1, 1, 1],
            _lightSize       : 2,
            _sigmaMax        : 1,
            _alphaCorrection : 1,
        };

        this._init();
    };




    _volumeRender(scene, camera) {

        // Define required programs
        for (let vol of scene.children) {
            this._requiredPrograms.push(vol.material.requiredProgram());
        }

        // Load the required programs
        // Required programs for each render iteration should be listed in the _requiredPrograms array
        if (!this._loadRequiredPrograms()) {
            return;
        }

        for (let vol of scene.children) {
            let material = vol.material;

            // TODO: Implement this
            let program = this._compiledPrograms.get(material.requiredProgram().programID);
            program.use();

            this._setup_attributes(program);

            this._setup_uniforms(program, vol, camera);

            // Draw the quad
            let buffer = this._glManager.getAttributeBuffer(this.quadIdx);
            this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, buffer);

            this._gl.drawElements(this._gl.TRIANGLES, this.quadIdx.count(), this._gl.UNSIGNED_INT, 0)
        }
    }

    // TODO: Implement this. Add additional parameters if needed.
    _setup_uniforms(program, volume, camera) {
        let uniformSetter = program.uniformSetter;

        uniformSetter["material.color"].set(volume.material.color.toArray());
        uniformSetter["volColor"].set(volume.color.toArray());
    }

    // TODO: Implement this. Add additional parameters if needed.
    _setup_attributes(program) {
        let attributeSetter = program.attributeSetter;

        // Setup quad attributes
        attributeSetter["VPos"].set(this._glManager.getAttributeBuffer(this.quadVtx), 3);
        if (attributeSetter["uv"]) {
            attributeSetter["uv"].set(this._glManager.getAttributeBuffer(this.quadUv), 3);
        }
    }



    //======================= VPT METHODS ==================== //
    _nullify() {
        this._programs      = null;
        this._frameNumber   = null;
        this._randomTexture = null;
    };
    
    
    _init() {
        _._nullify.call(this);

        var gl = this._gl;
    
        this._programs = WebGLUtils.compileShaders(gl, {
            generate  : SHADERS.MCSGenerate,
            integrate : SHADERS.MCSIntegrate,
            render    : SHADERS.MCSRender,
            reset     : SHADERS.MCSReset
        }, MIXINS);
    
        var nRandomValues = 100;
        var randomValues = new Float32Array(nRandomValues * 4);
        for (var i = 0; i < nRandomValues * 4; i++) {
            randomValues[i] = Math.random();
        }
        this._randomTexture = WebGLUtils.createTexture(gl, {
            data           : randomValues,
            width          : nRandomValues,
            height         : 1,
            format         : gl.RGBA,
            internalFormat : gl.RGBA16F,
            type           : gl.FLOAT,
            wrapS          : gl.CLAMP_TO_EDGE,
            wrapT          : gl.CLAMP_TO_EDGE,
            min            : gl.NEAREST,
            max            : gl.NEAREST
        });
    
        this._frameNumber = 1;
    };

    destroy = function() {
        var gl = this._gl;
        this._frameBuffer.destroy();
        this._accumulationBuffer.destroy();
        this._renderBuffer.destroy();
        gl.deleteTexture(this._transferFunction);
        gl.deleteBuffer(this._clipQuad);
        gl.deleteProgram(this._clipQuadProgram.program);
    
        var gl = this._gl;
        this._programs.forEach(function(program) {
            gl.deleteProgram(program.program);
        });
    
        gl.deleteTexture(this._randomTexture);
    
        _._nullify.call(this);
    };

    _resetFrame = function() {
        var gl = this._gl;
    
        var program = this._programs.reset;
        gl.useProgram(program.program);
    
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    
        this._frameNumber = 1;
    };

    _generateFrame = function() {
        var gl = this._gl;
    
        var program = this._programs.generate;
        gl.useProgram(program.program);
    
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_3D, this._volumeTexture);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this._environmentTexture);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, this._randomTexture);
    
        gl.uniform1i(program.uniforms.uVolume, 0);
        gl.uniform1i(program.uniforms.uEnvironment, 1);
        gl.uniform1i(program.uniforms.uTransferFunction, 2);
        gl.uniform1i(program.uniforms.uRandom, 3);
        gl.uniformMatrix4fv(program.uniforms.uMvpInverseMatrix, false, this._mvpInverseMatrix.m);
        gl.uniform1f(program.uniforms.uOffset, Math.random());
        gl.uniform1f(program.uniforms.uSigmaMax, this._sigmaMax);
        gl.uniform1f(program.uniforms.uAlphaCorrection, this._alphaCorrection);
    
        // scattering direction
        var x, y, z, length;
        do {
            x = Math.random() * 2 - 1;
            y = Math.random() * 2 - 1;
            z = Math.random() * 2 - 1;
            length = Math.sqrt(x * x + y * y + z * z);
        } while (length > 1);
        x /= length;
        y /= length;
        z /= length;
        gl.uniform3f(program.uniforms.uScatteringDirection, x, y, z);
    
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    };

    _integrateFrame = function() {
        var gl = this._gl;
    
        var program = this._programs.integrate;
        gl.useProgram(program.program);
    
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getTexture());
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this._frameBuffer.getTexture());
    
        gl.uniform1i(program.uniforms.uAccumulator, 0);
        gl.uniform1i(program.uniforms.uFrame, 1);
        gl.uniform1f(program.uniforms.uFrameNumber, this._frameNumber);
    
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    
        this._frameNumber += 1;
    };

    _renderFrame = function() {
        var gl = this._gl;
    
        var program = this._programs.render;
        gl.useProgram(program.program);
    
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getTexture());
    
        gl.uniform1i(program.uniforms.uAccumulator, 0);
    
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    };


    _getFrameBufferOptions = function() {
        var gl = this._gl;
        return {
            width          : this._bufferSize,
            height         : this._bufferSize,
            min            : gl.NEAREST,
            mag            : gl.NEAREST,
            format         : gl.RGBA,
            internalFormat : gl.RGBA16F,
            type           : gl.FLOAT
        };
    };

    _getAccumulationBufferOptions = function() {
        var gl = this._gl;
        return {
            width          : this._bufferSize,
            height         : this._bufferSize,
            min            : gl.NEAREST,
            mag            : gl.NEAREST,
            format         : gl.RGBA,
            internalFormat : gl.RGBA16F,
            type           : gl.FLOAT
        };
    };
};
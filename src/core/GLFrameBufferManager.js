/**
 * Created by Primoz on 4. 11. 2016.
 */

M3D.GLFrameBufferManager = class {

    constructor(gl) {
        this._gl = gl;
        this._cached_fbos = new Map();
        this._boundBuffer = null;
    }

    get boundFrameBuffer(){return this._boundBuffer};

    /**
     * Binds the framebuffer for the specified render target (each render target gets it's own framebuffer)
     * @param renderTarget
     */
    bindFramebuffer(renderTarget) {
        // Try to fetch framebuffer
        var framebuffer = this._cached_fbos.get(renderTarget);

        // Check if the frame-buffer already exists. If not create one.
        if (framebuffer === undefined) {
            framebuffer = this._gl.createFramebuffer();
            this._cached_fbos.set(renderTarget, framebuffer);
        }

        // Bind selected framebuffer
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, framebuffer);
        this._boundBuffer = framebuffer;
    }

    unbindFramebuffer() {
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
        this._boundBuffer = null;
    }

    clearFrameBuffers() {
        // Delete all cached FBO-s
        for (var framebuffer in this._cached_fbos.values()) {
            this._gl.deleteFramebuffer(framebuffer);
        }

        // Clear map
        this._cached_fbos.clear();
    }
};
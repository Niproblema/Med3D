/**
 * Created by Ziga & Primoz on 1.4.2016.
 */

 //@@Camera.js

M3D.PerspectiveCamera = class extends M3D.Camera {

	/**
	 * Creates new PerspectiveCamera object.
	 * @param fov Horizontal field of view given in radians.
	 * @param aspect Aspect ratio (width / height).
	 * @param near Distance to the near clipping plane of the projection camera frustum.
	 * @param far Distance to the far clipping plane of the projection camera frustum.
	 * @constructor
	 * @extends Camera
	 */
	constructor(fov, aspect, near, far) {
		super(M3D.Camera);

		this.type = "PerspectiveCamera";

		this._fov = fov || 50;
		this._aspect = aspect || 1;
		this._near = near || 0.1;
		this._far = far || 1000;
		this.updateProjectionMatrix();
	}

	/**
	* Updates projection matrix based on current values of properties.
	*/
	updateProjectionMatrix() {
		let top = this._near * Math.tan((Math.PI/180) * 0.5 * this._fov),
			height = 2 * top,
			width = this._aspect * height,
			left = - 0.5 * width;

		this.projectionMatrix.makeFrustum(left, left + width, top - height, top, this._near, this._far);
	}

	get fov() { return this._fov; }
	get aspect() { return this._aspect; }
	get near() { return this._near; }
	get far() { return this._far; }

	set fov(val) {
        if (val !== this._fov) {
            this._fov = val;

            this.updateProjectionMatrix();

            // Notify onChange subscriber
            if (this._onChangeListener) {
                var update = {uuid: this._uuid, changes: {fov: this._fov}};
                this._onChangeListener.objectUpdate(update)
            }
        }
	}

	set aspect(val) {
        if (val !== this._aspect) {
            this._aspect = val;

            this.updateProjectionMatrix();
        }
	}

	set near(val) {
        if (val !== this._near) {
            this._near = val;

            this.updateProjectionMatrix();

            // Notify onChange subscriber
            if (this._onChangeListener) {
                var update = {uuid: this._uuid, changes: {near: this._near}};
                this._onChangeListener.objectUpdate(update)
            }
        }
	}

	set far(val) {
        if (val !== this._far) {
            this._far = val;

            this.updateProjectionMatrix();

            // Notify onChange subscriber
            if (this._onChangeListener) {
                var update = {uuid: this._uuid, changes: {far: this._far}};
                this._onChangeListener.objectUpdate(update)
            }
        }
	}

	toJson() {
		// Export Object3D parameters
		var obj = super.toJson();

		// Export perspective camera parameters
		obj.fov = this._fov;
		obj.near = this._near;
		obj.far = this._far;

		return obj;
	}

	static fromJson(data, aspect) {
		// Create new object with the given camera parameters
		var camera = new M3D.PerspectiveCamera(data.fov, aspect, data.near, data.far);

		// Import underlying Object3D parameters
		return super.fromJson(data, camera);
	}

	update(data) {
		super.update(data);

		// Check if there are any camera parameter updates
		var modified = false;
		for (var prop in data) {
			switch (prop) {
				case "fov":
					this._fov = data.fov;
					delete data.fov;
					modified = true;
					break;
				case "near":
					this._near = data.near;
					delete data.near;
					modified = true;
					break;
				case "far":
					this._far = data.far;
					delete data.far;
					modified = true;
					break;
			}
		}

		// If the camera parameters have been modified update the projection matrix
		if (modified) {
			this.updateProjectionMatrix();
		}
	}


	vpt_nullify() {
		this._viewMatrix           = null;
		this._projectionMatrix     = null;
		this._transformationMatrix = null;
		this._isDirty              = null;
	};
	
	vpt_init() {
		_._nullify.call(this);
	
		this._viewMatrix = new Matrix();
		this._projectionMatrix = new Matrix();
		this._transformationMatrix = new Matrix();
		this._isDirty = false;
	};
	
	vpt_destroy() {
		_._nullify.call(this);
	};
	
	vpt_updateViewMatrix() {
    	this._rotation.toRotationMatrix(this.viewMatrix.m);
    	this._viewMatrix.m[ 3] = this.position.x;
    	this._viewMatrix.m[ 7] = this.position.y;
    	this._viewMatrix.m[11] = this.position.z;
    	this._viewMatrix.inverse();
    };
    
    vpt_updateMatrices() {
        this._updateViewMatrix();
        this._updateProjectionMatrix();
        this._transformationMatrix.multiply(this.projectionMatrix, this.viewMatrix);
    };
    
    vpt_resize(width, height) {
        this._fovX = width * this.zoomFactor;
        this._fovY = height * this.zoomFactor;
        this._isDirty = true;
    };
    
    vpt_zoom(amount) {
        var scale = Math.exp(amount);
        this._zoomFactor *= scale;
        this._fovX *= scale;
        this._fovY *= scale;
        this._isDirty = true;
    };


};
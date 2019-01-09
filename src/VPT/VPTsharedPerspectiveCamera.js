M3D.VPTsharedPerspectiveCamera = class extends M3D.PerspectiveCamera{

    constructor(fov, aspect, near, far) {
		super(fov, aspect, near, far);

		this.type = "PerspectiveCamera";

        this.isDirty = false;
        this.tranformationMatrix = new THREE.Matrix4();
        this.viewMatrix = new THREE.Matrix4();
    }
    
    //legacy
    updateViewMatrix(){
        this.viewMatrix.makeRotationFromQuaternion(this.quaternion);
        this.viewMatrix.setPosition(new THREE.Vector3(this.positionX, this.positionY, this.positionZ));
        this.viewMatrix.getInverse(this.viewMatrix, true);
    }

    //legacy
/*     updateProjectionMatrix() {
        var w = this.fovXVPT * this.near;
        var h = this.fovYVPT * this.near;
        //this.projectionMatrix.fromFrustum(-w, w, -h, h, this.near, this.far);
        //
        var left = -w;
        var right = w;
        var bottom = -h;
        var top = h;
        var near = this.near;
        var far = this.far;


        this.projectionMatrix.set(2*near/(right - left), 0, (right + left) / (right - left), 0,
                                0, 2 * near / (top - bottom), (top + bottom) / (top - bottom), 0,
                                0,0,-(far + near) / (far - near), -2 * far * near / (far - near),
                                0,0,-1,0);
		//this.projectionMatrix.transpose();

        //

    } */

    updateMatrices(){
        this.updateViewMatrix();
        this.updateProjectionMatrix();
        this.tranformationMatrix.multiplyMatrices(this.projectionMatrix, this.viewMatrix);
    }

    resize(width, height){
        this.aspect = width/height;
        this.isDirty = true;
    }

    get transformationMatrix(){
        return this.tranformationMatrix;
    }

    destroy(){
        this.isDirty = true;
    };

}
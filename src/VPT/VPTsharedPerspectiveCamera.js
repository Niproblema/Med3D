M3D.VPTsharedPerspectiveCamera = class extends M3D.PerspectiveCamera{

    constructor(fov, aspect, near, far) {
		super(fov, aspect, near, far);

		this.type = "vptPerspectiveCamera";

        this.isDirty = false;
        this.tranformationMatrix = new THREE.Matrix4();
        //this.viewMatrix = new THREE.Matrix4();
    }
    
    //legacy, not in use
/*     updateViewMatrix(){
        this.viewMatrix.makeRotationFromQuaternion(this.quaternion);
        this.viewMatrix.setPosition(new THREE.Vector3(this.positionX, this.positionY, this.positionZ));
        this.viewMatrix.getInverse(this.viewMatrix, true);
    } */

    //legacy, in use
    updateMatrices(){
        //this.updateViewMatrix();
        this.updateProjectionMatrix();
        this.tranformationMatrix.multiplyMatrices(this.projectionMatrix, this.matrixWorldInverse);
        this.isDirty = false
    }

    //legacy, in use
    get transformationMatrix(){
        return this.tranformationMatrix;
    }

}
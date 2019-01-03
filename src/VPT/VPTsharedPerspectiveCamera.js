M3D.VPTsharedPerspectiveCamera = class extends M3D.PerspectiveCamera{

    constructor(fov, aspect, near, far) {
		super(fov, aspect, near, far);

		this.type = "PerspectiveCamera";

        this.isDirty = false;
        this.tranformationMatrix = new THREE.Matrix4();
        this.viewMatrix = new THREE.Matrix4();
        this.zoomFactor = 0.001;
    }
    
/*     updateProjectionMatrix(){
        super();
        this.tranformationMatrix = multiplyMatrices()
    } */

    updateMatrices(){
        this.updateProjectionMatrix();
    }

    resize(width, height){
        this.aspect = width/height;
        this.isDirty = true;
    }

    transformationMatrix(){
        //if (scene.autoUpdate === true)
        //    scene.updateMatrixWorld();
        return new THREE.Matrix4().multiplyMatrices(this.projectionMatrix, this.matrixWorldInverse);
    }

    destroy(){
        this.isDirty = true;
    };

}
/**
 * Created by Ziga on 25.3.2016.
 */

 //@@../core/Object3D.js

M3D.Camera = class extends M3D.Object3D {

	constructor() {
		super(M3D.Object3D);

        this.type = "Camera";

		//this._matrixWorldInverse = new THREE.Matrix4();
		this._projectionMatrix = new THREE.Matrix4();

		// Camera up direction
		this._up = new THREE.Vector3(0, 1, 0);

		//this._lockedProjection = new THREE.Matrix4();
		//this._lockedProjection.elements.set([0.9634532332420349, 0, 0, 0, 0, 1.7320507764816284, 0, 0, 0, 0, -1.000100016593933, -1, 0, 0, -0.2000100016593933, 0]);
		this._lockedMWI = new THREE.Matrix4();
		this._lockedMWI.elements.set([-0.0015707561979070306, -0.0011902183759957552, -0.9999980926513672, 0, 0.00000000007192543782785776, 0.9999992847442627, -0.001190219889394939, 0, 0.9999988079071045, -0.0000018695916423894232, -0.0015707551501691341, 0, 0.00000006631738358464645, -0.00000000013147689881254365, -1.679560899734497, 1]);
	}

    get projectionMatrix () { return this._projectionMatrix; }
	get up() { return this._up; }

    get matrixWorldInverse () { return this._lockedMWI; }
    set matrixWorldInverse (inverse) {  }
};
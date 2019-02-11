/**
 * Created by Primoz Lavric on 23-Mar-17.
 */

CameraManager = class {

    constructor() {

        // Currently selected camera
        this._activeCamera = null;

        // List of all of the own cameras
        this._cameras = [];

        // Maps camera uuid to the controls that are used for that camera
        this._cameraControls = {};

        // Dictionary of all of the cameras that are shared with this user
        this._sharedCameras = {};

        // On change inside manager listners queues.
        this._onChangeListeners = {
            onAddCamera: [],       //On add camera to manager
            onRemoveCamera: [],    //On remove camera from manager
            onActiveCamera: []     //When new camera active
        };

        this._aspectRatio = 1;
    }


    update(inputData, deltaT) {
        // Update active camera
        if (this._activeCamera != null) {
            // Update aspect ratio for both own and shared cameras
            this._activeCamera.aspect = this._aspectRatio;

            if (this.isOwnCamera(this._activeCamera)) {
                this._cameraControls[this._activeCamera._uuid].update(inputData, deltaT);
            }
        }

        // Update animations of non-active cameras
        for (let i = 0; i < this._cameras.length; i++) {
            if (this._cameras[i] !== this._activeCamera) {
                this._cameraControls[this._cameras[i]._uuid].update(null, deltaT);
            }
        }
    }

    isOwnCamera(camera) {
        return this._cameras.indexOf(camera) >= 0;
    }

    /**
     * Creates new regular camera and controls for it
     * @param camera Camera to be added
     */
    addRegularCamera(camera) {
        this._cameras.push(camera);
        this._cameraControls[camera._uuid] = new M3D.RegularCameraControls(camera);

        this._onChangeListeners.onAddCamera.forEach(function (item, index) {
            item({ camera: camera, local: true, active: false });
        });
    }

    /**
     * Creates new orbit camera and controls for it
     * @param camera Camera to be added
     * @param orbitCenter Center of the orbit
     */
    addOrbitCamera(camera, orbitCenter) {
        this._cameras.push(camera);
        this._cameraControls[camera._uuid] = new M3D.OrbitCameraControls(camera, orbitCenter);

        this._onChangeListeners.onAddCamera.forEach(function (item, index) {
            item({ camera: camera, local: true, active: false });
        });
    }

    /**
     * Check if the camera is shared. Returns user id if found otherwise null
     * @param camera
     */
    isSharedCamera(camera) {
        for (let userId in this._sharedCameras) {
            if (this._sharedCameras[userId].list.indexOf(camera) >= 0) {
                return userId;
            }
        }

        return null;
    }

    /**
     * Clears all shared camera entries. If a shared camera is currently active it sets the first own camera as active
     * camera.
     */
    clearSharedCameras() {
        var self = this;
        for (let userId in this._sharedCameras) {
            while (this._sharedCameras[userId].list.length > 0) {
                var cam = this._sharedCameras[userId].list.shift();
                this._onChangeListeners.onRemoveCamera.forEach(function (item, index) {
                    item({ camera: cam, local: false, userId: userId, owner: self._sharedCameras[userId].ownerUsername, active: cam == self._activeCamera });
                });
            }
        }
        this._sharedCameras = [];

        if (!this.isOwnCamera(this._activeCamera)) {
            this._activeCamera = this._cameras[0];
        }
    }

    setSharedCameras(sharedCameras) {
        this.clearSharedCameras();

        for (let userId in sharedCameras) {
            for (var i = 0; i < sharedCameras[userId].list.length; i++) {
                var cam = sharedCameras[userId].list[i];
                this._onChangeListeners.onAddCamera.forEach(function (item, index) {
                    item({ camera: cam, local: false, userId: userId, owner: sharedCameras[userId].ownerUsername, active: false });
                });
            }
        }
        this._sharedCameras = jQuery.extend(true, {}, sharedCameras); //sharedCameras;
    }

    /**
     * Sets the given camera as active camera.
     * @param camera
     */
    setActiveCamera(camera) {
        if (!this.isOwnCamera(camera) && !this.isSharedCamera(camera)) {
            console.error("Tried to set the camera that is managed by the camera manager as the active camera!")
            return
        }
        this._activeCamera = camera;

        var self = this;
        this._onChangeListeners.onActiveCamera.forEach(function (item, index) {
            item({ camera: camera, local: self.isOwnCamera(camera), active: true });
        });
    }

    /**
     * Cancels the camera animation with the given id.
     * @param camera Camera (should be enrolled in the camera manager)
     * @param id Animation identificator
     */
    cancelAnimation(camera, id) {
        let cameraControls = this._cameraControls[camera._uuid];

        if (cameraControls != null) {
            cameraControls.cancelAnimation(id);
        }
        else {
            console.warn("Cannot cancel camera animations. Controls for the given camera do not exist.")
        }
    }

    /**
     * Cancels all of the camera animations
     * @param camera Camera (should be enrolled in the camera manager)
     */
    cancelAllAnimations(camera) {
        let cameraControls = this._cameraControls[camera._uuid];

        if (cameraControls != null) {
            cameraControls.cancelAllAnimations();
        }
        else {
            console.warn("Cannot cancel camera animations. Controls for the given camera do not exist.")
        }
    }

    /**
     * Enqueues the animation with specified parameters for the given camera
     * @param camera Camera that is to be animated (should be enrolled in the camera manager)
     * @param id Animation identificator
     * @param position Target position
     * @param rotation Target rotation
     * @param time Animation time specified in milliseconds
     * @param onFinish Callback that is called after the animation finishes
     */
    animateCameraTo(camera, id, position, rotation, time, onFinish = null) {
        let cameraControls = this._cameraControls[camera._uuid];

        if (cameraControls != null) {
            cameraControls.animateTo(id, position, rotation, time, onFinish);
        }
        else {
            console.warn("Cannot execute camera animation. Controls for the given camera do not exist.")
        }
    }

    /**
     * Locks the camera in place. While locked the camera is not affected by the user input.
     * @param camera Camera to be locked
     */
    lockCamera(camera) {
        let cameraControls = this._cameraControls[camera._uuid];

        if (cameraControls != null) {
            cameraControls.locked = true;
        }
        else {
            console.warn("Cannot lock the camera. Controls for the given camera do not exist.")
        }
    }

    /**
     * Unlocks the camera in place. While unlocked the camera will be affected by the user input.
     * @param camera Camera to be unlocked
     */
    unlockCamera(camera) {
        let cameraControls = this._cameraControls[camera._uuid];

        if (cameraControls != null) {
            cameraControls.locked = false;
        }
        else {
            console.warn("Cannot lock the camera. Controls for the given camera do not exist.")
        }
    }

    /**
     * Checks if the specified camera is locked.
     * @param camera Queried camera
     * @returns {boolean} True if the camera is locked.
     */
    isCameraLocked(camera) {
        let cameraControls = this._cameraControls[camera._uuid];

        return cameraControls == null || cameraControls.locked;
    }

    /**
     * Checks if the cameras position and rotation are equal to the given position and rotation vector.
     * @param position Position vector
     * @param rotation Rotation vector
     * @returns {*} True if the cameras position and rotation are equal to the specified vectors
     */
    isActiveCameraInPosition(position, rotation) {
        let EPS = 0.0001;
        return this._activeCamera.position.clone().sub(position).length() < EPS && this._activeCamera.rotation.toVector3().clone().sub(rotation).length() < EPS;
    }

    focusCamerasOn(sphere, offsetDir) {

        for (let i = 0; i < this._cameras.length; i++) {
            let controls = this._cameraControls[this._cameras[i]._uuid];

            if (controls != null) {
                controls.focusOn(sphere, offsetDir);
            }
        }
    }

    get activeCamera() { return this._activeCamera; }
    get ownCameras() { return this._cameras; }
    get sharedCameras() { return this._sharedCameras; }
    get aspectTratio() { return this._aspectRatio; }

    set aspectRatio(aspect) { this._aspectRatio = aspect; }



    /* Setup onChange listners */
    addOnAddCameraListner(listener) {
        this._onChangeListeners.onAddCamera.push(listener);
    }
    rmOnAddCameraListner(listener) {
        this._removeFromQueue(this._onChangeListeners.onAddCamera, listener)
    }
    addOnRemoveCameraListner(listener) {
        this._onChangeListeners.onRemoveCamera.push(listener);
    }
    rmOnRemoveCameraListner(listener) {
        this._removeFromQueue(this._onChangeListeners.onRemoveCamera, listener)
    }
    addOnSwitchActiveCameraListner(listener) {
        this._onChangeListeners.onActiveCamera.push(listener);
    }
    rmOnSwitchActiveCameraListner(listener) {
        this._removeFromQueue(this._onChangeListeners.onActiveCamera, listener)
    }

    _removeFromQueue(queue, element) {
        if (queue.isEmpty())
            console.error("Cannot remove element.");

        var found = false;
        var temp;
        for (var i = 0; i < queue.length; i++) {
            temp = queue.shift();
            if (temp == element) {
                found = true;
                break;
            }
            queue.push(temp);
        }
        if (!found)
            console.error("Cannot remove element from queue - No such element in queue.");
    }
    /* === */
};
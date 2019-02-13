/**
 * Created by Jan on 3.2.2019
 * Hold and VPT settings and states for rendering and collaboration.
 * 
 * 
 * Event hierarchy:
 *  -camera's vpt bundle 
 *   -settings   
 */
app.factory('VPT', function ($rootScope) {
    return new (function _vptFactory() {
        let self = this;
        let _cameraManager = null;
        let _lastActiveCameraUuid = null;

        /* User collection : user -> cameras */

        /* Change listener. camera -> vptBundle */
        this._onChangeListener = new Map();

        this.addListener = function (camera, onChange) {
            this._onChangeListener.set(camera, onChange);
        }

        this.rmListener = function (camera) {
            this._onChangeListener.delete(camera);
        }


        /* ================= SETTING BUNDLES ================= */

        //Bundles : Camera -> vptBundle
        this._vptBundles = new Map();

        this.setCameraBundle = function (camera, bundle) {
            this._vptBundles.set(camera, bundle);
        }
        this.getCameraBundle = function (camera) {
            return this._vptBundles.get(camera);
        }
        this.hasCameraBundle = function (camera) {
            return this._vptBundles.has(camera);
        }
        this.rmCameraBundle = function (camera) {
            return this._vptBundles.delete(camera);
        }

        //Default settings, if needed to reset.
        this._defaultSettings = {
            uuid: THREE.Math.generateUUID(),
            rendererChoiceID: 4, //VPT renderers - 0=Error, 1=EAM, 2=ISO, 3=MCS, 4=MIP, 5=Disabled=Use mesh with diffuse
            eam: {    //eam
                background: true,
                blendMeshRatio: 0.0,    //0-1 share of Mesh render ratio
                meshLight: true,
                blendMeshColor: {
                    r: 0.28,
                    g: 0.7,
                    b: 0.7
                },
                resolution: 512,        //Buffer dimensions
                steps: 10,
                alphaCorrection: 5,
                tfBundle: { uuid: "1", bumps: [] }
            },
            iso: {    //iso
                background: true,
                blendMeshRatio: 0.0,    //0-1 share of Mesh render ratio
                meshLight: true,
                blendMeshColor: {
                    r: 0.28,
                    g: 0.7,
                    b: 0.7
                },
                resolution: 512,        //Buffer dimensions
                steps: 10,
                isoVal: 0.25,
                color: {
                    r: 1,
                    g: 1,
                    b: 1
                }
            },
            mcs: {    //mcs
                background: true,
                blendMeshRatio: 0.0,    //0-1 share of Mesh render ratio
                meshLight: true,
                blendMeshColor: {
                    r: 0.28,
                    g: 0.7,
                    b: 0.7
                },
                resolution: 512,        //Buffer dimensions
                sigma: 30,
                alphaCorrection: 30,
                tfBundle: { uuid: "2", bumps: [] }
            },
            mip: {    //mip
                background: true,
                blendMeshRatio: 0.0,    //0-1 share of Mesh render ratio
                meshLight: true,
                blendMeshColor: {
                    r: 0.28,
                    g: 0.7,
                    b: 0.7
                },
                resolution: 512,        //Buffer dimensions
                steps: 10
            },
            reinhard: {
                exposure: 1
            },
            range: {
                rangeLower: 0,
                rangeHigher: 1
            },

            //Marching cubes
            useMCC: false,
        };

        //This client's currently active settings. For init, copy default settings. 
        this._activeSettings = null; //jQuery.extend(true, {}, this._defaultSettings);


        /* ================= STATE BUNDLE ================= */
        /* Client specific only settings - not shareable */
        this._state = {
            tf: {  //transferFunctions canvas ref
                eam: null,
                mcs: null
            },

            resetMVP: false,  //Set true to reset MVP for VPT render in next pass.
            resetBuffers: false,   //Remakes object's framebuffers. Used when switching renderers or render buffer sizes (render resolution)

            //Volume object collection. Used for MarchingCubes geometry updating and garbage collection.
            objects: [],

            mccStatus: false,  //Marching cubes ready for current objects
        };


        /* ================= LOCKS BUNDLE ================= */
        /* Client specific locks settings - not shareable */
        /* Locks for UI. Disables UI changes while controlled by other used in shared session */
        this._uiLock = {
            rendererSelection: false,
            rendererSettings: false,
            tonemapperSettings: false,
            mccSettings: false
        };



        /* ================= GETTER and SETTER model ================= */
        /* Controller for _activeSettings, holds setters with onChangeListeners */
        this._gNsModel = {
            get rendererChoiceID() { return self._activeSettings.rendererChoiceID; },
            set rendererChoiceID(val) { self._activeSettings.rendererChoiceID = val },

            eam: {
                get background() { return self._activeSettings.eam.background; },
                set background(val) { self._activeSettings.eam.background = val },

                get blendMeshRatio() { return self._activeSettings.eam.blendMeshRatio; },
                set blendMeshRatio(val) { self._activeSettings.eam.blendMeshRatio = val },

                get meshLight() { return self._activeSettings.eam.meshLight; },
                set meshLight(val) { self._activeSettings.eam.meshLight = val },

                get blendMeshColor() {
                    return {
                        get r() { return self._activeSettings.eam.blendMeshColor.r; },
                        set r(val) { self._activeSettings.eam.blendMeshColor.r = val },
                        get g() { return self._activeSettings.eam.blendMeshColor.g; },
                        set g(val) { self._activeSettings.eam.blendMeshColor.g = val },
                        get b() { return self._activeSettings.eam.blendMeshColor.b; },
                        set b(val) { self._activeSettings.eam.blendMeshColor.b = val }
                    }
                },
                set blendMeshColor(val) { self._activeSettings.eam.color = val },

                get resolution() { return self._activeSettings.eam.resolution; },
                set resolution(val) { self._activeSettings.eam.resolution = val },

                get steps() { return self._activeSettings.eam.steps; },
                set steps(val) { self._activeSettings.eam.steps = val },

                get alphaCorrection() { return self._activeSettings.eam.alphaCorrection; },
                set alphaCorrection(val) { self._activeSettings.eam.alphaCorrection = val },

                get tf() { return self._state.tf.eam; },
                set tf(val) { self._state.tf.eam = val },

                get tfBundle() { return self._activeSettings.eam.tfBundle; },
                set tfBundle(val) { self._activeSettings.eam.tfBundle = val }
            },
            iso: {
                get background() { return self._activeSettings.iso.background; },
                set background(val) { self._activeSettings.iso.background = val },

                get blendMeshRatio() { return self._activeSettings.iso.blendMeshRatio; },
                set blendMeshRatio(val) { self._activeSettings.iso.blendMeshRatio = val },

                get meshLight() { return self._activeSettings.iso.meshLight; },
                set meshLight(val) { self._activeSettings.iso.meshLight = val },

                get blendMeshColor() {
                    return {
                        get r() { return self._activeSettings.iso.blendMeshColor.r; },
                        set r(val) { self._activeSettings.iso.blendMeshColor.r = val },
                        get g() { return self._activeSettings.iso.blendMeshColor.g; },
                        set g(val) { self._activeSettings.iso.blendMeshColor.g = val },
                        get b() { return self._activeSettings.iso.blendMeshColor.b; },
                        set b(val) { self._activeSettings.iso.blendMeshColor.b = val }
                    }
                },
                set blendMeshColor(val) { self._activeSettings.iso.color = val },

                get resolution() { return self._activeSettings.iso.resolution; },
                set resolution(val) { self._activeSettings.iso.resolution = val },

                get steps() { return self._activeSettings.iso.steps; },
                set steps(val) { self._activeSettings.iso.steps = val },

                get isoVal() { return self._activeSettings.iso.isoVal; },
                set isoVal(val) { self._activeSettings.iso.isoVal = val },

                get color() {
                    return {
                        get r() { return self._activeSettings.iso.color.r; },
                        set r(val) { self._activeSettings.iso.color.r = val },
                        get g() { return self._activeSettings.iso.color.g; },
                        set g(val) { self._activeSettings.iso.color.g = val },
                        get b() { return self._activeSettings.iso.color.b; },
                        set b(val) { self._activeSettings.iso.color.b = val }
                    }
                },
                set color(val) { self._activeSettings.iso.color = val }
            },
            mcs: {
                get background() { return self._activeSettings.mcs.background; },
                set background(val) { self._activeSettings.mcs.background = val },

                get blendMeshRatio() { return self._activeSettings.mcs.blendMeshRatio; },
                set blendMeshRatio(val) { self._activeSettings.mcs.blendMeshRatio = val },

                get meshLight() { return self._activeSettings.mcs.meshLight; },
                set meshLight(val) { self._activeSettings.mcs.meshLight = val },

                get blendMeshColor() {
                    return {
                        get r() { return self._activeSettings.mcs.blendMeshColor.r; },
                        set r(val) { self._activeSettings.mcs.blendMeshColor.r = val },
                        get g() { return self._activeSettings.mcs.blendMeshColor.g; },
                        set g(val) { self._activeSettings.mcs.blendMeshColor.g = val },
                        get b() { return self._activeSettings.mcs.blendMeshColor.b; },
                        set b(val) { self._activeSettings.mcs.blendMeshColor.b = val }
                    }
                },
                set blendMeshColor(val) { self._activeSettings.mcs.color = val },

                get resolution() { return self._activeSettings.mcs.resolution; },
                set resolution(val) { self._activeSettings.mcs.resolution = val },

                get sigma() { return self._activeSettings.mcs.sigma; },
                set sigma(val) { self._activeSettings.mcs.sigma = val },

                get alphaCorrection() { return self._activeSettings.mcs.alphaCorrection; },
                set alphaCorrection(val) { self._activeSettings.mcs.alphaCorrection = val },

                get tf() { return self._state.tf.mcs; },
                set tf(val) { self._state.tf.mcs = val },

                get tfBundle() { return self._activeSettings.mcs.tfBundle; },
                set tfBundle(val) { self._activeSettings.mcs.tfBundle = val }
            },
            mip: {
                get background() { return self._activeSettings.mip.background; },
                set background(val) { self._activeSettings.mip.background = val },

                get blendMeshRatio() { return self._activeSettings.mip.blendMeshRatio; },
                set blendMeshRatio(val) { self._activeSettings.mip.blendMeshRatio = val },

                get meshLight() { return self._activeSettings.mip.meshLight; },
                set meshLight(val) { self._activeSettings.mip.meshLight = val },

                get blendMeshColor() {
                    return {
                        get r() { return self._activeSettings.mip.blendMeshColor.r; },
                        set r(val) { self._activeSettings.mip.blendMeshColor.r = val },
                        get g() { return self._activeSettings.mip.blendMeshColor.g; },
                        set g(val) { self._activeSettings.mip.blendMeshColor.g = val },
                        get b() { return self._activeSettings.mip.blendMeshColor.b; },
                        set b(val) { self._activeSettings.mip.blendMeshColor.b = val }
                    }
                },
                set blendMeshColor(val) { self._activeSettings.mip.color = val },

                get resolution() { return self._activeSettings.mip.resolution; },
                set resolution(val) { self._activeSettings.mip.resolution = val },

                get steps() { return self._activeSettings.mip.steps; },
                set steps(val) { self._activeSettings.mip.steps = val }
            },

            reinhard: {
                get exposure() { return self._activeSettings.reinhard.exposure; },
                set exposure(val) { self._activeSettings.reinhard.exposure = val }
            },
            range: {
                get rangeLower() { return self._activeSettings.range.rangeLower; },
                set rangeLower(val) { self._activeSettings.range.rangeLower = val },

                get rangeHigher() { return self._activeSettings.range.rangeHigher; },
                set rangeHigher(val) { self._activeSettings.range.rangeHigher = val }
            },

            get useMCC() { return self._activeSettings.useMCC; },
            set useMCC(val) { self._activeSettings.useMCC = val },

            get resetMVP() { return self._state.resetMVP; },
            set resetMVP(val) { self._state.resetMVP = val },

            get resetBuffers() { return self._state.resetBuffers; },
            set resetBuffers(val) { self._state.resetBuffers = val },

            get objects() { return self._state.objects; },
            set objects(val) { self._state.objects = val },

            get mccStatus() { return self._state.mccStatus; },
            set mccStatus(val) { self._state.mccStatus = val },

            refreshUI: function () { },     //TODO: remove this, do different way.

            uiLock: {
                get rendererSelection() { return self._uiLock.rendererSelection; },
                set rendererSelection(val) { self._uiLock.rendererSelection = val },

                get rendererSettings() { return self._uiLock.rendererSettings; },
                set rendererSettings(val) { self._uiLock.rendererSettings = val },

                get tonemapperSettings() { return self._uiLock.tonemapperSettings; },
                set tonemapperSettings(val) { self._uiLock.tonemapperSettings = val },

                get mccSettings() { return self._uiLock.mccSettings; },
                set mccSettings(val) { self._uiLock.mccSettings = val },
            }
        };

        /**
         * Get active bundle gNsModel. Used by UI, triggers onChnage updates
         */
        Object.defineProperty(_vptFactory.prototype, "vptBundle", {
            get: function myProperty() {
                return self._gNsModel;
            }
        });


        /* ================= External updates ================= */
        /* Do not trigger onChange updates */

        /**
         * Updates bundle.
         */
        let _update = function (bundle, data) {
            for (var prop in data) {
                switch (prop) {
                    case "position":
                        this._position.fromArray(data.position);
                        delete data.position;
                        break;
                    case "quaternion":
                        this._quaternion.fromArray(data.quaternion);
                        delete data.quaternion;
                        break;
                    case "scale":
                        this._scale.fromArray(data.scale);
                        delete data.scale;
                        break;
                    case "visible":
                        this._visible = data.visible;
                        delete data.visible;
                        break;
                    case "frustumCulled":
                        this._frustumCulled = data.frustumCulled;
                        delete data.frustumCulled;
                        break;
                    case "matrixAutoUpdate":
                        this._matrixAutoUpdate = data.matrixAutoUpdate;
                        delete data.matrixAutoUpdate;
                        break;
                }
            }

        }

        let updateSharedVPTSettings = function (userId, owner, camera, updates) {
            //Entry should first be added with add.
            if (!this.hasCameraBundle(camera)) {
                return;
            }

            //let userAnnotations = this.sharedDrawnAnnotations[userId].annotations;
            let bundle = this._vptBundles.get(camera);

            $rootScope.$apply(function () {
                self._update(bundle, updates);

                /*                 for (let annUuid in updates) {
                                    for (let i = 0; i < userAnnotations.length; i++) {
                                        if (userAnnotations[i]._uuid === annUuid) {
                                            // Update annotation
                                            this._update(updates[annUuid], owner);
                                            break;
                                        }
                                    }
                                } */
            });
        };



        /* ================= Camera triggers ================= */
        this._onAddCamera = function (data) {
            var camera = data.camera;
            var local = data.local;
            var active = data.active;
            if (!self.hasCameraBundle(camera._uuid)) {
                self.setCameraBundle(camera._uuid, jQuery.extend(true, {}, self._defaultSettings));   //Set it to defaults
                console.log("Camera " + data.camera._uuid + " added");
            }
            if (!self._activeSettings) {
                self._onActivateCamera(data);
            }
        }

        this._onRmCamera = function (data) {
            var camera = data.camera;
            var local = data.local;
            var active = data.active;
            if (self.rmCameraBundle(camera._uuid))
                console.log("Camera " + data.camera._uuid + " removed");
            if (active) {
                var newActive = self._cameraManager._activeCamera;
                self._lastActiveCameraUuid = null;
                self._onActivateCamera({ camera: newActive, local: self._cameraManager.isOwnCamera(newActive), active: true });
            }
        }

        this._onActivateCamera = function (data) {
            var camera = data.camera;
            var local = data.local;
            var active = data.active;

            if (self._lastActiveCameraUuid === camera._uuid) return;

            //Add camera first, if it doesn't exist yet - should not happen
            if (!self.hasCameraBundle(camera._uuid))
                self._onAddCamera(data);

            //Save previous active bundle into last active camera    
            if (self._lastActiveCameraUuid) {
                self.setCameraBundle(self._lastActiveCameraUuid, self._activeSettings);
            }

            self._activeSettings = self.getCameraBundle(camera._uuid);
            self._lastActiveCameraUuid = camera._uuid;
            //TODO: run UI parser in scope.apply
            console.log("Camera " + data.camera._uuid + " activated");
            console.log("TODO: run UI parser in scope.apply");
        }

        /** Init camera manager listeners for camera events */
        this.initCameraManager = function (cameraManager) {
            if (this._cameraManager) {
                this._cameraManager.rmOnAddCameraListner(this._onAddCamera);
                this._cameraManager.rmOnRemoveCameraListner(this._onRmCamera);
                this._cameraManager.rmOnSwitchActiveCameraListner(this._onActivateCamera);
            }
            this._cameraManager = cameraManager;
            this._cameraManager.addOnAddCameraListner(this._onAddCamera);
            this._cameraManager.addOnRemoveCameraListner(this._onRmCamera);
            this._cameraManager.addOnSwitchActiveCameraListner(this._onActivateCamera);
        };

    })(this);
});
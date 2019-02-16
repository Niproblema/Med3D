/**
 * Created by Jan on 3.2.2019
 * Hold and VPT settings and states for rendering and collaboration. 
 */
app.factory('VPT', ['$rootScope', function ($rootScope) {
    return new (function _vptFactory() {
        let self = this;
        let _cameraManager = null;
        let _vptInterface = null;
        let _sharingService = null;

        let _lastActiveCameraUuid = null;

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

        //Local specific meta : Bundle.uuid -> meta -> keys: amOwner, cameraUUID
        this.__bundleMeta = new Map();

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


        this.getNewBundle = function () {
            var bundle = jQuery.extend(true, {}, vptDataStructure.defaultSettings);
            bundle.uuid = THREE.Math.generateUUID();
            return bundle
        }

        //This client's currently active settings. For init, copy default settings. 
        this._activeSettings = null;


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
            mccSettings: false,

            // Object structure that is defined by lock. Update can be applied to fiter, to only update that part of settings
            filters: {
                rendererSelection: {
                    rendererChoiceID: 100
                },
                rendererSettings: {
                    eam: {
                        background: true,
                        blendMeshRatio: 0.0,
                        meshLight: true,
                        blendMeshColor: {
                            r: 0.28,
                            g: 0.7,
                            b: 0.7
                        },
                        resolution: 512,
                        steps: 10,
                        alphaCorrection: 5,
                        tfBundle: { uuid: "1", bumps: [] }
                    },
                    iso: {
                        background: true,
                        blendMeshRatio: 0.0,
                        meshLight: true,
                        blendMeshColor: {
                            r: 0.28,
                            g: 0.7,
                            b: 0.7
                        },
                        resolution: 512,
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
                        blendMeshRatio: 0.0,
                        meshLight: true,
                        blendMeshColor: {
                            r: 0.28,
                            g: 0.7,
                            b: 0.7
                        },
                        resolution: 512,
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
                    }
                },
                tonemapperSettings: {
                    reinhard: {
                        exposure: 1
                    },
                    range: {
                        rangeLower: 0,
                        rangeHigher: 1
                    }
                },
                mccSettings: {
                    useMCC: false
                }
            },

            onChange: {
                rendererSelection: function (locked) { if (locked && !self.__bundleMeta.get(self._activeSettings.uuid).amOwner) self.lockAndRestoreSection(self._uiLock.filters.rendererSelection) },
                rendererSettings: function (locked) { if (locked && !self.__bundleMeta.get(self._activeSettings.uuid).amOwner) self.lockAndRestoreSection(self._uiLock.filters.rendererSettings) },
                tonemapperSettings: function (locked) { if (locked && !self.__bundleMeta.get(self._activeSettings.uuid).amOwner) self.lockAndRestoreSection(self._uiLock.filters.tonemapperSettings) },
                mccSettings: function (locked) { if (locked && !self.__bundleMeta.get(self._activeSettings.uuid).amOwner) self.lockAndRestoreSection(self._uiLock.filters.mccSettings) }
            }
        };

        /* Locks section of UI. Restore saved settings and refreshes UI */
        this.lockAndRestoreSection = function (filter) {
            let saved = self.getCameraBundle(self.__bundleMeta.get(self._activeSettings.uuid).cameraUUID);
            self._applyUpdateBundleToBundle(saved, filter);
            self._applyUpdateBundleToBundle(filter, self._activeSettings);
            self._updateUIsidebar();
        }



        /* ================= GETTER and SETTER model ================= */
        /* Controller for _activeSettings, holds setters with onChangeListeners */
        this._gNsModel = {
            get rendererChoiceID() { return self._activeSettings.rendererChoiceID; },
            set rendererChoiceID(val) { self._activeSettings.rendererChoiceID = val; self._outUpdate({ rendererChoiceID: val }) },

            eam: {
                get background() { return self._activeSettings.eam.background; },
                set background(val) { self._activeSettings.eam.background = val; self._outUpdate({ eam: { background: val } }) },

                get blendMeshRatio() { return self._activeSettings.eam.blendMeshRatio; },
                set blendMeshRatio(val) { self._activeSettings.eam.blendMeshRatio = val; self._outUpdate({ eam: { blendMeshRatio: val } }) },

                get meshLight() { return self._activeSettings.eam.meshLight; },
                set meshLight(val) { self._activeSettings.eam.meshLight = val; self._outUpdate({ eam: { meshLight: val } }) },

                get blendMeshColor() {
                    return {
                        get r() { return self._activeSettings.eam.blendMeshColor.r; },
                        set r(val) { self._activeSettings.eam.blendMeshColor.r = val; self._outUpdate({ eam: { blendMeshColor: { r: val } } }) },
                        get g() { return self._activeSettings.eam.blendMeshColor.g; },
                        set g(val) { self._activeSettings.eam.blendMeshColor.g = val; self._outUpdate({ eam: { blendMeshColor: { g: val } } }) },
                        get b() { return self._activeSettings.eam.blendMeshColor.b; },
                        set b(val) { self._activeSettings.eam.blendMeshColor.b = val; self._outUpdate({ eam: { blendMeshColor: { b: val } } }) }
                    }
                },
                set blendMeshColor(val) { self._activeSettings.eam.color = val; self._outUpdate({ eam: { blendMeshColor: val } }) },

                get resolution() { return self._activeSettings.eam.resolution; },
                set resolution(val) { self._activeSettings.eam.resolution = val; self._outUpdate({ eam: { resolution: val } }) },

                get steps() { return self._activeSettings.eam.steps; },
                set steps(val) { self._activeSettings.eam.steps = val; self._outUpdate({ eam: { steps: val } }) },

                get alphaCorrection() { return self._activeSettings.eam.alphaCorrection; },
                set alphaCorrection(val) { self._activeSettings.eam.alphaCorrection = val; self._outUpdate({ eam: { alphaCorrection: val } }) },

                get tf() { return self._state.tf.eam; },
                set tf(val) { self._state.tf.eam = val },

                get tfBundle() { return self._activeSettings.eam.tfBundle; },
                set tfBundle(val) { self._activeSettings.eam.tfBundle = val; self._outUpdate({ eam: { tfBundle: val } }) }
            },
            iso: {
                get background() { return self._activeSettings.iso.background; },
                set background(val) { self._activeSettings.iso.background = val; self._outUpdate({ iso: { background: val } }) },

                get blendMeshRatio() { return self._activeSettings.iso.blendMeshRatio; },
                set blendMeshRatio(val) { self._activeSettings.iso.blendMeshRatio = val; self._outUpdate({ iso: { blendMeshRatio: val } }) },

                get meshLight() { return self._activeSettings.iso.meshLight; },
                set meshLight(val) { self._activeSettings.iso.meshLight = val; self._outUpdate({ iso: { meshLight: val } }) },

                get blendMeshColor() {
                    return {
                        get r() { return self._activeSettings.iso.blendMeshColor.r; },
                        set r(val) { self._activeSettings.iso.blendMeshColor.r = val; self._outUpdate({ iso: { blendMeshColor: { r: val } } }) },
                        get g() { return self._activeSettings.iso.blendMeshColor.g; },
                        set g(val) { self._activeSettings.iso.blendMeshColor.g = val; self._outUpdate({ iso: { blendMeshColor: { g: val } } }) },
                        get b() { return self._activeSettings.iso.blendMeshColor.b; },
                        set b(val) { self._activeSettings.iso.blendMeshColor.b = val; self._outUpdate({ iso: { blendMeshColor: { b: val } } }) }
                    }
                },
                set blendMeshColor(val) { self._activeSettings.iso.color = val; self._outUpdate({ iso: { blendMeshColor: val } }) },

                get resolution() { return self._activeSettings.iso.resolution; },
                set resolution(val) { self._activeSettings.iso.resolution = val; self._outUpdate({ iso: { resolution: val } }) },

                get steps() { return self._activeSettings.iso.steps; },
                set steps(val) { self._activeSettings.iso.steps = val; self._outUpdate({ iso: { steps: val } }) },

                get isoVal() { return self._activeSettings.iso.isoVal; },
                set isoVal(val) { self._activeSettings.iso.isoVal = val; self._outUpdate({ iso: { isoVal: val } }) },

                get color() {
                    return {
                        get r() { return self._activeSettings.iso.color.r; },
                        set r(val) { self._activeSettings.iso.color.r = val; self._outUpdate({ iso: { color: { r: val } } }) },
                        get g() { return self._activeSettings.iso.color.g; },
                        set g(val) { self._activeSettings.iso.color.g = val; self._outUpdate({ iso: { color: { g: val } } }) },
                        get b() { return self._activeSettings.iso.color.b; },
                        set b(val) { self._activeSettings.iso.color.b = val; self._outUpdate({ iso: { color: { b: val } } }) }
                    }
                },
                set color(val) { self._activeSettings.iso.color = val; self._outUpdate({ iso: { color: val } }) }
            },
            mcs: {
                get background() { return self._activeSettings.mcs.background; },
                set background(val) { self._activeSettings.mcs.background = val; self._outUpdate({ mcs: { background: val } }) },

                get blendMeshRatio() { return self._activeSettings.mcs.blendMeshRatio; },
                set blendMeshRatio(val) { self._activeSettings.mcs.blendMeshRatio = val; self._outUpdate({ mcs: { blendMeshRatio: val } }) },

                get meshLight() { return self._activeSettings.mcs.meshLight; },
                set meshLight(val) { self._activeSettings.mcs.meshLight = val; self._outUpdate({ mcs: { meshLight: val } }) },

                get blendMeshColor() {
                    return {
                        get r() { return self._activeSettings.mcs.blendMeshColor.r; },
                        set r(val) { self._activeSettings.mcs.blendMeshColor.r = val; self._outUpdate({ mcs: { blendMeshColor: { r: val } } }) },
                        get g() { return self._activeSettings.mcs.blendMeshColor.g; },
                        set g(val) { self._activeSettings.mcs.blendMeshColor.g = val; self._outUpdate({ mcs: { blendMeshColor: { g: val } } }) },
                        get b() { return self._activeSettings.mcs.blendMeshColor.b; },
                        set b(val) { self._activeSettings.mcs.blendMeshColor.b = val; self._outUpdate({ mcs: { blendMeshColor: { b: val } } }) }
                    }
                },
                set blendMeshColor(val) { self._activeSettings.mcs.color = val; self._outUpdate({ mcs: { blendMeshColor: val } }) },

                get resolution() { return self._activeSettings.mcs.resolution; },
                set resolution(val) { self._activeSettings.mcs.resolution = val;; self._outUpdate({ mcs: { resolution: val } }) },

                get sigma() { return self._activeSettings.mcs.sigma; },
                set sigma(val) { self._activeSettings.mcs.sigma = val; self._outUpdate({ mcs: { sigma: val } }) },

                get alphaCorrection() { return self._activeSettings.mcs.alphaCorrection; },
                set alphaCorrection(val) { self._activeSettings.mcs.alphaCorrection = val; self._outUpdate({ mcs: { alphaCorrection: val } }) },

                get tf() { return self._state.tf.mcs; },
                set tf(val) { self._state.tf.mcs = val },

                get tfBundle() { return self._activeSettings.mcs.tfBundle; },
                set tfBundle(val) { self._activeSettings.mcs.tfBundle = val; self._outUpdate({ mcs: { tfBundle: val } }) }
            },
            mip: {
                get background() { return self._activeSettings.mip.background; },
                set background(val) { self._activeSettings.mip.background = val; self._outUpdate({ mip: { background: val } }) },

                get blendMeshRatio() { return self._activeSettings.mip.blendMeshRatio; },
                set blendMeshRatio(val) { self._activeSettings.mip.blendMeshRatio = val; self._outUpdate({ mip: { blendMeshRatio: val } }) },

                get meshLight() { return self._activeSettings.mip.meshLight; },
                set meshLight(val) { self._activeSettings.mip.meshLight = val; self._outUpdate({ mip: { meshLight: val } }) },

                get blendMeshColor() {
                    return {
                        get r() { return self._activeSettings.mip.blendMeshColor.r; },
                        set r(val) { self._activeSettings.mip.blendMeshColor.r = val; self._outUpdate({ mip: { blendMeshColor: { r: val } } }) },
                        get g() { return self._activeSettings.mip.blendMeshColor.g; },
                        set g(val) { self._activeSettings.mip.blendMeshColor.g = val; self._outUpdate({ mip: { blendMeshColor: { g: val } } }) },
                        get b() { return self._activeSettings.mip.blendMeshColor.b; },
                        set b(val) { self._activeSettings.mip.blendMeshColor.b = val; self._outUpdate({ mip: { blendMeshColor: { b: val } } }) }
                    }
                },
                set blendMeshColor(val) { self._activeSettings.mip.color = val; self._outUpdate({ mip: { blendMeshColor: val } }) },

                get resolution() { return self._activeSettings.mip.resolution; },
                set resolution(val) { self._activeSettings.mip.resolution = val; self._outUpdate({ mip: { resolution: val } }) },

                get steps() { return self._activeSettings.mip.steps; },
                set steps(val) { self._activeSettings.mip.steps = val; self._outUpdate({ mip: { steps: val } }) }
            },

            reinhard: {
                get exposure() { return self._activeSettings.reinhard.exposure; },
                set exposure(val) { self._activeSettings.reinhard.exposure = val; self._outUpdate({ reinhard: { exposure: val } }) }
            },
            range: {
                get rangeLower() { return self._activeSettings.range.rangeLower; },
                set rangeLower(val) { self._activeSettings.range.rangeLower = val; self._outUpdate({ range: { rangeLower: val } }) },

                get rangeHigher() { return self._activeSettings.range.rangeHigher; },
                set rangeHigher(val) { self._activeSettings.range.rangeHigher = val; self._outUpdate({ range: { rangeHigher: val } }) }
            },

            get useMCC() { return self._activeSettings.useMCC; },
            set useMCC(val) { self._activeSettings.useMCC = val; self._outUpdate({ useMCC: val }) },

            get resetMVP() { return self._state.resetMVP; },
            set resetMVP(val) { self._state.resetMVP = val },

            get resetBuffers() { return self._state.resetBuffers; },
            set resetBuffers(val) { self._state.resetBuffers = val },

            get objects() { return self._state.objects; },
            set objects(val) { self._state.objects = val },

            get mccStatus() { return self._state.mccStatus; },
            set mccStatus(val) { self._state.mccStatus = val },

            uiLock: {
                get rendererSelection() { return self._uiLock.rendererSelection; },
                set rendererSelection(val) { self._uiLock.rendererSelection = val; self._uiLock.onChange.rendererSelection(val) },

                get rendererSettings() { return self._uiLock.rendererSettings; },
                set rendererSettings(val) { self._uiLock.rendererSettings = val; self._uiLock.onChange.rendererSettings(val) },

                get tonemapperSettings() { return self._uiLock.tonemapperSettings; },
                set tonemapperSettings(val) { self._uiLock.tonemapperSettings = val; self._uiLock.onChange.tonemapperSettings(val) },

                get mccSettings() { return self._uiLock.mccSettings; },
                set mccSettings(val) { self._uiLock.mccSettings = val; self._uiLock.onChange.mccSettings(val) },
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


        /* ================= Camera triggers ================= */
        this._onAddCamera = function (data) {
            var camera = data.camera;
            var local = data.local;
            var active = data.active;
            if (!self.hasCameraBundle(camera._uuid)) {
                var bundle = self.getNewBundle();
                //Save bundle to _vptBundles
                self.setCameraBundle(camera._uuid, bundle);
                //Set some local meta for this bundle
                self.__bundleMeta.set(bundle.uuid, { amOwner: self._cameraManager.isOwnCamera(camera), cameraUUID: camera._uuid });
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
            //Delete saved bundle's meta and bundle itself
            try {
                if (self.__bundleMeta.delete(self.getCameraBundle(camera._uuid).uuid) && self.rmCameraBundle(camera._uuid))
                    console.log("Camera " + data.camera._uuid + " removed");
                else
                    console.error("Error trying to remove camera " + camera._uuid + ".");
            } catch (err) {
                console.error("Error trying to remove camera " + camera._uuid + ". " + err);
            }
            if (active) {
                self._lastActiveCameraUuid = null;
            }
        }

        this._onActivateCamera = function (data) {
            var camera = data.camera;
            var local = data.local;
            var active = data.active;

            if (self._lastActiveCameraUuid === camera._uuid) return;

            //Add camera first, if it doesn't exist yet - should not happen
            if (!self.hasCameraBundle(camera._uuid)) {
                console.error("Trying to activate camera, that doesn't exist.")
                self._onAddCamera(data);
            }

            // Use deep clone, so we don't overwrite saved bundles.
            self._activeSettings = jQuery.extend(true, {}, self.getCameraBundle(camera._uuid));
            self._lastActiveCameraUuid = camera._uuid;

            console.log("Camera " + data.camera._uuid + " activated");

            // Lock UI locks, on shared camera
            var unlock = self._cameraManager.isOwnCamera(camera);
            self._uiLock.rendererSelection = !unlock;
            self._uiLock.rendererSettings = !unlock;
            self._uiLock.tonemapperSettings = !unlock;
            self._uiLock.mccSettings = !unlock;

            // Update UI with new active settings
            self._updateUIsidebar();
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

        this.initVPTrendInterface = function (vptInterface) {
            this._vptInterface = vptInterface;
        }

        this.initSharingService = function (sharingService) {
            this._sharingService = sharingService;
        }


        /* ================= Sidebar controls ================= */

        this._updateUIsidebar = function () {
            //This doesn't work for startup with first camera as sidebarDirective isn't init yet. Would be nice if it was
            $rootScope.$broadcast('refreshVPTsidebar');
        }

        /* ================= vptInterface controls ================= */

        this.getVptInterface = function () {
            return this._vptInterface;
        }


        /* ================ Updating values ================== */
        /* Outgoing updates. UI change -> active settings chnage -> stored settings update + notify other users */
        this._outUpdate = function (update) {
            //Don't make update for bundle that's not mine
            var meta = self.__bundleMeta.get(self._activeSettings.uuid);

            if (meta == null || !meta.amOwner)
                return;


            //Update local stored bundle too.
            var storedBundle = self.getCameraBundle(meta.cameraUUID)
            if (storedBundle == undefined || storedBundle == null) {
                console.error("Error vpt changing settings");
                return;
            }
            this._applyUpdateBundleToBundle(update, storedBundle);

            // TODO : merge shitton of updates into bigger packages to not spamm everyone?
            if (this._sharingService && (this._sharingService.state.hostingInProgress || this._sharingService.state.listeningInProgress)) {
                this._sharingService.sendVPTupdate(meta.cameraUUID, update);
            }
        }


        /**
         * Prepares current own settings export
         */
        this.outExportOwnState = function () {
            let out = {};
            this._vptBundles.forEach(function (value, key) {
                if (self.__bundleMeta.has(value.uuid)) {
                    let meta = self.__bundleMeta.get(value.uuid);
                    if (meta.amOwner) {
                        out[key] = value;
                    }
                }
            });
            return out;
        }



        /* Deep copy all union data from bundle or update budle to target bundle */
        this._applyUpdateBundleToBundle = vptDataStructure.applyUpdateBundleToBundle;


        /* Ingoing updates - do not trigger onChnage updates */
        this.inUpdate = function (cameraUUID, update) {
            //Entry should first be added with add.
            if (!this.hasCameraBundle(cameraUUID)) {
                return;
            }
            delete update.uuid;     //Don't want to overwrite local uuid bundles..
            let bundle = this.getCameraBundle(cameraUUID);
            this._applyUpdateBundleToBundle(update, bundle);
            if (bundle.uuid === this._activeSettings.uuid) {

                if (this._uiLock.rendererSelection) {
                    let rendChoiceFilter = this._uiLock.filters.rendererSelection;
                    this._applyUpdateBundleToBundle(bundle, rendChoiceFilter);
                    this._applyUpdateBundleToBundle(rendChoiceFilter, this._activeSettings);
                }
                if (this._uiLock.rendererSettings) {
                    let rendSettingsFilter = this._uiLock.filters.rendererSettings;
                    this._applyUpdateBundleToBundle(bundle, rendSettingsFilter);
                    this._applyUpdateBundleToBundle(rendSettingsFilter, this._activeSettings);
                }
                if (this._uiLock.tonemapperSettings) {
                    let tmSettingsFilter = this._uiLock.filters.tonemapperSettings;
                    this._applyUpdateBundleToBundle(bundle, tmSettingsFilter);
                    this._applyUpdateBundleToBundle(tmSettingsFilter, this._activeSettings);
                }
                if (this._uiLock.mccSettings) {
                    let mccSettingsFilter = this._uiLock.filters.mccSettings;
                    this._applyUpdateBundleToBundle(bundle, mccSettingsFilter);
                    this._applyUpdateBundleToBundle(mccSettingsFilter, this._activeSettings);
                }

                this._updateUIsidebar();
            }
        };

    })(this);
}]);
/**
 * Created by Jan on 3.2.2019
 * Hold and VPT settings and states for rendering and collaboration.
 */
app.factory('VPT', function ($rootScope) {
    return new (function _vptFactory() {
        let self = this;

        /* Change listener */
        this._onChangeListener = {};

        this.addListener = function (id, onChange) {
            this._onChangeListener[id] = onChange;
        }

        this.rmListener = function (id) {
            delete this._onChangeListener[id];
        }

        /* ================= SETTING BUNDLES ================= */

        //Default settings, if needed to reset.
        this._defaultSettings = {
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
                tf: null
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
                tf: null
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
        this._activeSettings = jQuery.extend(true, {}, this._defaultSettings);


        /* ================= STATE BUNDLE ================= */
        /* Client specific only settings - not shareable */
        this._state = {
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

                get tf() { return self._activeSettings.eam.tf; },
                set tf(val) { self._activeSettings.eam.tf = val }
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

                get tf() { return self._activeSettings.mcs.tf; },
                set tf(val) { self._activeSettings.mcs.tf = val }
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


        /* ================= Public methods ================= */
        //get vptBundle - this._gNsModel
        Object.defineProperty(_vptFactory.prototype, "vptBundle", {
            get: function myProperty() {
                return self._gNsModel;
            }
        });


    })(this);
});
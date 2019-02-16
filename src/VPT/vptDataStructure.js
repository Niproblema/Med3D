/**
 * Provides default vpt data structure, uiLock filters and it's apply methods
 */
(function (exports) {

    // your code goes here

    /**
    * Default vptBundle. Use deep clone on it please
    */
    exports.defaultSettings = {
        uuid: "changeThis",
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
        useMCC: false
    }

    /**
     * Deep copy all union data from bundle or update budle to target bundle
     * @param {vptDataStructure} update 
     * @param {vptDataStructure} target 
     */
    exports.applyUpdateBundleToBundle = function (update, target) {
        for (let prop in update) {
            if (update.hasOwnProperty(prop) && target.hasOwnProperty(prop) && typeof update[prop] === typeof target[prop]) {
                if (prop === "tfBundle") {      //Exception for tfBundle, 
                    target.tfBundle = exports.deepCopy(update.tfBundle);
                } else if (typeof update[prop] === "object") {
                    exports.applyUpdateBundleToBundle(update[prop], target[prop]);
                } else {
                    target[prop] = update[prop];
                }
            }
        }
    }

    exports.deepCopy = function(obj) {
        if(typeof obj !== 'object' || obj === null) {
            return obj;
        }
        
        if(obj instanceof Array) {
            return obj.reduce((arr, item, i) => {
                arr[i] = exports.deepCopy(item);
                return arr;
            }, []);
        }
    
        if(obj instanceof Object) {
            return Object.keys(obj).reduce((newObj, key) => {
                newObj[key] = exports.deepCopy(obj[key]);
                return newObj;
            }, {})
        }
    }


})(typeof exports === 'undefined' ? this['vptDataStructure'] = {} : exports);
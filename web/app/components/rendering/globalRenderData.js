/**
 * Created by Primoz on 20. 12. 2016.
 */

app.factory('PublicRenderData', function () {
    return {
        contentRenderGroup: null,
        canvasDimensions: { width: 1280, height: 1024 },
        renderingInProgress: false,

        // Camera management
        cameraManager: new CameraManager(),

        // Drawing parameters
        lineColor: new THREE.Color(1, 1, 1),
        lineThickness: 5, // px
        lineHardness: 0.1,

        // Function binder
        replaceRenderContent: null,
        setActiveCamera: null,

        // == UI interface to VPTrendInterface, also default values== //
        //VPT renderers - 0=Abstract, 1=EAM, 2=ISO, 3=MCS, 4=MIP
        vptBundle: {
            rendererChoiceID: 3,
            rendererName: "MCS",
            resetRequest: false,
            eam: {
                steps: 10,
                alphaCorrection: 1,
                tf: null
            },
            iso: {
                steps: 10,
                isoVal: 0.5,
                color: {
                    r: 1,
                    g: 1,
                    b: 1
                }  
            },
            mcs: {
                sigma: 10,
                alphaCorrection: 1,
                tf: null    
            },
            mip: {
                steps: 10
            },
            reinhard: {
                exposure: 1
            },
            range: {
                rangeLower: 0,
                rangeHigher: 1
            }
        }
    };
});
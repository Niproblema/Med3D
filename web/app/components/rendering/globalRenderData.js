/**
 * Created by Primoz on 20. 12. 2016.
 */

app.factory('PublicRenderData', function(){
    return {
        contentRenderGroup: null,
        canvasDimensions: {width: 1280, height: 1024},
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

        //UI interface to VPTrendInterface
        //Avoid string comparisons - VPT renderers - 0=Abstract, 1=EAM, 2=ISO, 3=MCS, 4=MIP
        vptRendererChoice : 0       
    };
});
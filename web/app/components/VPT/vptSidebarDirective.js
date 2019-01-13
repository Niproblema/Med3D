/**
 * Created by Jan on 9.7.2018.
 */

app.directive("vptSidebar", function () {
    return {
        restrict: 'E',
        replace: true,
        scope: false,
        link: function (scope, element, attributes) {
            // Add Object.keys functionality to scope
            scope.getKeys = Object.keys;

            // Fetch the id used for sidebar content toggling
            element.attr("id", attributes.toggleId);

            // On volume available change listener - enables or disables VPT options sidebar
/*             scope.publicRenderData.vptSceneChangedListener = function(){
                if(scope.publicRenderData.getVPTController().getIsRunning){
                    //Enable menu    TODO!
                }else{
                    //Disable menu  TODO!

                }
            }; */
            

            // Configure scroll bar
            element.find('.mCustomScrollbar').mCustomScrollbar({ alwaysShowScrollbar: 0, updateOnContentResize: true });

            //VPT renderer switcher
            scope.allRenderers = ["ERROR", "EAM", "ISO", "MCS", "MIP"];

            scope.renderer = 3; //current selected - also default
            scope.setRenderer = function (i) {
                if (i != scope.renderer) {
                    console.log("VPT previous renderer: " + scope.allRenderers[scope.renderer]);
                    console.log("VPT new renderer: " + scope.allRenderers[i]);
                    scope.renderer = i;

                    //Call VPTController
                    scope.publicRenderData.vptRendererChoice = i;
                    //Call for Directive-Needed for tranform function application
                    scope.$broadcast('start'+scope.allRenderers[scope.renderer]);
                }
            };
            //Apply default!
            scope.publicRenderData.vptRendererChoice = i;
            scope.$broadcast('start'+scope.allRenderers[scope.renderer]);



            // Sliders for Tone mapper settings
            let exposureHandle = element.find('#exposureHandle');
            element.find('#exposureSlider').slider({
                value: 1,
                min: 0,
                max: 32,
                step: 0.1,
                create: function () {
                   // scope.publicRenderData.getVPTController().getToneMapper()._exposure = parseFloat($(this).slider("value"));
                    exposureHandle.text($(this).slider("value"));
                },
                slide: function (event, ui) {
                    //scope.publicRenderData.getVPTController().getToneMapper()._exposure = parseFloat(ui.value);
                    exposureHandle.text(ui.value);
                }
            });

            let rangeHandle1 = element.find('#rangeHandle1');
            let rangeHandle2 = element.find('#rangeHandle2');
            element.find('#rangeSlider').slider({

                range: true,
                min: 0,
                max: 1,
                values: [0, 1],
                step: 0.01,
                create: function () {
                    //scope.publicRenderData.lineHardness = $(this).slider( "value" );
                    rangeHandle1.text($(this).slider("values")[0]);
                    rangeHandle2.text($(this).slider("values")[1]);
                    //scope.publicRenderData.getVPTController().getToneMapper()._min = parseFloat($(this).slider("values")[0]);
                    //scope.publicRenderData.getVPTController().getToneMapper()._max = parseFloat($(this).slider("values")[1]);
                },
                slide: function (event, ui) {
                    //scope.publicRenderData.lineHardness = ui.value;
                    rangeHandle1.text(ui.values[0]);
                    rangeHandle2.text(ui.values[1]);
                    scope.publicRenderData.getVPTController().getToneMapper()._min = parseFloat(ui.values[0]);
                    scope.publicRenderData.getVPTController().getToneMapper()._max = parseFloat(ui.values[1]);
                }
            });

            // Configure color picker
            let sliders = {
                saturation: {
                    maxLeft: 210,
                    maxTop: 125,
                    callLeft: 'setSaturation',
                    callTop: 'setBrightness'
                },
                hue: {
                    maxLeft: 0,
                    maxTop: 125,
                    callLeft: false,
                    callTop: 'setHue'
                }
            };
        },
        templateUrl: function (element, attributes) {
            return '/web/app/components/VPT/vptSidebar.html';
        }
    }
});
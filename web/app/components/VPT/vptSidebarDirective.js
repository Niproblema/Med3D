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

            // Configure scroll bar
            element.find('.mCustomScrollbar').mCustomScrollbar({ alwaysShowScrollbar: 0, updateOnContentResize: true });

            //VPT renderer switcher
            scope.allRenderers = ["ERROR", "EAM", "ISO", "MCS", "MIP"];
            scope.renderer = scope.publicRenderData.vptBundle.rendererChoiceID; //current selected 
            scope.setRenderer = function (i) {
                if (i != scope.renderer) {
                    console.log("VPT previous renderer: " + scope.allRenderers[scope.renderer]);
                    console.log("VPT new renderer: " + scope.allRenderers[i]);
                    scope.renderer = i;

                    //Call VPTController
                    scope.publicRenderData.vptBundle.rendererChoiceID = i;
                    
                    //Call for Directive-Needed for tranform function application
                    scope.$broadcast('start'+scope.allRenderers[scope.renderer]);
                }
            };
            //Apply default!
            scope.$broadcast('start'+scope.allRenderers[scope.renderer]);



            // Sliders for Tone mapper settings
            let exposureHandle = element.find('#exposureHandle');
            element.find('#exposureSlider').slider({
                value: scope.publicRenderData.vptBundle.reinhard.exposure,
                min: 0,
                max: 32,
                step: 0.1,
                create: function () {
                    exposureHandle.text($(this).slider("value"));
                },
                slide: function (event, ui) {
                    scope.publicRenderData.vptBundle.reinhard.exposure = parseFloat(ui.value);
                    exposureHandle.text(ui.value);
                }
            });

            let rangeHandle1 = element.find('#rangeHandle1');
            let rangeHandle2 = element.find('#rangeHandle2');
            element.find('#rangeSlider').slider({

                range: true,
                min: 0,
                max: 1,
                values: [scope.publicRenderData.vptBundle.range.rangeLower, scope.publicRenderData.vptBundle.range.rangeHigher],
                step: 0.01,
                create: function () {
                    rangeHandle1.text($(this).slider("values")[0]);
                    rangeHandle2.text($(this).slider("values")[1]);
                },
                slide: function (event, ui) {
                    //scope.publicRenderData.lineHardness = ui.value;
                    rangeHandle1.text(ui.values[0]);
                    rangeHandle2.text(ui.values[1]);
                    scope.publicRenderData.vptBundle.range.rangeLower = parseFloat($(this).slider("values")[0]);
                    scope.publicRenderData.vptBundle.range.rangeHigher = parseFloat($(this).slider("values")[1]);
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

            //  ==== Marching cubes tab ==== //

            scope.isComputingMCC = false;

            let mccRadioOff = $("#march-off");
            let mccRadioOn = $("march-on");
            scope.setMarching= function(bool){
                if(bool){   //Turn on MCC geometry
                    if(!scope.publicRenderData.vptBundle.mccStatus || scope.isComputingMCC){    //Availability condition - false
                        mccRadioOff.checked= true;
                        mccRadioOn.checked = false;
                        console.log("Cannot turn on")
                    }else{      //Availability condition - true
                      
                    }


                }else{      //Turn off MCC geometry

                }
            };


            let cpuHandle = element.find('#cpuHandle');
            element.find('#cpuSlider').slider({
                value: Math.ceil(window.navigator.hardwareConcurrency / 2),
                min: 1,
                max: window.navigator.hardwareConcurrency,
                step: 1,
                create: function () {
                    cpuHandle.text($(this).slider("value"));
                },
                slide: function (event, ui) {
                    cpuHandle.text(ui.value);
                }
            });

            let computeMCCButton = $("#calculateMRC");

            scope.calculateMRC = function(){
                //TODO: calc stuff;
                scope.isComputingMCC = true;
                console.log("Computing JAJAJA");
            };
            
            



        },
        templateUrl: function (element, attributes) {
            return '/web/app/components/VPT/vptSidebar.html';
        }
    }
});
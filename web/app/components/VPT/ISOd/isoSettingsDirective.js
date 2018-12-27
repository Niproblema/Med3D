/**
 * Created by Jan on 23.08.2018
 */

app.directive("isoSettings", function () {
    return {
        restrict: 'E',
        replace: true,
        scope: false,
        link: function (scope, element, attributes) {

            // Add Object.keys functionality to scope
            scope.getKeys = Object.keys;

            //Start notification for restoring UI values
            scope.$on('startISO', function () {
                inSteps.val(Math.round(1/scope.publicRenderData.getVPTController().getRenderer()._stepSize));
                inISO.val(scope.publicRenderData.getVPTController().getRenderer()._isovalue);
            });
            //
            
            let inSteps = element.find('[name="inSteps"]');
            let inISO = element.find('[name="inISO"]');
            let inColor = element.find('#inColor');
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

            
            inSteps.change(function(){
                value = Math.max(1, parseInt(inSteps.val(), 10)) || 10;
                scope.publicRenderData.getVPTController().getRenderer()._stepSize = 1 / value;
                inSteps.val(value);
            }.bind(this));

            
            inISO.change(function(){
                value = Math.max(0.01, parseFloat(inISO.val())) || 0.5;
                scope.publicRenderData.getVPTController().getRenderer()._isovalue = value;
                inISO.val(value);
            }.bind(this));

            inColor.colorpicker({
                color: "#ffffff",
                container: true,
                inline: true,
                format: "rgb",
                sliders: sliders}).on('changeColor', function(e) {
                                        color = e.color.toString('rgb').match(/rgba?\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)?(?:, ?(\d(?:\.\d?))\))?/);                                        
                                        scope.publicRenderData.getVPTController().getRenderer()._diffuse[0] = color[1] / 255;// parseInt(color.substr(1, 2), 16) / 255;
                                        scope.publicRenderData.getVPTController().getRenderer()._diffuse[1] = color[2] / 255;//  parseInt(color.substr(3, 2), 16) / 255;
                                        scope.publicRenderData.getVPTController().getRenderer()._diffuse[2] = color[3] / 255; //parseInt(color.substr(5, 2), 16) / 255;

                                    });


        },
        templateUrl: function(element, attributes) {
            return '/web/app/components/VPT/ISOd/isoSettings.html';
        }
    }
});
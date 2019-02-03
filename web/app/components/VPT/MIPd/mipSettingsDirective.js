/**
 * Created by Jan on 23.08.2018
 */

app.directive("mipSettings", function () {
    return {
        restrict: 'E',
        replace: true,
        scope: false,
        link: function (scope, element, attributes) {

            // Add Object.keys functionality to scope
            scope.getKeys = Object.keys;

            //Start notification for restoring UI values
            scope.$on('startMIP', function () {  
                $(blendSlider).slider("value", scope.vptGData.vptBundle.mip.blendMeshRatio);
                changeResolution(scope.vptGData.vptBundle.mip.resolution);
                inSteps.val(scope.vptGData.vptBundle.mip.steps);//Math.round(1 / scope.vptGData.getVPTController().getRenderer()._stepSize));
            });
            //

            //Blend mesh ratio
            let blendHandle = element.find('#blendHandleMIP');
            let blendSlider = element.find('#blendSliderMIP');
            blendSlider.slider({
                value: scope.vptGData.vptBundle.mip.blendMeshRatio,
                min: 0,
                max: 1,
                step: 0.01,
                create: function () {
                    blendHandle.text($(this).slider("value"));
                },
                slide: function (event, ui) {
                    scope.vptGData.vptBundle.mip.blendMeshRatio = parseFloat(ui.value);
                    blendHandle.text(ui.value);
                }
            });

            //Res setting

            let resolutionValues = [256, 512, 1024, 2048];
            let resolutionHandle = element.find('#resolutionHandleMIP');
            let resolutionSlider = element.find('#resolutionSliderMIP');
            let resLabels = [];
            let lastVal = null;
            resolutionSlider.slider({
                min: 0,
                max: 3,
                step: 1,
                value: 1,
                create: function () {
                    lastVal = $(this).slider("value");
                },
                slide: function (event, ui) {
                    scope.vptGData.vptBundle.mip.resolution = resolutionValues[ui.value];
                    scope.vptGData.vptBundle.resetBuffers = true;
                    changeResolutionSlider(ui.value, true);
                }
            }).each(function () {
                // Get the number of possible values
                var vals = resolutionSlider.slider("option", "max") - resolutionSlider.slider("option", "min");
                // Space out values
                for (var i = 0; i <= vals; i++) {

                    var el = $('<label>' + resolutionValues[i] + '</label>').css('left', (i / vals * 98) + '%');

                    $(resolutionSlider).append(el);
                    resLabels[i] = el;
                    if (i === lastVal)
                        el.addClass("selected");
                }
            });

            //Changes UI to closest selectable value
            let changeResolution = function (resValue) {
                var i = 0;
                while (i < resolutionValues.length && resolutionValues[i] < resValue) {
                    i++;
                }
                var selected = i >= resolutionValues.length ? resolutionValues.length - 1 : (i == 0 ? i : (Math.abs(resValue - resolutionValues[i]) <= Math.abs(resValue - resolutionValues[i - 1]) ? i : i - 1));
                changeResolutionSlider(selected);
            }

            //Changes UI to selected index
            let changeResolutionSlider = function (index, userChanged) {
                if (lastVal !== index) {
                    $(resLabels[lastVal]).removeClass("selected");
                    lastVal = index;
                    $(resLabels[lastVal]).addClass("selected");
                    if (userChanged === undefined || !userChanged) {
                        $(resolutionSlider).slider("value", index)
                    }
                }
            }


            //Original vpt settings
            let inSteps = element.find('[name="inSteps"]');
            inSteps.change(function () {
                value = Math.max(1, parseInt(inSteps.val(), 10)) || 10;
                scope.vptGData.vptBundle.mip.steps = value; //1 / value;
                inSteps.val(value);
                scope.vptGData.vptBundle.resetMVP = true;
            }.bind(this));
        },
        templateUrl: function (element, attributes) {
            return '/web/app/components/VPT/MIPd/mipSettings.html';
        }
    }
});
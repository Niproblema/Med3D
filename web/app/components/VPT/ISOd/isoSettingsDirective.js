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
                $(blendSlider).slider("value", scope.vptGData.vptBundle.iso.blendMeshRatio);
                changeResolution(scope.vptGData.vptBundle.iso.resolution);
                inSteps.val(scope.vptGData.vptBundle.iso.steps);
                inISO.val(scope.vptGData.vptBundle.iso.isoVal);
                var newColor = scope.vptGData.vptBundle.iso.color;
                var changeTo = "#" + toHex(Math.round(newColor.r * 255)) + toHex(Math.round(newColor.g * 255)) + toHex(Math.round(newColor.b * 255));
                inColor.colorpicker('setValue', changeTo);
            });
            //

            //Blend mesh ratio
            let blendHandle = element.find('#blendHandleISO');
            let blendSlider = element.find('#blendSliderISO');
            blendSlider.slider({
                value: scope.vptGData.vptBundle.iso.blendMeshRatio,
                min: 0,
                max: 1,
                step: 0.01,
                create: function () {
                    blendHandle.text($(this).slider("value"));
                },
                slide: function (event, ui) {
                    scope.vptGData.vptBundle.iso.blendMeshRatio = parseFloat(ui.value);
                    blendHandle.text(ui.value);
                }
            });

            //Res setting

            let resolutionValues = [256, 512, 1024, 2048];
            let resolutionHandle = element.find('#resolutionHandleISO');
            let resolutionSlider = element.find('#resolutionSliderISO');
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
                    scope.vptGData.vptBundle.iso.resolution = resolutionValues[ui.value];
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


            inSteps.change(function () {
                value = Math.max(1, parseInt(inSteps.val(), 10)) || 10;
                scope.vptGData.vptBundle.iso.steps = value;
                inSteps.val(value);
                scope.vptGData.vptBundle.resetMVP = true;
            }.bind(this));


            inISO.change(function () {
                value = Math.max(0.01, parseFloat(inISO.val())) || 0.5;
                scope.vptGData.vptBundle.iso.isoVal = value;
                inISO.val(value);
                scope.vptGData.vptBundle.resetMVP = true;
            }.bind(this));

            inColor.colorpicker({
                color: "#ffffff",
                container: true,
                inline: true,
                format: "rgb",
                sliders: sliders
            }).on('changeColor', function (e) {
                color = e.color.toString('rgb').match(/rgba?\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)?(?:, ?(\d(?:\.\d?))\))?/);
                scope.vptGData.vptBundle.iso.color.r = color[1] / 255;// parseInt(color.substr(1, 2), 16) / 255;
                scope.vptGData.vptBundle.iso.color.g = color[2] / 255;//  parseInt(color.substr(3, 2), 16) / 255;
                scope.vptGData.vptBundle.iso.color.b = color[3] / 255; //parseInt(color.substr(5, 2), 16) / 255;
                scope.vptGData.vptBundle.resetMVP = true;
            });


            let toHex = function (int) {
                var hex = Number(int).toString(16);
                if (hex.length < 2) {
                    hex = "0" + hex;
                }
                return hex;
            };


        },
        templateUrl: function (element, attributes) {
            return '/web/app/components/VPT/ISOd/isoSettings.html';
        }
    }
});
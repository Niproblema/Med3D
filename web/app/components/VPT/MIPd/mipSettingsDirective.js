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

            let _startupFunction = function (event, updates) {
                if (updates == null || (updates.mip != null && updates.mip.blendMeshRatio != null)) {
                    blendHandle.text(scope.vptGData.vptBundle.mip.blendMeshRatio);
                    $(blendSlider).slider("value", scope.vptGData.vptBundle.mip.blendMeshRatio);
                }
                if (updates == null || (updates.mip != null && updates.mip.blendMeshColor != null)) {
                    var newColor = scope.vptGData.vptBundle.mip.blendMeshColor;
                    var changeTo = "#" + toHex(Math.round(newColor.r * 255)) + toHex(Math.round(newColor.g * 255)) + toHex(Math.round(newColor.b * 255));
                    meshColorMIP.colorpicker('setValue', changeTo);
                }
                if (updates == null || (updates.mip != null && updates.mip.resolution != null)) {
                    changeResolution(scope.vptGData.vptBundle.mip.resolution);
                    scope.vptGData.vptBundle.resetBuffers = true;
                }
                if (updates == null || (updates.mip != null && updates.mip.steps != null)) {
                    inSteps.val(scope.vptGData.vptBundle.mip.steps);
                    scope.vptGData.vptBundle.resetMVP = true;
                }

                // Update ng-model
                if (updates != null && updates.mip != null && (updates.mip.background != null || updates.mip.meshLight != null)) {
                    scope.$digest()
                }
            };

            //Start notification for restoring UI values
            scope.$on('uiRefreshMIP', _startupFunction);
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

            //Bleded mesh color
            let meshColorMIP = $('#meshColorMIP');
            meshColorMIP.colorpicker({
                color: "#ffffff",
                format: "rgb",
                sliders: sliders
            }).on('changeColor', function (e) {
                color = e.color.toString('rgb').match(/rgba?\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)?(?:, ?(\d(?:\.\d?))\))?/);
                scope.vptGData.vptBundle.mip.blendMeshColor.r = color[1] / 255;
                scope.vptGData.vptBundle.mip.blendMeshColor.g = color[2] / 255;
                scope.vptGData.vptBundle.mip.blendMeshColor.b = color[3] / 255;
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

            let toHex = function (int) {
                var hex = Number(int).toString(16);
                if (hex.length < 2) {
                    hex = "0" + hex;
                }
                return hex;
            };

            _startupFunction();
        },
        templateUrl: function (element, attributes) {
            return '/web/app/components/VPT/MIPd/mipSettings.html';
        }
    }
});
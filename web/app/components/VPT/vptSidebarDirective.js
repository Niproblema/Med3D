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

            scope.vptGData.vptBundle.refreshUI = function () {
                scope.$apply();
            };


            //VPT renderer switcher
            scope.allRenderers = ["ERROR", "EAM", "ISO", "MCS", "MIP"];
            scope.renderer = scope.vptGData.vptBundle.rendererChoiceID; //current selected 
            scope.setRenderer = function (i) {
                if (i != scope.renderer) {
                    console.log("VPT previous renderer: " + scope.allRenderers[scope.renderer]);
                    console.log("VPT new renderer: " + scope.allRenderers[i]);
                    scope.renderer = i;

                    //Call VPTController
                    scope.vptGData.vptBundle.rendererChoiceID = i;

                    //Call for Directive-Needed for tranform function application
                    scope.$broadcast('start' + scope.allRenderers[scope.renderer]);
                }
            };
            //Apply default!
            scope.$broadcast('start' + scope.allRenderers[scope.renderer]);



            // Sliders for Tone mapper settings
            let exposureHandle = element.find('#exposureHandle');
            element.find('#exposureSlider').slider({
                value: scope.vptGData.vptBundle.reinhard.exposure,
                min: 0,
                max: 32,
                step: 0.1,
                create: function () {
                    exposureHandle.text($(this).slider("value"));
                },
                slide: function (event, ui) {
                    scope.vptGData.vptBundle.reinhard.exposure = parseFloat(ui.value);
                    exposureHandle.text(ui.value);
                }
            });

            let rangeHandle1 = element.find('#rangeHandle1');
            let rangeHandle2 = element.find('#rangeHandle2');
            element.find('#rangeSlider').slider({
                range: true,
                min: 0,
                max: 1,
                values: [scope.vptGData.vptBundle.range.rangeLower, scope.vptGData.vptBundle.range.rangeHigher],
                step: 0.01,
                create: function () {
                    rangeHandle1.text($(this).slider("values")[0]);
                    rangeHandle2.text($(this).slider("values")[1]);
                },
                slide: function (event, ui) {
                    //scope.vptGData.lineHardness = ui.value;
                    rangeHandle1.text(ui.values[0]);
                    rangeHandle2.text(ui.values[1]);
                    scope.vptGData.vptBundle.range.rangeLower = parseFloat($(this).slider("values")[0]);
                    scope.vptGData.vptBundle.range.rangeHigher = parseFloat($(this).slider("values")[1]);
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

            let MC = new M3D.MarchingCubes();

            scope.isComputingMCC = false;

            let mccRadioOff = $("#march-off");
            let mccRadioOn = $("march-on");
            scope.setMarching = function (bool) {
                scope.vptGData.vptBundle.useMCC = bool;
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
                    scope.cpuCount = ui.value;
                }
            });

            let inMccISO = element.find('[name="inISO-MRC"]');
            inMccISO.change(function () {
                value = Math.min(1.0, Math.max(0.01, inMccISO.val()));
                scope.isoSetting = value;
                inMccISO.val(value);
            }.bind(this));

            scope.cpuCount = Math.ceil(window.navigator.hardwareConcurrency / 2);
            scope.isoSetting = Math.max(0.01, inMccISO.val()) || 1.0;
            scope.objectsToMCC = 0;
            scope.calculateMRC = function () {
                if (scope.isComputingMCC)
                    return;

                scope.isComputingMCC = true;
                scope.objectsToMCC = scope.vptGData.vptBundle.objects.length;
                for (let k = 0; k < scope.vptGData.vptBundle.objects.length; k++) {
                    scope.runMMC(scope.cpuCount, scope.isoSetting * 255, scope.vptGData.vptBundle.objects[k]);
                }
            };


            //On file selected for Import button
            document.getElementById('import_input').addEventListener('change', function (event) {
                var file = event.target.files[0];
                if (file) {
                    scope.vptGData.vptBundle.mccStatus = false; 	//signals mcc geo isn't ready, don't use it until ready.
                    scope.runImportMCC(scope.vptGData.vptBundle.objects[0], file);    //Todo: scene object selector.
                }
                document.getElementById('import_input').value = "";
            }, false);
            //M3D button that calls file input for selection.
            scope.importOBJ = function () {
                if (scope.vptGData.vptBundle.objects.length == 0) {
                    console.log("No volume objects in scene, cannot import.");
                    return;
                }
                document.getElementById('import_input').click();
            };

            scope.exportOBJ = function () {
                if (scope.vptGData.vptBundle.objects.length == 0) {
                    console.log("No volume objects in scene, cannot export.");
                    return;
                }
                scope.runExportMCC(scope.vptGData.vptBundle.objects[0]);   //Todo: scene object selector.
            };


            /* ========= UI locks ========== */
            let disabledClass = 'med3d-disabled-menu';

            $("#rendererLockLabel").click(function (e) {
                // Do something
                scope.vptGData.vptBundle.uiLock.rendererSelection = !scope.vptGData.vptBundle.uiLock.rendererSelection;
                _lockRenderMethod(scope.vptGData.vptBundle.uiLock.rendererSelection);
                scope.$apply();
                e.preventDefault();
                e.stopPropagation();
            });

            $("#rendererSettingsLockLabel").click(function (e) {
                // Do something
                scope.vptGData.vptBundle.uiLock.rendererSettings = !scope.vptGData.vptBundle.uiLock.rendererSettings;
                _lockRenderSettings(scope.vptGData.vptBundle.uiLock.rendererSettings);
                scope.$apply();
                e.preventDefault();
                e.stopPropagation();
            });

            $("#tonemapperLockLabel").click(function (e) {
                // Do something
                scope.vptGData.vptBundle.uiLock.tonemapperSettings = !scope.vptGData.vptBundle.uiLock.tonemapperSettings;
                _lockTonemapperSettings(scope.vptGData.vptBundle.uiLock.tonemapperSettings);
                scope.$apply();
                e.preventDefault();
                e.stopPropagation();
            });

            $("#mccLockLabel").click(function (e) {
                // Do something
                scope.vptGData.vptBundle.uiLock.mccSettings = !scope.vptGData.vptBundle.uiLock.mccSettings;
                _lockMCCSettings(scope.vptGData.vptBundle.uiLock.mccSettings);
                scope.$apply();
                e.preventDefault();
                e.stopPropagation();
            });


            let _lockRenderMethod = function (locked) {
                locked ? $("#renderMethodButtonBox").addClass(disabledClass) : $("#renderMethodButtonBox").removeClass(disabledClass);
            };
            let _lockRenderSettings = function (locked) {
                locked ? $("#collapseOne").addClass(disabledClass) : $("#collapseOne").removeClass(disabledClass);
            };
            let _lockTonemapperSettings = function (locked) {
                locked ? $("#collapseTwo").addClass(disabledClass) : $("#collapseTwo").removeClass(disabledClass);
            };
            let _lockMCCSettings = function (locked) {
                locked ? $("#collapseThree").addClass(disabledClass) : $("#collapseThree").removeClass(disabledClass);
            };

        },
        templateUrl: function (element, attributes) {
            return '/web/app/components/VPT/vptSidebar.html';
        }
    }
});
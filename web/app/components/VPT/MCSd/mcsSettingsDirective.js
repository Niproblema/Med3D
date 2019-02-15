/**
 * Created by Jan on 23.08.2018
 */

app.directive("mcsSettings", function () {
    return {
        restrict: 'E',
        replace: true,
        scope: false,
        link: function (scope, element, attributes) {

            // Add Object.keys functionality to scope
            scope.getKeys = Object.keys;

            let _startupFunction = function () {
                blendHandle.text(scope.vptGData.vptBundle.mcs.blendMeshRatio);
                $(blendSlider).slider("value", scope.vptGData.vptBundle.mcs.blendMeshRatio);
                var newColor = scope.vptGData.vptBundle.mcs.blendMeshColor;
                var changeTo = "#" + toHex(Math.round(newColor.r * 255)) + toHex(Math.round(newColor.g * 255)) + toHex(Math.round(newColor.b * 255));
                meshColorMCS.colorpicker('setValue', changeTo);
                changeResolution(scope.vptGData.vptBundle.mcs.resolution);
                inSigma.val(scope.vptGData.vptBundle.mcs.sigma);
                inACorr.val(scope.vptGData.vptBundle.mcs.alphaCorrection);
                parseTFBundle();
                //scope.$apply();
            }

            //Start notification for restoring UI values
            scope.$on('uiRefreshMCS', _startupFunction);
            //

            //////TF variables//////

            var cWidth = 254;
            var cHeight = 254;
            var transferFunctionWidth = 254;
            var transferFunctionHeight = 254;
            var tfScaleSpeed = 0.003;
            var tfGL = null;
            var tfClipQuad = null;
            var tfProgram = null;
            var tfBumps = null;
            var tfBundle = {uuid: "0", bumps: []};
            var color = null;
            var alpha = 1;

            ///////////////////////



            //Blend mesh ratio
            let blendHandle = element.find('#blendHandleMCS');
            let blendSlider = element.find('#blendSliderMCS');
            blendSlider.slider({
                value: scope.vptGData.vptBundle.mcs.blendMeshRatio,
                min: 0,
                max: 1,
                step: 0.01,
                create: function () {
                    blendHandle.text($(this).slider("value"));
                },
                slide: function (event, ui) {
                    scope.vptGData.vptBundle.mcs.blendMeshRatio = parseFloat(ui.value);
                    blendHandle.text(ui.value);
                }
            });


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
            let meshColorMCS = $('#meshColorMCS');
            meshColorMCS.colorpicker({
                color: "#ffffff",
                format: "rgb",
                sliders: sliders
            }).on('changeColor', function (e) {
                color = e.color.toString('rgb').match(/rgba?\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)?(?:, ?(\d(?:\.\d?))\))?/);
                scope.vptGData.vptBundle.mcs.blendMeshColor.r = color[1] / 255;
                scope.vptGData.vptBundle.mcs.blendMeshColor.g = color[2] / 255;
                scope.vptGData.vptBundle.mcs.blendMeshColor.b = color[3] / 255;
            });


            //Res setting

            let resolutionValues = [256, 512, 1024, 2048];
            let resolutionHandle = element.find('#resolutionHandleMCS');
            let resolutionSlider = element.find('#resolutionSliderMCS');
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
                    scope.vptGData.vptBundle.mcs.resolution = resolutionValues[ui.value];
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
            let inSigma = element.find('[name="inSigma"]');
            let inACorr = element.find('[name="inACorr"]');
            let widget = element.find('.widget');
            let canvas = element.find('canvas').get(0);
            let inAlpha = element.find('[name="inAlpha"]');
            let inColor = element.find('#inColor');

            ///////////////////////
            inSigma.change(function () {
                value = Math.max(0, parseFloat(inSigma.val())) || 1;
                scope.vptGData.vptBundle.mcs.sigma = value;
                inSigma.val(value);
                scope.vptGData.vptBundle.resetMVP = true;
                //TODO: crashes at 0.0
            }.bind(this));


            inACorr.change(function () {
                value = Math.max(0, parseFloat(inACorr.val())) || 1;
                scope.vptGData.vptBundle.mcs.alphaCorrection = value;
                inACorr.val(value);
                scope.vptGData.vptBundle.resetMVP = true;
            }.bind(this));

            inColor.colorpicker({
                color: "#ffffff",
                container: true,
                inline: true,
                format: "rgb",
                sliders: sliders
            }).on('changeColor', function (e) {
                if (tfBumps.length > 0) {
                    color = e.color.toString('rgb').match(/rgba?\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)?(?:, ?(\d(?:\.\d?))\))?/);
                    var $selectedBump = element.find('.bump.selected');
                    var i = parseInt(DOMUtils.data($selectedBump.get(0), 'index'), 10);
                    tfBumps[i].color.r = color[1] / 255;
                    tfBumps[i].color.g = color[2] / 255;
                    tfBumps[i].color.b = color[3] / 255;
                    tfBumps[i].color.a = alpha;
                    render();
                    onUIChangeTF();
                }
            });

            inAlpha.change(function () {
                alpha = Math.max(0, parseFloat(inAlpha.val())) || 1;
                inAlpha.val(alpha);
                if (tfBumps.length > 0) {
                    var $selectedBump = element.find('.bump.selected');
                    var i = parseInt(DOMUtils.data($selectedBump.get(0), 'index'), 10);
                    tfBumps[i].color.r = color[1] / 255;
                    tfBumps[i].color.g = color[2] / 255;
                    tfBumps[i].color.b = color[3] / 255;
                    tfBumps[i].color.a = alpha;
                    render();
                    onUIChangeTF();
                }
            }.bind(this));

            ////Button events////
            scope.addBump_MCS = function () {
                var bumpIndex = tfBumps.length;
                var newBump = {
                    position: {
                        x: Math.random(),
                        y: Math.random()
                    },
                    size: {
                        x: Math.random() * 0.5,
                        y: Math.random() * 0.5
                    },
                    color: {
                        r: Math.random(),
                        g: Math.random(),
                        b: Math.random(),
                        a: Math.random()
                    }
                };
                tfBumps.push(newBump);
                addHandle(bumpIndex);
                selectBump(bumpIndex);
                render();
                onUIChangeTF();
            };
            scope.loadTF_MCS = function () {          //TODO
                CommonUtils.readTextFile(function (data) {
                    var parsed = JSON.parse(data);
                    tfBumps = parsed.bumps;
                    render();
                    rebuildHandles();
                    onUIChangeTF();
                }.bind(this));
            };
            scope.saveTF_MCS = function () {
                if (tfBundle)
                    CommonUtils.downloadJSON(tfBundle, 'TransferFunction.json');
                else
                    console.error("No tf settings prepared for export");
            };


            ////TF methods/////
            let initTF = function () {
                canvas.width = transferFunctionWidth;
                canvas.height = transferFunctionHeight;
                resize(cWidth, cHeight);
                tfGL = WebGLUtils.getContext(canvas, ['webgl2'], {
                    depth: false,
                    stencil: false,
                    antialias: false,
                    preserveDrawingBuffer: true
                });
                tfGL.enable(tfGL.BLEND);
                tfGL.blendFunc(tfGL.SRC_ALPHA, tfGL.ONE_MINUS_SRC_ALPHA);

                tfClipQuad = WebGLUtils.createClipQuad(tfGL);
                tfProgram = WebGLUtils.compileShaders(tfGL, {
                    drawTransferFunction: SHADERS.drawTransferFunction
                }, MIXINS).drawTransferFunction;
                tfGL.useProgram(tfProgram.program);
                tfGL.bindBuffer(tfGL.ARRAY_BUFFER, tfClipQuad);
                tfGL.enableVertexAttribArray(tfProgram.attributes.aPosition);
                tfGL.vertexAttribPointer(tfProgram.attributes.aPosition, 2, tfGL.FLOAT, false, 0, 0);

                tfBumps = [];
            };

            let destroyTF = function () {
                tfGL.deleteBuffer(tfClipQuad);
                tfGL.deleteProgram(tfProgram.program);
                tfGL = null;
                tfClipQuad = null;
                tfProgram = null;
                tfBumps = null;
            };

            let resize = function (nWidth, nHeight) {
                canvas.style.width = nWidth + 'px';
                canvas.style.height = nHeight + 'px';
                cWidth = nWidth;
                cHeight = nHeight;
            };

            let render = function () {
                tfGL.clear(tfGL.COLOR_BUFFER_BIT);
                tfBumps.forEach(function (bump) {
                    tfGL.uniform2f(tfProgram.uniforms['uPosition'], bump.position.x, bump.position.y);
                    tfGL.uniform2f(tfProgram.uniforms['uSize'], bump.size.x, bump.size.y);
                    tfGL.uniform4f(tfProgram.uniforms['uColor'], bump.color.r, bump.color.g, bump.color.b, bump.color.a);
                    tfGL.drawArrays(tfGL.TRIANGLE_FAN, 0, 4);
                });
            };

            let addHandle = function (index) {
                var $handle = $(TEMPLATES['TransferFunctionWidgetBumpHandle.html']);
                widget.append($handle);
                DOMUtils.data($handle.get(0), 'index', index);

                var left = (tfBumps[index].position.x * cWidth) + 'px';
                var top = ((1 - tfBumps[index].position.y) * cHeight) + 'px';
                $handle.css({
                    left: left,
                    top: top
                });
                $handle.draggable({
                    handle: $handle.find('.bump-handle'),
                    drag: function (e, ui) {
                        var x = ui.position.left / cWidth;
                        var y = 1 - ui.position.top / cHeight;
                        var i = parseInt(DOMUtils.data(e.target, 'index'), 10);
                        tfBumps[i].position.x = x;
                        tfBumps[i].position.y = y;
                        render();
                        onUIChangeTF();
                    }.bind(this)
                });
                $handle.mousedown(function (e) {
                    var i = parseInt(DOMUtils.data(e.currentTarget, 'index'), 10);
                    selectBump(i);
                }.bind(this));
                $handle.on('mousewheel', function (e) {
                    var amount = e.originalEvent.deltaY * tfScaleSpeed;
                    var scale = Math.exp(-amount);
                    var i = parseInt(DOMUtils.data(e.currentTarget, 'index'), 10);
                    selectBump(i);
                    if (e.shiftKey) {
                        tfBumps[i].size.y *= scale;
                    } else {
                        tfBumps[i].size.x *= scale;
                    }
                    e.stopPropagation();
                    render();
                    onUIChangeTF();
                }.bind(this));
            }

            let rebuildHandles = function () {
                element.find('.bump').remove();
                for (var i = 0; i < tfBumps.length; i++) {
                    addHandle(i);
                }
            };

            let selectBump = function (index) {
                var handles = element.find('.bump');
                var correctHandle = handles.filter('[data-index="' + index + '"]');
                handles.removeClass('selected');
                correctHandle.addClass('selected');

                alpha = Math.max(0, parseFloat(tfBumps[index].color.a)) || 1;
                inAlpha.val(alpha);

                var newColor = tfBumps[index].color;
                var changeTo = "#" + toHex(Math.round(newColor.r * 255)) + toHex(Math.round(newColor.g * 255)) + toHex(Math.round(newColor.b * 255));
                inColor.colorpicker('setValue', changeTo);

                color = inColor.data('colorpicker').color.toString('rgb').match(/rgba?\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)?(?:, ?(\d(?:\.\d?))\))?/);
            };

            let toHex = function (int) {
                var hex = Number(int).toString(16);
                if (hex.length < 2) {
                    hex = "0" + hex;
                }
                return hex;
            };

            // When UI changes tf. Update TF bundle
            let onUIChangeTF = function () {
                var newUUID = THREE.Math.generateUUID();
                tfBundle = { uuid: newUUID, bumps: tfBumps };
                scope.vptGData.vptBundle.mcs.tfBundle = tfBundle;
                scope.vptGData.vptBundle.resetMVP = true;
            }

            // Import settings from bundle. Refresh UI
            let parseTFBundle = function () {
                if (tfBundle.uuid === scope.vptGData.vptBundle.mcs.tfBundle.uuid)
                    return;

                tfBundle = scope.vptGData.vptBundle.mcs.tfBundle;
                tfBumps = tfBundle.bumps;
                render();
                rebuildHandles();
                scope.vptGData.vptBundle.resetMVP = true;
            }

            initTF();
            scope.vptGData.vptBundle.mcs.tf = canvas;
            _startupFunction();
        },
        templateUrl: function (element, attributes) {
            return '/web/app/components/VPT/MCSd/mcsSettings.html';
        }
    }
});
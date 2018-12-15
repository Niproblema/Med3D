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

            scope.allRenderers = ["MIP", "ISO", "EAM", "MCS"];
            scope.rendererMethods
            scope.renderer = 3; //default pick
            scope.setRenderer = function (i) {
                if (i != scope.renderer) {
                    console.log("VPT previous renderer: " + scope.allRenderers[scope.renderer]);
                    console.log("VPT new renderer: " + scope.allRenderers[i]);
                    scope.renderer = i;

                    scope.publicRenderData.getVPTController()._chooseRenderer(scope.allRenderers[scope.renderer]);
                    
                }
            };


            
            // Sliders for Tone mapper settings
            let exposureHandle = element.find('#exposureHandle');
            element.find('#exposureSlider').slider({
                value: 1,
                min: 0,
                max: 32,
                step: 0.1,
                create: function() {
                    scope.publicRenderData.getVPTController().getToneMapper()._exposure = parseFloat($(this).slider( "value" ));
                    exposureHandle.text( $(this).slider( "value" ) );
                },
                slide: function( event, ui ) {
                    scope.publicRenderData.getVPTController().getToneMapper()._exposure = parseFloat(ui.value);
                    exposureHandle.text(ui.value);
                }
            });

            let rangeHandle1 = element.find('#rangeHandle1');
            let rangeHandle2 = element.find('#rangeHandle2');
            element.find('#rangeSlider').slider({

                range: true,
                min: 0,
                max: 1,
                values: [ 0, 1 ],
                step: 0.01,
                create: function() {
                    //scope.publicRenderData.lineHardness = $(this).slider( "value" );
                    rangeHandle1.text( $(this).slider( "values" )[0] );
                    rangeHandle2.text( $(this).slider( "values" )[1] );
                    scope.publicRenderData.getVPTController().getToneMapper()._min = parseFloat($(this).slider( "values" )[0]);
                    scope.publicRenderData.getVPTController().getToneMapper()._max = parseFloat($(this).slider( "values" )[1]);
                },
                slide: function( event, ui ) {
                    //scope.publicRenderData.lineHardness = ui.value;
                    rangeHandle1.text( ui.values[0] );
                    rangeHandle2.text( ui.values[1] );
                    scope.publicRenderData.getVPTController().getToneMapper()._min = parseFloat(ui.values[0]);
                    scope.publicRenderData.getVPTController().getToneMapper()._max = parseFloat(ui.values[1]);
                }
            });

            // Configure color picker
            let sliders = {
                saturation: {
                    maxLeft: 220,
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





            /*
            //MCS renderer
            this.sigmaMax = element.find('[name="sigma-max"]');
            this.alphaCorrection = element.find('[name="alpha-correction"]');
            this.tfwContainer = element.find('.tfw-container');
            this.sigmaMax.val(scope.publicRenderData.getVPTController().getRenderer()._sigmaMax);
            this.sigmaMax.change(function(){
                scope.publicRenderData.getVPTController().getRenderer()._sigmaMax = this.sigmaMax.val();
            }.bind(this));
            this.alphaCorrection.val(scope.publicRenderData.getVPTController().getRenderer()._alphaCorrection);
            this.alphaCorrection.change(function(){
                scope.publicRenderData.getVPTController().getRenderer()._alphaCorrection = this.alphaCorrection.val();
            }.bind(this));
            this.transferFunctionWidget = new TransferFunctionWidget(this.tfwContainer, {
                onChange: function() {
                    scope.publicRenderData.getVPTController().getRenderer().reset();
                    scope.publicRenderData.getVPTController().getRenderer().setTransferFunction(this.transferFunctionWidget.getTransferFunction());
                }.bind(this)
            });

            //Reinhard Tone Mapper
            this.exposure = element.find('[name="exposure"]');
            this.exposure.val(scope.publicRenderData.getVPTController().getToneMapper()._exposure);
            this.exposure.change(function() {
                scope.publicRenderData.getVPTController().getToneMapper()._exposure = parseFloat(this.exposure.val());
            }.bind(this));

            //Range tone mapper
            this.min = element.find('[name="min"]');
            this.max = element.find('[name="max"]');

            this.min.val(scope.publicRenderData.getVPTController().getToneMapper()._min);
            this.max.val(scope.publicRenderData.getVPTController().getToneMapper()._max);
            this.min.change(function() {
                scope.publicRenderData.getVPTController().getToneMapper()._min = parseFloat(this.min.val());
            }.bind(this));
            this.max.change(function() {
                scope.publicRenderData.getVPTController().getToneMapper()._max = parseFloat(this.max.val());
            }.bind(this));
            */
        },
        templateUrl: function (element, attributes) {
            return '/web/app/components/VPT/vptSidebar.html';
        }
    }
});
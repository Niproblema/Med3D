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

            let inSigma = element.find('[name="inSigma"]');
            let inACorr = element.find('[name="inACorr"]');

            inSigma.change(function(){
                value = Math.max(0, parseFloat(inSigma.val())) || 1;
                scope.publicRenderData.getVPTController().getRenderer()._sigmaMax = value;
                inSigma.val(value);
                //TODO: crashes at 0.0
            }.bind(this));

            
            inACorr.change(function(){
                value = Math.max(0, parseFloat(inACorr.val())) || 1;
                scope.publicRenderData.getVPTController().getRenderer()._alphaCorrection = value;
                inACorr.val(value);
            }.bind(this));

        },
        templateUrl: function(element, attributes) {
            return '/web/app/components/VPT/MCSd/mcsSettings.html';
        }
    }
});
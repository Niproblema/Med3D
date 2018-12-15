/**
 * Created by Jan on 23.08.2018
 */

app.directive("eamSettings", function () {
    return {
        restrict: 'E',
        replace: true,
        scope: false,
        link: function (scope, element, attributes) {

            // Add Object.keys functionality to scope
            scope.getKeys = Object.keys;


            let inSteps = element.find('[name="inSteps"]');
            let inACorr = element.find('[name="inACorr"]');

            ///
            inSteps.change(function(){
                value = Math.max(1, parseInt(inSteps.val(), 10)) || 10;
                scope.publicRenderData.getVPTController().getRenderer()._stepSize = 1 / value;
                inSteps.val(value);
            }.bind(this));

            
            inACorr.change(function(){
                value = Math.max(0, parseFloat(inACorr.val())) || 1;
                scope.publicRenderData.getVPTController().getRenderer()._alphaCorrection = value;
                inACorr.val(value);
            }.bind(this));

        },
        templateUrl: function(element, attributes) {
            return '/web/app/components/VPT/EAMd/eamSettings.html';
        }
    }
});
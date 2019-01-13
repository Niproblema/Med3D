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
/*             scope.$on('startMIP', function () {  TODO: disabled for testing...
                inSteps.val(Math.round(1 / scope.publicRenderData.getVPTController().getRenderer()._stepSize));
            }); */
            //

            let inSteps = element.find('[name="inSteps"]');
            inSteps.change(function () {
                value = Math.max(1, parseInt(inSteps.val(), 10)) || 10;
                scope.publicRenderData.getVPTController().getRenderer()._stepSize = 1 / value;
                inSteps.val(value);
            }.bind(this));
        },
        templateUrl: function (element, attributes) {
            return '/web/app/components/VPT/MIPd/mipSettings.html';
        }
    }
});
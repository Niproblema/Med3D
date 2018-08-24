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



        },
        templateUrl: function(element, attributes) {
            return '/web/app/components/VPT/ISOd/isoSettings.html';
        }
    }
});
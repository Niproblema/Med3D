/**
 * Created by Jan on 23.08.2018.
 */

var mcsSettingsController = function($scope, PublicRenderData) {
    $scope.publicRenderData = PublicRenderData;
};

app.controller('MCSSettingsController', mcsSettingsController);
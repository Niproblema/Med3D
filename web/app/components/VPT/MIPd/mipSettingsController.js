/**
 * Created by Jan on 23.08.2018.
 */

var mipSettingsController = function($scope, PublicRenderData) {
    $scope.publicRenderData = PublicRenderData;
};

app.controller('MIPSettingsController', mipSettingsController);
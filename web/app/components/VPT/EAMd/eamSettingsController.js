/**
 * Created by Jan on 23.08.2018.
 */

var eamSettingsController = function($scope, PublicRenderData) {
    $scope.publicRenderData = PublicRenderData;
};

app.controller('EAMSettingsController', eamSettingsController);
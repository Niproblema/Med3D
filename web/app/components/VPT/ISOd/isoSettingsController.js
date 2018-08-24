/**
 * Created by Jan on 23.08.2018.
 */

var isoSettingsController = function($scope, PublicRenderData) {
    $scope.publicRenderData = PublicRenderData;
};

app.controller('ISOSettingsController', isoSettingsController);
/**
 * Created by Jan on 9.07.2018.
 */

var vptSidebarController = function($scope, PublicRenderData) {
    $scope.publicRenderData = PublicRenderData;
};

app.controller('VPTSidebarController', vptSidebarController);
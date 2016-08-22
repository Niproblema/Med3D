/**
 * Created by Primoz on 20. 08. 2016.
 */

var sharingController = function($scope, SharingService) {

    $scope.sharingService = SharingService;
    $scope.sharingSettings = SharingService.settings;
    $scope.sharingState = $scope.sharingService.state;

    $scope.startDataSharing = function (callback) {
        if (!$scope.sharingState.hostingInProgress) {
            $scope.sharingService.startHostingSession(function (event) {
                if (event.status === 0) {
                    $scope.$apply(function () {
                        $scope.sharingState.hostingInProgress = true;
                    });
                }

                // Forward the event to the directive
                callback(event);
            });
        }
        else {
            callback({status: 1, msg: "Data is already being shared."});
        }
    };

    $scope.joinSession = function (uuid, callback) {
        if (!$scope.sharingState.listeningInProgress) {
            $scope.sharingService.joinSession(uuid, function (event) {
                if (event.status === 0) {
                    $scope.$apply(function () {
                        $scope.sharingState.listeningInProgress = true;
                    });
                }

                // Forward the event to the directive
                callback(event);
            });
        }

        callback({status: 1, msg: "Listening already in progress"})
    };


};

app.controller('SharingController', sharingController);
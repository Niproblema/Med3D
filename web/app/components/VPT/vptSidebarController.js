/**
 * Created by Jan on 9.07.2018.
 */

var vptSidebarController = function ($scope, PublicRenderData, TaskManagerService) {
    $scope.publicRenderData = PublicRenderData;

    let MC = new M3D.MarchingCubes();

    $scope.runMMC = function (cores, iso, object) {
        var runnable = function (onLoad, onProgress, onError) {
            var privateOnLoad = function (data) {
                let vertArr = null;

                if(data[0].length){
                    var concatArrLength = 0;
                    for(var i = 0; i < data.length; i++){
                        concatArrLength += data[i].length;
                    }
                    vertArr = new Float32Array(concatArrLength);
                    vertArr.set(data[0]);
                    concatArrLength = data[0].length;
                    for(var i = 1; i < data.length; i++){
                        vertArr.set(data[i], concatArrLength);
                        concatArrLength += data[i].length;
                    }
                }else{
                    vertArr = data[0];
                }

                var geometry = new M3D.Geometry();
                geometry.vertices = new M3D.BufferAttribute(vertArr,  3);
                geometry.computeVertexNormals();
                geometry.computeBoundingSphere();

                onLoad(object, geometry);
            };

            var privateOnError = function (errorMsg) {
                onError({ code: 1, msg: errorMsg });
            };

            let dim = object.meta.dimensions;
            let voxelDim = object.meta.elementSpacing;

            MC.extractMesh({
                dimensions: { x: dim[0], y: dim[1], z: dim[2] }, voxelDimensions: {
                    x: voxelDim[0], y: voxelDim[1],
                    z: voxelDim[2]
                }, isoLevel: iso
            },
                object.rawDataCopy,
                cores,
                privateOnLoad,
                onProgress,
                privateOnError);
        };

        var task = {
            uuid: THREE.Math.generateUUID(),
            meta: {
                name: "Marching cubes",
                description: "Parsing volume object",
                icon: "no/icon/atm"
            },
            synchronous: true,
            target: "MCC-VPT",
            run: runnable,
            cancel: function () {/* TODO */ }
        };


        TaskManagerService.enqueueNewTask(task);
    };

    TaskManagerService.addResultCallback("MCC-VPT",
        function (object, geometry) {
            object._mccGeometry = geometry;
            $scope.objectsToMCC--;
            if ($scope.objectsToMCC <= 0) {
                $scope.isComputingMCC = false;
                $scope.publicRenderData.vptBundle.mccStatus = true;
            }
            $scope.$apply()
        });

};

app.controller('VPTSidebarController', vptSidebarController);
/**
 * Created by Jan on 9.07.2018.
 */

var vptSidebarController = function ($scope, VPT, TaskManagerService) {
    $scope.vptGData = VPT;

    let MC = new M3D.MarchingCubes();
    let OL = new M3D.ObjLoader();

    $scope.runMMC = function (cores, iso, object) {
        var runnable = function (onLoad, onProgress, onError) {
            var privateOnLoad = function (data) {
                let vertArr = null;

                if (data[0].length) {
                    var concatArrLength = 0;
                    for (var i = 0; i < data.length; i++) {
                        concatArrLength += data[i].length;
                    }
                    vertArr = new Float32Array(concatArrLength);
                    vertArr.set(data[0]);
                    concatArrLength = data[0].length;
                    for (var i = 1; i < data.length; i++) {
                        vertArr.set(data[i], concatArrLength);
                        concatArrLength += data[i].length;
                    }
                } else {
                    vertArr = data;
                }

                var geometry = new M3D.Geometry();
                geometry.vertices = new M3D.BufferAttribute(vertArr, 3);
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
                }, isoLevel: iso,
                bitSize: object.meta.bitSize,
                elementType: object.meta.elementType
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

    $scope.runImportMCC = function (object, file) {
        // Create task
        let runnable = function (onLoad, onProgress, onError) {
            let privateOnLoad = function (data) {
                var concatVertLength = 0;
                var concatNormLength = 0;
                for (var i = 0; i < data.length; i++) {
                    concatVertLength += data[i].geometry.vertices.length;
                    concatNormLength += data[i].geometry.normals.length;
                }
                let vertArr = new Float32Array(concatVertLength);
                let normArr = new Float32Array(concatNormLength);

                let vertCount = 0;
                for (var i = 0; i < data.length; i++) {
                    vertArr.set(data[i].geometry.vertices, vertCount);
                    if (concatNormLength > 0) {
                        normArr.set(data[i].geometry.normals, vertCount);
                    }
                    vertCount += data[i].geometry.vertices.length;
                }

                var geometry = new M3D.Geometry();
                geometry.vertices = new M3D.BufferAttribute(vertArr, 3);
                if (concatNormLength > 0)
                    geometry.normals = new M3D.BufferAttribute(normArr, 3);
                else
                    geometry.computeVertexNormals();
                geometry.computeBoundingSphere();

                onLoad(object, geometry);
            };

            let privateOnProgress = function (event) {
                // Calculate finished percentage
                onProgress(event.loaded / event.total * 100);
            };

            let privateOnError = function () {
                onError({ code: 1, msg: "Failed to load .obj file!" })
            };

            OL.loadFile(file, privateOnLoad, privateOnProgress, privateOnError, false);
        };

        let task = {
            uuid: THREE.Math.generateUUID(),
            meta: {
                name: "Wavefront OBJ loading",
                description: "Loading geometry from the specified file.",
                icon: "no/icon/atm"
            },
            synchronous: true,
            target: "MCC-IMPORT",
            run: runnable,
            cancel: function () {/* TODO */ }
        };

        TaskManagerService.enqueueNewTask(task)
    }


    $scope.runExportMCC = function (object) {
        // Create task
        let runnable = function (onLoad, onProgress, onError) {
            //onLoad('data:text/json;charset=utf-8,' + encodeURIComponent(object.exportOBJ()));
            //onLoad('data:text/json;charset=utf-8,' + object.exportOBJ());
            onLoad(object.exportGeometry());
        };


        let task = {
            uuid: THREE.Math.generateUUID(),
            meta: {
                name: "Wavefront OBJ loading",
                description: "Preparing data for download.",
                icon: "no/icon/atm"
            },
            synchronous: true,
            target: "MCC-EXPORT",
            run: runnable,
            cancel: function () {/* TODO */ }
        };

        TaskManagerService.enqueueNewTask(task)
    }

    TaskManagerService.addResultCallback("MCC-VPT",
        function (object, geometry) {
            object._mccGeometry = geometry;
            $scope.objectsToMCC--;
            if ($scope.objectsToMCC <= 0) {
                $scope.isComputingMCC = false;
                $scope.vptGData.vptBundle.mccStatus = true;
            }
            $scope.$apply();
        });


    TaskManagerService.addResultCallback("MCC-IMPORT",
        function (object, geometry) {
            if (geometry && object) {
                object._mccGeometry = geometry;
            }
            $scope.vptGData.vptBundle.mccStatus = true;
            $scope.$apply();
        });

    TaskManagerService.addResultCallback("MCC-EXPORT",
        function (data) {

            var blob = new Blob([data], { type: 'text/obj;charset=utf-8;' });
            if (navigator.msSaveBlob) { // IE 10+
                navigator.msSaveBlob(blob, filename);
            } else {
                var link = document.createElement("a");
                if (link.download !== undefined) { // feature detection
                    // Browsers that support HTML5 download attribute
                    var url = URL.createObjectURL(blob);
                    link.setAttribute("href", url);
                    link.setAttribute("download", 'M3D_MCC.obj');
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            }
        });



};

app.controller('VPTSidebarController', vptSidebarController);
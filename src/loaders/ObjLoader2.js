/**
 * Created by Jan on 13.2.2019
 * Loader optimized for parsing larger files with Line-Navigator - https://github.com/anpur/line-navigator
 * Also does not duplicate vertexes - bug in original
 */

M3D.ObjLoader2 = class {

    /**
    * Used for loading the .obj files.
    * @param manager   LoadingManager that will act as the loader observer
    * @constructor     Creates new OBJLoader object. If the manager is undefined the default LoadingManager will be used.
    * @name OBJLoader2
    */
    constructor(manager = new M3D.LoadingManager()) {
        this.manager = (manager !== undefined) ? manager : new M3D.LoadingManager();
        this.patterns = {
            // v float float float
            vertex_pattern: /^v\s+([\d|\.|\+|\-|e|E]+)\s+([\d|\.|\+|\-|e|E]+)\s+([\d|\.|\+|\-|e|E]+)/,
            // vn float float float
            normal_pattern: /^vn\s+([\d|\.|\+|\-|e|E]+)\s+([\d|\.|\+|\-|e|E]+)\s+([\d|\.|\+|\-|e|E]+)/,
            // vt float float
            uv_pattern: /^vt\s+([\d|\.|\+|\-|e|E]+)\s+([\d|\.|\+|\-|e|E]+)/,
            // f vertex vertex vertex ...
            face_pattern1: /^f\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)(?:\s+(-?\d+))?/,
            // f vertex/uv vertex/uv vertex/uv ...
            face_pattern2: /^f\s+((-?\d+)\/(-?\d+))\s+((-?\d+)\/(-?\d+))\s+((-?\d+)\/(-?\d+))(?:\s+((-?\d+)\/(-?\d+)))?/,
            // f vertex/uv/normal vertex/uv/normal vertex/uv/normal ...
            face_pattern3: /^f\s+((-?\d+)\/(-?\d+)\/(-?\d+))\s+((-?\d+)\/(-?\d+)\/(-?\d+))\s+((-?\d+)\/(-?\d+)\/(-?\d+))(?:\s+((-?\d+)\/(-?\d+)\/(-?\d+)))?/,
            // f vertex//normal vertex//normal vertex//normal ...
            face_pattern4: /^f\s+((-?\d+)\/\/(-?\d+))\s+((-?\d+)\/\/(-?\d+))\s+((-?\d+)\/\/(-?\d+))(?:\s+((-?\d+)\/\/(-?\d+)))?/,
            object_pattern: /^[og]\s*(.+)?/,
            smoothing_pattern: /^s\s+(\d+|on|off)/
        }
        this._mergedGroupObject = true;   //Import obj as single object -  Can't import object specific settings
    }

    get mergeGroupToSingleObject() { return this._mergedGroupObject; }
    set mergeGroupToSingleObject(val) { this._mergedGroupObject = val; }



    /**
    * Loads the .obj file via LineNavigator, parses only chunks to save memory. 
    * @param {Blob} file .obj file Blob
    * @param {function} onLoad Will be called when the .obj file finishes loading. Function will be called with parsed objects as parameters
    * @param {function} onProgress Will forward the progress calls of XHRLoader
    * @param {function} onError Will forward the error calls of XHRLoader
    * @param {bool} return M3D objects. default = true;
    */
    loadFile(file, onLoad, onProgress, onError, returnM3D) {
        var parseData = this._getParseDataFormat();
        this._addObject(parseData, '');
        var navigator = new LineNavigator(file, 'utf8', 65536, true);
        var self = this;
        var index = 0;

        var rtn = navigator.readSomeLines(index, function linesReadHandler(err, indexStep, lines, isEof, progress) {
            if (err)
                return { status: "err", callbacks: { onLoad: onLoad, onError: onError }, content: err };

            // Read + Parse lines
            for (var i = 0; i < lines.length; i++ , index++) {
                self._parseLine(lines[i], parseData);
            }

            // Update progress
            onProgress(progress);

            if (isEof)
                return self._returnMethod({
                    status: "succ", callbacks: { onLoad: onLoad, onError: onError },
                    content: {
                        parseData: parseData,
                        returnM3D: returnM3D
                    }
                });

            return navigator.readSomeLines(index, linesReadHandler);
        });

    }

    /* Prepares output */
    _returnMethod(rtn) {
        var onLoad = rtn.callbacks.onLoad;
        var onError = rtn.callbacks.onError;


        switch (rtn.status) {
            case "err":
                onError(rtn.content);
                break;
            case "succ":
                var parseData = rtn.content.parseData;
                var returnM3D = rtn.content.returnM3D;

                if (!returnM3D) {
                    return onLoad(parseData)
                } else {
                    if (this._mergedGroupObject) {
                        // Create new buffer geometry
                        var bufferGeometry = new M3D.Geometry();
                        // Add position of vertices
                        bufferGeometry.vertices = new M3D.BufferAttribute(new Float32Array(parseData.vertices), 3);
                        // Check if normals are specified. Otherwise calculate them
                        if (parseData.normals.length > 0) {
                            bufferGeometry.normals = new M3D.BufferAttribute(new Float32Array(parseData.normals), 3);
                        } else {
                            bufferGeometry.computeVertexNormals();
                        }
                        // If specified add texture uv-s
                        if (parseData.uvs.length > 0) {
                            bufferGeometry.uv = new M3D.BufferAttribute(new Float32Array(parseData.uvs), 2);
                        }
                        var material = new M3D.MeshBasicMaterial();
                        material.shading = M3D.SmoothShading;

                        // Create new mesh
                        var mesh = new M3D.Mesh(bufferGeometry, material);
                        //mesh.name = objects[i].name;

                        return onLoad(mesh);
                    } else {
                        var meshes = [];

                        for (var i = 0; i < parseData.objects.length; i++) {

                            var geometry = parseData.objects[i].geometry;

                            // Create new buffer geometry
                            var bufferGeometry = new M3D.Geometry();

                            // Add position of vertices
                            bufferGeometry.vertices = new M3D.BufferAttribute(new Float32Array(geometry.vertices), 3);

                            // Check if normals are specified. Otherwise calculate them
                            if (geometry.normals.length > 0) {
                                bufferGeometry.normals = new M3D.BufferAttribute(new Float32Array(geometry.normals), 3);
                            } else {
                                bufferGeometry.computeVertexNormals();
                            }

                            // If specified add texture uv-s
                            if (geometry.uvs.length > 0) {
                                bufferGeometry.uv = new M3D.BufferAttribute(new Float32Array(geometry.uvs), 2);
                            }

                            var material = new M3D.MeshBasicMaterial();

                            material.shading = parseData.objects[i].material.smooth ? M3D.SmoothShading : M3D.FlatShading;

                            // Create new mesh
                            var mesh = new M3D.Mesh(bufferGeometry, material);
                            mesh.name = parseData.objects[i].name;

                            meshes.push(mesh);
                        }
                        return onLoad(meshes);
                    }
                }
                break;
        }
        return onError("Obj reading error");
    }


    /**
     * Parses line into parseData structure
     * @param {*} line - One line of .obj file
     * @param {*} parseData - global data for this .obj file
     */
    _parseLine(line, parseData) {
        line = line.trim();

        var result;

        if (line.length === 0 || line.charAt(0) === '#') {
            return;
        }
        else if ((result = this.patterns.vertex_pattern.exec(line)) !== null) {
            // ["v 1.0 2.0 3.0", "1.0", "2.0", "3.0"]
            parseData.vertices.push(
                parseFloat(result[1]),
                parseFloat(result[2]),
                parseFloat(result[3])
            );
        }
        else if ((result = this.patterns.normal_pattern.exec(line)) !== null) {
            // ["vn 1.0 2.0 3.0", "1.0", "2.0", "3.0"]
            parseData.normals.push(
                parseFloat(result[1]),
                parseFloat(result[2]),
                parseFloat(result[3])
            );
        }
        else if ((result = this.patterns.uv_pattern.exec(line)) !== null) {
            // ["vt 0.1 0.2", "0.1", "0.2"]
            parseData.uvs.push(
                parseFloat(result[1]),
                parseFloat(result[2])
            );
        }
        else if ((result = this.patterns.face_pattern1.exec(line)) !== null) {
            // ["f 1 2 3", "1", "2", "3", undefined]
            this._addFace(
                result[1], result[2], result[3], result[4],
                undefined, undefined, undefined, undefined,
                undefined, undefined, undefined, undefined,
                parseData
            );
        }
        else if ((result = this.patterns.face_pattern2.exec(line)) !== null) {
            // ["f 1/1 2/2 3/3", " 1/1", "1", "1", " 2/2", "2", "2", " 3/3", "3", "3", undefined, undefined, undefined]
            this._addFace(
                result[2], result[5], result[8], result[11],
                result[3], result[6], result[9], result[12],
                undefined, undefined, undefined, undefined,
                parseData
            );
        }
        else if ((result = this.patterns.face_pattern3.exec(line)) !== null) {
            // ["f 1/1/1 2/2/2 3/3/3", " 1/1/1", "1", "1", "1", " 2/2/2", "2", "2", "2", " 3/3/3", "3", "3", "3", undefined, undefined, undefined, undefined]
            this._addFace(
                result[2], result[6], result[10], result[14],
                result[3], result[7], result[11], result[15],
                result[4], result[8], result[12], result[16],
                parseData
            );
        }
        else if ((result = this.patterns.face_pattern4.exec(line)) !== null) {
            // ["f 1//1 2//2 3//3", " 1//1", "1", "1", " 2//2", "2", "2", " 3//3", "3", "3", undefined, undefined, undefined]
            this._addFace(
                result[2], result[5], result[8], result[11],
                undefined, undefined, undefined, undefined,
                result[3], result[6], result[9], result[12],
                parseData
            );
        }
        else if ((result = this.patterns.object_pattern.exec(line)) !== null) {
            // o object_name
            // or
            // g group_name
            var name = result[0].substr(1).trim();

            if (parseData.foundObjects === false) {
                parseData.foundObjects = true;
                parseData.object.name = name;
            }
            else {
                this._addObject(parseData, name);
            }
        }
        else if (/^usemtl /.test(line)) {
            // material
            parseData.object.material.name = line.substring(7).trim();
        }
        else if (/^mtllib /.test(line)) {
            // mtl file
        }
        else if ((result = this.patterns.smoothing_pattern.exec(line)) !== null) {
            // smooth shading
            parseData.object.material.smooth = result[1] === "1" || result[1] === "on";
        }
        else {
            throw new Error("Unexpected line: " + line);
        }
    }


    /* ===== Support parse functions ===== */

    _parseVertexIndex(value, parseData) {
        var index = parseInt(value);

        return (index >= 0 ? index - 1 : index + parseData.vertices.length / 3) * 3;
    }

    _parseNormalIndex(value, parseData) {
        var index = parseInt(value);

        return (index >= 0 ? index - 1 : index + parseData.normals.length / 3) * 3;
    }

    _parseUVIndex(value, parseData) {
        var index = parseInt(value);

        return (index >= 0 ? index - 1 : index + parseData.uvs.length / 2) * 2;
    }

    _addVertex(a, b, c, parseData) {
        parseData.object.geometry.vertices.push(
            parseData.vertices[a], parseData.vertices[a + 1], parseData.vertices[a + 2],
            parseData.vertices[b], parseData.vertices[b + 1], parseData.vertices[b + 2],
            parseData.vertices[c], parseData.vertices[c + 1], parseData.vertices[c + 2]
        );
    }

    _addNormal(a, b, c, parseData) {
        parseData.object.geometry.normals.push(
            parseData.normals[a], parseData.normals[a + 1], parseData.normals[a + 2],
            parseData.normals[b], parseData.normals[b + 1], parseData.normals[b + 2],
            parseData.normals[c], parseData.normals[c + 1], parseData.normals[c + 2]
        );
    }

    _addUV(a, b, c, parseData) {
        parseData.object.geometry.uvs.push(
            parseData.uvs[a], parseData.uvs[a + 1],
            parseData.uvs[b], parseData.uvs[b + 1],
            parseData.uvs[c], parseData.uvs[c + 1]
        );
    }

    _addFace(a, b, c, d, ua, ub, uc, ud, na, nb, nc, nd, parseData) {
        var ia = this._parseVertexIndex(a, parseData);
        var ib = this._parseVertexIndex(b, parseData);
        var ic = this._parseVertexIndex(c, parseData);

        var id;

        if (d === undefined) {
            parseData.indices.push(ia/3, ib/3, ic/3);
            if (!this._mergedGroupObject) {
                this._addVertex(ia, ib, ic, parseData);
            }
        }
        else {
            id = this._parseVertexIndex(d, parseData);

            parseData.indices.push(ia/3, ib/3, id/3);
            parseData.indices.push(ib/3, ic/3, id/3);
            if (!this._mergedGroupObject) {
                this._addVertex(ia, ib, id, parseData);
                this._addVertex(ib, ic, id, parseData);
            }

        }

        if (!this._mergedGroupObject && ua !== undefined) { //Todo?
            ia = this._parseUVIndex(ua, parseData);
            ib = this._parseUVIndex(ub, parseData);
            ic = this._parseUVIndex(uc, parseData);

            if (d === undefined) {
                this._addUV(ia, ib, ic, parseData);
            }
            else {
                id = this._parseUVIndex(ud, parseData);
                this._addUV(ia, ib, id, parseData);
                this._addUV(ib, ic, id, parseData);
            }
        }

        if (!this._mergedGroupObject && na !== undefined) { //Todo?
            ia = this._parseNormalIndex(na, parseData);
            ib = this._parseNormalIndex(nb, parseData);
            ic = this._parseNormalIndex(nc, parseData);

            if (d === undefined) {
                this._addNormal(ia, ib, ic, parseData);
            }
            else {
                id = this._parseNormalIndex(nd, parseData);

                this._addNormal(ia, ib, id, parseData);
                this._addNormal(ib, ic, id, parseData);
            }
        }
    }

    // Parse data structure
    _getParseDataFormat() {
        return {
            objects: [],
            object: null,
            foundObjects: false,
            vertices: [],
            normals: [],
            uvs: [],
            indices: []
        }
    }

    // Object structure.
    _addObject(parseData, name) {
        var geometry = {
            vertices: [],
            normals: [],
            uvs: [],
        };

        var material = {
            name: '',
            smooth: true
        };

        parseData.object = {
            name: name,
            geometry: geometry,
            material: material
        };

        parseData.objects.push(parseData.object);
    }

}
/**
 * Created by Jan on 29.12.2018
 */


M3D.VPTVolume = class extends M3D.Mesh {
    constructor(data, meta) {

        //var material = new M3D.VolumeBasicMaterial();   //TODO: other stuff!
        var material = new M3D.MeshPhongMaterial();
        material = new M3D.MeshPhongMaterial();
        material.specular = new THREE.Color("#444444");
        material.color = new THREE.Color("#8A0707");
        material.shininess = 8;


        //Geometry setup
        var geometry = new M3D.Geometry();

        // Quad vertices
        geometry.vertices = M3D.Float32Attribute([
            // Front face
            -1.0, -1.0, 1.0,
            1.0, -1.0, 1.0,
            1.0, 1.0, 1.0,
            -1.0, 1.0, 1.0,

            // Back face
            -1.0, -1.0, -1.0,
            -1.0, 1.0, -1.0,
            1.0, 1.0, -1.0,
            1.0, -1.0, -1.0,

            // Top face
            -1.0, 1.0, -1.0,
            -1.0, 1.0, 1.0,
            1.0, 1.0, 1.0,
            1.0, 1.0, -1.0,

            // Bottom face
            -1.0, -1.0, -1.0,
            1.0, -1.0, -1.0,
            1.0, -1.0, 1.0,
            -1.0, -1.0, 1.0,

            // Right face
            1.0, -1.0, -1.0,
            1.0, 1.0, -1.0,
            1.0, 1.0, 1.0,
            1.0, -1.0, 1.0,

            // Left face
            -1.0, -1.0, -1.0,
            -1.0, -1.0, 1.0,
            -1.0, 1.0, 1.0,
            -1.0, 1.0, -1.0
        ], 3);


        geometry.indices = M3D.Uint32Attribute([
            0, 1, 2, 0, 2, 3,    // Front face
            4, 5, 6, 4, 6, 7,    // Back face
            8, 9, 10, 8, 10, 11,  // Top face
            12, 13, 14, 12, 14, 15, // Bottom face
            16, 17, 18, 16, 18, 19, // Right face
            20, 21, 22, 20, 22, 23  // Left face
        ], 1);

        geometry.computeVertexNormals();



        // Super M3D.Mesh
        super(geometry, material);
        this._data = data; //Holds data, dimensions..
        this._meta = meta;
        this.type = "VolumeCube";
    }

    get data() { return this._data; };
    get meta() { return this._meta; };
    get dimensions() { return this._meta.dimensions; };
    set data(newD) { this._data = newD; };
    set meta(newM) { this._meta = newM; };
};
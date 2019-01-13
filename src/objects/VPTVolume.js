/**
 * Created by Jan on 29.12.2018
 * Holds M3D information and volume render buffers
 */


M3D.VPTVolume = class extends M3D.Mesh {
    constructor(data, meta) {

        //var material = new M3D.VolumeBasicMaterial();   //TODO: other stuff!
        var material = new M3D.MeshPhongMaterial(); //TODO: custom material, no reflections, no lightning
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

        geometry.computeVertexNormals();  //don't need

        // Super M3D.Mesh
        super(geometry, material);
        this.type = "VolumeCube";
        this._meta = meta;
        this._width = this._meta.dimensions[0];
        this._height = this._meta.dimensions[1];
        this._depth = this._meta.dimensions[2];
        this._bitdepth = this._meta.bitSize;

        if (this._bitdepth === 8) {
            this._data = new Float32Array(new Uint8Array(data)).map(function (x) { return x / (1 << 8); });
        } else if (this._bitdepth === 16) {
            this._data = new Float32Array(new Uint16Array(data)).map(function (x) { return x / (1 << 16); });
        }

        this._lastMVPMatrix = null;

        //Buffers for each volume object;
        this._frameBuffer = null;
        this._accumulationBuffer = null;
        this._renderBuffer = null;
        this._clipQuad = null;
        this._outputBuffer = null;
        this._volumeTexture = null;
        this._environmentTexture = null;

        //When using new renderer type, accumulationBuffer should be reset.
        this._lastRendererTypeID = 0;
    }


    //========== Setters and Getters ==============//

    get data() { return this._data; }
    get meta() { return this._meta; }
    get dimensions() { return this._meta.dimensions; }
    set data(newD) { this._data = newD; }
    set meta(newM) { this._meta = newM; }
    get width() { return this._width; }
    get height() { return this._height; }
    get depth() { return this._depth; }
    get bitdepth() { return this._bitdepth; }
    get lastRenderTypeID() { return this._lastRendererTypeID; }
    set lastRenderTypeID(id) { this._lastRendererTypeID = id; }
    get frameBuffer() { return this._frameBuffer; }
    get accumulationBuffer() { return this._accumulationBuffer; }
    get clipQuad() { return this._clipQuad; }
    get renderBuffer() { return this._renderBuffer; }
    get volumeTexture() {return this._volumeTexture; }
    get environmentTexture() {return this._environmentTexture;}
    get lastMVPMatrix() { return this._lastMVPMatrix; }
    set lastMVPMatrix(newP) { this._lastMVPMatrix = newP; }
};
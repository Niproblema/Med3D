/**
 * Created by Jan on 29.12.2018
 * Holds M3D information and volume render buffers
 */


M3D.VPTVolume = class extends M3D.Mesh {
    constructor(data, meta) {

        
        var material = new M3D.CustomShaderMaterial("volumeProject");
        material.lights = false;
        material.transparent = true;
        material.color = new THREE.Color(0xffffff);
        var textur = new M3D.Texture();
        textur._dirty = false;
        textur._glTex = null;
        material.addMap(textur);  //Can't set tex later, or template gets set wrong
        

        //Geometry setup - Base geometry, replaced by Marching cubes asynchronously (todo)
        var geometry = new M3D.Geometry();      

        // Quad vertices
        geometry.vertices = M3D.Float32Attribute([
            // Front face
            -0.5, -0.5, 0.5,
            0.5, -0.5, 0.5,
            0.5, 0.5, 0.5,
            -0.5, 0.5, 0.5,

            // Back face
            -0.5, -0.5, -0.5,
            -0.5, 0.5, -0.5,
            0.5, 0.5, -0.5,
            0.5, -0.5, -0.5,

            // Top face
            -0.5, 0.5, -0.5,
            -0.5, 0.5, 0.5,
            0.5, 0.5, 0.5,
            0.5, 0.5, -0.5,

            // Bottom face
            -0.5, -0.5, -0.5,
            0.5, -0.5, -0.5,
            0.5, -0.5, 0.5,
            -0.5, -0.5, 0.5,

            // Right face
            0.5, -0.5, -0.5,
            0.5, 0.5, -0.5,
            0.5, 0.5, 0.5,
            0.5, -0.5, 0.5,

            // Left face
            -0.5, -0.5, -0.5,
            -0.5, -0.5, 0.5,
            -0.5, 0.5, 0.5,
            -0.5, 0.5, -0.5
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

        super(geometry, material);

        //  ==== VPT specific data ==== //
        this.type = "Volume";
        this._meta = meta;
        this._width = this._meta.dimensions[0];
        this._height = this._meta.dimensions[1];
        this._depth = this._meta.dimensions[2];
        this._bitdepth = this._meta.bitSize;
        this._rawData = data;   //Used for marching cubes data cloning
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
        this._outputBuffer = null;
        this._volumeTexture = null;
        this._environmentTexture = null;

        //When using new renderer type, accumulationBuffer should be reset.
        this._lastRendererTypeID = 0;



        // ==== General render data ==== //
        this._vptMaterial = material;
        var phongAltenative = new M3D.MeshPhongMaterial();
        phongAltenative.specular = new THREE.Color("#444444");
        phongAltenative.color = new THREE.Color("#49b2b2");
        phongAltenative.shininess = 8;
        this._phongMaterial = phongAltenative;
        this._cubeGeometry = geometry;
        this._mccGeometry = null;
    }


    //========== Setters and Getters ==============//

    get data() { return this._data; }
    get rawDataCopy() { return this._rawData.slice(); }
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
    get renderBuffer() { return this._renderBuffer; }
    get volumeTexture() {return this._volumeTexture; }
    get environmentTexture() {return this._environmentTexture;}
    get lastMVPMatrix() { return this._lastMVPMatrix; }
    set lastMVPMatrix(newP) { this._lastMVPMatrix = newP; }


    // ========== ============ //

    /**
     *Extended clear to gc buffers
     */
    clear(){
        super.clear();
        this._frameBuffer.destroy();
        this._accumulationBuffer.destroy();
        this._renderBuffer.destroy();
        this._outputBuffer.destroy();
    }

    /** Switches render modes */
    switchRenderModes(useVPTtex, useMCCgeo){
        this._material = useVPTtex ? this._vptMaterial : this._phongMaterial;
        this._geometry = (useMCCgeo && this._mccGeometry) ? this._mccGeometry : this._cubeGeometry;
    }


    //TODO!
/*     toJson() {
		var obj = super.toJson();

		// Add reference to geometry and material
		obj.geometryUuid = this._geometry._uuid;
		obj.materialUuid = this._material._uuid;

		return obj;
	}

	static fromJson(data, geometry, material, object) {
		// Create mesh object
		if (!object) {
			var object = new M3D.Mesh(geometry, material);
		}

		// Import Object3D parameters
		object = super.fromJson(data, object);

		return object;
	} */
};
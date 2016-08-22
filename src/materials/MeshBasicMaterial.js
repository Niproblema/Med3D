/**
 * Created by Primoz on 4.4.2016.
 */

M3D.MeshBasicMaterial = class extends M3D.Material {

    constructor() {
        super(M3D.Material);

        this.type = "MeshBasicMaterial";

        this._color = new THREE.Color(0xffffff); // emissive
        this._map = null;

        // Is affected by lights
        this._lights = true;
    }

    set color(val) {
        if (!val.equals(this._color)) {
            this._color = val;

            // Notify onChange subscriber
            if (this._onChangeListener) {
                var update = {uuid: this._uuid, changes: {color: this._color.getHex()}};
                this._onChangeListener.materialUpdate(update)
            }
        }
    }
    set map(val) {
        // TODO: Add texture sharing
        this._map = val;
    }
    set lights(val) {
        if (this._lights === val) {
            this._lights = val;

            // Notify onChange subscriber
            if (this._onChangeListener) {
                var update = {uuid: this._uuid, changes: {lights: this._lights}};
                this._onChangeListener.materialUpdate(update)
            }
        }
    }

    get color() { return this._color; }
    get map() { return this._map; }
    get lights() { return this._lights; }

    requiredProgram() {
        var programName = "basic";

        if (this._lights) {
            programName += "_lights";
        }

        if (this._map instanceof M3D.Texture) {
            programName += "_texture"
        }

        if (this._useVertexColors) {
            programName += "_colors"
        }

        return programName;
    }

    toJson() {
        var obj = super.toJson();

        obj.color = this._color.getHex();
        obj.lights = this._lights;

        return obj;
    }

    static fromJson(obj) {
        var material = new M3D.MeshBasicMaterial();

        // Material properties
        material = super.fromJson(obj, material);

        // MeshBasicMaterial properties
        material._color = new THREE.Color(obj.color);
        material._lights = obj.lights;

        return material;
    }

    update(data) {
        super.update(data);

        for (var prop in data) {
            switch (prop) {
                case "color":
                    this._color = data.color;
                    delete data.color;
                    break;
                case "lights":
                    this._lights = data.lights;
                    delete data.lights;
                    break;
            }
        }
    }
};
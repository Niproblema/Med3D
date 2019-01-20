/**
 * Created by Primoz on 19. 06. 2016.
 */

M3D.UpdateListener = class {
    constructor(onObjectUpdate, onHierarchyUpdate, onMaterialUpdate, onGeometryUpdate, onExternalUpdate) {
        this._onObjectUpdate = (onObjectUpdate) ? onObjectUpdate : function () {};
        this._onHierarchyUpdate = (onHierarchyUpdate) ? onHierarchyUpdate : function () {};
        this._onMaterialUpdate = (onMaterialUpdate) ? onMaterialUpdate : function () {};
        this._onGeometryUpdate = (onGeometryUpdate) ? onGeometryUpdate : function () {};
        this._onExternalUpdate = (onExternalUpdate) ? onExternalUpdate : function () {};
    }

    get objectUpdate() { return this._onObjectUpdate; }
    get hierarchyUpdate() { return this._onHierarchyUpdate; }
    get materialUpdate() { return this._onMaterialUpdate; }
    get geometryUpdate() { return this._onGeometryUpdate; }
    get externalUpdate() { return this._onExternalUpdate; }


    set objectUpdate(callback) { this._onObjectUpdate = callback; }
    set hierarchyUpdate(callback) { this._onHierarchyUpdate = callback; }
    set materialUpdate(callback) { this._onMaterialUpdate = callback; }
    set geometryUpdate(callback) { this._onGeometryUpdate = callback; }
    set externalUpdate(callback) { this._onExternalUpdate = callback; }
};
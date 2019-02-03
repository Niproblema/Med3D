/**
 * Created by Jan on 8.1.2019
 * Manages multiple UpdateListeners
 */

M3D.UpdateListenerManager = class {

    constructor(ref, existing) {
        this.ref = ref;
        if (existing === undefined || !(existing instanceof M3D.UpdateListenerManager) || existing.isEmpty()) {
            this._listeners = [];
        } else {
            this._listeners = existing._listeners.slice();
        }
    }

    get listeners() { return this._listeners }
    set listeners(listeners) { this._listeners = listeners; }

    addListener(listener) {
        this._listeners.push(listener);
    }

    removeAll() {
        this.listeners = [];
    }

    removeListener(listener) {
        if (this.isEmpty())
            console.error("Cannot remove listener - UpdateListenerManager empty.");

        var found = false;
        var temp;
        for (var i = 0; i < this._listeners.length; i++) {
            temp = this._listeners.shift();
            if (temp === listener) {
                found = true;
                break;
            }
            this._listeners.push(temp);
        }
        if (!found)
            console.error("Cannot remove listener - No such listener subscribed on this object.");

    }

    isEmpty() {
        return this._listeners.lenght == 0;
    }

    // ============================ Listener methods ============================ //

    objectUpdate(update) {
        for (var i = 0; i < this._listeners.length; i++) {
            this._listeners[i].objectUpdate.call(this.ref, update);
        }
    }

    hierarchyUpdate(update) {
        for (var i = 0; i < this._listeners.length; i++) {
            this._listeners[i].hierarchyUpdate.call(this.ref, update);
        }
    }
    materialUpdate(update) {
        for (var i = 0; i < this._listeners.length; i++) {
            this._listeners[i].materialUpdate.call(this.ref, update);
        }
    }
    geometryUpdate(update) {
        for (var i = 0; i < this._listeners.length; i++) {
            this._listeners[i].geometryUpdate.call(this.ref, update);
        }
    }
    /* On external update - like collaboration - someone else triggered change */
    externalUpdate(update){
        for (var i = 0; i < this._listeners.length; i++) {
            this._listeners[i].externalUpdate.call(this.ref, update);
        }
    }
    

}
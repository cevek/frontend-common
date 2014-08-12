class MyArray {length:number}
MyArray.prototype = [];

class Index {}
class IndexKey {
    constructor(public key:string, public many:boolean) {}
}

class IndexedArray<T> extends MyArray {
    keys:IndexKey[] = [];

    constructor(array:any, key = 'id', many = false) {
        super();
        for (var i = 0; i < array.length; i++) {
            this[i] = array[i];
        }
        this.length = array.length;
        if (array.keys) {
            this.keys = array.keys;
            for (var i = 0; i < this.keys.length; i++) {
                var indexKey:IndexKey = this.keys[i];
                this[indexKey.key] = array[indexKey.key];
            }
        }

        this.setValToPath(this, key, {__proto__: new Index});
        this.keys.push(new IndexKey(key, many));
        this.updateAll();

        this.hidePrivates();
    }


    updateAll() {
        var i:number, len:number, item:T, index_val:any;

        for (var j = 0; j < this.keys.length; j++) {
            var key = this.keys[j].key;
            var many = this.keys[j].many;


            this.setValToPath(this, key, {__proto__: new Index});
            var index = this.getValFromPath(this, key);


            for (i = 0, len = this.length; i < len; i++) {
                item = this[i];
                index_val = this.getValFromPath(item, key);


                if (many) {
                    if (!index[index_val])
                        index[index_val] = [];
                    index[index_val].push(item);
                }
                else {
                    index[index_val] = item;
                }
            }
        }
    }


    updateItemByIndexKey(i:number):void {
        var item:T = this[i];
        this.updateItem(item);
    }

    updateItem(item:T) {
        var i;

        for (var j = 0; j < this.keys.length; j++) {
            var key = this.keys[j].key;
            var many = this.keys[j].many;
            var index = this.getValFromPath(this, key);


            var index_val = this.getValFromPath(item, key);
            if (typeof item === 'object') {
                i = this.findObject(key, this.getValFromPath(item, key));
                //for (j in this[i]) delete this[i][j];
                //for (j in item) this[i][j] = item[j];
                if (i > -1)
                    this[i] = item;
                else
                    this.push(item);
            }
            if (item) {
                if (many) {
                    var pos = index[index_val].indexOf(item);
                    if (pos > -1)
                        index[index_val][pos] = item;
                    else
                        index[index_val].push(item);

                }
                else
                    index[index_val] = item;
            }
            else {
                console.error("IndexArray.updateItem item not found");
                //return false;
            }
        }
    }


    removeItem(item:T) {
        var i;
        for (var j = 0; j < this.keys.length; j++) {
            var key = this.keys[j].key;
            if (typeof item === 'object') {
                i = this.findObject(key, this.getValFromPath(item, key));
            }
            if (this[i]) {
                this.splice(i, 1);
            }
            else {
                console.error("IndexArray.updateItem item not found");
            }
        }
    }


    push(item:T) {
        var length = this.length;

        Array.prototype.push.apply(this, arguments);
        for (var i = 0; i < arguments.length; i++) {
            this.updateItemByIndexKey(length + i);
        }
    }

    unshift() {
        Array.prototype.unshift.apply(this, arguments);
        for (var i = 0; i < arguments.length; i++) {
            this.updateItemByIndexKey(i);
        }
    }

    pop() {
        var ret = this[this.length - 1];
        this.splice(this.length - 1, 1);
        return ret;
    }

    shift() {
        var ret = this[0];
        this.splice(0, 1);
        return ret;
    }

    splice(from:number, howMany:number) {
        var i, k, item, index_val;
        for (var j = 0; j < this.keys.length; j++) {
            var key = this.keys[j].key;
            var many = this.keys[j].many;
            var index = this.getValFromPath(this, key);
            for (i = 0; i < howMany; i++) {
                k = from + i;
                item = this[k];
                index_val = this.getValFromPath(item, key);
                if (many) {
                    var pos = index[index_val].indexOf(item);
                    if (pos > -1)
                        index[index_val].splice(pos, 1);
                    if (index[index_val].length === 0)
                        delete index[index_val];
                }
                else
                    delete index[index_val];
            }
        }
        Array.prototype.splice.apply(this, arguments);
        if (arguments.length > 2) {
            for (i = 0; i < arguments.length - 2; i++) {
                this.updateItem(from + i);
            }
        }
    }


    private getValFromPath(obj:any, key:string) {
        var keyChunks = key.split(".");
        var _obj = obj;
        for (var i = 0; i < keyChunks.length; i++) {
            _obj = _obj[keyChunks[i]]
        }
        return _obj;
    }


    private setValToPath(obj:any, key:string, new_val:any) {
        var keyChunks = key.split(".");
        var _obj = obj;
        for (var i = 0; i < keyChunks.length - 1; i++) {
            if (!_obj[keyChunks[i]])
                _obj[keyChunks[i]] = {};
            _obj = _obj[keyChunks[i]]
        }

        _obj[keyChunks[keyChunks.length - 1]] = new_val;
        this.hidePrivate(obj, keyChunks[0]);
    }

    private findObject(property, value):number {
        var compare_obj = {}, i, prop, len, find;
        if (typeof property === "string") {
            compare_obj[property] = value;
        }
        if (typeof property === "object") {
            compare_obj = property;
        }

        for (i = 0, len = this.length; i < len; i++) {
            find = true;
            for (prop in compare_obj) {
                if (this.getValFromPath(this[i], prop) != compare_obj[prop]) {
                    find = false;
                    break;
                }
            }
            if (find)
                return i;
        }
        return -1;
    }

    private hidePrivates() {
        var keys = Object.keys(IndexedArray.prototype);
        for (var i = 0; i < keys.length; i++) {
            this.hidePrivate(IndexedArray.prototype, keys[i]);
        }
        this.hidePrivate(this, "keys");
        this.hidePrivate(this, "length");
    }

    private hidePrivate(obj:any, name:string) {
        Object.defineProperty(obj, name, {
            enumerable: false,
            configurable: true,
            writable: true
        });
    }
}


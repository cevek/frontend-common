/**
 * Create index for array
 * Example: var arr = new IndexedArray([{id: 123, title: "Hello"}, {id: 124, title: "Text"}], "id");
 * arr.id[123]; arr.id[124];
 * @param array
 * @param key
 * @param many
 * @returns {IndexedArray}
 * @constructor
 */
function IndexedArray(array, key, many) {
    if (!key)
        key = 'id';
    if (!(array instanceof Array))
        array = [];
    for (var method in arguments.callee)
        if (arguments.callee.hasOwnProperty(method)) {
            array[method] = arguments.callee[method];
            Object.defineProperty(array, method, {
                enumerable: false,
                configurable: true,
                writable: true
            });
        }
    Object.setValToPath(array, key, {});

    if (!(array.keys instanceof Array))
        array.keys = [];
    array.keys.push({key: key, many: many});
    array.updateAll();
    return array;
}
Object.getValFromPath = function (obj, key) {
    var keyChunks = key.split(".");
    var _obj = obj;
    for (var i = 0; i < keyChunks.length; i++) {
        _obj = _obj[keyChunks[i]]
    }
    return _obj;
};

Object.setValToPath = function (obj, key, new_val) {
    var keyChunks = key.split(".");
    var _obj = obj;
    for (var i = 0; i < keyChunks.length - 1; i++) {
        if (!_obj[keyChunks[i]])
            _obj[keyChunks[i]] = {};
        _obj = _obj[keyChunks[i]]
    }

    _obj[keyChunks[keyChunks.length - 1]] = new_val;
};


/**
 * apply IndexedArray for this array
 * @param key
 * @returns {IndexedArray}
 */
Array.prototype.createIndex = function (key) {
    return IndexedArray(this, key);
};

Object.defineProperty(Array.prototype, 'createIndex', {
    enumerable: false,
    configurable: true,
    writable: true
});


/**
 * @param {Array=} array
 */
IndexedArray.updateAll = function (array) {
    var i, len, item, index_val;
    for (var j = 0; j < this.keys.length; j++) {
        var key = this.keys[j].key;
        var many = this.keys[j].many;

        Object.setValToPath(this, key, {});
        var index = Object.getValFromPath(this, key);

        if (array) {
            for (i = 0, len = array.length; i < len; i++) {
                item = array[i];
                index_val = Object.getValFromPath(item, key);
                this[i] = item;
                if (many)
                    index[index_val].push(item);
                else
                    index[index_val] = item;
            }
            this.length = array.length;
        }
        else {
            for (i = 0, len = this.length; i < len; i++) {
                item = this[i];
                index_val = Object.getValFromPath(item, key);
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


};
/**
 * @param {number|object} item
 */
IndexedArray.updateItem = function (item) {
    var i;
    if (typeof item === 'number') {
        i = item;
        item = this[i];
    }

    for (var j = 0; j < this.keys.length; j++) {
        var key = this.keys[j].key;
        var many = this.keys[j].many;
        var index = Object.getValFromPath(this, key);


        var index_val = Object.getValFromPath(item, key);
        if (typeof item === 'object') {
            i = this.findObject(key, Object.getValFromPath(item, key), true);
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
            // for CSS animation
            /*item.$changed = true;
             setTimeout(function () {
             delete item.$changed;
             }, 1000);*/
            //return i;
        }
        else {
            console.error("IndexArray.updateItem item not found");
            //return false;
        }
    }
};

/**
 * @param {number|object} item
 */
IndexedArray.removeItem = function (item) {
    var i;
    for (var j = 0; j < this.keys.length; j++) {
        var key = this.keys[j].key;
        if (typeof item === 'object') {
            i = this.findObject(key, Object.getValFromPath(item, key), true);
        }
        if (this[i]) {
            this.splice(i, 1);
        }
        else {
            console.error("IndexArray.updateItem item not found");
        }
    }
};


IndexedArray.push = function () {
    var length = this.length;

    Array.prototype.push.apply(this, arguments);
    for (var i = 0; i < arguments.length; i++) {
        this.updateItem(length + i);
    }
};
IndexedArray.unshift = function () {
    Array.prototype.unshift.apply(this, arguments);
    for (var i = 0; i < arguments.length; i++) {
        this.updateItem(i);
    }
};
IndexedArray.pop = function () {
    var ret = this[this.length - 1];
    this.splice(this.length - 1, 1);
    return ret;
};
IndexedArray.shift = function () {
    var ret = this[0];
    this.splice(0, 1);
    return ret;
};
IndexedArray.splice = function (from, howMany) {
    var i, k, item, index_val;
    for (var j = 0; j < this.keys.length; j++) {
        var key = this.keys[j].key;
        var many = this.keys[j].many;
        var index = Object.getValFromPath(this, key);
        for (i = 0; i < howMany; i++) {
            k = from + i;
            item = this[k];
            index_val = Object.getValFromPath(item, key);
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
};

// tests
if (false) {
    var a = [
        {id: "angel"},
        {id: "clown"},
        {id: "mandarin"},
        {id: "surgeon"}
    ].createIndex("id");
    a.splice(2, 0, {id: "drum"});
    a.splice(3, 1);
    a.splice(2, 1, {id: "trumpet"});
    a.splice(0, 2, {id: "parrot"}, {id: "anemone"}, {id: "blue"});
    console.log(JSON.stringify(a) === '[{"id":"parrot"},{"id":"anemone"},{"id":"blue"},{"id":"trumpet"},{"id":"surgeon"}]');
    console.log(JSON.stringify(a.id) === '{"surgeon":{"id":"surgeon"},"trumpet":{"id":"trumpet"},"parrot":{"id":"parrot"},"anemone":{"id":"anemone"},"blue":{"id":"blue"}}');
}


/**
 * @param {Object} obj
 * @param {Function} callback
 */
Object.forEach1 = function (obj, callback) {
    for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
            callback(obj[i], i, obj);
        }
    }
};

/**
 * @param {string|object} property
 * @param {*=} value
 * @param {boolean=} returnIndex
 * @returns {object|number|boolean}
 */
Array.prototype.findObject = function (property, value, returnIndex) {
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
            if (Object.getValFromPath(this[i], prop) != compare_obj[prop]) {
                find = false;
                break;
            }
        }
        if (find)
            return returnIndex ? i : this[i];
    }
    return returnIndex ? -1 : false;
};

Array.prototype.findAllObject = function (property, value, limit) {
    var compare_obj = {}, i, prop, len, find;
    if (typeof property === "string") {
        compare_obj[property] = value;
    }
    if (typeof property === "object") {
        compare_obj = property;
    }

    var ret = [];
    for (i = 0, len = this.length; i < len; i++) {
        find = true;
        for (prop in compare_obj) {
            if (Object.getValFromPath(this[i], prop) != compare_obj[prop]) {
                find = false;
                break;
            }
        }

        if (find)
            ret.push(this[i]);


        if (ret.length == limit)
            break;
    }
    return ret;
};

Object.defineProperty(Array.prototype, 'findObject', {
    enumerable: false,
    configurable: true,
    writable: true
});


function naturalSorter(as1, bs) {
    var a, b, a1, b1, i = 0, n, L,
        rx = /(\.\d+)|(\d+(\.\d+)?)|([^\d.]+)|(\.\D+)|(\.$)/g;
    if (as1 === bs) return 0;
    a = as1.toLowerCase().match(rx) || [];
    b = bs.toLowerCase().match(rx) || [];
    L = a.length;
    while (i < L) {
        if (!b[i]) return 1;
        a1 = a[i],
            b1 = b[i++];
        if (a1 !== b1) {
            n = a1 - b1;
            if (!isNaN(n)) return n;
            return a1 > b1 ? 1 : -1;
        }
    }
    return b[i] ? -1 : 0;
}


/**
 * Insert <script src="url"></script> into head
 */
function loadScript(url) {
    var head = document.getElementsByTagName("head")[0];
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = url;
    setTimeout(function () {
        head.appendChild(script);
    }, 0);
}


/**
 * include css js favicon files but only when loading beacause document.write, only for DEV
 * @param files
 */
function include(files) {
    var uniq = Math.random().toString(33).substr(-3);
    if (typeof files == "string")
        files = [files];
    var scripts = "";
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var src = file// + "?" + uniq;
        if (file.match(/\.js/i))
            scripts += ("<script src='" + src + "'><\/script>");
        if (file.match(/\.css/i))
            scripts += ("<link href='" + src + "' rel='stylesheet' />");
        if (file.match(/\.ico/i))
            scripts += ("<link href='" + src + "' type='image/x-icon' rel='icon' />");
        if (file.match(/.html/i)) {
            //includeAngularTpl(file);
        }
    }

    document.write(scripts);
}

function includeAngularTpl(tpl) {

    //setTimeout(function () {
    var id = tpl.split('/').pop().split('.').shift();
    var xhr = new XMLHttpRequest();
    var script = $('<script id="' + id + '" type="text/ng-template"></script>').appendTo("body");
    xhr.open("GET", tpl, false);
    xhr.onload = function (e) {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                if (window.app)
                    app.run(function ($templateCache) {
                        $templateCache.put(id, xhr.responseText);
                    });
            } else {
                console.error(xhr.statusText);
            }
        }
    };
    xhr.onerror = function (e) {
        console.error(xhr.statusText);
    };

    xhr.send(null);
    if (xhr.status === 200) {
        script.text(xhr.responseText);
    } else {
        console.error(xhr.statusText);
    }
    //});

}

// fix console
(function (console) {
    var i,
        global = this,
        fnProto = Function.prototype,
        fnApply = fnProto.apply,
        fnBind = fnProto.bind,
        bind = function (context, fn) {
            return fnBind ?
                fnBind.call(fn, context) :
                function () {
                    return fnApply.call(fn, context, arguments);
                };
        },
        methods = 'assert count debug dir dirxml error group groupCollapsed groupEnd info log markTimeline profile profileEnd table time timeEnd trace warn'.split(' '),
        emptyFn = function () {},
        empty = {},
        timeCounters;

    for (i = methods.length; i--;) empty[methods[i]] = emptyFn;

    if (console) {
        if (!console.time) {
            console.timeCounters = timeCounters = {};
            console.time = function (name, reset) {
                if (name) {
                    var time = +new Date, key = "KEY" + name.toString();
                    if (reset || !timeCounters[key]) timeCounters[key] = time;
                }
            };
            console.timeEnd = function (name) {
                var diff,
                    time = +new Date,
                    key = "KEY" + name.toString(),
                    timeCounter = timeCounters[key];

                if (timeCounter) {
                    diff = time - timeCounter;
                    console.info(name + ": " + diff + "ms");
                    delete timeCounters[key];
                }
                return diff;
            };
        }
        for (i = methods.length; i--;) {
            console[methods[i]] = methods[i] in console ?
                bind(console, console[methods[i]]) : emptyFn;
        }
        console.disable = function () { global.console = empty; };
        empty.enable = function () { global.console = console; };
        empty.disable = console.enable = emptyFn;

    } else {
        console = global.console = empty;
        console.disable = console.enable = emptyFn;
    }
})(typeof console === 'undefined' ? null : console);


Object.forEach = function (obj, fn) {
    if (obj instanceof Object)
        for (var i in obj) {
            if (obj.hasOwnProperty(i))
                fn(obj[i], i);
        }
};

/**
 * getWeek
 * @returns {number}
 */
Date.prototype.getWeek = function () {
    var onejan = new Date(this.getFullYear(), 0, 1);
    return Math.ceil((((this - onejan) / 86400000) + onejan.getDay() + 1) / 7);
};

/**
 * getMonday of this date
 * @returns {Date}
 */
Date.prototype.getMonday = function () {
    var d = new Date(this);
    var day = d.getDay(),
        diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
};

/**
 * return number in format 20130612
 */
Date.prototype.getDayInt = function () {
    return this.getFullYear() * 10000 + this.getMonth() * 100 + this.getDate();
};
/**
 * Get day of year
 * @returns {number}
 */
Date.prototype.getDOY = function () {
    var onejan = new Date(this.getFullYear(), 0, 1);
    return Math.ceil((this - onejan) / 86400000);
};

Date.prototype.shiftToUTC = function () {
    var date = new Date(this);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date;
};
Date.prototype.shiftFromUTC = function () {
    var date = new Date(this);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return date;
};

/**
 * For beautiful view
 * @returns {string}
 */
Date.prototype.toString = function () {
    var json = this.toJSON();
    if (json)
        return json.replace(/\..*$/, '') + 'Z';
    else
        return 'Invalid Date';
};

/**
 * Parse JSON ISO datetime to JS Date obj JSON.parse('["2013-11-25T16:28:57.762Z"]', dateTimeReviver);
 * @param key
 * @param value
 * @returns {Date}
 */
function dateTimeReviver(key, value) {
    if (typeof value === 'string') {
        if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
            return new Date(value);
        }
    }
    return value;
}

/**
 * return obj with search params
 * @returns {}
 */
function parseURLSearch(url) {
    var obj = {};
    url = url.replace('&amp;', '&');
    var search = url.split('?')[1] || "";
    search && search.split('&').forEach(function (pair) {
        pair = pair.split('=');
        obj[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    });
    return obj;
}


/**
 * Fast function call with array arguments
 * http://jsperf.com/apply-vs-call-vs-invoke
 */
function call(fn, args) {
    switch (args.length) {
        case  0:
            return fn();
        case  1:
            return fn(args[0]);
        case  2:
            return fn(args[0], args[1]);
        case  3:
            return fn(args[0], args[1], args[2]);
        case  4:
            return fn(args[0], args[1], args[2], args[3]);
        case  5:
            return fn(args[0], args[1], args[2], args[3], args[4]);
        case  6:
            return fn(args[0], args[1], args[2], args[3], args[4], args[5]);
        case  7:
            return fn(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
        case  8:
            return fn(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
        case  9:
            return fn(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7],
                args[8]);
        case 10:
            return fn(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7],
                args[8], args[9]);
        default:
            return fn.apply(null, args);
    }
}


//check browser
(function () {
    if (window.browser) return;
    var nav = window.navigator.userAgent.toLowerCase();
    var match = /(opr)[\/]([\w.]+)/.exec(nav) || /(chrome)[ \/]([\w.]+)/.exec(nav) || /(webkit)[ \/]([\w.]+)/.exec(nav) || /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(nav) || /(msie) ([\w.]+)/.exec(nav) || nav.indexOf("trident") >= 0 && /(rv)(?::| )([\w.]+)/.exec(nav) || nav.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(nav) || [];
    var platform = /(ipad)/.exec(nav) || /(iphone)/.exec(nav) || /(android)/.exec(nav) || /(win)/.exec(nav) || /(mac)/.exec(nav) || /(linux)/.exec(nav) || [];
    var b = {};
    b[match[1]] = true;
    b[platform[1]] = true;
    b.platform = platform[1];
    b.name = match[1];
    b.version = match[2] || "";
    b.majorVersion = b.versionMajor = b.major = ~~b.version.split(".").shift();
    if (b.chrome || b.opr) {b.webkit = true}
    else if (b.webkit) {b.safari = true}
    if (b.rv) {b.msie = true}
    if (b.opr) {b.opera = true}

    b.ismobile = navigator.userAgent.match(/Android/i)
        || navigator.userAgent.match(/webOS/i)
        || navigator.userAgent.match(/iPhone/i)
        || navigator.userAgent.match(/iPad/i)
        || navigator.userAgent.match(/iPod/i)
        || navigator.userAgent.match(/BlackBerry/i)
        || navigator.userAgent.match(/Windows Phone/i)
        || false;

    window.browser = b;

    var classes = " " + b.name + " " + b.name + b.majorVersion + " " + b.platform + (b.ismobile ? " mobile" : "") +
        (b.webkit ? " webkit" : "");
    if (b.name == "msie") {
        if (b.majorVersion < 9)
            classes += " msie678";
        if (b.majorVersion < 8)
            classes += " msie67"
    }
    document.documentElement.className += classes;
})();


function visibilityChange(callback) {
    var hidden = "hidden";

    // Standards:
    if (hidden in document)
        document.addEventListener("visibilitychange", onchange);
    else if ((hidden = "mozHidden") in document)
        document.addEventListener("mozvisibilitychange", onchange);
    else if ((hidden = "webkitHidden") in document)
        document.addEventListener("webkitvisibilitychange", onchange);
    else if ((hidden = "msHidden") in document)
        document.addEventListener("msvisibilitychange", onchange);
    // IE 9 and lower:
    else if ('onfocusin' in document)
        document.onfocusin = document.onfocusout = onchange;
    // All others:
    else
        window.onpageshow = window.onpagehide
            = window.onfocus = window.onblur = onchange;

    function onchange(evt) {
        var v = true, h = false,
            evtMap = {
                focus: v, focusin: v, pageshow: v, blur: h, focusout: h, pagehide: h
            };

        evt = evt || window.event;
        if (evt.type in evtMap)
            callback(evtMap[evt.type]);
        else
            callback(!this[hidden]);
    }
};

/**
 * @param src Object
 * @param dst Object
 */
Object.clone = function (src, dst) {
    for (var idx in src)
        if ('undefined' !== typeof src[idx])
        //if (src.hasOwnProperty(idx))
            dst[idx] = src[idx];
};


Object.hidePrototype = function (fn) {
    for (var i in fn.prototype) {
        Object.defineProperty(fn.prototype, i, {
            enumerable: false,
            configurable: true,
            writable: true
        });
    }
    return fn;
};

/**
 * Create {obj[prop_ids]} with getters and setters,
 * linked with array {obj[prop]}
 * which has in every item {id} prop
 * when set new value in obj[prop_ids]
 * start generating obj[prop] array from indexedObj[id]
 * @param obj Object
 * @param prop String
 * @param indexedObj Object
 */
Object.autoIds = function (obj, prop, indexedObj) {
    Object.defineProperty(obj, prop + '_ids', {
        get: function () {
            var ids = [];
            if (this[prop])
                for (var i = 0; i < this[prop].length; i++)
                    ids.push(this[prop][i].id);

            return ids.join(',');
        },
        set: function (values) {
            this[prop] = [];
            if (typeof values === 'string')
                values = values.split(',');
            if (values instanceof Array)
                for (var i = 0; i < values.length; i++)
                    this.a.push(indexedObj[values[i]]);
        },
        enumerable: true,
        configurable: true
    })
};


/**
 * @param array Array
 * @param constructor Function
 */
Array.classList = function (array, constructor) {
    if (!(array instanceof Array))
        array = [];
    for (var i = 0, l = array.length; i < l; i++) {
        array[i] = array[i] ? new constructor(array[i]) : null;
    }
    if (array.updateAll)
        array.updateAll();
    return array;
};


Array.generateNumbers = function (from, to) {
    var a = [];
    for (var i = from; i <= to; i++)
        a.push(i);
    return a;
};
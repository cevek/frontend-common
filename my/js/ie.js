var ie = (function () {
    var undef,
        v = 3,
        div = document.createElement('div'),
        all = div.getElementsByTagName('i');

    while (
        div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->',
            all[0]
        );
    return v > 4 ? v : undef;

}());
if (ie < 9) {
    document.createElement('header');
    document.createElement('footer');
}

if (typeof Object.create != 'function') {
    (function () {
        var F = function () {};
        Object.create = function (o) {
            if (arguments.length > 1) { throw Error('Second argument not supported');}
            if (o === null) { throw Error('Cannot set a null [[Prototype]]');}
            if (typeof o != 'object') { throw TypeError('Argument must be an object');}
            F.prototype = o;
            return new F;
        };
    })();
}


if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (obj, start) {
        for (var i = (start || 0), j = this.length; i < j; i++) {
            if (this[i] === obj) { return i; }
        }
        return -1;
    }
}

if (!String.prototype.trim) {
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g, "");
    }
}


if (!Array.prototype.forEach) {
    Array.prototype.forEach = function (fn, scope) {
        'use strict';
        var i, len;
        for (i = 0, len = this.length; i < len; ++i) {
            if (i in this) {
                fn.call(scope, this[i], i, this);
            }
        }
    };
}

if (!Array.prototype.some) {
    Array.prototype.some = function (fun /*, thisp */) {
        "use strict";
        var t = Object(this);
        var len = t.length >>> 0;
        if (typeof fun != "function")
            throw new TypeError();
        var thisp = arguments[1];
        for (var i = 0; i < len; i++)
            if (i in t && fun.call(thisp, t[i], i, t))
                return true;
        return false;
    };
}


if (!Array.prototype.filter)
{
    Array.prototype.filter = function(fun /*, thisArg */)
    {
        "use strict";

        if (this === void 0 || this === null)
            throw new TypeError();

        var t = Object(this);
        var len = t.length >>> 0;
        if (typeof fun != "function")
            throw new TypeError();

        var res = [];
        var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
        for (var i = 0; i < len; i++)
        {
            if (i in t)
            {
                var val = t[i];

                // NOTE: Technically this should Object.defineProperty at
                //       the next index, as push can be affected by
                //       properties on Object.prototype and Array.prototype.
                //       But that method's new, and collisions should be
                //       rare, so use the more-compatible alternative.
                if (fun.call(thisArg, val, i, t))
                    res.push(val);
            }
        }

        return res;
    };
}

/**
 * Parse ISO date
 */
(function() {

    var d = window.Date,
        regexIso8601 = /^(\d{4}|\+\d{6})(?:-(\d{2})(?:-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})\.(\d{1,3})(?:Z|([\-+])(\d{2}):(\d{2}))?)?)?)?$/;

    if (d.parse('2011-11-29T15:52:30.5') !== 1322581950500 ||
        d.parse('2011-11-29T15:52:30.52') !== 1322581950520 ||
        d.parse('2011-11-29T15:52:18.867') !== 1322581938867 ||
        d.parse('2011-11-29T15:52:18.867Z') !== 1322581938867 ||
        d.parse('2011-11-29T15:52:18.867-03:30') !== 1322594538867 ||
        d.parse('2011-11-29') !== 1322524800000 ||
        d.parse('2011-11') !== 1320105600000 ||
        d.parse('2011') !== 1293840000000) {

        d.__parse = d.parse;

        d.parse = function(v) {

            var m = regexIso8601.exec(v);

            if (m) {
                return Date.UTC(
                    m[1],
                    (m[2] || 1) - 1,
                    m[3] || 1,
                    m[4] - (m[8] ? m[8] + m[9] : 0) || 0,
                    m[5] - (m[8] ? m[8] + m[10] : 0) || 0,
                    m[6] || 0,
                    ((m[7] || 0) + '00').substr(0, 3)
                );
            }

            return d.__parse.apply(this, arguments);

        };
    }

    d.__fromString = d.fromString;

    d.fromString = function(v) {

        if (!d.__fromString || regexIso8601.test(v)) {
            return new d(d.parse(v));
        }

        return d.__fromString.apply(this, arguments);
    };

})();

if ( !Date.prototype.toISOString ) {
    ( function() {

        function pad(number) {
            if ( number < 10 ) {
                return '0' + number;
            }
            return number;
        }

        Date.prototype.toISOString = function() {
            return this.getUTCFullYear() +
                '-' + pad( this.getUTCMonth() + 1 ) +
                '-' + pad( this.getUTCDate() ) +
                'T' + pad( this.getUTCHours() ) +
                ':' + pad( this.getUTCMinutes() ) +
                ':' + pad( this.getUTCSeconds() ) +
                '.' + (this.getUTCMilliseconds() / 1000).toFixed(3).slice( 2, 5 ) +
                'Z';
        };

    }() );
}
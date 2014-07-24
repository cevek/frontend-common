function setStruct(obj, struct) {
    function deep(o, st) {
        for (var i in st)
            if (st.hasOwnProperty(i)) {
                var def = st[i]; // default value
                switch (typeof def) {
                    case "number":
                        o[i] = i in o ? +o[i] : def;
                        o[i] = isFinite(o[i]) ? o[i] : def;
                        break;
                    case "string":
                        o[i] = i in o ? o[i] + "" : def;
                        break;
                    case "boolean":
                        o[i] = i in o ? !!o[i] : def;
                        break;
                    case "object":
                        if (def instanceof Date) {
                            o[i] = new Date(i in o ? o[i] : def);
                            if (isNaN(o[i].getTime()))
                                o[i] = new Date(def);
                        }
                        else if (def instanceof Array) {
                            var _o = {};
                            o[i] = o[i] instanceof Array ? o[i] : (st[i].length ? [_o] : []);
                            for (var j = 0; j < o[i].length; j++){
                                o[i][j] = o[i][j] instanceof Object ? o[i][j] : {};
                                deep(o[i][j], st[i][0]);
                            }
                        }
                        else if (def instanceof Object) {
                            o[i] = o[i] instanceof Object ? o[i] : {};
                            deep(o[i], st[i]);
                        }
                        break;
                }
            }
    }

    deep(obj, struct);
    return obj;
}
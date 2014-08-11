if (typeof exports != "undefined") {
    var asyncNextTick = process.nextTick;
    exports.Sync = Sync;
    exports.Async = Async;
    exports.SyncGlobal = Sync().do;
}
else {
    var asyncNextTick = window.setTimeout;
}


function Async() {
    var o = {
        callback: function () { },
        inprocess: 0,
        counter: 0,
        queue: [],
        limit: 100,
        push: function () {
            o.inprocess++;
            o.counter++;
            var args = Array.prototype.slice.call(arguments);
            var fn = args.pop();
            args.push(o.iteration);
            fn.apply(null, args);
        },

        run: function () {
            if (o.inprocess < o.limit && o.queue.length) {
                o.inprocess++;
                o.counter++;
                var args = o.queue.shift();
                args.push(o.iteration);
                var fn = args.shift();
                fn.apply(null, args);
            }
        },


        doit: function () {
            o.queue.push(Array.prototype.slice.call(arguments));
            o.run();
        },
        iteration: function () {
            var args = arguments;
            o.run();
            asyncNextTick(function () {
                if (!--o.inprocess)
                    o.callback(args.callee);
            })
        },
        done: function (cb) {
            o.callback = cb;
            if (o.counter == 0)
                o.callback();
        }
    }
    o["do"] = o.doit;

    var firstArg = arguments[0];
    var lastArg = arguments[arguments.length - 1];

    if (typeof firstArg == "number")
        o.limit = firstArg;

    // if we have array
    if (firstArg instanceof Array)
        for (var i = 0; i < firstArg.length; i++)
            o.doit.apply(null, firstArg[i]);

    // if we have callbacks
    if (firstArg instanceof Function && arguments.length > 3)
        for (var i = 0; i < arguments.length; i += 2) {
            if (arguments[i + 1]) {
                var a = arguments[i + 1];
                a.unshift(arguments[i]);
                a.push(o.iteration);
                console.log(a);
                o.doit.apply(null, a);
            }
        }

    if (lastArg instanceof Function)
        o.callback = lastArg;

    return o;
}


function Sync() {

    var o = {
        items: [],
        itemProccess: false,
        itemsLengthLastRun: 0,
        next: function () {
            if (o.items.length > 0) {
                //console.log("before", o.items);
                // move child items to top
                if (o.itemsLengthLastRun < o.items.length) {
                    //console.log("need move from", o.itemsLengthLastRun, o.items.length);
                    o.items = o.items.splice(o.itemsLengthLastRun, o.items.length).concat(o.items);
                }
                //console.log("after", o.items);

                var item = o.items.shift();
                var fn = item.shift();

                o.itemProccess = item;
                o.itemsLengthLastRun = o.items.length;

                fn.apply(null, item);
            }
        },
        doit: function () {
            //console.log("new do", o.items.length);
            var args = Array.prototype.slice.call(arguments);
            args.push(o.next);
            o.items.push(args);
            //console.log("list", o.items);
            //console.log("start", o.items);
            if (o.items.length == 1)
                asyncNextTick(o.next);

        }
    }
    o.done = o.doit;

    if (arguments[0] instanceof Function)
        for (var i = 0; i < arguments.length; i += 2) {
            var a = arguments[i + 1] || [];
            a.unshift(arguments[i]);
            a.push(o.next);
            o.items.push(a);
        }

    o.next();
    return o;
}


//Sync(
// fn, [400],
// fn, [200],
// fn, [800],
// function(){
// console.log("done");
// }
//// );
//
//
//function fn(time, callback){
//    //console.log("args", arguments);
//    //console.log(time, callback);
//    //callback();
//    setTimeout(function(){
//        console.log(time);
//        callback();
//    }, time);
//}
//
//function fn2(callback){
//    console.log("run subchilds");
//    setTimeout(function(){
//        for (var i = 0; i < 10; i++)
//            sync.do(fn, 350 + i);
//        callback();
//    }, 1000);
//}
//
//function fn3(callback){
//    for (var i = 0; i < 3; i++)
//        sync.do(fn, 450 + i);
//    callback();
//
//}
//
//var sync = Sync();
//sync.do(fn3);
//for (var i = 0; i < 5; i++)
//    sync.do(fn, i * 100);
//
//sync.do(fn2);
//
//for (var i = 0; i < 5; i++)
//    sync.do(fn, i * 100 + 1);
//
//sync.do(function(){
//    console.log("done");
//});



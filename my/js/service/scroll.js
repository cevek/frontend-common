angular.module("scroll", []).factory("scroll", ["$rootScope", "$location",
    function ($rootScope, $location) {
        var scroll = {};
        var url = "";
        var counter = 0;
        var process = false;
        var backforwardEvent = false;

        function checkExists(url) {
            if (!scroll[url])
                scroll[url] = {active: false, pos: 0}
        }

        window.onscroll = function () {
            //console.log("scroll");
            if (!process && scroll[url] && scroll[url].active) {
                scroll[url].pos = $(window).scrollTop();
                //console.log("save scroll", url, scroll[url].pos, scroll);
            }
        };

        window.onpopstate = function () {
            backforwardEvent = true;
            //console.log("backforwardEvent ");
        };

        $rootScope.$on('$routeChangeSuccess', function () {
            counter++;
            url = $location.absUrl();
            checkExists(url);
            for (var i in scroll)
                scroll[i].active = false;
            backforwardEvent = false;
            //console.log("change location", url);
        });

        $rootScope.$on('$routeUpdate', function () {
            //console.log("route update", url);

            url = $location.absUrl();
            checkExists(url);
            //console.log("changeupdate location", url);
        });

        var timeoutAnim;
        var timeoutSetPos;
        return {
            get: function () {
                return scroll[url].pos;
            },
            clear: function () {
                scroll = {};
                return false;
            },
            set: function (val, animate) {
                //console.log("set scroll", url, val);
                checkExists(url);
                scroll[url].pos = val;
                clearTimeout(timeoutAnim);
                clearTimeout(timeoutSetPos);
                process = true; // doing scroll
                if (animate) {
                    var st = $(window).scrollTop();
                    var diff = 0;
                    var minspeed = 10;

                    function anim() {
                        process = true;
                        var st = $(window).scrollTop();
                        var dest = scroll[url].pos;
                        var diff = st - dest;
                        var diffAbs = Math.abs(diff);
                        var speed = Math.max(minspeed, diffAbs / 10);
                        var newSt = st + (diff > 0 ? -1 : 1) * speed;
                        //console.log("anim", "dest:",dest, "this:",st);
                        if (diffAbs < speed)
                            newSt = dest;
                        $(window).scrollTop(newSt);
                        if (newSt != dest)
                            timeoutAnim = setTimeout(anim, 10);
                        else
                            process = false;
                    }

                    timeoutAnim = setTimeout(anim);
                }
                else {
                    timeoutSetPos = setTimeout(function () {
                        process = false;
                        //console.log("set scroll", scroll[url].pos);
                        //$(window).scrollTop(scroll[url].pos);
                        window.scrollTo(0, scroll[url].pos);
                        //console.log("setted scroll", document.body.scrollTop, document.body.scrollHeight);
                    }, 1000);
                }

                return false;
            },

            restore: function () {
                url = $location.absUrl();
                checkExists(url);
                scroll[url].active = true;
                if (backforwardEvent) {
                    //console.log("restore scroll", url, scroll[url].pos, scroll);
                    this.set(scroll[url].pos);
                }

            }
        }
    }])

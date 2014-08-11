var router = angular.module("router", []);
router.directive('routeItem', function ($rootScope, $location) {
    return {
        scope: {
            routeItem: "="
        },
        link: function (scope, elem, attrs) {
            if (typeof attrs.noClick == "undefined") {
                elem.attr("href", attrs.routeItem);
                elem.on("touchstart click", function () {
                    $location.url(scope.routeItem);
                    $rootScope.$apply();
                    if (typeof attrs.noScroll == "undefined")
                        window.scrollTo(0, 0);
                });
            }
            $rootScope.$watch("urlPath", function (url) {
                if (url == scope.routeItem) {
                    elem.addClass("active");
                }
                else {
                    elem.removeClass("active");
                }
            });
        }
    }
});

router.directive('route', function ($rootScope, $location) {
    var activeElement;
    var activeRoute = $location.path();

    function emptyWatcher() {

    }

    function toggleWatchers(elem, watcherOn, scope) {
        var scopes = {};
        //console.log("watcher", watcherOn, elem);
        var _scopes = [];
        /*var _scope = scope;
         while (_scope) {
         console.log(_scope.$$childHead);
         _scope = _scope.$$nextSibling;
         if (_scope)
         _scopes.push(_scope);
         }*/

        var q = [scope], watchers = 0;
        while (q.length > 0) {
            $scope = q.pop();
            _scopes.push($scope);
            if ($scope.$$childHead) {
                q.push($scope.$$childHead);
            }
            if ($scope.$$nextSibling) {
                q.push($scope.$$nextSibling);
            }
        }


        //console.log(scope);

        /*var child_scope = scope.$$nextSibling;
         if (child_scope) {
         if (watcherOn) {
         if (child_scope.$$nextSibling_) {
         child_scope.$$nextSibling = child_scope.$$nextSibling_;
         console.log(child_scope, child_scope.$$nextSibling);
         }
         child_scope.$$nextSibling_ = null;
         }
         else {
         if (child_scope.$$nextSibling)
         child_scope.$$nextSibling_ = child_scope.$$nextSibling;
         child_scope.$$nextSibling = null;
         }
         }
         */

        /*
         if (!watcherOn && scope.$$nextSibling)
         scope.$$nextSibling.$destroy();
         */

        //scope.$$destroyed = !watcherOn;

        //console.log(_scopes.length);

        var offlined = [];
        for (var i = 0; i < _scopes.length; i++) {
            var $scope = _scopes[i];
            //if (watcherOn == $scope.$online)
            //    break;
            //break;
            $scope.$online = watcherOn;
            if (!$scope.$$watchers)
                $scope.$$watchers = [];

            if (!$scope.$$watchers_)
                $scope.$$watchers_ = [];

            /*if (watcherOn) {
                for (var j = 0; j < $scope.$$watchers_.length; j++) {
                    if (!$scope.$$watchers[j])
                        $scope.$$watchers[j] = $scope.$$watchers_[j];
                    $scope.$$watchers_[j] = null;
                }
            }
            else {
                for (var j = 0; j < $scope.$$watchers.length; j++) {
                    if ($scope.$$watchers[j])
                        $scope.$$watchers_[j] = $scope.$$watchers[j];
                    $scope.$$watchers[j] = null;
                }
            }*/

            /*if (watcherOn) {
                $scope.$$watchers = $scope.$$watchers.concat($scope.$$watchers_);
                $scope.$$watchers_ = [];
            }
            else {
                $scope.$$watchers_ = $scope.$$watchers_.concat($scope.$$watchers);
                $scope.$$watchers = [];
            }*/
        }

        /*
         elem.find(".ng-scope").each(function () {
         var $this = $(this);
         var $scope = $this.data().$scope;
         if ($scope && !scopes[$scope.$id]) {
         if (watcherOn) {
         if ($scope._$$watchers) {
         $scope.$$watchers = $scope._$$watchers;
         $scope._$$watchers = null;
         }
         }
         else {
         if (!$scope._$$watchers) {
         $scope._$$watchers = $scope.$$watchers;
         $scope.$$watchers = null;
         }
         }
         scopes[$scope.$id] = true;
         }
         });*/
    }


    function locationChange() {
        //console.log("locationChange");
        $rootScope.urlPath = $location.path();
        activeRoute = $rootScope.urlPath;
        for (var route in linked) {
            checkRouter(linked[route]);
        }
    }

    function checkRouter(r) {
        var match = activeRoute.match(r.regexp);
        if (match) {
            var params = {};
            r.keys.forEach(function (key, index) {
                params[key.name] = match[index + 1];
            });


            if (r.scope.$$nextSibling && r.scope.$$nextSibling.enter) {
                r.scope.$$nextSibling.enter(params);
                console.log("RUN ENTER");
            }
            else {
                setTimeout(function () {
                    if (r.scope.$$nextSibling && r.scope.$$nextSibling.enter) {
                        r.scope.$$nextSibling.enter(params);
                        console.log("RUN ENTER FIRST TIME");
                    }
                });
            }

            activeElement = r.element;
            toggleWatchers(activeElement, true, r.scope);
            activeElement.removeClass("ng-hide");
        }
        else {
            r.element.addClass("ng-hide");
            toggleWatchers(r.element, false, r.scope);
        }
    }

    $rootScope.$on("$locationChangeSuccess", locationChange);
    //locationChange();

    window.addEventListener("scroll", function () {
        if (activeElement) {
            activeElement.data("scrollTop", $(window).scrollTop());
        }
    });

    window.onpopstate = function () {
        if (activeElement) {
            var scrollTop = activeElement.data("scrollTop");
            if (scrollTop)
                window.scrollTo(0, scrollTop);
        }
    };

    function pathRegExp(path) {
        var ret = {
                originalPath: path,
                regexp: path
            },
            keys = ret.keys = [];

        path = path
            .replace(/([().])/g, '\\$1')
            .replace(/(\/)?:(\w+)([\?|\*])?/g, function (_, slash, key, option) {
                var optional = option === '?' ? option : null;
                var star = option === '*' ? option : null;
                keys.push({ name: key, optional: !!optional });
                slash = slash || '';
                return ''
                    + (optional ? '' : slash)
                    + '(?:'
                    + (optional ? slash : '')
                    + (star && '(.+?)' || '([^/]+)')
                    + (optional || '')
                    + ')'
                    + (optional || '');
            })
            .replace(/([\/$\*])/g, '\\$1');

        ret.regexp = new RegExp('^' + path + '$');
        return ret;
    }


    var linked = {};

    return  {
        restrict: 'EA',
        replace: true,
        //transclude: true,
        scope: {
            route: '='
        },
        template: '<div class="ng-hide"></div>',
        link: function (scope, elem, attr) {
            //console.log("link route");
            //console.log("ScOpe", scope);
            var route = scope.route;

            scope.$parent.$on("$includeContentLoaded", function () {
                checkRouter(linked[route]);
            });


            linked[route] = pathRegExp(route);
            linked[route].element = elem;
            linked[route].scope = scope;
            checkRouter(linked[route]);
        }
    }
});

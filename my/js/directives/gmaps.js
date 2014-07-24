function gmapsInited() {
    window.gmapsReady = true;
}


(function () {
    var loadProgress = false;

    function loadGmaps() {
        if (loadProgress)
            return;
        var head = document.getElementsByTagName("head")[0];
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.async = true;
        script.src = "https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&callback=gmapsInited&libraries=places&gmaps.js";
        head.appendChild(script);
        loadProgress = true;
    }

    function checkGMaps(callback) {
        loadGmaps();
        window.gmapsReady ? callback() : setTimeout(function () {
            checkGMaps(callback);
        }, 100);
    }


    var googleMaps = angular.module("googleMaps", []);


    //59.794008,30.407537
    //59.602195,30.761012
    // 29km
    googleMaps.factory('calculateDistance', function () {
        return function calculateDistance(coords1, coords2) {
            if (typeof coords1.lat == 'function')
                coords1 = [coords1.lat(), coords1.lng()];
            if (typeof coords2.lat == 'function')
                coords2 = [coords2.lat(), coords2.lng()];
            var EARTH_RADIUS = 6372795;
            // перевести координаты в радианы
            var M_PI = Math.PI;
            var lat1 = coords1[0] * M_PI / 180;
            var lat2 = coords2[0] * M_PI / 180;
            var long1 = coords1[1] * M_PI / 180;
            var long2 = coords2[1] * M_PI / 180;

            // косинусы и синусы широт и разницы долгот
            var cl1 = Math.cos(lat1);
            var cl2 = Math.cos(lat2);
            var sl1 = Math.sin(lat1);
            var sl2 = Math.sin(lat2);
            var delta = long2 - long1;
            var cdelta = Math.cos(delta);
            var sdelta = Math.sin(delta);

            // вычисления длины большого круга
            var y = Math.sqrt(Math.pow(cl2 * sdelta, 2) + Math.pow(cl1 * sl2 - sl1 * cl2 * cdelta, 2));
            var x = sl1 * sl2 + cl1 * cl2 * cdelta;

            var ad = Math.atan2(y, x);
            return Math.round(ad * EARTH_RADIUS);
        }
    });
    googleMaps.factory('geoCode', function ($q) {
        return function (address) {

            var deferred = $q.defer();
            checkGMaps(function () {
                var geocoder = new google.maps.Geocoder();
                geocoder.geocode({ 'address': address}, function (results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        /* map.setCenter(results[0].geometry.location);
                         var marker = new google.maps.Marker({
                         map: map,
                         position: results[0].geometry.location
                         });*/
                        var point = results[0].geometry.location;
                        deferred.resolve([point.lat(), point.lng(), 14]);

                    } else {
//                        deferred.reject(status);
                        deferred.resolve(null);
                        console.error('Geocode was not successful for the following reason: ' + status);
                    }
                });
            });
            return deferred.promise;
        }
    });

    googleMaps.factory('closestPlace', function ($q) {
        return function (coord, types, radius) {

            var deferred = $q.defer();
            checkGMaps(function () {
                if (!(types instanceof Array))
                    types = [types || 'subway_station'];

                var origin = new google.maps.LatLng(coord[0], coord[1]);
                var request = {
                    location: origin,
                    //radius: radius || 3000,
                    rankBy: google.maps.places.RankBy.DISTANCE,
                    types: types
                };

                var mapEl = $("<div style='width:0;height:0; display: none;'></div>").appendTo("body");
                var map = new google.maps.Map(mapEl[0]);

                var service = new google.maps.places.PlacesService(map);

                service.search(request, function (results, status) {
                    if (status == google.maps.places.PlacesServiceStatus.OK) {
                        deferred.resolve(results);
                        /*for (var i = 0; i < results.length; i++) {
                         createMarker(results[i]);
                         }*/
                    }
                    else {
                        //deferred.reject(status);
                        deferred.resolve(null);
                        console.error('Google Places was not successful for the following reason: ' + status);
                    }
                });

            });
            return deferred.promise;
        }
    });

    googleMaps.directive("googleMaps", function ($compile) {
        return {
            scope: {
                mode: '@',
                polygon: '=',
                defaultCenter: '=',
                center: '=',
                marker: '=',
                markers: '=',
                options: '=',
                ready: '&',
                change: '&'
            },
            link: function (scope, elem, attr) {
                var $input = $("<input name='" + attr.inputName + "' type='hidden' ng-model='" + attr.marker + "'>");
                elem.before($input);
                $compile($input)(scope.$parent);

                var $form = $input.parents("form");
                var formName = $form.attr('name');
                if (formName && attr.inputName) {
                    var formInput = scope.$parent[formName][attr.inputName];
                }

                checkGMaps(function () {
                    //console.log("Map ready");
                    var center = scope.center ? scope.center.slice() : [0, 0];
                    var map = new google.maps.Map(elem[0], {zoom: scope.zoom || 3, center: new google.maps.LatLng(center[0], center[1])});

                    var greenIcon = new google.maps.MarkerImage("http://mt.google.com/vt/icon?psize=30&font=fonts/arialuni_t.ttf&color=ff304C13&name=icons/spotlight/spotlight-waypoint-a.png&ax=43&ay=48&text=%E2%80%A2&scale=2", null, null, null, new google.maps.Size(22, 40));

                    var marker = new google.maps.Marker({
                        draggable: true,
                        map: map
                    });
                    var allMarkers = [];

                    var infoWindow = new google.maps.InfoWindow({content: ""});

                    var dontwatch = false;

                    function setCenter(coords) {
                        //console.log("SET CENTER", coords);
                        if (coords)
                            center = coords.slice();
                        google.maps.event.trigger(map, 'resize');
                        map.setCenter(new google.maps.LatLng(+center[0], +center[1]));
                        map.setZoom(+center[2]);
                    }

                    scope.$watch(function () { return elem.is(':visible') }, function (visible) {
                        if (visible)
                            setCenter();
                        //console.log("VISIBLE", visible);
                    });

                    scope.$on("refreshGoogleMaps", function () {
                        setTimeout(function () {
                            setCenter();
                            //console.log("REFRESH MAP");
                        });
                    });

                    scope.$watch("defaultCenter", function (coords) {
                        if (coords)
                            setCenter(coords);
                    });
                    scope.$watch("center", function (coords) {
                        if (coords)
                            setCenter(coords);
                    });
                    scope.$watch("marker", function (markerCoord, prev) {
                        //console.log("marker");
                        if (dontwatch) return dontwatch = false;
                        if (markerCoord) {
                            //console.log("MARKER", markerCoord);
                            var coord = new google.maps.LatLng(markerCoord[0], markerCoord[1]);
                            setCenter(markerCoord);
                            setMarker({latLng: coord});
                        }
                        else {
                            if (scope.defaultCenter)
                                setCenter(scope.defaultCenter);
                            marker.setVisible(false);
                        }
                    });
                    scope.$watch("markers", function (markers) {
                        //if (dontwatch) return dontwatch = false;
                        //console.log("Markers", markers && markers.length);
                        if (markers) {
                            allMarkers.forEach(function (marker) {
                                marker.setMap(null);
                            });
                            markers.forEach(function (marker_data) {
                                var marker = new google.maps.Marker({
                                    position: new google.maps.LatLng(marker_data.coords[0], marker_data.coords[1]),
                                    map: map
                                });
                                if (marker_data.green)
                                    marker.setIcon(greenIcon);

                                if (marker_data.content)
                                    google.maps.event.addListener(marker, 'click', function () {
                                        infoWindow.content = marker_data.content;
                                        infoWindow.open(map, marker);
                                    });

                                allMarkers.push(marker);
                            });
                        }
                    });

                    //https://developers.google.com/maps/documentation/javascript/reference
                    //backgroundColor,center,disableDefaultUI,disableDoubleClickZoom,draggable,draggableCursor,draggingCursor,
                    //heading,keyboardShortcuts,mapMaker,mapTypeControl,mapTypeControlOptions,mapTypeId,maxZoom,minZoom,
                    //noClear,overviewMapControl,overviewMapControlOptions,panControl,panControlOptions,
                    //rotateControl,rotateControlOptions,scaleControl,scaleControlOptions,
                    //streetView,streetViewControl,streetViewControlOptions,
                    //styles,tilt,scrollwheel,
                    //zoom,zoomControl,zoomControlOptions
                    scope.$watch("options", function (options) {
                        google.maps.event.trigger(map, 'resize');
                        if (options)
                            map.setOptions(options);
                    });

                    function apply() {
                        if (!scope.$root.$$phase)
                            scope.$apply();
                    }

                    function setMarker(e) {
                        dontwatch = true;
                        //console.log("setMarker", e);
                        marker.setVisible(true);
                        marker.setPosition(e.latLng);
                        scope.marker = [e.latLng.lat(), e.latLng.lng(), map.getZoom()];
                        setTimeout(function () {
                            scope.change(scope.marker, scope.zoom);
                            apply();
                        });
                    }


                    if (scope.mode == "set") {
                        google.maps.event.addListener(map, 'click', function (e) {
                            setMarker(e);
                            if (formInput)
                                formInput.$setViewValue(formInput.$viewValue);
                            apply();
                        });
                        google.maps.event.addListener(marker, 'dragend', function (e) {
                            setMarker(e);
                            if (formInput)
                                formInput.$setViewValue(formInput.$viewValue);
                            apply();
                        });
                        google.maps.event.addListener(map, 'zoom_changed', function (e) {
                            scope.zoom = map.getZoom();
                            //dontwatch = true;
                            //console.log("Zoom", scope.zoom);
                            apply();
                        });
                    }

                    if (scope.mode == 'view') {
                        marker.setDraggable(false);
                    }
                    scope.ready();
                    apply();
                });
            }
        }
    });
})();
$(document).ready(function () {
    loadScript("https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&callback=gmapsInit&gmaps.js");
});
function gmapsInit() {
    window.gmapsReady = true;
}

function drawMaps(opt) {

    function checkGMaps() {
        if (window.gmapsReady) {
            setTimeout(function () {

                if (typeof opt != "object")
                    opt = {};

                opt = $.extend({
                    divID: "map",
                    zoom: config.map.zoom,
                    polygon: config.map.polygon,
                    center: config.map.center,
                    mode: "view",
                    markers: [],
                    ready: function () {},
                    onchange: function () {}
                }, opt);

                var mapDiv = document.getElementById(opt.divID);
                if ($(mapDiv).data("inited"))
                    return;
                $(mapDiv).data("inited", true);


                //console.log("INNER HTML", mapDiv.innerHTML);

                var map = new google.maps.Map(mapDiv, {
                    zoom: opt.zoom,
                    center: new google.maps.LatLng(opt.center[0], opt.center[1])
                });
                setTimeout(function () {
                    google.maps.event.trigger(map, 'resize');
                }, 1000);



                //console.log("WIDTH", mapDiv.clientWidth, mapDiv.clientHeight);


                var infowindow = new google.maps.InfoWindow({
                    content: ""
                });


                if (opt.polygon) {
                    var borderCoords = [];
                    for (var i = 0; i < opt.polygon.length; i++) {
                        var d = opt.polygon[i];
                        borderCoords.push(new google.maps.LatLng(d[0] - 0.0001, d[1] - 0.0001));
                    }

                    // Construct the polygon.
                    var border = new google.maps.Polygon({
                        paths: borderCoords,
                        strokeColor: '#000000',
                        strokeOpacity: 0.8,
                        strokeWeight: 1,
                        fillColor: '#000000',
                        fillOpacity: 0
                    })
                    border.setMap(map);
                }


                if (opt.mode == "set") {
                    google.maps.event.addListener(opt.polygon ? border : map, 'click', function (e) {
                        marker.setPosition(e.latLng);
                        opt.onchange([e.latLng.lat(), e.latLng.lng()], map.getZoom());
                    });
                    var marker = new google.maps.Marker({
                        draggable: true,
                        map: map
                    });
                    google.maps.event.addListener(marker, 'dragend', function (e) {
                        opt.onchange([e.latLng.lat(), e.latLng.lng()], map.getZoom());
                    });
                }


                if (opt.mode == "view") {
                    for (var i = 0; i < opt.markers.length; i++) {
                        var m = opt.markers[i];
                        var icon = "https://mts.googleapis.com/vt/icon/name=icons/spotlight/spotlight-waypoint-b.png&scale=1";
                        var icon_done = "https://mts.googleapis.com/vt/icon/name=icons/spotlight/spotlight-waypoint-a.png&scale=1";
                        var marker = new google.maps.Marker({
                            position: new google.maps.LatLng(m.coords[0], m.coords[1]),
                            icon: m.done ? icon_done : icon,
                            map: map
                        });

                        if (m.showInfo)
                            (function (marker, content) {
                                google.maps.event.addListener(marker, 'click', function () {
                                    infowindow.content = content;
                                    infowindow.open(map, marker);
                                });
                            })(marker, m.content);
                    }

                }

                opt.ready({map: map, border: border, marker: marker, infowindow: infowindow});
            }, 100);
        }
        else
            setTimeout(checkGMaps, 100);
    }

    checkGMaps();
}

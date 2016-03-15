$(document).ready(function () {
    var mapDiv = $('#map');
    var header = $('header');
    var searchDiv = $('#search-div');
    mapDiv.height($(window).height() - header.height() - searchDiv.height());

    $(window).resize(function () {
        mapDiv.height($(window).height() - header.height() - searchDiv.height());
    });

    var map = new ol.Map({
        target: 'map',
        layers: [
            new ol.layer.Tile({
                source: new ol.source.OSM()
            })
        ],
        controls: ol.control.defaults().extend([
            new ol.control.ScaleLine(),
            new ol.control.FullScreen()
        ]),
        view: new ol.View({
            zoom: 6,
            center: ol.proj.transform([-96.794559, 32.774177],'EPSG:4326','EPSG:3857')
        })
    });
});
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
            zoom: 12,
            center: ol.proj.transform([-122.752367, 42.434220],'EPSG:4326','EPSG:3857')
        })
    });

    // ADDING TAXLOTS SOURCE AND LAYER
    var taxlotsSource = new ol.source.TileWMS({
        url: 'http://localhost:8080/geoserver/wms?',
        params: {'LAYERS': 'county' + ':' + 'taxlots', 'TILED': true},
        serverType: 'geoserver'
    });

    var taxlots = new ol.layer.Tile({
        preload: Infinity,
        source: taxlotsSource,
        opacity: 0.4
    });

    map.addLayer(taxlots);

    function viewparamsToStr(obj) {
        var str = '';
        $.each(obj, function (k, v) {
            str.length && (str += ';');
            str += k + ':' + v;
        });
        return str;
    }

    function addressSource( requestString, responseFunc ) {

        // Strip crazy (non-alpha) characters from the input string.
        var querystr = requestString.term.replace(/[^0-9a-zA-Z ]/g, "");

        // If there's nothing left after stripping, just return null.
        if ( querystr.length == 0 ) {
            response([]);
            return;
        }

        // Form the input parameters into a standard viewparams
        // object string.
        var viewParamsStr = viewparamsToStr({
            query: querystr
        });

        // Set up the parameters for our WFS call to the address_autocomplete
        // web service.
        var wfsParams = {
            service: 'WFS',
            version: '2.0.0',
            request: 'GetFeature',
            typeName: 'county:address_autocomplete',
            outputFormat: 'application/json',
            srsname: 'EPSG:3857',
            viewparams: viewParamsStr
        };

        // Call the WFS web service, and call the response on completion
        $.ajax({
            url: 'http://localhost:8080/geoserver/wfs',
            data: wfsParams,
            type: "GET",
            dataType: "json",

            // What to do once the HTTL call is complete?
            success: function(data, status, xhr) {
                console.log(data);
                // Parse the GeoJSON payload into a OL3 feature collection
                var geojson = new ol.source.GeoJSON({
                    object: data
                });
                var arr = [];
                geojson.forEachFeature(function(feat) {
                    arr.push({
                        label: feat.get("address"),
                        value: feat.get("address"),
                        feature: feat
                    });
                });
                console.log(arr);
                // Call-back to the autocomplete widget now that
                // we have data to display.
                responseFunc( arr );
            }

        });

    }

    var flagStyle = new ol.style.Style({
        image: new ol.style.Icon({
            anchor: [0.2, 0.9],
            opacity: 0.75,
            scale: 0.25,
            src: 'flag.png'
        })
    });

    var highlight = new ol.layer.Vector({
        style: new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#00FFFF',
                width: 3
            })
        }),
        source: new ol.source.Vector()
    });

    map.addLayer(highlight);

    function addressSelect( event, ui ) {

        // Zoom to the address point, at a "close enough" zoom
        var view = map.getView();
        var feat = ui.item.feature;
        var geom = feat.getGeometry();
        view.setCenter(geom.getFirstCoordinate());
        view.setZoom(19);

        // Over-ride the old polygon-based highlight style with a
        // point marker style using a flag image as the icon.
        highlight.setStyle(flagStyle);

        // Add a flag marker to the map at the location of the selection
        var markerSource = highlight.getSource();
        markerSource.clear();
        markerSource.addFeature(feat);

    }
//
    $('#address').autocomplete({
        minLength: 1,
        source: addressSource,
        select: addressSelect
    });
});
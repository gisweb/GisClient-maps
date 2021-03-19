//*********************************************************************************************************
//**** Functions for GEOweb - WFM integration
//**** Common functions

window.GCComponents.Functions.centerMap = function (xCoord, yCoord, srid, zoom) {
    var lonLat = new OpenLayers.LonLat(xCoord, yCoord);
    var GCMap = GisClientMap.map;
    var retValue = {result: 'ok'};
    if (srid != GCMap.projection) {
        lonLat.transform(srid, GCMap.projection);
    }
    if(!GCMap.isValidLonLat(lonLat)){
        retValue.result = 'error';
        retValue.message = 'Posizione non valida: X ' +lonLat.lon+', Y '+lonLat.lat+', SRID ' + srid;
        alert(retValue.message);
        return retValue;
    }
    if(!GCMap.getMaxExtent().containsLonLat(lonLat)){
        retValue.result = 'error';
        retValue.message = 'Posizione fuori extent: X ' +lonLat.lon+', Y '+lonLat.lat+', SRID ' + srid;
        alert(retValue.message);
        return retValue;
    }
    GCMap.setCenter(lonLat);
    GCMap.zoomToScale(zoom, true);
    return retValue;
}

window.GCComponents.Functions.centerMapOnFeature = function(layer, whereCond, values) {
    var retValue = {result: 'ok'};
    var fType = GisClientMap.getFeatureType(layer);

    if(!fType) {
        retValue.result = 'error';
        retValue.message = 'Errore: il featureType '+selectedFeatureType+' non esiste';
        return retValue;
    }

    var params = {
        featureType: layer,
        query: whereCond,
        values: values
    };
    params.projectName = GisClientMap.projectName;
    params.mapsetName = GisClientMap.mapsetName;
    params.srid = GisClientMap.map.projection;

    $.ajax({
        url: GISCLIENT_URL + '/services/xMapQuery.php',
        method: 'POST',
        dataType: 'json',
        data: params,
        success: function(response) {
            if(!response || typeof(response) != 'object') {
                retValue.result = 'error';
                retValue.message = 'Errore di sistema';
                return retValue;
            }
            if(!response.length) {
                retValue.result = 'error';
                retValue.message = 'Nessun risultato';
                return retValue;
            }

            var geometries = new OpenLayers.Geometry.Collection(),
                len = response.length, result, i, geometry, feature;

            for(i = 0; i < len; i++) {
                result = response[i];

                geometry = result.gc_geom && OpenLayers.Geometry.fromWKT(result.gc_geom);
                if(!geometry) continue;
                delete result.gc_geom;

                geometries.addComponent(geometry);
            }

            if (geometries.components.length < 1) {
                retValue.result = 'error';
                retValue.message = 'Nessuna geometria nel risultato della ricerca';
                return retValue;
            }

            geometries.calculateBounds();
            GisClientMap.map.zoomToExtent(geometries.bounds);

            return retValue;
        },
        error: function() {
            retValue.result = 'error';
            retValue.message = 'Errore di sistema';
            return retValue;
        }
    });
}

window.GCComponents.Functions.parseQueryString = function() {
    var match,
        pl     = /\+/g,  // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
        query  = window.location.search.substring(1);

    var urlParams = {};
    while (match = search.exec(query))
        urlParams[decode(match[1])] = decode(match[2]);

    return urlParams;
}

window.GCComponents.Functions.updateQueryString = function(updateItems) {
    var queryStringItems = window.GCComponents.Functions.parseQueryString();
    for (var item in updateItems) {
        queryStringItems[item] = updateItems[item];
    };

    if (history.pushState) {
        var newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?';
        for (var item in queryStringItems) {
            newUrl += item + '=' + queryStringItems[item] + '&';
        };
        window.history.pushState({path:newUrl},'',newUrl);
    }
}

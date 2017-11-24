//*********************************************************************************************************
//**** Functions for GEOweb - WFM integration
//**** OSVC integration functions

window.GCComponents.Functions.centerMapWFM = function () {
    var queryStringItems = window.GCComponents.Functions.parseQueryString();
    if (queryStringItems.layer) {
        var fType = GisClientMap.getFeatureType(queryStringItems.layer);
        if (!fType)
            return;

        var values = {};
        var queryString = '';
        for (var i=0; i<fType.properties.length; i++) {
            if (fType.properties[i].searchType == 0)
                continue;
            var fieldName = fType.properties[i].name;
            var valPlaceholder = 'param' + i;
            if (typeof (queryStringItems[fieldName]) != 'undefined') {
                if (queryString.length == 0) {
                    queryString += fieldName + ' = :' + valPlaceholder;
                }
                else {
                    queryString += ' AND ' + fieldName + ' = :' + valPlaceholder;
                }
                values[valPlaceholder] = queryStringItems[fieldName];
            }
        }
        if (queryString.length > 0) {
            queryString = '(' + queryString + ')';
            window.GCComponents.Functions.centerMapOnFeature(queryStringItems.layer, queryString, values);
        }
    }
}

window.GCComponents.Functions.sendToWFM = function(wfmItems) {
    if (wfmItems.x && wfmItems.y && wfmItems.srid) {
        var srid_native = GisClientMap.map.displayProjection?GisClientMap.map.displayProjection:this.map.projection;
        var osvcCoordTag = (wfmItems.srid==srid_native?'osvc-coord':'osvc-coord-'+ wfmItems.srid.substring(wfmItems.srid.indexOf(":")+1));
        var osvcCoord = document.getElementsByTagName(osvcCoordTag);
        if (osvcCoord.length === 1) {
            osvcCoord[0].innerHTML = 'X:' + wfmItems.x + '|Y:' +wfmItems.y;
        }
    }
    else {
        if (!wfmItems.wfm_outitem)
            return;
        var osvcItem = document.getElementsByTagName(wfmItems.wfm_outitem);
        var tagContent = '';
        if (osvcItem.length === 1) {
            for (var field in wfmItems) {
                if (field !== 'wfm_outitem') {
                    var fieldVal = (typeof(wfmItems[field]) === 'undefined' || wfmItems[field] === null)?'':wfmItems[field];
                    tagContent += field + ':' + fieldVal + '|';
                }
            }
            osvcItem[0].innerHTML = tagContent.substring(0, tagContent.length -1);
        }
    }
}

window.GCComponents.Functions.resetWFMData = function(){
    var osvcTag = document.getElementsByTagName('osvc-coord');
    if (osvcTag.length === 1)
        osvcTag[0].innerHTML = '';
    if (typeof(WFM_SRID) !== 'undefined') {
        var osvcSrid = WFM_SRID;
        osvcSrid = 'osvc-coord-'+ osvcSrid.substring(osvcSrid.indexOf(":")+1);
        osvcTag = document.getElementsByTagName(osvcSrid);
        if (osvcTag.length === 1)
            osvcTag[0].innerHTML = '';
    }
    for (var j=0; j<WFM_LAYERS.length; j++) {
        if (typeof(WFM_LAYERS[j].outitem) !== 'undefined') {
            osvcTag = document.getElementsByTagName(WFM_LAYERS[j].outitem);
            if (osvcTag.length === 1)
                osvcTag[0].innerHTML = '';
        }
    }

}

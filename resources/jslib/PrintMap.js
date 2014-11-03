//TODO:
// - tradurre il codice per evitare l'uso di jquery
// - passare l'url dell'author da configurazione o simili

$(document).ready(function() {
    $('#printpanel').on('click', 'button[role="print"]', function() {
        var params = getParams();
        
        var loadingControl = GisClientMap.map.getControlsByClass('OpenLayers.Control.LoadingPanel')[0];
        loadingControl.maximizeControl();
        
        $('#printpanel a[role="pdf"], #printpanel a[role="html"]').attr('href', '#');
        $('#printpanel span[role="icon"]').removeClass('glyphicon-white').addClass('glyphicon-disabled');
        
        $.ajax({
            url: '/gisclient/services/print.php',
            type: 'POST',
            data: params,
            dataType: 'json',
            success: function(response) {
                if(typeof(response.result) != 'undefined' && response.result == 'ok') {
                    //$('#printpanel div.loading').hide();
                    
                    if(response.format == 'HTML') {
                        $('#printpanel a[role="html"]').attr('href', response.file);
                        $('#printpanel a[role="html"] span[role="icon"]').removeClass('glyphicon-disabled').addClass('glyphicon-white');
                    } else if(response.format == 'PDF') {
                        $('#printpanel a[role="pdf"]').attr('href', response.file);
                        $('#printpanel a[role="pdf"] span[role="icon"]').removeClass('glyphicon-disabled').addClass('glyphicon-white');
                    }
                    
                } else alert(OpenLayers.i18n('Error'));
                
                loadingControl.minimizeControl();
            },
            error: function() {
                alert(OpenLayers.i18n('Error'));
                loadingControl.minimizeControl();
            }
        });
    });
});
            
            
function getConfigParams() {
    var size  = GisClientMap.map.getCurrentSize();
    var bounds = GisClientMap.map.calculateBounds();
    var topLeft = new OpenLayers.Geometry.Point(bounds.top, bounds.left);
    var topRight = new OpenLayers.Geometry.Point(bounds.top, bounds.right);
    var distance = topLeft.distanceTo(topRight);
    var pixelsDistance  = size.w / distance;
    var scaleMode = $('#printpanel input[name="scale_mode"]:checked').val();
    var scale = $('#printpanel input[name="scale"]').val();
    var currentScale = GisClientMap.map.getScale();
    if(scaleMode == 'user') {
        pixelsDistance = pixelsDistance / (scale/currentScale);
    }
    
    var center = GisClientMap.map.getCenter();
    
    
    var copyrightString = null;
    var searchControl = GisClientMap.map.getControlsByClass('OpenLayers.Control.Attribution');
    if(searchControl.length > 0) {
        copyrightString = searchControl[0].div.innerText;
    }
    
    var srid = GisClientMap.map.getProjection();
    if(srid == 'ESPG:900913') srid = 'EPSG:3857';
    
    var params = {
        viewport_size: [size.w, size.h],
        center: [center.lon, center.lat],
        format: $('#printpanel input[name="format"]:checked').val(),
        printFormat: $('#printpanel select[name="formato"]').val(),
        direction: $('#printpanel input[name="direction"]:checked').val(),
        scale_mode: scaleMode,
        scale: scale,
        current_scale: currentScale,
        text: $('#printpanel textarea[name="text"]').val(),
        extent: GisClientMap.map.calculateBounds().toBBOX(),
        date: $('#printpanel input[name="date"]').val(),
        dpi: $('#print_panel_resolution').val(),
        srid: srid,
        pixels_distance: pixelsDistance,
        copyrightString: copyrightString
    };
    return params;
    
};
function getParams() {
    var self = this;
    
    $('#printpanel div.results').hide();
    $('#printpanel div.loading').show();
    $('#printpanel div.settings').hide();
    
    var params = getConfigParams();
    
    var tiles = [];
    
    $.each(GisClientMap.map.layers, function(key, layer) {
        if (!layer.getVisibility()) return;
        //if (!layer.calculateInRange()) return;
        var tile;
        if(layer.CLASS_NAME == 'OpenLayers.Layer.TMS') {
            tile = {
                url: layer.url.replace('/tms/', '/wms/'),
                parameters: {
                    service: 'WMS',
                    request: 'GetMap',
                    project: gisclient.getProject(),
                    map: gisclient.getMapOptions().mapsetName,
                    layers: [layer.layername.substr(0, layer.layername.indexOf('@'))],
                    version: '1.1.1',
                    format: 'image/png'
                },
                type: 'WMS',
                opacity: layer.opacity ? (layer.opacity * 100) : 100
            };
        } else if(layer.CLASS_NAME == 'OpenLayers.Layer.WMS') {
            tile = {
                url: layer.url,
                type: 'WMS',
                parameters: layer.params,
                opacity: layer.opacity ? (layer.opacity * 100) : 100
            };
        } else if(layer.CLASS_NAME == 'OpenLayers.Layer.WMTS') {
            var params = {
                LAYERS: [layer.name],
                FORMAT: 'image/png',
                SRS: layer.projection.projCode,
                TRANSPARENT: true,
                SERVICE: 'WMS',
                VERSION: '1.1.1'
            };
            tile = {
                url: GisClientMap.mapProxyBaseUrl+'/'+GisClientMap.mapsetName+'/service?',
                type: 'WMS',
                parameters: params,
                opacity: layer.opacity ? (layer.opacity * 100) : 100
            };
        } else if(layer.CLASS_NAME == 'OpenLayers.Layer.OSM' ||
            layer.CLASS_NAME == 'OpenLayers.Layer.Google') {

            tile = {
                type: 'external_provider',
                externalProvider: layer.CLASS_NAME.replace('OpenLayers.Layer.', ''),
                name: layer.name,
                project: GisClientMap.projectName,
                map: GisClientMap.mapsetName
            };
        } else console.log(layer.name+' '+layer.CLASS_NAME+' non riconosciuto per stampa');
        if(tile) {
            if(layer.options.theme_id) {
                tile.options = {
                    theme_id: layer.options.theme_id,
                    theme_title: layer.options.theme_title || ''
                };
            }
            tiles.push(tile);
        }
    });

    if($('#printpanel input[name="legend"]:checked').val() == 'yes') {
        params.legend = 'yes';
        
    }
    tiles.reverse();
    params.tiles = tiles;


    return params;
    
};

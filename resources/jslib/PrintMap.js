//TODO:
// - tradurre il codice per evitare l'uso di jquery
// - passare l'url dell'author da configurazione o simili

$(document).ready(function() {
    $('#printpanel').on('click', 'button[role="print"]', function() {
        var params = getParams();
        
        var loadingControl = GisClientMap.map.getControlsByClass('OpenLayers.Control.LoadingPanel')[0];
        loadingControl.maximizeControl();
        
        $.ajax({
            url: '/gisclient/services/print.php',
            type: 'POST',
            data: params,
            dataType: 'json',
            success: function(response) {
                if(typeof(response.result) != 'undefined' && response.result == 'ok') {
                    $('#printpanel div.loading').hide();
                    var link = '<a href="'+response.file+'" target="_blank" rel="file">';
                    if(response.format == 'HTML') {
                        link += 'Visualizza stampa';
                    } else if(response.format == 'PDF') {
                        link += 'Scarica stampa';
                    } else if(response.format == 'geotiff') {
                        link += 'Scarica immagine';
                    }
                    link += '</a>';
                    $('#printpanel div.results span[name="result"]').html(link);
                    $('#printpanel div.results').show();
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
        srid: GisClientMap.map.getProjection(),
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
                opacity: layer.opacity ? (layer.opacity * 100) : 100
            };
        } else if(layer.CLASS_NAME == 'OpenLayers.Layer.WMS') {
            tile = {
                url: layer.url,
                parameters: layer.params,
                opacity: layer.opacity ? (layer.opacity * 100) : 100
            };
        }
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
    
    params.tiles = tiles;


    return params;
    
};

OpenLayers.Control.PrintMap = OpenLayers.Class(OpenLayers.Control.Button, {
    //type: OpenLayers.Control.TYPE_TOGGLE,
    formId: undefined, //id del form di stampa
    loadingControl: undefined,
    baseUrl:null,
    waitFor: undefined, //se il pannello viene caricato async, il tool aspetta il caricamento prima di far partire la richiesta per il box
    //passare l'url del servizio stampa per non doverlo cablare!
    
    initialize: function(options) {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
    },
    
    doPrint: function() {
        var me = this;
        var params = me.getParams();
        
        if(me.loadingControl) me.loadingControl.maximizeControl();
        
        $('#'+me.formId+' a[role="pdf"], #printpanel a[role="html"]').attr('href', '#');
        $('#'+me.formId+' span[role="icon"]').removeClass('glyphicon-white').addClass('glyphicon-disabled');
        
        $.ajax({
            url: me.baseUrl + '/services/print.php',
            type: 'POST',
            data: params,
            dataType: 'json',
            success: function(response) {
                if(typeof(response.result) != 'undefined' && response.result == 'ok') {
                    //$('#'+this.formId+' div.loading').hide();
                    
                    if(response.format == 'HTML') {
                        $('#'+me.formId+' a[role="html"]').attr('href', response.file);
                        $('#'+me.formId+' a[role="html"] span[role="icon"]').removeClass('glyphicon-disabled').addClass('glyphicon-white');
                    } else if(response.format == 'PDF') {
                        $('#'+me.formId+' a[role="pdf"]').attr('href', response.file);
                        $('#'+me.formId+' a[role="pdf"] span[role="icon"]').removeClass('glyphicon-disabled').addClass('glyphicon-white');
                    }
                    
                } else alert(OpenLayers.i18n('Error'));
                
                if(me.loadingControl) me.loadingControl.minimizeControl();
            },
            error: function() {
                alert(OpenLayers.i18n('Error'));
                if(me.loadingControl) me.loadingControl.minimizeControl();
            }
        });
    },
    
    setMap: function(map) {
        var me = this;

        OpenLayers.Control.prototype.setMap.apply(me, arguments);
        
        if(!me.loadingControl) {
            var query = me.map.getControlsByClass('OpenLayers.Control.LoadingPanel');
            if(query.length) me.loadingControl = query[0];
        }

        $('#'+me.formId).on('click', 'button[role="print"]', function(event) {
            event.preventDefault();
            
            me.doPrint();
        });
        
        var boxHtml = '<div id="print_box" style="border:1px solid red;position:absolute;top:0px;left:0px;z-index:1000;cursor:move;display:none;"><div style="background:silver;opacity:0.1;width:100%;height:100%;filter:alpha(opacity=10);">&nbsp;</div></div>';
        $(me.map.div).append(boxHtml);
        //$('#print_box').draggable({containment: 'parent'}).bind('stop',{me:me},me.boxMoved);
        $('#print_box').draggable({
            containment: 'parent',
            onStopDrag: function() {
                me.boxMoved();
            }
        });
        
        var waitForEvent = 'activate';
        if(me.waitFor) waitForEvent = me.waitFor;

        me.events.register(waitForEvent, me, me.onToolReady);
        me.events.register('deactivate', me, me.removePrintArea);
        
        me.map.events.register('moveend', me, me.boxMoved);
    },
    
    getConfigParams: function() {
        var size  = this.map.getCurrentSize();
        var bounds = this.map.calculateBounds();
        var topLeft = new OpenLayers.Geometry.Point(bounds.top, bounds.left);
        var topRight = new OpenLayers.Geometry.Point(bounds.top, bounds.right);
        var distance = topLeft.distanceTo(topRight);
        var pixelsDistance  = size.w / distance;
        var scaleMode = $('#'+this.formId+' input[name="scale_mode"]:checked').val();
        var scale = $('#'+this.formId+' input[name="scale"]').val();
        var currentScale = this.map.getScale();
        if(scaleMode == 'user') {
            pixelsDistance = pixelsDistance / (scale/currentScale);
        }
        
        if(this.printBox) {
            var boxBounds = new OpenLayers.Bounds.fromArray(this.printBox);
            var center = boxBounds.getCenterLonLat();
        } else {
            var center = this.map.getCenter();
        }
        
        
        var copyrightString = null;
        var searchControl = this.map.getControlsByClass('OpenLayers.Control.Attribution');
        if(searchControl.length > 0) {
            copyrightString = searchControl[0].div.innerText;
        }
        
        var srid = this.map.getProjection();
        if(srid == 'ESPG:900913') srid = 'EPSG:3857';
        
        var params = {
            viewport_size: [size.w, size.h],
            center: [center.lon, center.lat],
            format: $('#'+this.formId+' input[name="format"]:checked').val(),
            printFormat: $('#'+this.formId+' select[name="formato"]').val(),
            direction: $('#'+this.formId+' input[name="direction"]:checked').val(),
            scale_mode: scaleMode,
            scale: scale,
            current_scale: currentScale,
            text: $('#'+this.formId+' textarea[name="text"]').val(),
            extent: this.map.calculateBounds().toBBOX(),
            date: $('#'+this.formId+' input[name="date"]').val(),
            dpi: $('#'+this.formId+' select[name="print_resolution"]').val(),
            srid: srid,
            map: this.map.config.mapsetName,
            pixels_distance: pixelsDistance,
            copyrightString: copyrightString
        };
        return params;
        
    },
    getParams: function() {
        var self = this;
        
        var params = this.getConfigParams();
        
        var tiles = [];
        
        $.each(this.map.layers, function(key, layer) {
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
                    url: GisClientMap.mapProxyBaseUrl+'/'+ GisClientMap.projectName +'/' + GisClientMap.mapsetName+'/service?',
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

        if($('#'+this.formId+' input[name="legend"]:checked').val() == 'yes') {
            params.legend = 'yes';
            
        }
        tiles.reverse();
        params.tiles = tiles;


        return params;
    },
    
    onToolReady: function() {
        var me = this,
            scale = Math.round(me.map.getScale()),
            userScale = $('#'+me.formId+' input[name="scale"]').val();

        if(!userScale) {
            $('#'+me.formId+' input[name="scale"]').val(scale)
        }
        
        var selectorsToControl = ['input[name="scale_mode"]', 'input[name="scale_mode"]', 'direction', 'formato'];
        
        $('#'+me.formId+' input[name="scale_mode"]').change(function() {
            me.drawPrintArea();
        });
        $('#'+me.formId+' input[name="scale"]').change(function() {
            me.drawPrintArea();
        });
        $('#'+me.formId+' input[name="direction"]').change(function() {
            me.drawPrintArea();
        });
        $('#'+me.formId+' select[name="formato"]').change(function() {
            me.drawPrintArea();
        });
        
        me.drawPrintArea();
    },
    
    drawPrintArea: function() {
        var me = this;
        var params = me.getConfigParams();
        params.request_type = 'get-box';
        
        $.ajax({
            url: me.baseUrl + '/services/print.php',
            type: 'POST',
            dataType: 'json',
            data: params,
            success: function(response) {
                if(typeof(response) != 'object' || response == null || typeof(response.result) != 'string' || response.result != 'ok' || typeof(response.box) != 'object') {
                    return alert(OpenLayers.i18n('System error'));
                }
                me.printBox = response.box;
                
                me.updateBox();
                
                $('#print_box').show();
                
            },
            error: function() {
                return alert(OpenLayers.i18n('System error'));
            }
        });
    },
    
    updateBox: function() {
        var me = this;
        
        var bounds = me.map.getExtent();
        var refSize = me.map.getCurrentSize();

        var lb = me.map.getViewPortPxFromLonLat(new OpenLayers.LonLat(me.printBox[0], me.printBox[1]));
        var rt = me.map.getViewPortPxFromLonLat(new OpenLayers.LonLat(me.printBox[2], me.printBox[3]));

        var left = (lb.x>0) ? lb.x : 0;
        var top = (rt.y>0) ? rt.y : 0;
        var width = ((rt.x-lb.x)<refSize.w) ? (rt.x-lb.x) : refSize.w;
        var height = ((lb.y-rt.y)<refSize.h) ? (lb.y-rt.y) : refSize.h;
        if((left+width)>refSize.w) width = refSize.w-left;
        if((top+height)>refSize.h) height = refSize.h-top;
        $('#print_box').css({
            'left':left,
            'top':top,
            'width':width,
            'height':height
        });
    },
    
    boxMoved: function(event) {
        var pos = $('#print_box').position();
        // get the left-boom and right-top LonLat, given the rectangle position
        var lb = this.map.getLonLatFromPixel(new OpenLayers.Pixel(pos.left, (pos.top+$('#print_box').height())));
        var rt = this.map.getLonLatFromPixel(new OpenLayers.Pixel((pos.left+$('#print_box').width()), pos.top));
        // update the map viewport with the bounds calculated above
        this.printBox = [lb.lon, lb.lat, rt.lon, rt.lat];
    },
    
    removePrintarea: function() {
        $('#print_box').hide();
    }
});




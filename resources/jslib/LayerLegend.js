OpenLayers.Control.LayerLegend = OpenLayers.Class(OpenLayers.Control, {
    autoLoad: true,
    loaded: false,
    
    initialize: function(options) {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
    },

    destroy: function() {
        this.map.events.unregister("changelayer", this, this.layerChanged);
        OpenLayers.Control.prototype.destroy.apply(this, arguments);
    },
    
    setMap: function(map) {
        OpenLayers.Control.prototype.setMap.apply(this, arguments);
        
        if(this.autoLoad) {
            this.load();
        }

    },
    
    load: function() {
        var len = this.map.layers.length, i, layer, j,
            params, legendUrls, paramsString, legendNodes = [], node, nodeHtml;
        
        for(i = 0; i < len; i++) {
            layer = this.map.layers[i];
            
            legendUrls = this.getLegendUrls(layer);
            
            if(!legendUrls || !legendUrls.length) continue;
            
            node = document.createElement('div');
            node.setAttribute('id', 'legend_'+layer.id);
            node.style.display = (this.layerIsVisible(layer) ? 'block' : 'none');
            nodeHtml = '<p>'+layer.title+'</p>';
            for(j = 0; j < legendUrls.length; j++) {
                var itemID = 'legend_'+layer.id+'_url_'+j;
                this.checkImgSize(legendUrls[j], itemID);
                nodeHtml += '<div id='+itemID+'><img src="'+legendUrls[j]+'"><br></div>';
            }
            node.innerHTML = nodeHtml + '<br>';
            
            legendNodes.push(node);
        }
        
        var len = legendNodes.length;
        for(i = 0; i < len; i++) {
            this.div.appendChild(legendNodes[i]);
        }

        this.map.events.register("changelayer", this, this.layerChanged);
        
        this.loaded = true;
    },
    
    getLegendUrls: function(layer) {
        var params = {}, 
            legendUrls = [];
        
        switch(layer.CLASS_NAME) {
            case 'OpenLayers.Layer.WMS':
                var layers;
                if(layer.params.LAYERS instanceof Array) {
                    layers = layer.params.LAYERS.slice(0);
                } else {
                    layers = [layer.params.LAYERS];
                }
                var len = layers.length, i, layerName;

                for(i = 0; i < len; i++) {
                    layerName = layers[i];
                    params = {};
                        
                    OpenLayers.Util.extend(params, layer.params);
                    OpenLayers.Util.extend(params, {
                        REQUEST: 'GetLegendGraphic',
                        LAYER: layerName,
                        WIDTH: 500
                    });
                    delete params.LAYERS;
                    
                    paramsString = OpenLayers.Util.getParameterString(params);
                    legendUrls.push(OpenLayers.Util.urlAppend(layer.url, paramsString));
                }
            break;
            case 'OpenLayers.Layer.WMTS':
                if(layer.owsurl) {
                    params = {
                        REQUEST: 'GetLegendGraphic',
                        LAYER: layer.name,
                        FORMAT: 'image/png',
                        SERVICE: 'WMS',
                        VERSION: '1.1.1'
                    };
                    
                    paramsString = OpenLayers.Util.getParameterString(params);
                    legendUrls.push(OpenLayers.Util.urlAppend(layer.owsurl, paramsString));
                }
            break;
            default:
                //console.log('legend not implemented for '+layer.CLASS_NAME + ' ('+layer.name+')');
            break;
        }
        
        return legendUrls;
    },
    
    layerChanged: function(event) {
        if(event.property != 'visibility') return;
        
        var element = document.getElementById('legend_'+event.layer.id);
        if(element) {
            element.style.display = (this.layerIsVisible(event.layer) ? 'block' : 'none');
        }
    },
    
    layerIsVisible: function(layer) {
        var visible = false;
        
        if(layer.getVisibility()) {
            visible = true;
        } else {
            if(GisClientMap.mapsetTiles && GisClientMap.mapsetTileLayer.getVisibility()) {
                var mapsetTileLayer = true;
                if(GisClientMap.default_layers.indexOf(layer.name) > -1) {
                    visible = true;
                }
            }
        }
        return visible;
    },
    
    // **** Remove elements with empty legend
    checkImgSize: function(imgUrl, itemID) {
        var img = new Image();
        img.src = imgUrl;
        img.itemID = itemID;
        img.onload = function() {
            if (this.height <=1) {
                var item = document.getElementById(this.itemID);
                if (item) {
                    var parentDiv = item.parentNode;
                    item.remove();
                    if (parentDiv.getElementsByTagName('div').length == 0)
                        parentDiv.remove();
                }
            }
        }

    }

    
    
});
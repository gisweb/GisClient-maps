OpenLayers.Control.LayerLegend = OpenLayers.Class(OpenLayers.Control, {
    
    initialize: function(options) {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
    },

    destroy: function() {
        this.map.events.unregister("changelayer", this, this.layerChanged);
        OpenLayers.Control.prototype.destroy.apply(this, arguments);
    },
    
    setMap: function(map) {
        OpenLayers.Control.prototype.setMap.apply(this, arguments);
        
        var len = this.map.layers.length, i, layer, j,
            params, legendUrls, paramsString, legendNodes = [], node, nodeHtml;
        
        for(i = 0; i < len; i++) {
            layer = this.map.layers[i];
            legendUrls = this.getLegendUrls(layer);
            
            if(!legendUrls || !legendUrls.length) continue;
            
            node = document.createElement('div');
            node.setAttribute('id', 'legend_'+layer.id);
            node.style.display = (layer.getVisibility() ? 'block' : 'none');
            nodeHtml = '<p>'+layer.title+'</p>';
            for(j = 0; j < legendUrls.length; j++) {
                nodeHtml += '<img src="'+legendUrls[j]+'"><br>';
            }
            node.innerHTML = nodeHtml;
            
            legendNodes.push(node);
        }
        
        var len = legendNodes.length;
        for(i = 0; i < len; i++) {
            this.div.appendChild(legendNodes[i]);
        }

        this.map.events.register("changelayer", this, this.layerChanged);

    },
    
    getLegendUrls: function(layer) {
        var params = {}, 
            legendUrls = [];
        
        switch(layer.CLASS_NAME) {
            case 'OpenLayers.Layer.WMS':
                var len = layer.params.LAYERS.length, i, layerName;
                
                for(i = 0; i < len; i++) {
                    layerName = layer.params.LAYERS[i];
                    params = {};
                        
                    OpenLayers.Util.extend(params, layer.params);
                    OpenLayers.Util.extend(params, {
                        REQUEST: 'GetLegendGraphic',
                        LAYER: layerName
                    });
                    delete params.LAYERS;
                    
                    paramsString = OpenLayers.Util.getParameterString(params);
                    legendUrls.push(OpenLayers.Util.urlAppend(layer.url, paramsString));
                }
            break;
            case 'OpenLayers.Layer.WMTS':
                params = {
                    REQUEST: 'GetLegendGraphic',
                    LAYER: layer.name,
                    FORMAT: 'image/png',
                    SERVICE: 'WMS',
                    VERSION: '1.1.1'
                };
                
                paramsString = OpenLayers.Util.getParameterString(params);
                legendUrls.push(OpenLayers.Util.urlAppend(layer.owsurl, paramsString));
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
            element.style.display = (event.layer.getVisibility() ? 'block' : 'none');
        }
    }
    
});
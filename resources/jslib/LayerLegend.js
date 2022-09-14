OpenLayers.Control.LayerLegend = OpenLayers.Class(OpenLayers.Control, {
    autoLoad: true,
    loaded: false,
    currentZoom: 0,

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
        // **** Insert layers in configuration order, not in Openlayers Map order!
        var len = this.map.config.layers.length, i, layer, mapLayers, j, k,
            params, legendUrls, paramsString, legendNodes = [], node, nodeHtml;

        for(i = 0; i < len; i++) {
            mapLayers = this.map.getLayersByName(this.map.config.layers[i].name);
            for (k = 0; k< mapLayers.length; k++) {
                layer = mapLayers[k];
                legendUrls = this.getLegendUrls(layer);

                if(!legendUrls)
                    continue;

                var elementThemeC = document.getElementById('legend_theme_container_'+layer.options.theme_id);
                var elementTheme = document.getElementById('legend_theme_'+layer.options.theme_id);

                if (!elementTheme) {
                    elementTheme = document.createElement('div');
                    elementTheme.setAttribute('id', 'legend_theme_'+layer.options.theme_id);
                    elementTheme.innerHTML = '<span icon-before="\ue114">' + layer.options.theme + '</span>';
                    elementTheme.addEventListener('click', function (event) {
                        event.stopPropagation();
                        var toggleSpan = this.getElementsByTagName('span')[0];
                        var toggleDiv = this.getElementsByTagName('div')[0];
                        if (toggleDiv.style.display == 'block') {
                            toggleDiv.style.display = 'none';
                            toggleSpan.setAttribute('icon-before', '\ue080');
                        }
                        else {
                            toggleDiv.style.display = 'block';
                            toggleSpan.setAttribute('icon-before', '\ue114');
                        }
                    });
                    this.div.appendChild(elementTheme);
                    elementThemeC = document.createElement('div');
                    elementThemeC.style.display = 'block';
                    elementThemeC.setAttribute('id', 'legend_theme_container_'+layer.options.theme_id);
                    elementThemeC.classList.add('legend-container-0');
                    elementTheme.appendChild(elementThemeC);
                }

                if (layer.options.theme_id == layer.name) { // **** Theme in single layer
                    elementTheme.setAttribute('oLayer', layer.id);
                    if (this.layerIsVisible(layer)) elementTheme.classList.add('legend-node-visible');
                    if(typeof(layer.nodes)!='undefined') {
                        for (var n=0; n<layer.nodes.length; n++){
                            var lNode = layer.nodes[n];
                            var node1 = document.createElement('div');
                            node1.setAttribute('id', 'legend_layer_'+lNode.layer);
                            node1.setAttribute('oLayerNode', layer.id);
                            node1.setAttribute('legendParent', 'legend_theme_'+layer.options.theme_id);
                            if (lNode.hasOwnProperty('minScale')) {
                                node1.setAttribute('minScale', lNode.minScale);
                            }
                            if (lNode.hasOwnProperty('maxScale')) {
                                node1.setAttribute('maxScale', lNode.maxScale);
                            }
                            node1.innerHTML = '<span icon-before="\ue114">' + lNode.title + '</span>';
                            elementThemeC.appendChild(node1);
                            if(typeof(lNode.nodes)!='undefined') {
                                node1.addEventListener('click', function (event) {
                                    event.stopPropagation();
                                    var toggleSpan = this.getElementsByTagName('span')[0];
                                    var toggleDiv = this.getElementsByTagName('div')[0];
                                    if (toggleDiv.style.display == 'block') {
                                        toggleDiv.style.display = 'none';
                                        toggleSpan.setAttribute('icon-before', '\ue080');
                                    }
                                    else {
                                        toggleDiv.style.display = 'block';
                                        toggleSpan.setAttribute('icon-before', '\ue114');
                                    }
                                });
                                var node1C = document.createElement('div');
                                node1C.style.display = 'block';
                                node1C.setAttribute('id', 'legend_layer_container_'+lNode.layer);
                                node1C.classList.add('legend-container-1');
                                node1.appendChild(node1C);
                                for (var m=0; m<lNode.nodes.length; m++){
                                    var node2 = document.createElement('div');
                                    node2.setAttribute('id', 'legend_layer_'+lNode.nodes[m].layer);
                                    node2.setAttribute('oLayerNode', layer.id);
                                    node2.setAttribute('legendParent', 'legend_layer_'+lNode.layer);
                                    if (lNode.nodes[m].hasOwnProperty('minScale')) {
                                        node2.setAttribute('minScale', lNode.nodes[m].minScale);
                                    }
                                    if (lNode.nodes[m].hasOwnProperty('maxScale')) {
                                        node2.setAttribute('maxScale', lNode.nodes[m].maxScale);
                                    }
                                    node1C.appendChild(node2);
                                }
                            }
                        }
                    }

                }
                else { // **** Layergroup as OpenLayers layer
                    var elementLayerGroup = document.createElement('div');
                    if(this.layerIsVisible(layer)) {
                        elementLayerGroup.classList.add('legend-node-visible');
                    }
                    elementLayerGroup.setAttribute('id', 'legend_layer_'+layer.name);
                    elementLayerGroup.setAttribute('oLayer', layer.id);
                    elementLayerGroup.setAttribute('legendParent', 'legend_theme_'+layer.options.theme_id);
                    elementLayerGroup.innerHTML = '<span icon-before="\ue114">' + layer.title + '</span>';
                    elementThemeC.appendChild(elementLayerGroup);
                    if(typeof(layer.nodes)!='undefined') {
                        elementLayerGroup.addEventListener('click', function (event) {
                            event.stopPropagation();
                            var toggleSpan = this.getElementsByTagName('span')[0];
                            var toggleDiv = this.getElementsByTagName('div')[0];
                            if (toggleDiv.style.display == 'block') {
                                toggleDiv.style.display = 'none';
                                toggleSpan.setAttribute('icon-before', '\ue080');
                            }
                            else {
                                toggleDiv.style.display = 'block';
                                toggleSpan.setAttribute('icon-before', '\ue114');
                            }
                        });
                        var elementLayerGroupC = document.createElement('div');
                        elementLayerGroupC.style.display = 'block';
                        elementLayerGroupC.setAttribute('id', 'legend_layer_container_'+layer.name);
                        elementLayerGroupC.classList.add('legend-container-1');
                        elementLayerGroup.appendChild(elementLayerGroupC);
                        for (var m=0; m<layer.nodes.length; m++){
                            var node1 = document.createElement('div');
                            node1.setAttribute('id', 'legend_layer_'+layer.nodes[m].layer);
                            node1.setAttribute('oLayerNode', layer.id);
                            node1.setAttribute('legendParent', 'legend_layer_'+layer.name);
                            if (layer.nodes[m].hasOwnProperty('minScale')) {
                                node1.setAttribute('minScale', layer.nodes[m].minScale);
                            }
                            if (layer.nodes[m].hasOwnProperty('maxScale')) {
                                node1.setAttribute('maxScale', layer.nodes[m].maxScale);
                            }
                            elementLayerGroupC.appendChild(node1);
                        }
                    }
                }

                if (this.layerIsVisible(layer))
                    this.changeLegendNodeVisibility(legendUrls);
            }
        }

        this.currentZoom = this.map.getZoom();
        this.map.events.register("changelayer", this, this.layerChanged);

        this.loaded = true;
    },

    changeLegendNodeVisibility: function (legendUrls) {
        var visibleNodesCount = 0;
        for(var j = 0; j < legendUrls.length; j++) {
            var layerID = legendUrls[j].name;
            var layerUrl = legendUrls[j].url;
            var scale = this.map.getScale();
            var elementNode = document.getElementById('legend_layer_'+layerID);
            if (elementNode) {
                if(elementNode.getElementsByTagName('img').length == 0 && elementNode.getElementsByTagName('div').length == 0) {
                    var elementImg = document.createElement("img");
                    elementImg.src = layerUrl;
                    this.checkImgSize(layerUrl, 'legend_layer_'+layerID, true);
                    elementNode.appendChild(elementImg);
                }
                var minScale = elementNode.hasAttribute('minScale')?elementNode.getAttribute('minScale'):null;
                var maxScale = elementNode.hasAttribute('maxScale')?elementNode.getAttribute('maxScale'):null;
                if ((!maxScale || maxScale <= scale) && (!minScale || minScale >= scale)) {
                    elementNode.classList.add('legend-node-visible');
                }
                else {
                    elementNode.classList.remove('legend-node-visible');
                }
                this.changeLayerParentVisibility(elementNode);
            }
        }
    },

    changeLayerParentVisibility: function(element) {
        if (!element.hasAttribute('legendParent'))
            return;
        var legendParent = element.getAttribute('legendParent');
        var parentElem = document.getElementById(legendParent);
        if (document.querySelectorAll("div.legend-node-visible[legendParent="+legendParent+"]").length > 0){
            parentElem.classList.add('legend-node-visible');
        }
        else {
            parentElem.classList.remove('legend-node-visible');
        }
        if (parentElem.hasAttribute('legendParent')) {
            this.changeLayerParentVisibility(parentElem);
        }
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
                if (layers.length == 0) {
                    var tileLayer = GisClientMap.map.getLayersByName(layer.name + '_tiles') && GisClientMap.map.getLayersByName(layer.name + '_tiles')[0];
                    if (tileLayer) {
                        if(tileLayer.getVisibility() && tileLayer.calculateInRange()) {
                            layers = tileLayer.params.LAYERS.slice(0);
                        }
                    }
                }
                var len = layers.length, i, layerName;

                for(i = len-1; i >=0; i--) {
                    layerName = layers[i];
                    params = {};
                    if (layer.map.config.hasOwnProperty('legendCacheUrl')) {
                        var cacheUrl = layer.map.config.legendCacheUrl;
                        cacheUrl += '/' + layer.params.PROJECT + '/';
                        if (layer.params.hasOwnProperty('TMP')) {
                            cacheUrl += 'tmp.';
                        }
                        cacheUrl += layer.params.MAP + '/' + layerName + '.png';
                        legendUrls.push({name:layerName,url:cacheUrl});
                    }
                    else {
                        OpenLayers.Util.extend(params, layer.params);
                        OpenLayers.Util.extend(params, {
                            REQUEST: 'GetLegendGraphic',
                            LAYER: layerName,
                            WIDTH: 500
                        });
                        delete params.LAYERS;

                        var paramsString = OpenLayers.Util.getParameterString(params);
                        var urlString = OpenLayers.Util.urlAppend(layer.url, paramsString);
                        legendUrls.push({name:layerName,url:urlString});
                    }
                }
            break;
            case 'OpenLayers.Layer.WMTS':
                if (layer.map.config.hasOwnProperty('legendCacheUrl')) {
                    var cacheUrl = layer.map.config.legendCacheUrl;
                    cacheUrl += '/' + layer.params.PROJECT + '/';
                    if (layer.params.hasOwnProperty('TMP')) {
                        cacheUrl += 'tmp.';
                    }
                    cacheUrl += layer.params.MAP + '/' + layerName + '.png';
                    legendUrls.push({name:layerName,url:cacheUrl});
                }
                else if(layer.owsurl) {
                    params = {
                        REQUEST: 'GetLegendGraphic',
                        LAYER: layer.name,
                        FORMAT: 'image/png',
                        SERVICE: 'WMS',
                        VERSION: '1.1.1'
                    };

                    var paramsString = OpenLayers.Util.getParameterString(params);
                    var urlString = OpenLayers.Util.urlAppend(layer.url, paramsString);
                    legendUrls.push({name:layerName,url:urlString});
                }
            break;
            default:
                legendUrls = null;
            break;
        }

        return legendUrls;
    },

    zoomEnd: function(mapZoom) {
        if (!this.loaded)
            return;

        var len = this.map.config.layers.length, layer, mapLayers,legendUrls;

        for(var i = 0; i < len; i++) {
            mapLayers = this.map.getLayersByName(this.map.config.layers[i].name);
            for (var k = 0; k< mapLayers.length; k++) {
                layer = mapLayers[k];
                legendUrls = this.getLegendUrls(layer);
                if(!legendUrls)
                    continue;
                if (!this.layerIsVisible(layer)) {
                    var nodeElements = document.querySelectorAll("div[oLayerNode="+layer.id+"]");
                    for (var j =0; j < nodeElements.length; j++) {
                        nodeElements[j].classList.remove('legend-node-visible');
                    }
                    if (layer.options.theme_id == layer.name)
                        var elementNode = document.getElementById('legend_theme_'+layer.name);
                    else
                        var elementNode = document.getElementById('legend_layer_'+layer.name);
                    if (elementNode) {
                        elementNode.classList.remove('legend-node-visible');
                        this.changeLayerParentVisibility(elementNode);
                    }
                    continue;
                }

                this.changeLegendNodeVisibility(legendUrls);
            }
        }
        this.currentZoom = mapZoom;
    },

    layerChanged: function(event) {
        if (this.currentZoom != this.map.getZoom())
            return;
        var legendUrls = this.getLegendUrls(event.layer);
        if(!legendUrls || !legendUrls.length)
            return;
        var nodeElements = document.querySelectorAll("div[oLayerNode="+event.layer.id+"]");
        for (var j =0; j < nodeElements.length; j++) {
            nodeElements[j].classList.remove('legend-node-visible');
        }
        if (this.layerIsVisible(event.layer)) {
            this.changeLegendNodeVisibility(legendUrls);
        }
        else {
            if (event.layer.options.theme_id == event.layer.name)
                var elementNode = document.getElementById('legend_theme_'+event.layer.name);
            else
                var elementNode = document.getElementById('legend_layer_'+event.layer.name);
            if (elementNode) {
                elementNode.classList.remove('legend-node-visible');
                this.changeLayerParentVisibility(elementNode);
            }
        }
    },

    layerIsVisible: function(layer) {
        var visible = false;
        if(layer.getVisibility() && layer.calculateInRange()) {
            visible = true;
        } else {
            if(GisClientMap.mapsetTiles && GisClientMap.mapsetTileLayer.getVisibility()) {
                var mapsetTileLayer = true;
                if(GisClientMap.default_layers.indexOf(layer.name) > -1) {
                    visible = true;
                }
            }
            else {
                var tileLayer = GisClientMap.map.getLayersByName(layer.name + '_tiles') && GisClientMap.map.getLayersByName(layer.name + '_tiles')[0];
                if (tileLayer) {
                    if(tileLayer.getVisibility() && tileLayer.calculateInRange()) {
                        visible = true;
                    }
                }
            }
        }
        return visible;
    },

    // **** Remove elements with empty legend
    checkImgSize: function(imgUrl, itemID, removeParent) {
        var img = new Image();
        img.src = imgUrl;
        img.itemID = itemID;
        img.onload = function() {
            if (this.height <=1) {
                var item = document.getElementById(this.itemID);
                if (item) {
                    var parentDiv = item.parentNode;
                    parentDiv.removeChild(item);
                    if (parentDiv.getElementsByTagName('div').length == 0 && removeParent) {
                        if (!item.hasAttribute('legendParent'))
                            return;
                        var legendParent = item.getAttribute('legendParent');
                        var parentElem = document.getElementById(legendParent);
                        var parentDiv1 = parentElem.parentNode;
                        parentDiv1.removeChild(parentElem);
                    }
                }
            }
        }

    }



});

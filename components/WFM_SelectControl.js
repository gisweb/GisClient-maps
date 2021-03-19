// *******************************************************************************************

// **** Toolbar integration
$(function(){
    window.GCComponents["QueryToolbar.Actions"].addAction(
            'wfm-mark',
            function(featureType, feature) {
                var selectControls = feature.layer.map.getControlsBy('gc_id', 'queryToolbar');
                if (selectControls[0].wfmSelection) {
                    return '<a class="olControlButtonItemInactive olButton olLikeButton" href="#" featureType="' + featureType.typeName
                    + '" featureId="' + feature.id
                    +'" action="wfm-mark" title="" style="margin:0"><span class="glyphicon-white glyphicon-check"></span></a>';
                }
                return "";
            },
            function(featureTypeName, featureId, objQueryToolbar) {
                var wfmLayer = objQueryToolbar.map.getLayersByName('layer-wfm-highlight')[0];
                // **** bring Vector layer on top
                var origLayerIndex = objQueryToolbar.map.getLayerIndex(wfmLayer);
                var maxIndex = objQueryToolbar.map.getLayerIndex(objQueryToolbar.map.layers[objQueryToolbar.map.layers.length -1]);
                if(origLayerIndex < maxIndex) objQueryToolbar.map.raiseLayer(wfmLayer, (maxIndex - origLayerIndex -1));
                objQueryToolbar.map.resetLayersZIndex();

                var feature = objQueryToolbar.findFeature(featureId);
                var newFeature = feature.clone();
                newFeature.featureTypeName = feature.featureTypeName;

                // **** Remove features of the same type
                var oldFeatures = [];
                var featureTypeArr = [featureTypeName];
                var featureNum = 1;
                for (var i=0; i<WFM_LAYERS.length; i++) {
                    if (WFM_LAYERS[i].layers.indexOf(featureTypeName) > -1) {
                        featureTypeArr = WFM_LAYERS[i].layers;
                        featureNum = WFM_LAYERS[i].numfeats;
                    }
                }
                for (var i=0; i<wfmLayer.features.length; i++) {
                    if (featureTypeArr.indexOf(wfmLayer.features[i].featureTypeName) > -1) {
                        oldFeatures.push(wfmLayer.features[i]);
                    }
                }
                wfmLayer.removeFeatures(oldFeatures);
                wfmLayer.addFeatures([newFeature]);
            }
    );
});
window.GCComponents["Layers"].addLayer('layer-wfm-highlight', {
    displayInLayerSwitcher:false,
    styleMap: new OpenLayers.StyleMap({
        'default': {
            fill: false,
            fillColor: "red",
            fillOpacity: 0.9,
            hoverFillColor: "white",
            hoverFillOpacity: 0.9,
            strokeColor: "red",
            strokeOpacity: 0.9,
            strokeWidth: 10,
            strokeLinecap: "round",
            strokeDashstyle: "solid",
            hoverStrokeColor: "red",
            hoverStrokeOpacity: 1,
            hoverStrokeWidth: 10,
            pointRadius: 8,
            hoverPointRadius: 1,
            hoverPointUnit: "%",
            pointerEvents: "visiblePainted",
            cursor: "inherit"
        },
        'select': {
            fill: true,
            fillColor: "red",
            fillOpacity: 0.9,
            hoverFillColor: "white",
            hoverFillOpacity: 0.9,
            strokeColor: "red",
            strokeOpacity: 1,
            strokeWidth: 10,
            strokeLinecap: "round",
            strokeDashstyle: "solid",
            hoverStrokeColor: "red",
            hoverStrokeOpacity: 1,
            hoverStrokeWidth: 10,
            pointRadius: 8,
            hoverPointRadius: 1,
            hoverPointUnit: "%",
            pointerEvents: "visiblePainted",
            cursor: "pointer"
        },
        'temporary': {
            fill: true,
            fillColor: "EEA652",
            fillOpacity: 0.2,
            hoverFillColor: "white",
            hoverFillOpacity: 0.8,
            strokeColor: "#EEA652",
            strokeOpacity: 1,
            strokeLinecap: "round",
            strokeWidth: 4,
            strokeDashstyle: "solid",
            hoverStrokeColor: "red",
            hoverStrokeOpacity: 1,
            hoverStrokeWidth: 0.2,
            pointRadius: 6,
            hoverPointRadius: 1,
            hoverPointUnit: "%",
            pointerEvents: "visiblePainted",
            cursor: "pointer"
        }
    })
}, {
    "featureadded": function(obj) {
        var features = obj.object.features;
        var wfmExportData = {};
        for (var i = 0; i < features.length; i++) {
            for (var j=0; j<WFM_LAYERS.length; j++) {
                if (WFM_LAYERS[j].layers.indexOf(features[i].featureTypeName) > -1) {
                    for (var k = 0; k < WFM_LAYERS[j].fields.length; k++) {
                        var dataField = WFM_LAYERS[j].outvars[k];
                        var dataValue = features[i].attributes[WFM_LAYERS[j].fields[k]];
                        wfmExportData[dataField] = dataValue;
                    }
                    if (typeof(WFM_LAYERS[j].outitem) != 'undefined') {
                        wfmExportData['wfm_outitem'] = WFM_LAYERS[j].outitem;
                    }
                }
            }
        }
        window.GCComponents.Functions.sendToWFM(wfmExportData);
    }
});


// **** Point marker layer (TODO: style)
window.GCComponents["Layers"].addLayer('layer-wfm-markpoint', {
    displayInLayerSwitcher:false,
    styleMap: new OpenLayers.StyleMap({
        'default': {
            cursor: "inherit",
            graphicHeight: 32,
            externalGraphic: "images/marker32_red.png"
        }
    })
}, {
    "sketchcomplete": function(obj) {
        var tmpGeom = obj.feature.geometry.clone();
        var srid = this.map.displayProjection?this.map.displayProjection:this.map.projection;
        if (srid != this.map.projection) {
            tmpGeom.transform(this.map.projection, srid);
        }
        window.GCComponents.Functions.sendToWFM({x: tmpGeom.x, y:tmpGeom.y, srid:srid});

        if (typeof(WFM_SRID) !== 'undefined') {
            tmpGeom = obj.feature.geometry.clone();
            srid = WFM_SRID;
            if (srid != this.map.projection) {
                tmpGeom.transform(this.map.projection, srid);
            }
            window.GCComponents.Functions.sendToWFM({x: tmpGeom.x, y:tmpGeom.y, srid:srid});
        }

        this.removeAllFeatures();
    },
    "featureadded": function(obj) {
        // **** Get main selection control
        var selectControls = this.map.getControlsBy('gc_id', 'queryToolbar');
        if (selectControls.length != 1)
            return;
        if (!selectControls[0].controls)
            return;
        var selectControl = selectControls[0];
        selectControl.controls[0].layers = [];
        // **** insert configured WFS layers
        if (typeof(WFM_LAYERS) === 'undefined') {
            return;
        }
        var featureTypes = '';
        var selectLayers = [];
        for (var i=0; i<WFM_LAYERS.length; i++) {
            for (var j=0; j<WFM_LAYERS[i].layers.length; j++) {
                var tmpLayer = selectControl.getLayerFromFeature(WFM_LAYERS[i].layers[j]);
                var idx;
                for (idx = 0; idx < selectLayers.length; idx++)  {
                    if (selectLayers[idx].id === tmpLayer.id)
                        break;
                }
                if (idx === selectLayers.length)
                    selectLayers.push(tmpLayer);

                featureTypes += WFM_LAYERS[i].layers[j] + ',';
            }
        }
        if (selectLayers.length < 1)
            return;
        
        selectControl.controls[0].layers = selectLayers;
        selectControl.controls[0].queryFeatureType = featureTypes.substring(0, featureTypes.length -1);

        // **** Build selection rectangle
        var selWidth = (typeof(WFM_SELECTION_WIDTH) === 'undefined')?5:WFM_SELECTION_WIDTH;
        var XCoord = obj.feature.geometry.x;
        var YCoord = obj.feature.geometry.y;
        var pointLL = new OpenLayers.Geometry.Point(XCoord -selWidth, YCoord -selWidth);
        var pointLU = new OpenLayers.Geometry.Point(XCoord -selWidth, YCoord +selWidth);
        var pointRU = new OpenLayers.Geometry.Point(XCoord +selWidth, YCoord +selWidth);
        var pointRL = new OpenLayers.Geometry.Point(XCoord +selWidth, YCoord -selWidth);
        var selRectangle = new OpenLayers.Geometry.LinearRing([pointLL, pointLU, pointRU, pointRL, pointLL]);

        // **** Apply selection
        this.keepFeatures = true;
        selectControl.controls[0].activate();
        selectControl.clearResults();
        selectControl.controls[0].select(selRectangle);
        selectControl.activateVectorControl();
        selectControl.resultLayer.setVisibility(true);
        selectControl.controls[0].deactivate();
        selectControl.wfmSelection = true;
        this.keepFeatures = false;
    }
});

// **** Point marker draw control
window.GCComponents["Controls"].addControl('control-wfm-markpoint', function(map){
    return new OpenLayers.Control.DrawFeature(
        map.getLayersByName('layer-wfm-markpoint')[0],
        OpenLayers.Handler.Point,
        {
            gc_id: 'control-wfm-markpoint',
            eventListeners: {
                'activate': function(e){
                    if (map.currentControl != this) {
                        map.currentControl.deactivate();
                        var touchControl = map.getControlsByClass("OpenLayers.Control.TouchNavigation");
                        if (touchControl.length > 0) {
                            touchControl[0].dragPan.deactivate();
                        }
                    }
                    map.currentControl=this;
                },
                'deactivate': function(e){
                    var touchControl = map.getControlsByClass("OpenLayers.Control.TouchNavigation");
                    if (touchControl.length > 0) {
                        touchControl[0].dragPan.activate();
                    }
                    if (!this.layer.keepFeatures) {
                        this.layer.removeAllFeatures();
                    }
                    var btnControl = map.getControlsBy('id', 'button-wfm-markpoint')[0];
                    if (btnControl.active)
                        btnControl.deactivate();

                }
            }
        }
    )
});

// **** Toolbar button
window.GCComponents["SideToolbar.Buttons"].addButton (
    'button-wfm-markpoint',
    'Esporta coordinate per WFM',
    'glyphicon-white glyphicon-pushpin',
    function() {
        if (sidebarPanel.handleEvent || typeof(sidebarPanel.handleEvent) === 'undefined')
        {
            this.map.getLayersByName('layer-wfm-highlight')[0].removeAllFeatures();
            this.map.getLayersByName('layer-wfm-markpoint')[0].removeAllFeatures();
            window.GCComponents.Functions.resetWFMData();
            if (this.active) {
                this.deactivate();
                var drawControl = this.map.getControlsBy('gc_id', 'control-wfm-markpoint');
                if (drawControl.length == 1)
                    drawControl[0].deactivate();
                //adjustPanZoomBar(queryToolbar, 60);
            }
            else
            {
                this.activate();
                var drawControl = this.map.getControlsBy('gc_id', 'control-wfm-markpoint');
                if (drawControl.length == 1)
                    drawControl[0].activate();
            }
            if (typeof(sidebarPanel.handleEvent) !== 'undefined')
                sidebarPanel.handleEvent = false;
        }
    },
    null
);

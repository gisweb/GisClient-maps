Ext.namespace("GisClient.plugins");
//Editing di elementi vettoriali con memoria dello stato della mappa
GisClient.plugins.WKTEdit = Ext.extend(Ext.util.Observable, {

	labelText: 'Info: ',
	resultLayer:null,
	selectControl:null,
	resultTemplate:{},
	popupList:{},
	info:[],

    constructor: function(config) {
        Ext.apply(this.initialConfig, Ext.apply({}, config));
        Ext.apply(this, config);
		GisClient.plugins.WKTEdit.superclass.constructor.apply(this, arguments); 
	},

    init: function(mapPanel){
		//Se ho i controlli di selezione regstro l'evento selected di ogni controllo
		var info,proj,geom,lon,lat,zoom,layersconf;
		this.mapPanel=mapPanel;
		this.format = new OpenLayers.Format.WKT();
		
		var editStyle = new OpenLayers.StyleMap({
			"default": new OpenLayers.Style({    
				pointRadius: "4",
				fillColor: "#999999",
				strokeColor: "#444444",
				strokeWidth: 2,
				graphicZIndex: 1
			}),
			"select": new OpenLayers.Style({    
				pointRadius: "6",
				fillColor: "#ff0000",
				strokeColor: "#ff9933",
				strokeWidth: 2,
				graphicZIndex: 1
			}),
			"temporary": new OpenLayers.Style({    
				pointRadius: "6",
				fillColor: "#ffcc66",
				strokeColor: "#ff9933",
				strokeWidth: 2,
				graphicZIndex: 1
			})
		});
		
		var vectorLayer = new OpenLayers.Layer.Vector("gcWKTEditTools", {visibility:true,displayInLayerSwitcher:true,styleMap:editStyle});	
		mapPanel.map.addLayer(vectorLayer);	
		this.modifyControl = new OpenLayers.Control.ModifyFeature(vectorLayer,{standalone:true});
		this.selectControl = new OpenLayers.Control.SelectFeature(vectorLayer);
		mapPanel.map.addControl(this.modifyControl);
		mapPanel.map.addControl(this.selectControl);

		
		info = this.confElement && this.confElement.value && this.confElement.value.split(';');
		if(info && info.length == 6){
			proj = info[0];
			geom = info[1];
			lon = parseFloat(info[2]);
			lat = parseFloat(info[3]);
			zoom = parseInt(info[4]);
			layersconf = info[5];
			this.info = info;
		};
		// TODO USARE TRANSFORM QUANDO SRID GEOM <> SRID MAPPA
		//Posizione:
		if(lon && lat) mapPanel.center = new OpenLayers.LonLat(lon,lat);
		if(zoom) mapPanel.zoom = zoom;
		if(geom){		
			var feature = this.format.read(geom);
			if (feature){
				vectorLayer.addFeatures([feature]);
				this.modifyControl.selectFeature(feature);
			}
		};
		if(layersconf) this.configureLayers(layersconf);
		
		//vectorLayer.events.register("featureadded", this, this.updateDatagrid);
		vectorLayer.events.register("featuremodified", this, this.updateWKTGeometry);
		vectorLayer.events.register("featureselected", this, this.selectWKTGeometry);
		vectorLayer.events.register("beforefeaturesadded", this, this.newGeometry);
		this.vectorLayer = vectorLayer;
		
		//mapPanel.map.events.register("moveend", this, this.updatePosition);
		vectorLayer.events.register("loadend", this, this.updatePosition);
		mapPanel.map.events.register("changelayer", this, this.updateLayers);	
		mapPanel.map.events.register("changebaselayer", this, this.updateLayers);
		
		var items = [];
	
		if(this.point){
			var drawPointControl = new OpenLayers.Control.DrawFeature(
				vectorLayer,
				OpenLayers.Handler.Point
			);
			items.push(	new GeoExt.Action({
								control: drawPointControl,
								text: "Punto",
								iconCls: 'drawpoint',  // <-- icon
								toggleGroup: 'mapToolbar'
			}));	
			mapPanel.map.addControl(drawPointControl);
		};
		
		
		if(this.line){
		
			var drawLineControl = new OpenLayers.Control.DrawFeature(
				vectorLayer,
				OpenLayers.Handler.Path
			);
			if(items.length > 0) items.push(" ","-"," ");
			items.push(	new GeoExt.Action({
								control: drawLineControl,
								text: "Linea",
								iconCls: 'drawline',  // <-- icon
								toggleGroup: 'mapToolbar'
			}));
			mapPanel.map.addControl(drawLineControl);
		};
		
		
		if(this.polygon){

			var drawPolygonControl = new OpenLayers.Control.DrawFeature(
				vectorLayer,
				OpenLayers.Handler.Polygon
			);
			if(items.length > 0) items.push(" ","-"," ");

			items.push(new GeoExt.Action({
								control: drawPolygonControl,
								text: "Poligono",
								iconCls: 'drawpolygon',  // <-- icon
								toggleGroup: 'mapToolbar'
			}));
			mapPanel.map.addControl(drawPolygonControl);
		};

		if(items.length>0){
			var list = ["->",'Inserisci: '];
			items = list.concat(items);
			mapPanel.getTopToolbar().add(items);
		};
		mapPanel.gcTools["gc_wktedit"] = this;
    },
	
	configureLayers: function(layersconf) {

		 
            for(var i=0, len=this.mapPanel.map.layers.length; i<len; i++) {
		
                var layer = this.mapPanel.map.layers[i];			
                var c = layersconf.charAt(i);
        
                if (c == "B") {
                    this.mapPanel.map.setBaseLayer(layer);
                } else if ( (c == "T") || (c == "F") ) {
                    layer.setVisibility(c == "T");
                }
            }
        
    },
	
	
	updateLayers: function(evt){
		if (this.confElement){
			var layers = this.mapPanel.map.layers;  
			var params={};
            params.layers = '';
            for (var i=0, len=layers.length; i<len; i++) {
                var layer = layers[i];
                if (layer.isBaseLayer) {
                    params.layers += (layer == this.mapPanel.map.baseLayer) ? "B" : "0";
                } else {
                    params.layers += (layer.getVisibility()) ? "T" : "F";           
                }
            }
			this.info[5] = params.layers;
			this.updateConf();
		}
	},
	
	newGeometry: function(evt) {
		var geom = this.format.write(evt.features[0]);
		if(geom) geom = evt.object.projection.projCode + ';' + geom;
		var drawCtrls = this.mapPanel.map.getControlsByClass('OpenLayers.Control.DrawFeature');
		for(i=0;i<drawCtrls.length;i++) drawCtrls[i].deactivate();  
		//if(evt.features[0].renderIntent == 'default') this.modifyControl.selectFeature(evt.features[0]);
		this.addWKTGeometry(evt.features[0]);
		
		if (this.confElement){
			this.info[0] = evt.object.projection.projCode;
			this.info[1] = this.format.write(evt.features[0]);
			this.updateConf();
		}
    },

	updatePosition: function(evt) {
		if (this.confElement){
			this.info[3] = evt.object.center.lat;
			this.info[2] = evt.object.center.lon;
			this.info[4] = evt.object.zoom;
			this.updateConf();
		}
    },
	
	updateConf: function() {
		if (this.confElement){
			this.confElement.value = this.info.join(";");
		}
	},
	
	updateWKTGeometry: function(){
		console.log('updateWKTGeometry')
	},
	
	addWKTGeometry: function(){
		console.log('addWKTGeometry')
	},
	
	selectWKTGeometry: function(evt){
	
		console.log(evt)
	
	}

});

Ext.preg("gc_wktedit", GisClient.plugins.WKTEdit);
	
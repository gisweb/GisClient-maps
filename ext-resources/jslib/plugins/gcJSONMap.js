Ext.namespace("GisClient.plugins");
//Strumento di interrogazione di un elenco di layer (mapPanel.activeLayers)

GisClient.plugins.JSONMap = Ext.extend(Ext.util.Observable, {

	labelText: 'Info: ',
	resultLayer:null,
	selectControl:null,
	resultTemplate:{},
	popupList:{},
	mapConfig:null,
	
    constructor: function(config) {
        Ext.apply(this.initialConfig, Ext.apply({}, config));
        Ext.apply(this, config);
		GisClient.plugins.JSONMap.superclass.constructor.apply(this, arguments); 
	},

    init: function(mapPanel){

		//Se ho i controlli di selezione regstro l'evento selected di ogni controllo
		var proj,geom,lon,lat,zoom;
		this.mapPanel=mapPanel;
		
		var format = new OpenLayers.Format.JSON()
		if(!this.confElement) return;		
		this.mapConfig = (this.confElement && this.confElement.value.length>0 && format.read(this.confElement.value)) || {};
		
		mapPanel.map.events.register('addlayer', this, this.addLayer);
		mapPanel.map.events.register('removelayer', this, this.removeLayer);
		for (var i = 0; i < mapPanel.map.layers.length; i++) {
			var layer = mapPanel.map.layers[i];
			layer.events.register('visibilitychanged', this, this.pippo);
		}

		mapPanel.map.events.register("moveend", this, function(){
				this.mapConfig.lon = mapPanel.map.center.lon;
				this.mapConfig.lat = mapPanel.map.center.lat;
				this.mapConfig.zoom = mapPanel.map.zoom;
				this.writeConfig();
			}
		);
		
		if(this.mapConfig.lon && this.mapConfig.lat) mapPanel.center = new OpenLayers.LonLat(this.mapConfig.lon,this.mapConfig.lat);
		
		if(this.mapConfig.zoom) mapPanel.zoom = this.mapConfig.zoom;
		if(this.mapConfig.geom){		
			var format = new OpenLayers.Format.WKT();
			var feature = format.read(this.mapConfig.geom);		// TODO USARE TRANSFORM QUANDO SRID GEOM <> SRID MAPPA
			if (feature){
				var vectorLayer = new OpenLayers.Layer.Vector("gcVector", {displayInLayerSwitcher:false});	
				vectorLayer.addFeatures([feature]);
			}
		};
		
		if(this.mapConfig.layersOn){
			var lay;
			for(i=0;i<this.mapConfig.layersOn.length;i++){
				lay = mapPanel.getGCLayer(this.mapConfig.layersOn[i]);
				if(lay) lay.setVisibility(true);
			}
		}	
		
		if(this.mapConfig.extent){
			mapPanel.map.setCenter(new OpenLayers.LonLat(sitiset.pageConfig.extent.lon,sitiset.pageConfig.extent.lat),sitiset.pageConfig.extent.zoom);
		}
        
		

		mapPanel.jsonContext = this;

		return;
		

		if(this.point){
			var drawPointControl = new OpenLayers.Control.DrawFeature(
				vectorLayer,
				OpenLayers.Handler.Point
			);
			items.push(	new GeoExt.Action({
								control: drawPointControl,
								text: "Punto",
								iconCls: 'add-feature',  // <-- icon
								toggleGroup: 'mapToolbar'
			}));	
			mapPanel.map.addControl(drawPointControl);
		};
		
		


		if(items.length>0){
			var list = ["->",'Inserisci: '];
			items = list.concat(items);
			mapPanel.getTopToolbar().add(items);
		};
		
    },
	
	
	pippo: function(evt){					
		var layersOn = [];
		var layers = this.mapPanel.map.layers;
		for(i=0;i<layers.length;i++){
			if(layers[i].gc_id && layers[i].visibility) layersOn.push(layers[i].gc_id)
		};
		this.mapConfig.layersOn = layersOn;
		this.writeConfig();
		
		
	
	},
	
	addLayer: function(evt) {
		if (evt.layer) {
			evt.layer.events.register('visibilitychanged', this, this.pippo);
		}
	},

	removeLayer: function(evt) {
		if (evt.layer) {
			evt.layer.events.unregister('visibilitychanged', this, this.pippo);
		}
	},
	
	
	updateWKTGeometry: function(evt) {
		if (this.confElement){
			if(evt.feature.renderIntent == 'default') this.modifyControl.selectFeature(evt.feature);
			var format = new OpenLayers.Format.WKT();
			this.info[0] = evt.object.projection.projCode;
			this.info[1] = format.write(evt.feature);
			this.confElement.value = this.info.join(";");
			format.destroy();
		}
    },

	updatePosition: function(evt) {
		if (this.confElement){
			this.info[3] = evt.object.center.lat;
			this.info[2] = evt.object.center.lon;
			this.info[4] = evt.object.zoom;
			this.confElement.value = this.info.join(";");
		}
    },
	
	writeConfig: function(){
		if(this.confElement && this.mapConfig) this.confElement.value = new OpenLayers.Format.JSON().write(this.mapConfig);
	}


});

Ext.preg("gc_jsonmap", GisClient.plugins.JSONMap);
	
Ext.namespace("GisClient.plugins");
//Editing di elementi vettoriali con memoria dello stato della mappa
GisClient.plugins.WKTEdit = Ext.extend(Ext.util.Observable, {

	labelText: 'Info: ',
	resultLayer:null,
	selectControl:null,
	resultTemplate:{},
	popupList:{},
	mapInfo:[],

    constructor: function(config) {
        Ext.apply(this.initialConfig, Ext.apply({}, config));
        Ext.apply(this, config);
		GisClient.plugins.WKTEdit.superclass.constructor.apply(this, arguments); 
	},

    init: function(mapPanel){
		//Se ho i controlli di selezione regstro l'evento selected di ogni controllo
		var mapInfo,mapset,proj,geom,lon,lat,zoom,layersconf;
		this.mapPanel=mapPanel;
        var map = mapPanel.map;
		
		var editStyle = new OpenLayers.StyleMap({    
			pointRadius: "4",
			fillColor: "#999999",
			strokeColor: "#444444",
			strokeWidth: 2,
			graphicZIndex: 1
        });
		
		var vectorLayer = new OpenLayers.Layer.Vector("gcWKTEditTools", {displayInLayerSwitcher:false,styleMap:editStyle});	
		map.addLayer(vectorLayer);	
		this.modifyControl = new OpenLayers.Control.ModifyFeature(vectorLayer);
		map.addControl(this.modifyControl);
		this.vectorLayer = vectorLayer;

		mapInfo = this.confElement && this.confElement.value && this.confElement.value.split(';');
		if(mapInfo && mapInfo.length > 4){
			mapset = mapInfo[0];
			proj = mapInfo[1];
			lon = parseFloat(mapInfo[2]);
			lat = parseFloat(mapInfo[3]);
			zoom = parseInt(mapInfo[4]);
			if(mapInfo[5]) layersconf = mapInfo[5];
			this.mapInfo = mapInfo;
		};
		// TODO USARE TRANSFORM QUANDO SRID GEOM <> SRID MAPPA (librerie proj.js)
		//Carico ala configurazione della mappa:
		if(lon && lat) mapPanel.center = new OpenLayers.LonLat(lon,lat);
		if(zoom) mapPanel.zoom = zoom;
		if(layersconf) this.configureLayers(layersconf);
		
		//SE ho un marker aggiungo il marker se presente
		if (this.mapMarker){
		
			//ATRIMENTI POTREBBE ESSERE UN CAMPO DI TIPO MARKER E VADO A RECUPARARE LE INFORMAZIONI SUGLI ATTRIBUTI DELL'OGGETTO
			//eval('var configObject = ' + this.mapMarker.getAttribute("data-geocode-options"));
			//configObject.pos = eval(geom);
			//var iconPath =  this.mapMarker.getAttribute("data-icon-path");
			//configObject.icon = iconPath + configObject.icon;
			this.addMarker(this.mapMarker);
		}
		//SE ho una geometri ala aggiungo in mappa al layer con lo style del layer
		else if(this.mapGeometry){
		     mapGeometry = this.mapGeometry.value;	
			//SE E UNA GEOMETRIA LA RECUPERO DIRETTAMENTE
			var format = new OpenLayers.Format.WKT();
			var feature = format.read(mapGeometry);
			if (feature){
				vectorLayer.addFeatures([feature]);
				//this.modifyControl.selectFeature(feature);
			}
		};
		
		//Registro gi eventi
		vectorLayer.events.register("featureadded", this, this.updateWKTGeometry);
		vectorLayer.events.register("featuremodified", this, this.updateWKTGeometry);
		vectorLayer.events.register("beforefeaturesadded", vectorLayer, function(evt) {
			this.destroyFeatures();
		});
		map.events.register("moveend", this, this.updateMapPosition);
		map.events.register("changelayer", this, this.updateLayers);	
		map.events.register("changebaselayer", this, this.updateLayers);
		

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
			map.addControl(drawPointControl);
		    mapPanel.gcTools["wktEdit"] = this;
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
			map.addControl(drawLineControl);
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
			map.addControl(drawPolygonControl);
		};

		if(items.length>0){
			var list = ["->",'Inserisci: '];
			items = list.concat(items);
			mapPanel.getTopToolbar().add(items);
		};
		mapPanel.gcTools["wktedit"] = this;
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
			this.mapInfo[5] = params.layers;
			this.confElement.value = this.mapInfo.join(";");
		}
	},
	
	updateMapPosition: function(evt) {
		if (this.confElement){
		    var map = evt.object;
			this.mapInfo[0] = this.mapPanel.name;
			this.mapInfo[1] = map.projection.projCode;
			this.mapInfo[2] = map.center.lon;		
			this.mapInfo[3] = map.center.lat;
			this.mapInfo[4] = map.zoom;
			this.confElement.value = this.mapInfo.join(";");
		}
    },
	
	addMarker: function(options){
//VEDERE NMARKER >1*******************
        if(!options.pos) return;
        var map = this.mapPanel.map;
		var markerStyle = {externalGraphic:options.icon, graphicWidth:options.iconw, graphicHeight:options.iconh};
		var mapBounds = map.getMaxExtent();
		var point = new OpenLayers.Geometry.Point(options.pos[1],options.pos[0]);
		if (map.projection != "EPSG:4326") point.transform(
			new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
			map.getProjectionObject() // to Spherical Mercator Projection
		);
		if (mapBounds.contains(point.x, point.y)) {
			var imgTitle = 'Marker';
			var feature = new OpenLayers.Feature.Vector(point, {title: imgTitle, clickable: 'off'}, markerStyle);
			feature.fid = options.fieldId;
			this.vectorLayer.addFeatures([feature]);
			this.modifyControl.selectFeature(feature);
		}	
	    map.setCenter(new OpenLayers.LonLat(point.x, point.y), options.zoom);
	},
	
	updateMarkerPosition: function(options){
	    var map = this.mapPanel.map;
		var feature = this.vectorLayer.getFeatureByFid(options.fieldId);
		if(feature) this.vectorLayer.removeFeatures([feature]);
		this.addMarker(options);
	},
	
	updateWKTGeometry: function(evt) {

	    //Aggiorno i valore della geometria
		if (this.mapGeometry){
			var format = new OpenLayers.Format.WKT();
			this.mapGeometry.value = format.write(evt.feature);
			format.destroy();
		}
		
        //Aggiorno la posizione del marker
		if (this.mapMarker){
			var point = evt.feature.geometry.clone();
			point.transform(this.mapPanel.map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"));
            this.mapMarker.pos = [point.y,point.x];
			if(window.parent.jQuery.plominoMaps){
				window.parent.jQuery.plominoMaps.updateGeometryField (this.mapMarker);
				if(window.parent.jQuery.plominoMaps.google) window.parent.jQuery.plominoMaps.google.updateMarkerPosition(this.mapMarker)
			
			}
			
			//TODO SOLO GISCLIENT.....
		}
    }
	

});

Ext.preg("gc_wktedit", GisClient.plugins.WKTEdit);
	
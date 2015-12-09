
OpenLayers.Control.QueryMap = OpenLayers.Class(OpenLayers.Control.SLDSelect, {


	/** 
	**** baseUrl - Gisclient service URL
	*/
	baseUrl : '/gisclient',
	

	/** 
		* maxSldLength - lunghezza max sld da passare il get
	*/
	maxSldLength : 20,
	
	/** 
		{Boolean} select only visible layers?
		* visibleLayers 
	*/
	visibleLayers: true,

	/** 
		{Boolean} select only in range layers?
		* inRangeLayers
	*/
	inRangeLayers: true,
	
	/** 
		{Boolean} highlight result?
		* highLight
	*/
	highLight: false,

	
	/** 
		{String} Current typename for query
		* queryFeatureType
	*/
	queryFeatureType: null,
	
	/** 
		* queryFilters - {Object} hash table of non spatial filters  queryFilters[typename]
	*/
	queryFilters : {},


	resultLayer: null,

	resultPanel: null,

	//NUMERO DI RISULTATI MASSIMI RICHIESTI AL SERVIZIO WFS PER OGNI FETURETYPE
	maxFeatures: 20,

	//NUMERO COMPESSIVO DI ELEMENTI VETTORIALI DA AGGIUNGERE AL LIVELLO VETTORIALE DEI RISULTATI
	maxVectorFeatures: 100,
    
    //Features che non sono state renderizzate su mappa a causa del limite sopra
    vectorFeaturesOverLimit: [],

	 
	selectionSymbolizer: {
        'Polygon': {strokeColor: '#FFFF00',fillColor:'#FF0000'},
        'Line': {strokeColor: '#FFFF00', strokeWidth: 2},
        'Point': {fill:false, graphicName: 'circle', strokeColor: '#FFFF00', pointRadius: 3}
    },
	
	autoDeactivate: false,


	onlyVisibleLayers: false,

	//CREA UN UNICO LIVELLO PER LA SELEZIONE BASATO SU PROJECT E MAP DI UNO DEI LIVELLI INTERROGATI (DA VEDERE)
	createSelectionLayer: function(key, selection) {
        // check if we already have a selection layer for the source layer
        var selection = this.selection || selection,
            selectionLayer;
        if (!this.layerCache[key]) {
			selectionLayer = new OpenLayers.Layer.WMS('Oggetti evidenziati',
				selection[key].url, 
				OpenLayers.Util.applyDefaults({HIGHLIGHT:1},selection[key].params), 
				OpenLayers.Util.applyDefaults(this.layerOptions,{singleTile:true})
			);
			selectionLayer.displayInLayerSwitcher = true;//???????
			
            this.layerCache[key] = selectionLayer;
            this.map.addLayer(selectionLayer);
        } else {
            selectionLayer = this.layerCache[key];
        }
        return selectionLayer;
    },
	
	
	
    /**
     * Method: createSLD
     * Create the SLD document for the layer using the supplied filters.
     *
     * Parameters:
     * layer - {<OpenLayers.Layer.WMS>}
     * filters - Array({<OpenLayers.Filter>}) The filters to be applied.
     * geometryAttributes - Array({Object}) The geometry attributes of the 
     *     layer.
     *
     * Returns:
     * {String} The SLD document generated as a string.
     */
    createSLD: function(layer, filters, geometryAttributes) {
		var layerNames = []
        var sld = {version: "1.0.0", namedLayers: {}};
        for (var i=0, len=geometryAttributes.length; i<len; i++) {

			var geometryAttribute = geometryAttributes[i];
			layerNames.push(geometryAttribute.typeName);			
            var name = this.currentFeature?this.currentFeature:geometryAttribute.typeName;	
			sld.namedLayers[name] = {name: name, userStyles: []};
			var symbolizer={};			
			
			if(geometryAttribute.symbolizer){
				symbolizer = geometryAttribute.symbolizer;	
			}
			else{
				if (geometryAttribute.type.indexOf('Polygon') >= 0) {
					symbolizer = {Polygon: this.selectionSymbolizer['Polygon']};
				} else if (geometryAttribute.type.indexOf('LineString') >= 0) {
					symbolizer = {Line: this.selectionSymbolizer['Line']};
				} else if (geometryAttribute.type.indexOf('Point') >= 0) {
					symbolizer = {Point: this.selectionSymbolizer['Point']};
				}
			}

			var filter = filters[i];

			sld.namedLayers[name].userStyles.push({name: 'default', rules: [
				new OpenLayers.Rule({symbolizer: symbolizer, 
					filter: filter, 
					maxScaleDenominator: layer.options.minScale})
			]});
	
        }
						
		//SOSTITUISCO A LAYERS L'ELENCO layerNames per avere il match con sld
		layer.params.LAYERS = layerNames;
        return new OpenLayers.Format.SLD().write(sld);
    },

    /**
     * Method: parseDescribeLayer
     * Parse the SLD WMS DescribeLayer response and issue the corresponding
     *     WFS DescribeFeatureType request
     *
     * request - {XMLHttpRequest} The request object.
     */
    parseDescribeLayer: function(request) {
	   var format = new OpenLayers.Format.WMSDescribeLayer();
        var doc = request.responseXML;
        if(!doc || !doc.documentElement) {
            doc = request.responseText;
        }
        var describeLayer = format.read(doc);
        var typeNames = [];
        var url = null;
        for (var i=0, len=describeLayer.length; i<len; i++) {
            // perform a WFS DescribeFeatureType request
			//DA MAPSERVER MI ARRIVA SEMPRE  describeLayer[i].owsType == "WFS" ANCHE SE NON E UN LAYER INTERROGABILE
            if (describeLayer[i].owsURL && describeLayer[i].owsType == "WFS") {
                typeNames.push(describeLayer[i].typeName);
                url = describeLayer[i].owsURL;
				this.layer.wfsSchema = url;
            }
        }
		if(url!=null){//SE NON C'E URL NON CI SOLO LAYER INTERROGABILI
			var options = {
				url: url,
				params: {
					SERVICE: "WFS",
					TYPENAME: typeNames.toString(),
					REQUEST: "DescribeFeatureType",
					VERSION: "1.0.0"
				},
				callback: this.control.parseDescribeFeatureType,
				scope: this
			}; 
			OpenLayers.Request.GET(options);
		}
    },
	
	parseDescribeFeatureType: function(request) {
        var format = new OpenLayers.Format.WFSDescribeFeatureType();
        var doc = request.responseXML;
        if(!doc || !doc.documentElement) {
            doc = request.responseText;
        }
        var describeFeatureType = format.read(doc);
		if(describeFeatureType.featureTypes){
			for(var i=0, leni=describeFeatureType.featureTypes.length; i<leni; i++) {
				featureType = describeFeatureType.featureTypes[i];
				for (var j=0, len=this.control.wfsCache[this.layer.id]["featureTypes"].length; j<len; j++){
					if(typeof(this.control.wfsCache[this.layer.id]["featureTypes"][j]["properties"])=='undefined' && this.control.wfsCache[this.layer.id]["featureTypes"][j]["typeName"] == featureType.typeName){
						this.control.wfsCache[this.layer.id]["featureTypes"][j]["properties"] = featureType.properties
					} 
				}
			}
		}				
		//tengo in memoria la funzione per poterla eseguire se va in buca
		this.control._queue && this.control.applySelection(); 
		if(typeof(console)!="undefined") console.log(this.control.wfsCache[this.layer.id])
	
	},
	

    /**
     * APIMethod: activate
     * Activate the control. Activating the control will perform a SLD WMS
     *     DescribeLayer request followed by a WFS DescribeFeatureType request
     *     so that the proper symbolizers can be chosen based on the geometry
     *     type.
     */
	checkFeatureType:function(layerId){
		//SE NON C'E' NULLA ALLORA DEVO FARE LA CHIAMATA
		if(!this.wfsCache[layerId]["featureTypes"]) return false;
		//SE IN QUALCHE FEATURETYPE HO IL TYPENAME MA NON HO PROPERTIES DEVO FARE LA CHIAMATA PER RECUPERARE I CAMPI
        for (var i=0, len=this.wfsCache[layerId]["featureTypes"].length; i<len; i++){
			if(typeof(this.wfsCache[layerId]["featureTypes"][i]["properties"])=='undefined'){
				if(typeof(console)!="undefined") console.log(this.wfsCache[layerId]["featureTypes"][i]); 
				return false;
			}
		}
		return true;
	},
    activate: function() {

        var activated = OpenLayers.Control.prototype.activate.call(this);
        if(activated) {
            for (var i=0, len=this.layers.length; i<len; i++) {
                var layer = this.layers[i];
                if (layer && !this.checkFeatureType(layer.id)) {
					//################## MODIFICA PER LAYERS DI TIPO TMS  ###########################
					var layerUrl = (typeof(layer.owsurl)!='undefined')?layer.owsurl:layer.url;			
					//##################  	                                ###########################
                    var options = {
                        url: layerUrl,
                        params: {
							PROJECT:layer.params.PROJECT,
							MAP:layer.params.MAP,	
                            SERVICE: "WMS",
                            VERSION: layer.params.VERSION,
                            LAYERS: layer.params.LAYERS,
                            REQUEST: "DescribeLayer"
                        },
                        callback: this.parseDescribeLayer,
                        scope: {layer: layer, control: this}
                    };
                    OpenLayers.Request.GET(options);
                }
            }
        }
        return activated;
    },
    
	
    /**
     * Method: select
     * When the handler is done, use SLD_BODY on the selection layer to
     *     display the selection in the map.
     *
     * Parameters:
     * geometry - {Object} or {<OpenLayers.Geometry>}
	 */
    select: function(geometry, mode) {
        var mode = mode || 'default';
     
        this.map.defaultControl.activate();
        this._queue = function() {
			var layer, featureTypes, geometryAttribute, filterId, params;
			var selection = {};
			this.nquery=0;
			this.nresponse=0;
			for(var i=0, leni=this.layers.length; i<leni; i++) {
				layer = this.layers[i];
                
                if(!this.wfsCache[layer.id]) continue;
                
				//SE DEVO INTERROGARE SOLO I VISIBILI METTO LE FATURE DEI SOLI VISIBILI ALTRIMENTI LE METTO TUTTE
				if(layer.nodes && this.onlyVisibleLayers){
					//per ogni nodo prendo solo il layername (stringa con il nome) che risulta visibile e in range
					//dato il layername inserisco in cache solo le feturetupes con typeName che comincia con layername + 
					var scale = layer.map.getScale()
					var node,layerName;
					//console.log(scale)
					featureTypes=[];
					for(var j=0, lenj=layer.nodes.length; j<lenj; j++) {
						node = layer.nodes[j];
                                                if (layer.params["LAYERS"].indexOf(node.layer) < 0){
                                                    continue;
                                                }
						if(!(node.minScale && node.minScale < scale) && !(node.maxScale && node.maxScale > scale)){
							//console.log(node.layer)
							for(k in this.wfsCache[layer.id].featureTypes){
								if(this.wfsCache[layer.id].featureTypes[k].typeName.indexOf(node.layer + '.') != -1) featureTypes.push(this.wfsCache[layer.id].featureTypes[k])
							}
						}
					}
				}
				else
					featureTypes = this.wfsCache[layer.id].featureTypes;

				filterId = (layer.params.PROJECT && layer.params.MAP)?(layer.params.PROJECT + '_' + layer.params.MAP):layer.id;
				selection[filterId] = selection[filterId] || {
					Filters:[],
					geometryAttributes:[],
					params:layer.params,
					url:(typeof(layer.owsurl)!='undefined')?layer.owsurl:layer.url
				};
				//#######   getGeometryAttributes ################
				for(var j=0, lenj=featureTypes.length; j<lenj; j++) {
					featureType = featureTypes[j];
					if(!this.queryFeatureType ||(this.queryFeatureType && featureType.typeName == this.queryFeatureType)){
						if(featureType.properties){
							var properties = featureType.properties;
							for (var k=0; k<properties.length; k++) {
								var property = properties[k];
								var type = property.type;
								if ((type.indexOf('LineString') >= 0) ||
									(type.indexOf('GeometryAssociationType') >=0) ||
									(type.indexOf('GeometryPropertyType') >= 0) ||
									(type.indexOf('Point') >= 0) ||
									(type.indexOf('Polygon') >= 0) ) {
										geometryAttribute = property;
								}
							}
						}
						if (geometryAttribute) {

							//##################### MODIFICA PER AUMENTARE IL BUFFER IN CASO DI SELEZIONE PUNTO #######################
							/*
							if(this.handler.start==this.handler.last){
								var ll = this.map.getLonLatFromPixel(this.handler.start);
								var bounds =  new OpenLayers.Bounds();
								var buffer =  this.map.getExtent().getWidth()*0.01;
								bounds.extend(new OpenLayers.LonLat(ll.lon-buffer,ll.lat-buffer));
								bounds.extend(new OpenLayers.LonLat(ll.lon+buffer,ll.lat+buffer));
								geometry = bounds.toGeometry();
							}
							*/
							//#####################  #######################
						
							// from the click handler we will not get an actual 
							// geometry so transform
							if (!(geometry instanceof OpenLayers.Geometry) && geometry.xy) {
								var point = this.map.getLonLatFromPixel(
									geometry.xy);
								geometry = new OpenLayers.Geometry.Point(
									point.lon, point.lat);
							}
								
							//######## faccio sempre una selezione spaziale anche quando faccio una ricerca !!!! quindi ho sempre un filtro spaziale
							//##### infatti quando uso select come query passo una tra le opzioni estensione completa, estensione corrente, selezione corrente, oggetto selezionato come in gc 2
                            var filter;
                            if(geometry instanceof OpenLayers.Bounds) {
                                filter = new OpenLayers.Filter.Spatial({
                                    type: OpenLayers.Filter.Spatial.BBOX,
                                    property: geometryAttribute.name,
                                    value: geometry
                                });
                            } else {
                                filter = this.createFilter(geometryAttribute, geometry);
                            }
							if (filter !== null) {
								if(this.queryFilters[featureType.typeName]){
									filter = new OpenLayers.Filter.Logical({
									type: OpenLayers.Filter.Logical.AND,
									filters: [
										filter,
										this.queryFilters[featureType.typeName]
										]
									})
								}
							}
							else if(this.queryFilters[featureType.typeName]){
									filter = this.queryFilters[featureType.typeName];
							}
							selection[filterId]["Filters"].push(filter.clone());
							geometryAttribute.typeName = featureType.typeName;
							if(featureType.symbolizer) geometryAttribute.symbolizer = featureType.symbolizer;
							selection[filterId]["geometryAttributes"].push(geometryAttribute);
							
							this.getFeatures(layer,featureType,filter,mode);//query wfs

							//this.events.triggerEvent("selected",{layer:layer,featureType:featureType,filter:filter})

						}
					}
				}
				
				//delete this._queue;
            }

			if(this.highLight) { //SOLO SE VOGLIO ANCHE GLI OGGETTI SELEZIONATI
				//PER OGNI MAPPA(PROGETTO O LAYER INDIP) CREO IL LAYER DI SELEZIONE (SE HO SOLO LAYER DI 1 PROGETTO HO 1 SOLO LAYER DI SELEZIONE
                
				for(filterId in selection){
					var selectionLayer = this.createSelectionLayer(filterId, selection);
					var sld = this.createSLD(selectionLayer, selection[filterId]["Filters"], selection[filterId]["geometryAttributes"]);
										
					//VEDO SE PASSARE IL POST O IN GET
					//VEDERE selectionLayer.tileOptions
					if(sld.length < this.maxSldLength)	
						selectionLayer.mergeNewParams({SLD_BODY:sld});
					else
						var request = OpenLayers.Request.POST({
							url: this.baseUrl + '/services/dumpsld.php',
							data: sld,
							callback: function(response){
								selectionLayer.mergeNewParams({SLD: response.responseText});
							}
					});
				}
			};	
			//this.events.triggerEvent("selected",{start:true});
			delete selection;
			//tengo in memoria la funzione per poterla eseguire se va in buca
			delete this._queue;

        };
		
        this.applySelection();
    },
    
	getFeatures: function(layer,featureType,filter,mode){

		//CONTROLLARE LA GESTIONE DELLE ECCEZIONI
		//PREVEDERE PROXY!!!!
		
		
			/* VEDERE	
		
		var layer = e.layer;
		if(typeof(layer)=="string"){
				layer = this.mapPanel.getGCLayer(layer);
		};
		
		var featureType = e.featureType;
		if(typeof(featureType)=="string"){
			featureTypes = this.mapPanel.gcTools["query"].wfsCache[layer.id].featureTypes;
			for(i=0;i<featureTypes.length;i++){
				if(featureTypes[i].typeName == featureType)
					featureType = featureTypes[i];
			}
		};
		
		if(e.fids){
			e.filter = new OpenLayers.Filter.FeatureId({fids:e.fids});
		}
		

		if(layer == null || featureType == null){
		
			Ext.MessageBox.show({
				title: "Interrogazione",
				maxWidth: 900,
				msg: "Nessun livello interrogabile",
				buttons: Ext.MessageBox.OK,
				icon: Ext.MessageBox.INFO
			});
			return;
		
		} 
		
		//CONTROLLARE LA GESTIONE DELLE ECCEZIONI
		//PREVEDERE PROXY!!!!
		
		
		*/
		if(this.nquery == 0){
            if(this.resultLayer.features.length > 0) {
                this.resultLayer.hasPreviousResults = true;
            }
			//this.resultLayer.removeAllFeatures();
			this.events.triggerEvent('startQueryMap');
		}

		var url;
		if(layer.owsurl) 
			url = layer.owsurl;
		else
			url = layer.url;
		this.nquery++;
		var filter_1_1 = new OpenLayers.Format.Filter({version: "1.1.0"});
		var xml = new OpenLayers.Format.XML();
		var filterValue = xml.write(filter_1_1.write(filter));
		var options = {
            url: url,
            params: {
				PROJECT:layer.params.PROJECT,
				MAP:layer.params.MAP,
                SERVICE: "WFS",
                TYPENAME: featureType.typeName,
				FILTER:filterValue,
				MAXFEATURES:this.maxFeatures,
				SRS:layer.params.SRS,
                REQUEST: "GetFeature",
                VERSION: "1.0.0"
            },
            callback: function(response) {
			
				this.nresponse++;

				var doc = response.responseXML;
				if (!doc || !doc.documentElement) {
					doc = response.responseText;
				}
				var format = new OpenLayers.Format.GML();
				var features = format.read(doc);
				featureType.features = features;
				this.events.triggerEvent('featuresLoaded',featureType);
				//if((this.resultLayer.features.length + features.length) < this.maxVectorFeatures)
                
                for(var i = 0; i < features.length; i++) {
                    features[i].featureTypeName = featureType.typeName;
                }
                if((this.resultLayer.features.length + features.length) < this.maxVectorFeatures) {
                    if(features.length && this.resultLayer.hasPreviousResults) {
                        this.resultLayer.removeAllFeatures();
                        delete this.resultLayer.hasPreviousResults;
                    }
                    this.resultLayer.addFeatures(features);
                } else {
                    this.vectorFeaturesOverLimit.push(features);
                }
				

				if(features.length>0){
					//if(this.addVectorFeatures) this.resultLayer.addFeatures(features);
					//this.writeDataResults(featureType)
/*
					this.map.events.triggerEvent("myfeatureloaded", {
						layer: layer,
						resultLayer:this.resultLayer,
						filter: filter,
						featureType:featureType,
						features:features
					});
*/
				}
				if(this.nquery == this.nresponse){
					this.nquery = this.nresponse = 0;
                    
                    var event = {
                        layer: this.resultLayer,
                        mode: mode
                    };
                    if(this.vectorFeaturesOverLimit.length) {
                        event.vectorFeaturesOverLimit = this.vectorFeaturesOverLimit.slice(0);
                        this.vectorFeaturesOverLimit = [];
                    }
					this.events.triggerEvent('endQueryMap', event);
				}

				//var resp=format.read(doc);
				//if(resp.length>0){

				

					
					//this.map.getControlsByClass("OpenLayers.Control.LoadingPanel")[0].minimizeControl();
					
				//}
            },

            scope: this
        };
		OpenLayers.Request.POST(options);	
	
	},


    applySelection: function() {
        var canApply = (this.layers.length >0);
		/*
        for (var i=0, len=this.layers.length; i<len; i++) {
            if(!(this.layers[i].inRange && this.inRangeLayers) || !(this.layers[i].visibility && this.visibleLayers)) {
                canApply = false;
                break;
            }
        }
        */
		if(!canApply) this.events.triggerEvent("selected"); 
		canApply && this._queue.call(this);
		
		this.autoDeactivate && this.deactivate();

    },


    CLASS_NAME: "OpenLayers.Control.QueryMap"
});
OpenLayers.Map.GisClient = OpenLayers.Class({

   /**
     * Property: url
     * {String} url of GisClient service.
     */
    url: null,

   /**
     * Property: map
     * {<OpenLayers.Map>} this gets set in the constructor.
     */
    map: null,

    /**
     * Property: id
     * {String} Unique identifier for the Editor.
     */
    id: null,

    /**
     * Property: resultsLayer
     * {<OpenLayers.Layer.Vector>} Editor workspace.
     */
    resultsLayer: null,

    /**
     * Property: dialog
     * {<OpenLayers.Editor.Control.Dialog>} ...
     */
    dialog: null,

    /**
     * Property: status
     * @type {function(string, string)} Function to display states, receives status type and message
     */
    showStatus: function (status, message) {
        if (status === 'error') {
            alert(message);
        }
    },

    /**
     * Property: activeControls
     * {Array} ...
     */
    activeControls: [],

    /**
     * Property: editorControls
     * {Array} Contains names of all available editor controls. In particular
     *   this information is needed by this EditorPanel.
     */
    mycontrols: ['CleanFeature', 'DeleteFeature', 'DeleteAllFeatures', 'Dialog', 'DrawHole', 'DrawRegular',
        'DrawPolygon', 'DrawPath', 'DrawPoint', 'DrawText', 'EditorPanel', 'ImportFeature',
        'MergeFeature', 'SnappingSettings', 'SplitFeature', 'CADTools',
        'TransformFeature'],

    /**
     * Geometry types available for editing
     * {Array}
     */
    featureTypes: [],

    /**
     * Property: sourceLayers
     * {Array} ...
     */
    sourceLayers: [],

    /**
     * Property: parameters
     * {Object} ...
     */
    params: {},

    geoJSON: new OpenLayers.Format.GeoJSON(),

    /**
     * Property: options
     * {Object} ...
     */
    options: {},

    /**
     * Property: URL of processing service.
     * {String}
     */
    oleUrl: '',


	initialize : function(url, map, options){

        OpenLayers.Util.extend(this, options);

        if (!options) {
            options = {};
        }

        if (map instanceof OpenLayers.Map) {
            this.mapDiv = map.div;
            this.map.destroy(); //butto la mappa esistente
            //TODO VEDERE COSA TENERE
        } 
        else
        	this.mapDiv = map;


        if (!options.dialog) {
            //this.dialog = new OpenLayers.Editor.Control.Dialog();
            //this.map.addControl(this.dialog);
        }

        this.id = OpenLayers.Util.createUniqueID('OpenLayers.GisClientMap_');

        if (options.resultsLayer) {
            this.resultsLayer = options.resultsLayer
        } else {
            this.resultsLayer = new OpenLayers.Layer.Vector('wfsResults', {
                displayInLayerSwitcher: false
            });
        }
        if (options.styleMap) {
            this.resultsLayer.styleMap = options.styleMap;
        } else {
            this.resultsLayer.styleMap = new OpenLayers.StyleMap({
                'default': new OpenLayers.Style({
                    fillColor: '#07f',
                    fillOpacity: 0.8,
                    strokeColor: '#037',
                    strokeWidth: 2,
                    graphicZIndex: 1,
                    pointRadius: 5
                }),
                // defaultLabel and selectLabel Styles are needed for DrawText Control
                'defaultLabel': new OpenLayers.Style({
                    fillColor: '#07f',
                    fillOpacity: 0.8,
                    strokeColor: '#037',
                    strokeWidth: 2,
                    graphicZIndex: 11,
                    pointRadius: 0,
                    cursor: 'default',
                    label: '${label}',
                    fontColor: '#000000',
                    fontSize: "11px",
                    fontFamily: "Verdana, Arial, Helvetica, sans-serif",
                    fontWeight: "bold",
//					labelAlign: "cm",
//					labelXOffset: 0,
//					labelYOffset: 0,
                    labelOutlineColor: '#FFFFFF',
                    labelOutlineWidth: 4,
                    labelSelect: true
                }),
                'select': new OpenLayers.Style({
                    fillColor: '#fc0',
                    strokeColor: '#f70',
                    graphicZIndex: 2
                }),
                // defaultLabel and selectLabel Styles are needed for DrawText Control
                'selectLabel': new OpenLayers.Style({
                    pointRadius: 5,
                    label: '${label}',
                    fontColor: 'black',
                    fontSize: "11px",
                    fontFamily: "Verdana, Arial, Helvetica, sans-serif",
                    fontWeight: "bold",
                    labelAlign: "cm",
                    labelXOffset: "${xOffset}",
                    labelYOffset: "${yOffset}",
                    fillColor: '#fc0',
                    strokeColor: '#f70',
                    labelOutlineColor: '#fc0',
                    labelOutlineWidth: 6,
                    graphicZIndex: 2
                }),
                'temporary': new OpenLayers.Style({
                    fillColor: '#fc0',
                    fillOpacity: 0.8,
                    strokeColor: '#f70',
                    strokeWidth: 2,
                    graphicZIndex: 2,
                    pointRadius: 5
                })
            });
        }


		if(url!=null){//SE  C'E URL CARICO LA CONFIGURAZIONE DA REMOTO
			var req = {
				url: url,
				success:this.requestComplete,
				failure:function(){alert('fallito')},
				scope: this
			}; 
			//start waiting
			OpenLayers.Request.GET(req);
		}
		else
			this.initGCMap();	
	},
	

	requestComplete : function(response){

		var responseJSON = new OpenLayers.Format.JSON().read(response.responseText);
		//stop waiting
		var script,googleCallback = false;
        if (!responseJSON) {
            this.showStatus('error', OpenLayers.i18n('noJSON'))
        } else if (responseJSON.error) {
            this.showStatus('error', responseJSON.message)
        } else {

        	OpenLayers.Util.extend(responseJSON.mapOptions, this.mapOptions);
        	OpenLayers.Util.extend(this, responseJSON);
        	//console.log(this);return
        	//CHISSA' PER QUALE RAGIONE IN PHP NON SI RIESCE A TRASFORMARE CORRETTAMENTE LE STRINGHE IN FLOAT
			for (var i = 0; i < this.mapOptions.serverResolutions.length; i++) {
				this.mapOptions.serverResolutions[i] = parseFloat(this.mapOptions.serverResolutions[i]);
			};
			this.mapOptions.resolutions = this.mapOptions.serverResolutions.slice(this.mapOptions.minZoomLevel, this.mapOptions.maxZoomLevel);

		    if (this.mapProviders && this.mapProviders.length>0) {
				for (var i = 0, len = this.mapProviders.length; i < len; i++) {
					script = document.createElement('script');
					script.type = "text/javascript";
					script.src = this.mapProviders[i];
					if(this.mapProviders[i].indexOf('google')>0){
						script.src += "&callback=OpenLayers.Map.GisClient.CallBack";
						OpenLayers.Map.GisClient.CallBack = this.createDelegate(this.initGCMap,this);
						googleCallback=true;
					} 
					document.getElementsByTagName('head')[0].appendChild(script);
				}	
            }
			if(!googleCallback)	this.initGCMap();	
        }
	},

	initGCMap: function(){

		this.mapOptions.theme = null;	
		if(this.mapOptions.controls){
			// TOLGO I CONTROLLI PER AGGIUNGERLI DOPO ALTRIMENTI I NUOVI FANNO CASINO... TODO
			var controls = this.mapOptions.controls;
			this.mapOptions.controls = [];
		}
       // this.mapOptions.resolutions = this.mapOptions.serverResolutions.slice(this.mapOptions.minZoomLevel,this.mapOptions.maxZoomLevel);
		this.map = new OpenLayers.Map(this.mapDiv, this.mapOptions);
		this.map.GisClientMap = this;
		this.map.addLayer(new OpenLayers.Layer.Image('EMPTY_BASE_LAYER',OpenLayers.ImgPath +'blank.gif', new OpenLayers.Bounds.fromArray(this.map.maxExtent), new OpenLayers.Size(1,1),{maxResolution:this.map.resolutions[0],  resolutions:this.map.resolutions, displayInLayerSwitcher:true, isBaseLayer:true}));
		this.map.zoomToMaxExtent ({restricted:true});
		this.initLayers();

		//SETTO IL BASE LAYER SE IMPOSTATO
		if(this.baseLayerName) {
			var ret = this.map.getLayersByName(this.baseLayerName);
			if(ret.length > 0) this.map.setBaseLayer(ret[0]);
		}	

		if(controls) this.map.addControls(controls);
		//if(this.mapOptions.center) this.map.setCenter(this.mapOptions.center);
		//if(this.mapOptions.zoom) this.map.zoomTo(this.mapOptions.zoom);
		//console.log(this)
		if(this.callback) this.callback.call(this);

	},
	
	initLayers: function(){
		var cfgLayer,oLayer;

		// baselayer finto
		for (var i = 0, len = this.layers.length; i < len; i++) {
			cfgLayer =  this.layers[i];
			switch(cfgLayer.type){
				case "WMS":
					oLayer = new OpenLayers.Layer.WMS(cfgLayer.name,cfgLayer.url,cfgLayer.parameters,cfgLayer.options);
					if(cfgLayer.nodes) oLayer.nodes = cfgLayer.nodes;
				break;
				case "WMTS":
					oLayer = new OpenLayers.Layer.WMTS(cfgLayer.parameters);
				break;
				case "TMS":
					//CHISSA PERCHE' QUI NON GLI PIACE L'ARRAY
					cfgLayer.options.tileOrigin = new OpenLayers.LonLat(cfgLayer.options.tileOrigin[0],cfgLayer.options.tileOrigin[1]);
					cfgLayer.options.resolutions = this.map.resolutions;
                    oLayer = new OpenLayers.Layer.TMS(cfgLayer.name,cfgLayer.url,cfgLayer.options);
				break;
				case "OSM":
					cfgLayer.options.resolutions = this.map.resolutions;
					oLayer = new OpenLayers.Layer.OSM(cfgLayer.name,null,cfgLayer.options);
				break;	
				case "Google":
					cfgLayer.options.resolutions = this.map.resolutions;
					oLayer = new OpenLayers.Layer.Google(cfgLayer.name,cfgLayer.options);
				break;			
				case "Bing":
					cfgLayer.options.resolutions = this.map.resolutions;
					oLayer = new OpenLayers.Layer.Bing(cfgLayer.options);
				break;	
				case "Yahoo":
					cfgLayer.options.resolutions = this.map.resolutions;
					oLayer = new OpenLayers.Layer.Yahoo(cfgLayer.name,cfgLayer.options);
				break;

			}

			this.map.addLayer(oLayer);
		}
	},

	CLASS_NAME: "OpenLayers.Map.GisClient"
});
function createDelegate(handler, obj)
{
    obj = obj || this;
    return function() {
        handler.apply(obj, arguments);
    }
}
OpenLayers.Map.GisClient.prototype.createDelegate = createDelegate;
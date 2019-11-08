OpenLayers.GisClient = OpenLayers.Class({

   /**
     * Property: baseUrl
     * {String} url of GisClient.
     */
    baseUrl: null,

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

    activeLayers:[],

    mapsetWMS: null,

    mapsetWMTS: null,

    useGMaps: false,

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


        if(url!=null){//SE  C'E URL CARICO LA CONFIGURAZIONE DA REMOTO
            var req = {
                url: url,
                success:this.requestComplete,
                failure:function(){alert('caricamento del servizio fallito')},
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
        var script = false;
        if (!responseJSON) {
            this.showStatus('error', OpenLayers.i18n('noJSON'))
        } else if (responseJSON.error) {
            this.showStatus('error', responseJSON.message)
        } else {

            OpenLayers.Util.extend(responseJSON.mapOptions, this.mapOptions);
            OpenLayers.Util.extend(this, responseJSON);

            //FIX Proj4js bug ??
            Proj4js.defs["EPSG:3857"] = Proj4js.defs["GOOGLE"];
            if(this.projdefs){
                for (key in this.projdefs){
                    if(!Proj4js.defs[key]) Proj4js.defs[key] = this.projdefs[key];
                }
            }
            // **** Parse to float resolutions
            // **** NOTE: gisclient will generate resolutions array as string, to override php floating point precision limit
            for (var i = 0; i < this.mapOptions.resolutions.length; i++) {
                this.mapOptions.resolutions[i] = parseFloat(this.mapOptions.resolutions[i]);
            };


            //this.mapOptions.resolutions = this.mapOptions.serverResolutions.slice(this.mapOptions.minZoomLevel, this.mapOptions.maxZoomLevel);
            var nProviders = 0;
            if (this.mapProviders && this.mapProviders.length>0) {
                for (var i = 0, len = this.mapProviders.length; i < len; i++) {
                    var self = this;
                    var extUrl = this.mapProviders[i];
                    if(extUrl.indexOf('google')>0){
                        extUrl += "&callback=OpenLayers.GisClient.CallBack";
                        OpenLayers.GisClient.CallBack = self.createDelegate(self.initGCMap,self);
                        self.useGMaps=true;
                    }
                    $.ajax({
                        url: extUrl,
                        type: 'HEAD',
                        dataType: 'script',
                        complete: function(jqXHR, testStatus){
                            nProviders++;
                            if (jqXHR.readyState != 4 || jqXHR.status != 200) {
                            var script = document.createElement('script');
                                if(this.url.indexOf('google')>0){
                                    OpenLayers.GisClient.CallBack = null;
                                    self.useGMaps=false;
                                }
                                //document.getElementsByTagName('head')[0].appendChild(script);
                            }
                            if (!self.useGMaps && nProviders == self.mapProviders.length)
                                self.initGCMap();

                        }
                    });

                }
            }
            else {
                this.initGCMap();
            }

        }
    },

    initGCMap: function(){

        OpenLayers.DOTS_PER_INCH = this.dpi;
        this.mapOptions.theme = null;
        this.mapOptions.tileManager = null;
        this.mapOptions.zoomDuration = 10;
        if(this.mapOptions.controls){
            // TOLGO I CONTROLLI PER AGGIUNGERLI DOPO ALTRIMENTI I NUOVI FANNO CASINO... TODO
            var controls = this.mapOptions.controls;
            this.mapOptions.controls = [];
        }
       // this.mapOptions.resolutions = this.mapOptions.serverResolutions.slice(this.mapOptions.minZoomLevel,this.mapOptions.maxZoomLevel);
        this.map = new OpenLayers.Map(this.mapDiv, this.mapOptions);
        this.map.config = this;
        this.emptyBaseLayer = new OpenLayers.Layer.Image('EMPTY_BASE_LAYER',OpenLayers.ImgPath +'blank.gif', this.map.maxExtent, new OpenLayers.Size(1,1),{maxResolution:this.map.resolutions[0],  resolutions:this.map.resolutions, displayInLayerSwitcher:true, isBaseLayer:true});
        this.map.addLayer(this.emptyBaseLayer);
        this.map.zoomToMaxExtent ({restricted:true});


        this.initLayers();

        if(controls) this.map.addControls(controls);
        //if(this.mapOptions.center) this.map.setCenter(this.mapOptions.center);
        //if(this.mapOptions.zoom) this.map.zoomTo(this.mapOptions.zoom);
        //console.log(this)

        //SETTO IL BASE LAYER SE IMPOSTATO
        if(this.baseLayerName) {
            var ret = this.map.getLayersByName(this.baseLayerName);
            if(ret.length > 0) this.map.setBaseLayer(ret[0]);
        }

        if(OpenLayers.GisClient.OverviewMap){
            this.overviewMap = new OpenLayers.GisClient.OverviewMap({
                layers: this.layers
            });
            this.map.addControl(this.overviewMap);
        }

        if(this.callback) this.callback.call(this);



    },

    initLayers: function(){
        var cfgLayer,oLayer,owLayer;

        // **** Reverse layers order (Use tree order for layers overlap)
        // **** Force Z-index for specific layers based on layer option zindex_correction
        var orderLayer = [], orderLayerNeg = [], orderLayerPos =[];
        for (var i = this.layers.length-1; i >=0; i--) {
            var layerOrder = 0;
            if (typeof(this.layers[i].options) !== 'undefined') {
                layerOrder = this.layers[i].options.zindex_correction;
            }
            else if (typeof(this.layers[i].parameters) !== 'undefined') {
                layerOrder = this.layers[i].parameters.zindex_correction;
            }

            if (typeof(layerOrder) == 'undefined') {
                orderLayer.push(this.layers[i]);
            }
            else if (layerOrder > 0) {
                orderLayerPos.push(this.layers[i]);
            }
            else if (layerOrder < 0) {
                orderLayerNeg.push(this.layers[i]);
            }
            else {
                orderLayer.push(this.layers[i]);
            }
        }

        orderLayerNeg.sort(function(layerA,layerB) {
            var layerOrderA = 0;
            var layerOrderB = 0;
            if (typeof(layerA.options) !== 'undefined') {
                layerOrderA = layerA.options.zindex_correction;
            }
            else if (typeof(layerA.parameters) !== 'undefined') {
                layerOrderA = layerA.parameters.zindex_correction;
            }

            if (typeof(layerB.options) !== 'undefined') {
                layerOrderB = layerB.options.zindex_correction;
            }
            else if (typeof(layerB.parameters) !== 'undefined') {
                layerOrderB = layerB.parameters.zindex_correction;
            }

            return (layerOrderA - layerOrderB);
        });
        orderLayerPos.sort(function(layerA,layerB) {
            var layerOrderA = 0;
            var layerOrderB = 0;
            if (typeof(layerA.options) !== 'undefined') {
                layerOrderA = layerA.options.zindex_correction;
            }
            else if (typeof(layerA.parameters) !== 'undefined') {
                layerOrderA = layerA.parameters.zindex_correction;
            }

            if (typeof(layerB.options) !== 'undefined') {
                layerOrderB = layerB.options.zindex_correction;
            }
            else if (typeof(layerB.parameters) !== 'undefined') {
                layerOrderB = layerB.parameters.zindex_correction;
            }

            return (layerOrderA - layerOrderB);
        });

        orderLayer = orderLayerNeg.concat(orderLayer.concat(orderLayerPos));

        for (var i = 0; i < orderLayer.length; i++) {
            cfgLayer =  orderLayer[i];
            oLayer = null;
            switch(cfgLayer.typeId){
                case 1:
                case 3:
                    oLayer = new OpenLayers.Layer.WMS(cfgLayer.name,cfgLayer.url,cfgLayer.parameters,cfgLayer.options);
                    if(cfgLayer.nodes){
                        //SE MAPPROXY AGGIUNGO IL LAYER WMTS
                        oLayer.nodes = cfgLayer.nodes;
                        // **** Reverse layers order (Use tree order for layers overlap)
                        if (oLayer.params["LAYERS"] && oLayer.params["LAYERS"].length > 0) {
                          revLayers = oLayer.params["LAYERS"];
                          revLayers.reverse();
                          oLayer.mergeNewParams({layers:revLayers});
                        }
                        //tema singolo per ora non in uso
                        //if(this.useMapproxy && cfgLayer.theme_single) this.addThemeLayer(oLayer);
                    }
                break;
                case 2:
                    //cfgLayer.parameters.matrixSet = this.mapOptions.matrixSet;
                    cfgLayer.parameters.requestEncoding = "REST";
                    oLayer = new OpenLayers.Layer.WMTS(cfgLayer.parameters);
                break;
                case 6:
                    //CHISSA PERCHE' QUI NON GLI PIACE L'ARRAY
                    cfgLayer.options.tileOrigin = new OpenLayers.LonLat(cfgLayer.options.tileOrigin[0],cfgLayer.options.tileOrigin[1]);
                    //cfgLayer.options.serverResolutions = this.map.resolutions;
                    //cfgLayer.options.resolutions = this.map.resolutions;
                    oLayer = new OpenLayers.Layer.TMS(cfgLayer.name,cfgLayer.url,cfgLayer.options);
                break;
                case 5:
                    //maxlevel = 18

                    cfgLayer.options.resolutions = this.map.resolutions.slice(0, 19 - cfgLayer.options.zoomOffset);
                    oLayer = new OpenLayers.Layer.OSM(cfgLayer.name,null,cfgLayer.options);
                break;
                case 7:
                    if (this.useGMaps) {
                        //cfgLayer.options.resolutions = this.map.resolutions;
                        oLayer = new OpenLayers.Layer.Google(cfgLayer.name,cfgLayer.options);
                    }
                break;
                case 8:
                    cfgLayer.options.resolutions = this.map.resolutions;
                    oLayer = new OpenLayers.Layer.Bing(cfgLayer.options);
                break;
                case 9:
                    //CHISSA PERCHE' QUI NON GLI PIACE L'ARRAY tanto l'ho tolto
                    //cfgLayer.options.tileOrigin = new OpenLayers.LonLat(cfgLayer.options.tileOrigin[0],cfgLayer.options.tileOrigin[1]);
                    //cfgLayer.options.serverResolutions = this.map.resolutions;
                    cfgLayer.options.resolutions = this.map.resolutions;
                    oLayer = new OpenLayers.Layer.XYZ(cfgLayer.name,cfgLayer.url,cfgLayer.options);
                    console.log(oLayer)
                break;
                case 4:
                    cfgLayer.options.resolutions = this.map.resolutions;
                    oLayer = new OpenLayers.Layer.Yahoo(cfgLayer.name,cfgLayer.options);
                break;

            }
            //var theme_id = (cfgLayer.parameters && cfgLayer.parameters.theme_id) || cfgLayer.options.theme_id;
            //oLayer.id = theme_id+"_"+cfgLayer.name;
            if (oLayer)
                this.map.addLayer(oLayer);
        }

        if(this.mapsetTiles == 2) this.addMapsetWMTS();
        if(this.mapsetTiles == 3) this.addMapsetWMS();

    },

    //SERVIVA PER IL TEMA UNICO IN CACHE
    addThemeLayer: function(oLayer){
        var baseUrl = this.mapProxyBaseUrl + this.projectName + "/" + "/" + this.mapsetName +"/wmts/";
        var layerParams = {
            "name": oLayer.name + '_tiles',
            "layer": oLayer.name + '_tiles',
            "url": baseUrl + oLayer.name + "_tiles/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.png",
            "style": "",
            "matrixSet": this.mapOptions.matrixSet,
            "requestEncoding": "REST",
            "maxExtent": this.mapOptions.tilesExtent,
            "zoomOffset": this.mapOptions.minZoomLevel,
            "transitionEffect": "resize",
            "displayInLayerSwitcher":false,
            "visibility":true,
            "serverResolutions":this.mapOptions.serverResolutions,
            "isBaseLayer":oLayer.isBaseLayer
        };
        var ll = new OpenLayers.Layer.WMTS(layerParams);
        var vis = oLayer.params['LAYERS'].length == oLayer.nodes.length;
        ll.setVisibility(vis);
        this.map.addLayer(ll);
    },


    //LAYER MAPSET WMTS COMPLETO IN CONFIGURAZINE DI AVVIO IN CACHE
    addMapsetWMTS: function(){
        var baseUrl = this.mapProxyBaseUrl + "/"  + this.projectName + "/" + this.mapsetName +"/wmts/";
        var layerParams = {
            "name": this.mapsetName,
            "layer": this.mapsetName + '_tiles',
            "url": baseUrl + this.mapsetName + "_tiles/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.png",
            "style": "",
            "matrixSet": this.mapOptions.matrixSet,
            "requestEncoding": "REST",
            "maxExtent": this.mapOptions.tilesExtent,
            "zoomOffset": this.mapOptions.levelOffset,
            "transitionEffect": "resize",
            "displayInLayerSwitcher":false,
            "visibility":false,
            "serverResolutions":this.mapOptions.serverResolutions,
            "gridResolution": this.mapOptions.resolutions[0],
            "isBaseLayer":false
        };
        this.mapsetTileLayer = new OpenLayers.Layer.WMTS(layerParams);
        this.map.addLayer(this.mapsetTileLayer);
    },

    //LAYER MAPSET WMS COMPLETO IN CONFIGURAZINE DI AVVIO IN CACHE
    addMapsetWMS: function(){
        var baseUrl = this.mapProxyBaseUrl + "/" + this.projectName + "/" + this.mapsetName + "/service";
        var layerParams = {
            "map": this.mapsetName,
            "exceptions": "xml",
            "format": "image/png",
            "transparent": true,
            "layers": [
                this.mapsetName + "_tiles"
            ]
        }
        var layerOptions = {
            "transitionEffect": "resize",
            "displayInLayerSwitcher":false,
            "visibility":false,
            "singleTile":true,
            "isBaseLayer":false
        };
        this.mapsetTileLayer = new OpenLayers.Layer.WMS(this.mapsetName,baseUrl,layerParams,layerOptions);
        this.map.addLayer(this.mapsetTileLayer);
    },

    getFeatureType: function(featureTypeName) {
        var featureTypes = this.featureTypes,
            len = featureTypes.length, fType, i;

        for(i = 0; i < len; i++) {
            if(featureTypes[i].typeName == featureTypeName) {
                fType = featureTypes[i];
                break;
            }
        }

        return fType;
    },

    CLASS_NAME: "OpenLayers.GisClient"
});
function createDelegate(handler, obj)
{
    obj = obj || this;
    return function() {
        handler.apply(obj, arguments);
    }
}
OpenLayers.GisClient.prototype.createDelegate = createDelegate;

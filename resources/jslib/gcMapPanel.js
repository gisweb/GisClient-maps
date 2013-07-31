//Ext.namespace("GisClient");  //NON piace ad explorer !!!!!!!!!!!!!!!!!!!!!!!!! AZZZZZZZ
GisClient={};
//TODO: TESTI N PROPRIETA PER SETTARE LINGUE O STRINGHE PERSONALIZZATE

GisClient.MapPanel = Ext.extend(
	GeoExt.MapPanel,
	{
		region: 'center',
		sliderTemplate: "Scale: 1 : {scale}",
		baseLayerText: "Base layer",
		baseLayerGroup: "",
		id: 'gc-mappanel-' + this.name,
		useCookies: true,
		activeLayer: null,//Layer correntemente attivo per farci qualcosa (di solito selezionati dall'albero)
		resultLayer: null,//Layer vettoriale con i risultati di qualche interrogazione
		selectControl: null,//Controllo di selezione su resultLayer
		gcTools: {}, //hash con i vari tools
		infoWin:null, //finestra di popup per url

		initComponent : function() {
		
			var gxMapPanelOptions = {
			
				items: [
						{
							xtype: "gx_zoomslider",
							vertical: true,
							height: 220,
							x: 10,
							y: 20,
							minValue:this.minZoomLevel,
							plugins: new GeoExt.ZoomSliderTip({template:this.sliderTemplate})
						}
					],

					bbar : new Ext.Container(),
					tbar: new Ext.Toolbar({items: []})
			}
			
			Ext.apply(this, gxMapPanelOptions);

			if(this.layers) this.map.layers = this.layers;	
			GisClient.MapPanel.superclass.initComponent.call(this);
			//Add dummy base layer
			var emptyBaseLayer = new OpenLayers.Layer.Image(this.baseLayerText,Ext.BLANK_IMAGE_URL, this.map.maxExtent, new OpenLayers.Size(1,1),{"gc_id":"GisClient_empty_base","displayInLayerSwitcher":true,"isBaseLayer":true,"group":this.baseLayerGroup});
			this.map.addLayer(emptyBaseLayer);
			this.map.setLayerIndex(emptyBaseLayer,0);
			
			if(this.baseLayerId) 
				this.map.setBaseLayer(this.getGCLayer(this.baseLayerId));
			else
				this.map.setBaseLayer(emptyBaseLayer);
			
			this.addEvents('activelayerset');
			
			if(this.useCookies) this.readCookies()

		},	
		
		
		getMap : function() {
			return this.map;
		},

		getGCLayer: function(gcId){
		
			var layer = null;
			var lays = this.map.getLayersBy("gc_id",gcId);
			if (lays.length > 0) layer = lays[0];
			return layer;
		
		},

		setActiveLayer: function(layer){
		
			if(typeof(layer)=="string")
				layer = this.getGCLayer(layer);
				
			this.activeLayer = layer;	
			this.fireEvent("activelayerset",this,layer);
		},
		
		readCookies: function(){
			if(Ext.util.Cookies.get('gcZoomLevel-' +  this.name)){
				var zoom = parseInt(Ext.util.Cookies.get('gcZoomLevel-' + this.name));
				var lat = parseFloat(Ext.util.Cookies.get('gcCenterLat-' + this.name));
				var lon = parseFloat(Ext.util.Cookies.get('gcCenterLon-' + this.name));
				this.map.setCenter(new OpenLayers.LonLat(lon,lat),zoom);
			}
			this.map.events.register("moveend", this, function(){
				//Registro l'ultima posizione in cookies
				Ext.util.Cookies.set('gcCenterLat-' + this.name, this.map.center.lat);
				Ext.util.Cookies.set('gcCenterLon-' + this.name, this.map.center.lon);
				Ext.util.Cookies.set('gcZoomLevel-' + this.name, this.map.zoom);
			});
		},
		
		openUrl: function(conf){

			if(this.infoWin)
				this.infoWin.destroy();

			if(!conf.height) conf.height = 600;
			if(!conf.width) conf.width = 800;
			if(!conf.title) conf.title = 'External url';
			if(conf.url) conf.html = '<iframe width="100%" height="100%" src="' + conf.url + '"></iframe>';
			this.infoWin = new Ext.Window (conf);
			this.infoWin.show();
			
		}
});

/** api: xtype = hr_mappanel */
Ext.reg('gc_mappanel', GisClient.MapPanel);

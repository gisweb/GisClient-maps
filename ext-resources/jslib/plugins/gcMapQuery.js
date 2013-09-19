Ext.namespace("GisClient.plugins");
//Strumento di interrogazione di un elenco di layer (mapPanel.activeLayers)

GisClient.plugins.MapQuery = Ext.extend(Ext.util.Observable, {

	labelText: 'Interroga: ',
	queryBoxText: 'Punto / Riquadro',
	queryPolygonText: 'Poligono',
	queryCircleText: 'Cerchio',
	queryAreaText: 'Area',
	selgroupAllLayers: 'Tutti i livelli',
	selgroupVisibleLayers: 'Tutti i livelli visibili',
	selgroupActiveLayer: 'Attivo: Nessun livello attivo',
	cleanSelectionText: 'Deseleziona oggetti',
	//selgroupActive: 'ActiveLayer',
	selgroupActive: 'VisibleLayers',
	//activeControl: null,
	activeToolIndex: 0,
	maxVectorFeatures: 200,
	toggleGroup: 'mapToolbar',	
	wfsCache: {},
	queryLayers: [],
	queryFilters:{},
	nquery:0,
	nresponse:0,//Per il monitoraggio di fine processo
	resultLayer: null,//LAYER VETTORIALE PER I RISULTATI
	activeLayer:null,
	resultLayerStyle: new OpenLayers.StyleMap({
		'default': {
			fill: false,
			fillColor: "#ff00FF",
			fillOpacity: 0.1,
			hoverFillColor: "white",
			hoverFillOpacity: 0.1,
			strokeColor: "yellow",
			strokeOpacity: 0.4,
			strokeWidth: 4,
			strokeLinecap: "round",
			strokeDashstyle: "solid",
			hoverStrokeColor: "red",
			hoverStrokeOpacity: 1,
			hoverStrokeWidth: 0.2,
			pointRadius: 6,
			hoverPointRadius: 1,
			hoverPointUnit: "%",
			pointerEvents: "visiblePainted",
			cursor: "inherit"
		},
		'select': {
			fill: true,
			fillColor: "blue",
			fillOpacity: 0.4,
			hoverFillColor: "white",
			hoverFillOpacity: 0.8,
			strokeColor: "yellow",
			strokeOpacity: 1,
			strokeWidth: 4,
			strokeLinecap: "round",
			strokeDashstyle: "solid",
			hoverStrokeColor: "red",
			hoverStrokeOpacity: 1,
			hoverStrokeWidth: 0.2,
			pointRadius: 6,
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
	}),


    constructor: function(config) {
        Ext.apply(this.initialConfig, Ext.apply({}, config));
        Ext.apply(this, config);
		this.addEvents(
			"cleanselection","pippo"
		);
		GisClient.plugins.MapQuery.superclass.constructor.apply(this, arguments); 
	},

    init: function(mapPanel){
		this.mapPanel = mapPanel;
		this.map = mapPanel.map;
		var self=this;

		if(!this.resultLayer) this.initResultLayer();
		this.initWfsCache();

		this.initSelActions();
		this.initSelGroups();
		this.initSelOptions();
		this.setQueryLayers();
		
		var queryTools = new Ext.SplitButton({
			enableToggle: true,
			toggleGroup: this.toggleGroup, // Ext doesn't respect this, registered with ButtonToggleMgr below
			allowDepress: false, // Ext doesn't respect this, handler deals with it
			handler: function(button, event) {
				// allowDepress should deal with this first condition
				if(!button.pressed) {
					button.toggle();
				} else {
					button.menu.items.itemAt(self.activeToolIndex).setChecked(true);
				}
			},
			listeners: {
				toggle: function(button, pressed) {
					// toggleGroup should handle this
					if(!pressed) {
						button.menu.items.each(function(i) {
							if(i.setChecked) i.setChecked(false);
						});
					}
				},
				render: function(button) {
					// toggleGroup should handle this
					Ext.ButtonToggleMgr.register(button);
				}
			},
			menu: new Ext.menu.Menu({
				items: [
					new Ext.menu.CheckItem(this.actions[0]),
					new Ext.menu.CheckItem(this.actions[1]),
					new Ext.menu.CheckItem(this.actions[2]),
					new Ext.menu.CheckItem(this.actions[3])
					,
					'-',
					{
						text: 'Interroga a gruppi',
						id: 'queryByGroup',
						hideOnClick: false,
						menu: {        // <-- submenu by nested config object
							items: this.selgroupItems
						}
					},
					'-',
					/*
					{
						text: 'Opzioni / Azioni',
						hideOnClick: false,
						menu: {        // <-- submenu by nested config object
							items: this.selOptions
						}
					},
					'-',*/
					{
						id: 'clean-selection',
						text: this.cleanSelectionText,
						iconCls: 'clean_selection',
						disabled: true,
						handler: this.cleanSelection,
						scope: this
					}
				]
			})
		});
		
		queryTools.menu.items.each(function(item, index) {
			item.on({checkchange: function(item, checked) {
				queryTools.toggle(checked);
				if(checked) {
					self.activeToolIndex = index;
					queryTools.setIconClass(item.iconCls);
					queryTools.setTooltip(item.text);
				}
			}});
		});
		
		this.queryTools = queryTools;
		//Inizializza l'icona giusta
		queryTools.setIconClass(queryTools.menu.getComponent(self.activeToolIndex).iconCls);
		
		mapPanel.gcTools["query"] = this;
		mapPanel.getTopToolbar().add(" ","-"," ",this.labelText,queryTools);
		//mapPanel.on('activelayerset', this.setQueryLayers, this);
		mapPanel.on('activelayerset', function(mapPanel,layer){
			this.activeLayer = layer;
			this.queryTools.menu.getComponent('queryByGroup').menu.getComponent('queryActiveLayer').setText('Attivo: ' + layer.name);	
			if(this.selgroupActive=='ActiveLayer') this.setQueryLayers();
		}, this)
		
       	mapPanel.map.events.on({
            changelayer: this.updateQueryLayers,
            scope: this
        });
    },

	initResultLayer: function(){

		var resultLayer = new OpenLayers.Layer.Vector('Selezione',{displayInLayerSwitcher:false, styleMap: this.resultLayerStyle});
		resultLayer.id = 'gc_dataviewlayer';
		resultLayer.events.register('beforefeatureadded', this, this.checkFeature);
		
		this.map.addLayer(resultLayer);


		//Setto i controlli
		var selectControl = new OpenLayers.Control.SelectFeature(resultLayer);
		var modifyControl = new OpenLayers.Control.ModifyFeature(resultLayer);
		var highlightControl = new OpenLayers.Control.SelectFeature(resultLayer,
			{
				hover: true,
				highlightOnly: true,
				renderIntent: "temporary"
			}
		);

		this.map.addControl(modifyControl);
		this.map.addControl(selectControl);	
		this.map.addControl(highlightControl);
	
		this.selectControl = selectControl;
		this.highlightControl = highlightControl;
		this.modifyControl = modifyControl;
		
		this.resultLayer = resultLayer;

	},
	
	
	initWfsCache:function(){
		var layer;
	    for (var i = 0; i < this.mapPanel.featureTypes.length; i++) {
	        layer =  this.mapPanel.map.getLayersByName(this.mapPanel.featureTypes[i].WMSLayerName)[0];
	        if(typeof(this.wfsCache[layer.id])=='undefined') this.wfsCache[layer.id] = {featureTypes:[]};
	        this.wfsCache[layer.id].featureTypes.push(this.mapPanel.featureTypes[i]);
	       // layer.events.register("visibilitychanged",this,function(){
			//	this.setQueryLayers()
					//this.activeControl.setLayers(this.queryLayers); 
			//});
	    };
	},
	
	initSelActions: function(){
		var self=this;
		this.actions = [
		new GeoExt.Action({
			text: this.queryBoxText,
			iconCls: 'query-box',
			map: self.mapPanel.map,
			control: new OpenLayers.Control.GisClientSLDSelect(
				OpenLayers.Handler.RegularPolygon,
				{
					wfsCache:this.wfsCache,
					layers:this.queryLayers,					
					queryFilters:this.queryFilters,					
					handlerOptions: {
						irregular: true
					}
				}
			)
		}),
		new GeoExt.Action({
			text: this.queryPolygonText,
			iconCls: "query-polygon",
			map: self.mapPanel.map,
			control: new OpenLayers.Control.GisClientSLDSelect(
				OpenLayers.Handler.Polygon,
				{
					wfsCache:self.wfsCache,
					layers:this.queryLayers,	
					queryFilters:this.queryFilters,
					handlerOptions: {
						irregular: false
					}
				}
			)
		}),
		new GeoExt.Action({
			text: this.queryCircleText,
			iconCls: 'query-circle',
			map: self.mapPanel.map,
			control: new OpenLayers.Control.GisClientSLDSelect(
				OpenLayers.Handler.RegularPolygon,
				{
					wfsCache:self.wfsCache,
					layers:this.queryLayers,
					queryFilters:this.queryFilters,					
					handlerOptions: {
						sides: 30
					}
				}
			)
		}),
		new GeoExt.Action({
			text: this.queryAreaText,
			iconCls: 'query-area',
			map: self.mapPanel.map,
			control: new OpenLayers.Control.GisClientSLDSelect(
				OpenLayers.Handler.Polygon,
				{
					wfsCache:self.wfsCache,
					layers:this.queryLayers,					
					queryFilters:this.queryFilters,
					handlerOptions: {
						irregular: false,
						freehand: true
					}
				}
			)
		})
		];
		
		Ext.each(this.actions,function(action){
			action.control.events.register('activate',this,this.activateControl);
			action.control.events.register('deactivate',this,this.deactivateControl);
			//CAPIRE PERCHE' CON DEACTIVATE NON TIRA SU IL BOTTONE!!!!!!!!!!!!!!!!!!!!

			action.control.events.register('selected',this,this.getFeatures)

		},this);
	},
	
	
	cleanSelection: function(){
		this.resultLayer.removeAllFeatures();
		this.queryTools.menu.getComponent('clean-selection').disable();
		this.fireEvent('cleanselection');
	},
	
	initSelGroups: function(){
		var self=this;
		
		var onItemCheck=function(){
			if(this.checked){
				//SETTA I LAYER DA INTERROGARE IN FUNZIONE DEL GRUPPO DI INTERROGAZIONE
				//SE HO UN CONTROLLO DI SELEZIONE ATTIVO NE AGGIORNO I LAYERS
				self.selgroupActive = this.selgroupId;
				self.setQueryLayers();
				//if(self.activeControl)	self.activeControl.setLayers(self.queryLayers);
			}
		};
		
		var item;
		this.selgroupItems = [	
			'<b class="menu-title">Gruppi di interrogazione</b>',
			{
				text: this.selgroupActiveLayer,
				id: 'queryActiveLayer',
				checked: (this.selgroupActive == 'ActiveLayer'),
				selgroupId: 'ActiveLayer',
				group: 'selGroup',
				checkHandler: onItemCheck
			},
			{
				text: this.selgroupVisibleLayers,
				checked: (this.selgroupActive == 'VisibleLayers'),
				selgroupId: 'VisibleLayers',
				group: 'selGroup',
				checkHandler: onItemCheck
			}
		];

		Ext.iterate(self.mapPanel.selgroup,function(name,selgroup){
			this.selgroupItems.push(
				{
					text: selgroup.title,
					checked: false,
					selgroupId: name,
					group: 'selGroup',
					checkHandler: onItemCheck
				});	
		},this);
		
		this.selgroupItems.push({
			text: this.selgroupAllLayers,
			checked: (this.selgroupActive == 'AllLayers'),
			selgroupId: 'AllLayers',
			group: 'selGroup',
			checkHandler: onItemCheck
		});
	
	
	},
	
	initSelOptions: function(){
		var self=this;
		
		var onItemCheck=function(){
			if(this.checked){
			}
		};
		this.selOptions = [
			// stick any markup in a menu
			'<b class="menu-title">Opzioni</b>',
			{
				text: 'Evidezia oggetti ??',
				checked: true,
				group: 'optionGroup',
				checkHandler: onItemCheck
			}, {
				text: 'Evidezia e centra oggetti ??',
				checked: true,
				group: 'optionGroup',
				checkHandler: onItemCheck
			}, {

				text: 'Vettoriali ???',
				checked: false,
				group: 'optionGroup',
				checkHandler: onItemCheck
			}, {
				text: 'Solo info ???',
				checked: false,
				group: 'optionGroup',
				checkHandler: onItemCheck
			}
		]
	
	},
	
	checkFeature: function(e){
	
		//controllo se ho raggiunto il max numero di oggeti previsto
		if(e.object.features.length >= this.maxVectorFeatures) return false;
		this.queryTools.menu.getComponent('clean-selection').enable();

		//coloro gli oggetti se esiste uno stile dedicato??????
		//casino colorare gli oggetti perchè poi bisogna gestire a mano i vari stili (temporary e select)
		//var symbolizer = {strokeColor: "red"};e.feature.style=symbolizer;
		//console.log(e);

	},
	
	
	activateControl: function(e){
		this.highlightControl.activate();
		this.selectControl.activate();
		this.activeControl =  e.object;
		this.activeControl.layers = this.queryLayers; 
	},
	
	deactivateControl: function(e){
		this.selectControl.deactivate();
		this.highlightControl.deactivate();

		//this.activeControl.layers = []; 		
		//this.activeControl = null;
	},
	
	setQueryLayers: function(){

		if(typeof(console)!="undefined") console.log('Active selgroup => ' + this.selgroupActive);
		//this.queryTools.toggle(false);
		this.queryLayers = [];

		switch (this.selgroupActive) { 

			case 'ActiveLayer': 

				if(!this.activeLayer && this.activeControl){
					this.queryTools.toggle(false);
					Ext.MessageBox.show({
						title: 'Attenzione',
						maxWidth: 900,
						msg: 'manca layer attivo',
						buttons: Ext.MessageBox.OK,
						icon: Ext.MessageBox.WARNING
					});
					return;
					
				}
				if(this.activeLayer){
					this.queryLayers = [this.activeLayer];
					if(Ext.getCmp("tb-result")) Ext.getCmp("tb-result").setText('<b>  INTERROGA LIVELLO ATTIVO: ' + this.activeLayer.name + '</b>');
				}



			break; 

			case 'VisibleLayers': 
				Ext.each(this.map.layers,function(layer){
					if(layer instanceof OpenLayers.Layer.WMS && this.wfsCache[layer.id] && layer.visibility && layer.inRange){
						this.queryLayers.push(layer);
					}
				},this);
				if(Ext.getCmp("tb-result")) Ext.getCmp("tb-result").setText('  INTERROGA LIVELLI VISIBILI ');
				//TODO : nome auto  if(this.queryTools && Ext.getCmp("tb-result")) Ext.getCmp("tb-result").setText('  INTERROGA ' + this.queryTools.menu.getComponent('queryByGroup').menu.getComponent('queryVisobleLayer').text);	

			break; 

			case 'AllLayers': 
			
				var layers = this.queryLayers;
				Ext.each(this.map.layers,function(layer,index){
					if(layer instanceof OpenLayers.Layer.WMS && layer.featureTypes){
						layers.push(layer);
					}
				});			
			if(Ext.getCmp("tb-result")) Ext.getCmp("tb-result").setText('  INTERROGA TUTTI I LIVELLI');

			break; 

			default: //GRUPPI DI INTERROGAZIONE
				var grouplayers = this.map.getLayersBy('selgroupId',this.selgroupActive);
				Ext.each(grouplayers,function(layer,index){
					if(layer instanceof OpenLayers.Layer.WMS && layer.featureTypes){
						this.queryLayers.push(layer);
					}
				});	
			
		}
		if(this.activeControl) this.activeControl.layers = this.queryLayers; 
		console.log(this.queryLayers)

	},
		
	updateQueryLayers: function(e){

		if(this.selgroupActive == 'VisibleLayers' && typeof(this.wfsCache[e.layer.id])!='undefined'){
			var index = -1;
			for (var i = 0; i < this.queryLayers.length; i++) {
				if(this.queryLayers[i].id == e.layer.id) index = i
			};
			if(e.layer.visibility && e.layer.inRange)
				index==-1 && this.queryLayers.push(e.layer); 
			else
				index!=-1 && this.queryLayers.splice(index,1);
		}

	},

	getFeatures: function(e){

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
		if(this.nquery == 0){
			this.resultLayer.removeAllFeatures();
			this.mapPanel.fireEvent('loading',{start:true,title:'Interrogazione',width:200,msg:'Ricerca informazioni in corso....'})
			this.fireEvent('featureload',{start:true});
		}
			
			
		this.nquery++;
		var filter_1_1 = new OpenLayers.Format.Filter({version: "1.1.0"});
		var xml = new OpenLayers.Format.XML();
		var filterValue = xml.write(filter_1_1.write(e.filter));
	
		var options = {
            url: layer.wfsSchema?layer.wfsSchema:layer.url,
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

				if(features.length>0){
					this.resultLayer.addFeatures(features);
					this.fireEvent('featureload',{layer:layer, featureType:featureType, features:features});
				}
				if(this.nquery == this.nresponse){
					this.nquery = this.nresponse = 0;
					this.fireEvent('featureload',{end:true});
					this.mapPanel.fireEvent('loading',{end:true})
				}

            },
            scope: this
        };
		OpenLayers.Request.POST(options);	
	
	}
	
	

});

Ext.preg("gc_mapquery", GisClient.plugins.MapQuery);
	
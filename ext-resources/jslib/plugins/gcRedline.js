Ext.namespace("GisClient.plugins");

GisClient.plugins.Redline = Ext.extend(Ext.util.Observable, {

	labelText: 'Disegna: ',
	addfreeText: 'Testo libero',
	addlabelText: 'Etichetta',
	toggleGroup: 'mapToolbar',
	redlineColor: '#FF00FF',
	activeToolIndex: 0,
	popupTitle: "Appunti",
	promptTitle: "Nome appunti",
	saveBtnText: "Salva appunti",
	cancelBtnText: 'Annulla appunti',
	cancelBtnMessage: "Questa operazione elimina gli appunti non ancora archiviati. Si vuole proseguire?",
	deleteBtnText: "Elimina appunti ", 
	deleteBtnMessage: "Eliminare definitivamente gli appunti archiviati?",
	treeLayerGroup: "Appunti",
	serviceURL: 'services/redline.php',
	redlineImages: '/ms4w/tmp/redline_tmp/',
	
    constructor: function(config) {
        Ext.apply(this.initialConfig, Ext.apply({}, config));
        Ext.apply(this, config);
        GisClient.plugins.Measure.superclass.constructor.apply(this, arguments);
    },

    init: function(mapPanel){
		this.mapPanel = mapPanel;
		
		//Carica i livelli di redline
		this.loadRedlineLayers()
		
		var label = new Ext.Toolbar.TextItem({
			id:'labelRedline',
			xtype: 'tbtext',
			text: this.labelText,
			 style: {
				color: this.redlineColor
			}
		});

		this.addVectorLayer();
		var self=this;
		//per rendere modificabile le annotazioni....  CI PENSEREMO
		//this.modifyControl = new OpenLayers.Control.ModifyFeature(this.redlineVectLayer);
		//mapPanel.map.addControl(this.modifyControl);
		var redLineTools = new Ext.SplitButton({
			iconCls: "drawfree",
			tooltip: "redline",
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
					new Ext.menu.CheckItem(
						new GeoExt.Action({
							text: this.addfreeText,
							iconCls: "drawfree",
							toggleGroup: this.toggleGroup,
							group: this.toggleGroup,
							allowDepress: false,
							map: mapPanel.map,
							control: new OpenLayers.Control.DrawFeature(this.redlineVectLayer, 
								OpenLayers.Handler.Path,
								{
									handlerOptions:{freehand:true}
								}
							)
						})
					),
					new Ext.menu.CheckItem(
						new GeoExt.Action({
							text: this.addlabelText,
							iconCls: "drawlabel",
							toggleGroup: this.toggleGroup,
							group: this.toggleGroup,
							allowDepress: false,
							map: mapPanel.map,
							control: new OpenLayers.Control.DrawFeature(this.redlineVectLayer, 
								OpenLayers.Handler.Path,
								{
									featureAdded:self.addLabel,
									handlerOptions:{freehand:false}
								}
							)
						})
					),
					'-',
					{
						id: 'save-session',
						text: this.saveBtnText,
						iconCls: 'save-feature',
						disabled: true,
						handler: this.saveSession,
						scope: this
					},
					{
						id: 'delete-session',
						text: this.cancelBtnText,
						iconCls: 'clear-feature',
						disabled: true,
						handler: this.deleteSession,
						scope: this
					},
					'-',
					{
						text: 'Cambia colore',
						iconCls: 'color_swatch',
						hideOnClick: false,
						menu: {
							items: [
								new Ext.ColorPalette({
									listeners: {
										select: function(cp, color){
											label.getEl().setStyle('color',color);
											this.redlineColor = "#"+color;
										},
										scope: this
									}
								})
							]
						}
					},
					 '-',
					{
						id: 'delete-redline',
						text: this.deleteBtnText,
						iconCls: 'save-feature',
						disabled: true,
						handler: this.deleteRedline,
						scope: this
					}
				]
			})
		});
		
		redLineTools.menu.items.each(function(item, index) {
			item.on({checkchange: function(item, checked) {
				redLineTools.toggle(checked);
				if(checked) {
					self.activeToolIndex = index;
					redLineTools.setIconClass(item.iconCls);
				}
			}});
		});
		
		this.redLineTools = redLineTools;
		//Inizializza l'icona giusta
		redLineTools.setIconClass(redLineTools.menu.getComponent(self.activeToolIndex).iconCls);
		mapPanel.gcTools["redline"] = this;
		mapPanel.getTopToolbar().add(" ","-"," ",label,redLineTools);
		
		mapPanel.on('activelayerset', function(mapPanel,layer) {
			if(layer.gc_id.indexOf('gc_redline_')!=-1)
				redLineTools.menu.getComponent('delete-redline').enable();
		});
		

    },
	
	addVectorLayer: function(){
		//Layer vettoriale per il redline
		var redlineStyle = new OpenLayers.Style({
						pointRadius: 5, 
						fillOpacity: 0.7, 
						fontSize: "12px",
						fontFamily: "Courier New, monospace",
						fontWeight: "bold",
						labelAlign: "rt",
						labelXOffset: 0,
						labelYOffset: 0
		});
		var redlineStyleMap = new OpenLayers.StyleMap({
			'default': redlineStyle
		});

		var saveStrategy = new OpenLayers.Strategy.Save(
			{
				create:{
					callback: this.saveSuccess,
					scope:this
				},
				update:{
					callback:function(response){console.log('UPDATE')},
					scope:this
				},
				pippo:'pippo'
			}
		);
		//saveStrategy.events.register('success', this, this.saveSuccess);
		saveStrategy.events.register('fail', this, this.saveFail);

		this.redlineVectLayer = new OpenLayers.Layer.Vector('Redline',{
			displayInLayerSwitcher:false,
			styleMap:redlineStyleMap,
			strategies: [
					saveStrategy
				],
				protocol: new OpenLayers.Protocol.HTTP({
					url: this.serviceURL,
					format: new OpenLayers.Format.GeoJSON({
						ignoreExtraDims: true
						//internalProjection: mapPanel.map.baseLayer.projection
						//externalProjection: wgs84
					}),
					params:{
						PROJECT: this.mapPanel.project,
						MAPSET: this.mapPanel.name,
						SRS: this.mapPanel.map.projection.projCode
					},
					headers: {"Content-Type": "application/x-www-form-urlencoded"}
				})
				

		});
		this.redlineVectLayer.id = 'gc_redline_layer';

		this.redlineVectLayer.events.on({
            "featureadded": function(e){
				var symbolizer = {
					fillColor: this.redlineColor, 
					strokeColor: this.redlineColor,
					fontColor: this.redlineColor,
							fontSize: "12px",
							fontFamily: "Courier New, monospace",
							fontWeight: "bold",
							labelAlign: "lb",
							labelXOffset: 5,
							labelYOffset: 10
				};
				this.redLineTools.menu.getComponent('save-session').enable();
				this.redLineTools.menu.getComponent('delete-session').enable();				
				e.feature.attributes = {color: this.redlineColor};
				e.feature.style = symbolizer;
				e.feature.layer.redraw();

			},
            scope: this
        });
		
		this.mapPanel.map.addLayer(this.redlineVectLayer);

	},
	
				
	addLabel: function(myLine){
	
	
		//this.modifyControl.activate();
		//this.modifyControl.selectFeature(myLine);
		
		var txtNote =  new Ext.form.TextArea({
				width:240,
				name: 'msg'	
			})
		
		var myPoint =  myLine.geometry.components[myLine.geometry.components.length-1];
		var map = myLine.layer.map;
		
		var popup = new GeoExt.Popup({
			title: this.popupTitle,
			location: myPoint,
			map: map,
			width: 250,
			items:txtNote,
			buttons: [{
				text: 'Ok',
				 handler: function(){
					var sNote = txtNote.getValue();


					myLine.attributes["note"] = sNote;
					popup.close();
					/*
					var symbolizer = {
						fillColor:  redlineColor, 
						strokeColor: redlineColor,
						fontColor: redlineColor,
						label : label,
						pointRadius: 5, 
						fillOpacity: 0.7, 
						fontSize: "12px",
						fontFamily: "Courier New, monospace",
						fontWeight: "bold",
						labelAlign: "rt",
						labelXOffset: 0,
						labelYOffset: 0
					};*/
					//e.layer.features[e.layer.features.length-1].style = symbolizer;
					//var myLine = e.layer.getFeatureFromEvent(e);
					//var myLine = e.layer.features[e.layer.features.length-1];

					//this.modifyControl.unselectFeature(myLine);
					
					// create a point feature
					var pointFeature = new OpenLayers.Feature.Vector(myPoint);
					myLine.layer.addFeatures([pointFeature]);
					pointFeature.style.label = sNote;
					pointFeature.style.pointRadius = 1; 
					pointFeature.style.fillColor = '#000000';
					pointFeature.layer.redraw();
	
				}
			},{
				text: 'Annulla',
				handler: function(){
					//this.modifyControl.unselectFeature(myLine);
					myLine.destroy();
					popup.close();	
				}
			}],
			collapsible: true
		});
		
		popup.on({
			close: function() {},
			activate: function(){txtNote.focus();}
		});
		
		popup.show();
		popup.setActive(true);
	},

	saveSession: function(){
		var srs = this.mapPanel.map.projection;
		console.log(this)
		Ext.MessageBox.show({
			title: this.saveBtnText,
			msg: this.promptTitle,
			width:300,
			buttons: Ext.MessageBox.OKCANCEL,
			prompt: true,
			value: new Date().format("d-m-Y-H-i-s"),
			fn: function(btn,text){
				if(btn == 'ok'){
					console.log('save')
					this.redlineVectLayer.protocol.params["TITLE"] = text;
					this.redlineVectLayer.protocol.params["REQUEST"] = 'SaveLayer';
					this.redlineVectLayer.protocol.params["SRS"] = srs;
					this.redlineVectLayer.strategies[0].save();
				}
			},
			scope: this
		});
	},

	deleteSession: function(e){
		var self=this; 
	    Ext.MessageBox.confirm(
			self.cancelBtnText, 
			self.cancelBtnMessage, 
			function(btn){
				if(btn == 'yes'){
					self.redlineVectLayer.removeAllFeatures();	
					self.redLineTools.menu.getComponent('save-session').disable();
					self.redLineTools.menu.getComponent('delete-session').disable();
				}
			
		});
	},
	
	deleteRedline: function(e){
		var self=this; 
	    Ext.MessageBox.confirm(
			this.deleteBtnText + self.mapPanel.activeLayer.name, 
			this.deleteBtnMessage, 
			function(btn){
				if(btn == 'yes'){
					if(self.mapPanel.activeLayer){
						self.deleteRedlineLayer(self.mapPanel.activeLayer);
					}
				}
		});
	
	},

	saveSuccess: function (response) {

		//if();return;
		var doc = response.priv.responseText;
		var result = new OpenLayers.Format.JSON().read(doc);

		var title = this.redlineVectLayer.protocol.params["TITLE"];//TODO DA RECUPERARE DAL RISULTATO DEL POST

		var wms = new OpenLayers.Layer.WMS(title,this.serviceURL,{
			"PROJECT": this.mapPanel.project,
			"MAPSET": this.mapPanel.name,
			"REDLINEID": result.redlineId,
			"LAYER" : "redline",
			"SRS": this.mapPanel.map.projection.projCode,
			"FORMAT":"image/png; mode=24bit",
			"TRANSPARENT":true
		},
		{
			"visibility":true,
			"buffer":0,
			"singleTile":true,
			"gc_id": "gc_redline_" + result.redlineId,
			"group":this.treeLayerGroup
		});
		this.mapPanel.map.addLayer(wms);
		this.redlineVectLayer.removeAllFeatures();	
		this.redLineTools.menu.getComponent('save-session').disable();
		this.redLineTools.menu.getComponent('delete-session').disable();
		
		//SE HO SALVATO IN TABELLA IL/I RECORD SALVO ANCHE LA SCHEDA (IMMAGINE TIFF) 
		this.mapPanel.fireEvent('loading',{start:true})
		this.printMap(result.redlineId);
		
		
		
    },
	
    saveFail: function(response) {
       console.log(response)
    },
	
	deleteRedlineLayer: function(layer){
		Ext.Ajax.request({
			url : this.serviceURL, 
			method: 'GET',
			params:{
				REQUEST: 'DeleteLayer',
				IMAGEPATH: this.redlineImages,
				REDLINEID: layer.params["REDLINEID"]
			},
			success: function ( result, request )
			{ 
				this.mapPanel.map.removeLayer(layer);
				this.mapPanel.activeLayer = null;		
				this.redLineTools.menu.getComponent('delete-redline').disable();

			},
			scope:this
		});

	},
	
	loadRedlineLayers: function(){
	
		Ext.Ajax.request({
			url : this.serviceURL, 
			method: 'GET',
			params:{
				REQUEST: 'GetLayers',
				PROJECT: this.mapPanel.project,
				MAPSET: this.mapPanel.name
			},
			success: function ( result, request )
			{ 
				var res = Ext.decode(result.responseText);
				for(i=0;i<res.layers.length;i++){
					var ll = res.layers[i];
					var wms = new OpenLayers.Layer.WMS(ll.redline_title,this.serviceURL,{
						"PROJECT": this.mapPanel.project,
						"MAPSET": this.mapPanel.name,
						"REDLINEID": ll.redline_id,
						"LAYER" : "redline",
						"SRS": this.mapPanel.map.projection.projCode,
						"FORMAT":"image/png; mode=24bit",
						"TRANSPARENT":true
					},
					{
						"visibility":true,
						"buffer":0,
						"singleTile":true,
						"gc_id": "gc_redline_" + ll.redline_id,
						"group":this.treeLayerGroup
					});
					this.mapPanel.map.addLayer(wms);
				}
			},
			scope:this
		});
	
	},
	
	printMap: function(redlineId){

		var printProvider = new GeoExt.data.PrintProvider({
			capabilities: {"scales": [{"name":"1:1,000","value":1000},{"name":"1:2,000","value":2000},{"name":"1:5,000","value":5000},{"name":"1:10,000","value":10000},{"name":"1:25,000","value":25000},{"name":"1:50,000","value":50000},{"name":"1:100,000","value":100000},{"name":"1:500,000","value":500000},{"name":"1:1,000,000","value":1000000},{"name":"1:1,500,000","value":1500000},{"name":"1:2,000,000","value":2000000},{"name":"1:2,500,000","value":2500000},{"name":"1:5,000,000","value":5000000},{"name":"1:10,000,000","value":10000000}],"dpis":[{"name":"75","value":"75"},{"name":"150","value":"150"},{"name":"300","value":"300"}],"layouts":[{"name":"A4","map":{"width":440,"height":600},"rotation":true},{"name":"Legal","map":{"width":440,"height":650},"rotation":true},{"name":"Letter","map":{"width":440,"height":550},"rotation":true}],"printURL":this.serviceURL,"createURL":this.serviceURL + "?REQUEST=PrintMap"}
		});
		printProvider.download = function(url){console.log(url)};
		
		var printPage = new GeoExt.data.PrintPage({
			printProvider: printProvider
		});
		
		printPage.fit(this.mapPanel, true);
		printProvider.customParams = {"extent": this.mapPanel.map.getExtent().toArray(),size:[800,800],"format":'gtiff',"version":"1.1.1","scalbar":1,"file_name":this.redlineImages + redlineId + ".tif"};
        printProvider.print(this.mapPanel, printPage);
		
	}
	
});

Ext.preg("gc_redline", GisClient.plugins.Redline);
	
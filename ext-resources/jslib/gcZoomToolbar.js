Ext.namespace("GisClient");

//SOSTITUIRE TUTTO CON UN PLUGIN CHE USA SOLO 3 COMBO CAMBIANDONE DINAMICAMENTE I PARAMETRI


GisClient.ZoomToolbar = Ext.extend(Ext.Toolbar, {

    initComponent: function(){

		var map = this.mapPanel.map;
		var vectorLayer = new OpenLayers.Layer.Vector("gcZoomTo", {displayInLayerSwitcher:false});	
		map.addLayer(vectorLayer);
		var datasrid;
		
		var action = new Ext.Action({
			disabled:false,
			iconCls: 'zoomto'
		});
		
		var comboZoomTo = new Ext.form.ComboBox({
			typeAhead: true,
			triggerAction: 'all',
			lazyRender:true,
			mode: 'local',	
			emptyText: 'Scegli:',
			store: new Ext.data.ArrayStore({
				id: 0,
				fields: [
					'nome',
					'codice',
					'datasrid'
				],
				data:this.data
			}),
			valueField: 'codice',
			displayField: 'nome',
			listeners:{select:{fn:function(combo, value) {

				//NOTA PAROLA CHIAVE FISSA DA USAR EIN AUTHOR
				if(value.data.codice == 'geolocator'){
					comboFogli.hide();
					comboParticelle.hide();
					comboStradario.hide();
					comboCivici.hide();	
					comboStrade.hide();
					comboComuni.hide();
					txtIndirizzo.show();
					action.setHandler(geoLocate);
				}
				else if(value.data.codice == 'stradario'){
					comboFogli.hide();
					comboParticelle.hide();
					txtIndirizzo.hide();
					comboStrade.hide();						
					comboComuni.hide();
					
					comboStradario.show();
					comboCivici.show();
					action.setHandler(zoomToIndirizzo);
				}
				else if(value.data.codice == 'particella'){
					comboStradario.hide();
					
					
					
					
					
					
					comboCivici.hide();
					txtIndirizzo.hide();
					comboStrade.hide();
					comboComuni.hide();
					comboFogli.show();
					comboParticelle.show();
					action.setHandler(zoomToParcel)
				}
				else if(value.data.codice == 'strada_provinciale'){
					comboStradario.hide();
					comboCivici.hide();
					txtIndirizzo.hide();
					comboFogli.hide();
					comboParticelle.hide();
					comboComuni.hide();
					comboStrade.show();
					action.setHandler(zoomToStrada)
				}
				else{
					comboStradario.hide();
					comboCivici.hide();
					comboFogli.hide();
					comboParticelle.hide();	
					txtIndirizzo.hide();					
					comboStrade.hide();
					comboComuni.hide();
					action.setHandler(zoomToComune)
				}
				

				//comboComuni.setDisabled(false);
				//comboComuni.store.baseParams = {request:combo.getValue()};
				//comboComuni.store.reload();
			 
			 
			}}} 
		});
				 
		var comboComuni	= new Ext.form.ComboBox ({
			fieldLabel:'nome',
			displayField:'nome',
			valueField:'codice',
			value:'',
			id: 'comune',
			hidden:true,
			autoSelect:true,
			minChars:2,
			typeAhead:true,
			 typeAheadDelay:300,
			 width:180,
			 triggerAction:'all',
			 mode:'remote',
			 loadingText:'Caricamento in corso',
			 emptyText: 'Digita comune:',
			 store: new Ext.data.JsonStore({
				url: this.url,
				baseParams:{project:this.mapPanel.project,request:'comuni',srs:map.projection},
				idProperty: 'codice',
				fields: ['codice', 'nome','extent'],
				root: 'comuniData',
				autoLoad: false
			}),
			 listeners:{select:{fn:function(combo, value) {
				comboStradario.setValue('');
				comboStradario.setDisabled(false);
				comboStradario.store.baseParams = {request:'stradario',comune:combo.getValue(),srs:map.projection};
				comboStradario.store.removeAll();
				
				comboFogli.setValue('');
				comboFogli.setDisabled(false);
				comboFogli.store.baseParams = {request:'foglio',comune:combo.getValue(),srs:map.projection};
				comboFogli.store.reload();
				comboParticelle.store.removeAll();

				
			 }}}                     
		 });
		
		var comboStradario = new Ext.form.ComboBox ({
			 fieldLabel:'nome',
			 displayField:'nome',
			 valueField:'codice',
			 hidden:true,
			 id: 'vie',
			 minChars:2,
			 typeAhead:false,
			 typeAheadDelay:300,
			 width:250,
			 //disabled: true,
			 triggerAction:'all',
			 mode:'remote',
			 loadingText:'Caricamento in corso',
			 emptyText: 'Digita indirizzo:',
			 store: new Ext.data.JsonStore({
				url: this.url,
				idProperty: 'codice',
				fields: ['codice', 'nome','extent'],
				root: 'stradarioData',
				baseParams: {project:this.mapPanel.project,request:'stradario',comune:comboComuni.getValue(),srs:map.projection,datasrid:comboZoomTo.getValue()},
				autoLoad: false
			}),
			 listeners:{select:{fn:function(combo, value) {
				comboCivici.setValue('');
				comboCivici.setDisabled(false);
				comboCivici.store.reload({
					params: { codvia: combo.getValue() }
				});
			 }}}                     
		 });
		
		
		var comboCivici = new Ext.form.ComboBox ({
			fieldLabel:'Civico',
			displayField:'numero',
			valueField:'codice',
			hidden:true,
			id:'civici',
			width:100,
			disabled: true,
			triggerAction:'all',
			mode:'local',
			autoHeight: true,
			emptyText: 'Civico:',
			store: new Ext.data.JsonStore({
				url: this.url,
				baseParams:{project:this.mapPanel.project,request:'civici',srs:map.projection},
				idProperty: 'codice',
				fields: ['codice', 'numero', 'x', 'y'],
				root: 'civiciData',
				autoLoad: false
			}),
			listeners:{
				selectXXXX:{fn:function(combo, value) {
					if(!value){
						alert ('Civico non presente');
						return;
					};
					var style_green = {
						strokeColor: "#00FF00",
						pointRadius: 6,
						pointerEvents: "visiblePainted",
						label : value.data.numero,
						fontColor: "#ff0000",
						fontSize: "12px",
						fontFamily: "Courier New, monospace",
						fontWeight: "bold",
						labelAlign: "cm",
						labelXOffset: "15",
						labelYOffset: "-15"
					};
					var point = new OpenLayers.Geometry.Point(value.data.x,value.data.y);
					var pointFeature = new OpenLayers.Feature.Vector(point,null,style_green);
					//ELimino i civici già inseriti o li lascio ????? configurabile???
					vectorLayer.destroyFeatures();
					vectorLayer.addFeatures([pointFeature]);
					//console.log(pointFeature)
					
					vectorLayer.map.setCenter(new OpenLayers.LonLat(value.data.x,value.data.y), 16);	
				}}
			}
			
		 });
		 
		var comboFogli = new Ext.form.ComboBox ({
			 fieldLabel:'numero',
			 displayField:'numero',
			 valueField:'numero',
			 hidden:true,
			 id: 'foglio',
			 minChars:1,
			 typeAhead:true,
			 typeAheadDelay:300,
			 width:120,
			 //disabled: true,
			 triggerAction:'all',
			 mode:'local',
			 emptyText: 'Foglio:',
			 store: new Ext.data.JsonStore({
				url: this.url,
				idProperty: 'codice',
				fields: ['codice','numero','extent'],
				root: 'fogliData',
				baseParams: {project:this.mapPanel.project,request:'foglio',comune:comboComuni.getValue(),srs:map.projection},
				autoLoad: true
			}),
			 listeners:{select:{fn:function(combo, value) {
				comboParticelle.setValue('');
				comboParticelle.setDisabled(false);
				comboParticelle.store.reload({
					params: {comune:comboComuni.getValue(),foglio: combo.getValue()}
				});
			 }}}                     
		 });
		 
		var comboParticelle = new Ext.form.ComboBox ({
			 fieldLabel:'numero',
			 displayField:'numero',
			 valueField:'numero',
			 hidden:true,
			 id: 'particella',
			 minChars:2,
			 typeAhead:false,
			 typeAheadDelay:300,
			 width:100,
			 //disabled: true,
			 triggerAction:'all',
			 mode:'local',
			 emptyText: 'Particella:',
			 store: new Ext.data.JsonStore({
				url: this.url,
				idProperty: 'codice',
				fields: ['codice', 'numero','extent'],
				root: 'particelleData',
				baseParams: {project:this.mapPanel.project,request:'particella',comune:comboComuni.getValue(),srs:map.projection},
				autoLoad: false
			})                    
		 });

		 var txtIndirizzo = new Ext.form.TextField({
				fieldLabel: 'Adress',
				name: 'address',
				width:290,
				enableKeyEvents:true,
				emptyText: 'Digita indirizzo:',
				hidden:true
		});
		
		var comboStrade = new Ext.form.ComboBox ({
			 fieldLabel:'nome',
			 displayField:'nome',
			 valueField:'codice',
			 hidden:true,
			 id: 'strada',
			 minChars:1,
			 typeAhead:true,
			 typeAheadDelay:300,
			 width:400,
			 //disabled: true,
			 triggerAction:'all',
			 mode:'remote',
			 loadingText:'Caricamento in corso',
			 emptyText: 'Strada:',
			 store: new Ext.data.JsonStore({
				url: this.url,
				idProperty: 'codice',
				fields: ['codice', 'nome','extent'],
				root: 'stradaData',
				baseParams: {project:this.mapPanel.project,request:'strada',srs:map.projection},
				autoLoad: false
			})                    
		 });
		 
        var zoomToIndirizzo = function(){
			if(comboCivici.selectedIndex != -1)
				//comboCivici.fireEvent('select',comboCivici,comboCivici.getStore().getAt(comboCivici.selectedIndex));
				selectCivico(comboCivici.getStore().getAt(comboCivici.selectedIndex));
			else if(comboStradario.getStore().getAt(comboStradario.selectedIndex).data.extent){
				var extent = OpenLayers.Bounds.fromArray(comboStradario.getStore().getAt(comboStradario.selectedIndex).data.extent);
				map.zoomToExtent(extent);
			}
        };
		
		var zoomToParcel = function(){
			if(comboParticelle.selectedIndex != -1){
				var extent = OpenLayers.Bounds.fromArray(comboParticelle.getStore().getAt(comboParticelle.selectedIndex).data.extent);
				map.zoomToExtent(extent);
			}
			else if(comboFogli.getStore().getAt(comboFogli.selectedIndex).data.extent){
				var extent = OpenLayers.Bounds.fromArray(comboFogli.getStore().getAt(comboFogli.selectedIndex).data.extent);
				map.zoomToExtent(extent);
			}
        };
		var zoomToComune = function(){
			if(comboComuni.selectedIndex != -1 && comboComuni.getStore().getAt(comboComuni.selectedIndex).data.extent){
				var extent = OpenLayers.Bounds.fromString(comboComuni.getStore().getAt(comboComuni.selectedIndex).data.extent);
				map.zoomToExtent(extent);
			}
			
        };
		var zoomToStrada = function(){
			if(comboStrade.selectedIndex != -1 && comboStrade.getStore().getAt(comboStrade.selectedIndex).data.extent){
				var extent = OpenLayers.Bounds.fromString(comboStrade.getStore().getAt(comboStrade.selectedIndex).data.extent);
				map.zoomToExtent(extent);
			}
			
        };
		
		var selectCivico = function(value){

					if(!value){
						alert ('Civico non presente');
						return;
					};
					var style_green = {
						strokeColor: "#00FF00",
						pointRadius: 6,
						pointerEvents: "visiblePainted",
						label : value.data.numero,
						fontColor: "#ff0000",
						fontSize: "12px",
						fontFamily: "Courier New, monospace",
						fontWeight: "bold",
						labelAlign: "cm",
						labelXOffset: "15",
						labelYOffset: "-15"
					};
					var point = new OpenLayers.Geometry.Point(value.data.x,value.data.y);
					var pointFeature = new OpenLayers.Feature.Vector(point,null,style_green);
					//ELimino i civici già inseriti o li lascio ????? configurabile???
					vectorLayer.destroyFeatures();
					vectorLayer.addFeatures([pointFeature]);
					//console.log(pointFeature)
					
					vectorLayer.map.setCenter(new OpenLayers.LonLat(value.data.x,value.data.y), 16);	

		
		
		}
		
		
		var geoLocate = function (){

			var address = comboComuni.getRawValue() + ' ' + txtIndirizzo.getValue();
			
			var geocoder = new GClientGeocoder();
			if (geocoder) {
			  
				geocoder.getLatLng(
				  address,
				  function(point) {
					if (!point) {
					  alert(address + " non trovato");
					} else {

						var layers=map.getLayersByName("Posizione");
						if(layers.length>0)	var markers = layers[0].destroy();
									
						var markers = new OpenLayers.Layer.Markers("Posizione");	
						map.addLayer(markers);	
						
						var olpoint = new OpenLayers.LonLat(point.x,point.y);		
						var proj = new OpenLayers.Projection("EPSG:4326");
						olpoint=olpoint.transform(proj, map.getProjectionObject());
				
						var size = new OpenLayers.Size(50,50);
						var icon = new OpenLayers.Icon('/gisclient/css/theme/img/other/spillo.gif',size);
						markers.addMarker(new OpenLayers.Marker(olpoint,icon));
						map.setCenter(olpoint,18);		
					}
				  }
				)
				
			}
	
		}

		this.items=['Vai a: ',comboZoomTo,comboStrade,comboComuni,comboStradario,comboCivici,comboFogli,comboParticelle,txtIndirizzo,action,'->'];
		
        GisClient.ZoomToolbar.superclass.initComponent.apply(this, arguments);

    }
	

});

Ext.reg('gc_zoomtoolbar', GisClient.ZoomToolbar);


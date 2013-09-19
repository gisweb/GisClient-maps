Ext.namespace("GisClient.plugins");
//Strumento di interrogazione di un elenco di layer (mapPanel.activeLayers)
/*
GeoExt.data.PrintProvider.prototype.loadCapabilities = function() {
			if (!this.url) {
				return;
			}
			var url = this.url;
			Ext.Ajax.request({
				url: url + "capabilities.php",
				method: "GET",
				disableCaching: false,
				success: function(response) {
					this.capabilities = Ext.decode(response.responseText);
					this.loadStores();
				},
				params: {pippo:'pippo',pluto:'pluto'},
				scope: this
			});
		}
*/
 GeoExt.data.PrintPage.prototype.calculatePageScale = function(bounds, units) {

        var w = this.printProvider.layout.get("size").width;
		var f = this.feature;
		var bounds = bounds || f.geometry.getBounds();
        var units = units ||
            (f.layer && f.layer.map && f.layer.map.getUnits()) ||
            "dd";
        var unitsRatio = OpenLayers.INCHES_PER_UNIT[units];
		
		var s = bounds.getWidth()/w * 72 * unitsRatio;
		return new Ext.data.Record({"name":s,"value":s});

    };



 GeoExt.data.PrintPage.prototype.fit = function(fitTo, options) {

        options = options || {};
        var map = fitTo, extent;
        if(fitTo instanceof GeoExt.MapPanel) {
            map = fitTo.map;
        } else if(fitTo instanceof OpenLayers.Feature.Vector) {
            map = fitTo.layer.map;
            extent = fitTo.geometry.getBounds();
        }
        if(!extent) {
            extent = map.getExtent();
            if(!extent) {
                return;
            }
        }
        this._updating = true;
        var center = extent.getCenterLonLat();
        this.setCenter(center);
        var units = map.getUnits();
        var scale = this.printProvider.scales.getAt(0);
        var closest = Number.POSITIVE_INFINITY;
        var mapWidth = extent.getWidth();
        var mapHeight = extent.getHeight();
		
/*
		
		var myscale = new Ext.data.Record({"name":"33,333","value":(10000*extent.getWidth()/this.printProvider.layout.get("size").width)});

		//this.setScale(myscale, units);
		delete this._updating;
		
		this.updateFeature(this.feature.geometry, {
            center: center,
            scale: scale
        });
		return true;
	
*/

		if (options.mode == "pippo") {
			scale = this.calculatePageScale();
		}
		else{
			this.printProvider.scales.each(function(rec) {
				var bounds = this.calculatePageBounds(rec, units);
			   if (options.mode == "closest") {
					var diff = 
						Math.abs(bounds.getWidth() - mapWidth) +
						Math.abs(bounds.getHeight() - mapHeight);
					if (diff < closest) {
						closest = diff;
						scale = rec;
					}
				} else {
					var contains = options.mode == "screen" ?
						!extent.containsBounds(bounds) :
						bounds.containsBounds(extent);
					if (contains || (options.mode == "screen" && !contains)) {
						scale = rec;
					}
					return contains;
				}
			}, this);
		}
	

        this.setScale(scale, units);
        delete this._updating;
        this.updateFeature(this.feature.geometry, {
            center: center,
            scale: scale
        });
		
		
    };


GisClient.plugins.PrintPanel =  Ext.extend(GeoExt.plugins.PrintExtent,{
	printPanel: null,
	printButton: true,
    constructor: function(config) {
        Ext.apply(this.initialConfig, Ext.apply({}, config));
        Ext.apply(this, config);
		console.log(config)
		this.printProvider = new GeoExt.data.PrintProvider({
			method: "POST",// recommended for production use
			url:config.url,
			autoLoad:true,
			//capabilities: printCapabilities,
			loadCapabilities: function() {
				if (!this.url) {
					return;
				}
				Ext.Ajax.request({
					url: config.url + "/capabilities.php",
					method: "GET",
					disableCaching: false,
					success: function(response) {
						this.capabilities = Ext.decode(response.responseText);
						this.loadStores();
					},
					params: {project:config.mapset.project,mapset:config.mapset.name},
					scope: this
				});
			}
		});
		GisClient.plugins.PrintPanel.superclass.constructor.apply(this, arguments); 
	},

    init: function(mapPanel) {

		this.mapPanel = mapPanel;
		
		GisClient.plugins.PrintPanel.superclass.init.apply(this, arguments);

		mapPanel.gcTools["printpanel"] = this;		

		if(this.printButton){
			var btnPrint={
				text: 'Stampa',
				iconCls: 'print',
				toggleGroup: 'print',	
				listeners: {
					toggle: function(button, pressed) {
						if(pressed) {
							if(!this.printPanel) this.initPrintPanel();
							mapPanel.getBottomToolbar().items.items[0].hide();
							this.show();
							this.printPanel.show();
							
						}
						else{
							this.hide();					
							this.printPanel.hide();
							mapPanel.getBottomToolbar().items.items[0].show();
						}
						mapPanel.getBottomToolbar().doLayout();
					},
					scope:this
				},
				
				
			}
			mapPanel.getTopToolbar().add(" ","-"," ",btnPrint);

		};
		
	},
	
	initPrintPanel: function(){
	
		var printPage = this.addPage();
	
		var items = [
		{
		    xtype: 'compositefield',
			items:[
				{
					xtype: "combo",
					store: this.printProvider.layouts,
					displayField: "name",
					fieldLabel: "Formato",
					typeAhead: true,
					mode: "local",
					triggerAction: "all",
					width:75,
					plugins: new GeoExt.plugins.PrintProviderField({
						printProvider: this.printProvider
					})
				},
				{
					xtype: "combo",
					store: this.printProvider.scales,
					displayField: "name",
					fieldLabel: "Scala",
					typeAhead: true,
					mode: "local",
					triggerAction: "all",
					plugins: new GeoExt.plugins.PrintPageField({
						printPage: printPage
					})
				}
			]
		},
		{
		    xtype: 'compositefield',
			items:[
				{
					xtype: "combo",
					store: this.printProvider.dpis,
					displayField: "name",
					fieldLabel: "Risoluzione",
					tpl: '<tpl for="."><div class="x-combo-list-item">{name} dpi</div></tpl>',
					typeAhead: true,
					mode: "local",
					triggerAction: "all",
					width:75,
					plugins: new GeoExt.plugins.PrintProviderField({
						printProvider: this.printProvider
					}),
					// the plugin will work even if we modify a combo value
					setValue: function(v) {
						v = parseInt(v) + " dpi";
						Ext.form.ComboBox.prototype.setValue.apply(this, arguments);
					}
				}, 
				{
					xtype: "textfield",
					name: "rotation",
					fieldLabel: "Rot.",
					width:50,
					plugins: new GeoExt.plugins.PrintPageField({
						printPage: printPage
					})
				},
				{
					xtype: "button",
					text: 'Opzioni',
					iconCls: 'printproperties',
					handler: function(){
						var printDialog = new Ext.Window({
							title:'Opzioni di stampa',
							//autoHeight: true,
							modal:true,
							width: 250,
							height:350,
							html: 'Altri attributi titolo descrizione legenda .....'
						});
						printDialog.show();
					}
				},
				{	
					xtype: "button",
					text: 'Scarica immagine',
					iconCls: 'geotiff'
				},		
				{	
					xtype: "button",
					text: 'Stampa PDF',
					iconCls: 'pdf',
					handler: function() {console.log(printPage)
						printPage.customParams = {"extent":printPage.feature.geometry.bounds.toArray()};
						this.print();
						//printPage.fit(this.mapPanel, true);
						// print the page, optionally including the legend
						//printProvider.print(this.mapPanel, printPage, includeLegend && {legend: legendPanel});
					},
					scope:this
				}
			]
		}];
		this.printPanel = new Ext.form.FormPanel({
									autoHeight: true,
									autoWidth: true,
									hidden: true,
									items:items
								});
		
		this.mapPanel.getBottomToolbar().add(this.printPanel);
	
	}

 //printExtent.addPage();
});

Ext.preg("gc_printpanel", GisClient.plugins.PrintPanel);
	
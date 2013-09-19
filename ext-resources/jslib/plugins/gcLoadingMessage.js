Ext.namespace("GisClient.plugins");
GisClient.plugins.LoadingMessage = Ext.extend(Ext.util.Observable, {

	errorTitle: 'Errore durante la generazione del livello: ',
	loadingTitle: 'Aggiornamento mappa ...',
	loadingIcon: 'loading-panel',
	loadingWidth: 250,
	counter: 0,

	maximized: false,
	visible: true,
	
    constructor: function(config) {
        Ext.apply(this.initialConfig, Ext.apply({}, config));
        Ext.apply(this, config);
        GisClient.plugins.LoadingMessage.superclass.constructor.apply(this, arguments);
    },

    init: function(mapPanel){
		mapPanel.map.events.register('preaddlayer', this, this.addLayer);
		mapPanel.map.events.register('removelayer', this, this.removeLayer);
		for (var i = 0; i < mapPanel.map.layers.length; i++) {
			var layer = mapPanel.map.layers[i];
			layer.events.register('loadstart', this, this.increaseCounter);
			layer.events.register('loadend', this, this.decreaseCounter);
			if(layer instanceof OpenLayers.Layer.WMS)layer.events.register('loadend', {layer:layer,self:this}, this.checkErrors);
		}

		mapPanel.loadingPanel = this;
		mapPanel.addListener("loading",function(options){
			if(options.start) this.showLoading(options);
			if(options.end) this.hideLoading();
		},this);
		
    },
	
	addLayer: function(evt) {
		if (evt.layer) {
			evt.layer.events.register('loadstart', this, this.increaseCounter);
			evt.layer.events.register('loadend', this, this.decreaseCounter);
		}
	},

	removeLayer: function(evt) {
		if (evt.layer) {
			evt.layer.events.unregister('loadstart', this, this.increaseCounter);
			evt.layer.events.unregister('loadend', this, this.decreaseCounter);
		}
	},
	
	getWaitText: function() {
		return "Caricamento di" + ' ' + this.counter + ' ' + (this.counter <= 1 ? 'livello' : 'livelli') +'   in corso ';
	},
	
	showLoading: function(config){
		var opt = {
				title: this.loadingTitle,
				width: this.loadingWidth,
				icon: this.loadingIcon,
				modal:false,
				closable:false
			}
		if(config){
			Ext.apply(opt,config);
		}
		Ext.MessageBox.show(opt);
	},
	
	hideLoading: function() {
		Ext.MessageBox.hide();
	},
	
	increaseCounter: function() {
		this.counter++;
		if (this.counter > 0) {	
			if(!Ext.MessageBox.isVisible()) this.showLoading();
			Ext.MessageBox.updateText(this.getWaitText());
		}
		
	},

	checkErrors: function() {

        var imgDiv = Ext.fly(this.layer.div);
		if(!imgDiv.child('img').hasClass('olImageLoadError')) return;
		imgDiv.hide();
		var layerName = this.layer.name;
		console.log(this.layer)
		Ext.Ajax.request({
			url : imgDiv.child('img').dom.src, 
			method: 'GET',
			success: function ( result, request )
			{ 
				this.decreaseCounter();
				Ext.MessageBox.show({
					title: this.errorTitle + layerName,
					maxWidth: 900,
					msg: result.responseText,
					buttons: Ext.MessageBox.OK,
					icon: Ext.MessageBox.WARNING
				});
			},
			failure: function ( result, request )
			{
				this.decreaseCounter();
			},
			scope:this.self
		});

	},
	
	decreaseCounter: function() {
		this.counter--;
		if (this.counter > 0) {		
			if(!Ext.MessageBox.isVisible()) this.showLoading();
			Ext.MessageBox.updateText(this.getWaitText());
		}
		if (this.counter <= 0) {
			this.hideLoading();
			this.counter=0;
		}
	
	}
	
});

Ext.preg("gc_loading", GisClient.plugins.LoadingMessage);
	
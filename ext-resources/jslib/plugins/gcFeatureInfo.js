Ext.namespace("GisClient.plugins");
//Strumento di interrogazione di un elenco di layer (mapPanel.activeLayers)

GisClient.plugins.FeatureInfo = Ext.extend(Ext.util.Observable, {

	labelText: 'Interroga: ',
	Text: 'Punto / Riquadro',
	queryPolygonText: 'Poligono',
	queryCircleText: 'Cerchio',
	queryAreaText: 'SELECT FEATURE (SEZIONI)',
	selgroupAllLayers: 'Tutti i livelli',
	selgroupVisibleLayers: 'Tutti i livelli visibili',
	selgroupActiveLayer: 'Attivo: Nessun livello attivo',
	//selgroupActive: 'ActiveLayer',
	selgroupActive: 'VisibleLayers',
	//activeControl: null,
	activeToolIndex: 0,
	toggleGroup: 'mapToolbar',	
	wfsCache: {},
	queryLayers: [],
	queryFilters:{},
	vectorLayer:null,


    constructor: function(config) {
        Ext.apply(this.initialConfig, Ext.apply({}, config));
        Ext.apply(this, config);
		GisClient.plugins.FeatureInfo.superclass.constructor.apply(this, arguments); 
	},

    init: function(mapPanel){
		this.mapPanel = mapPanel;
		var self=this;
		
		var item = new GeoExt.Action({
			text: this.queryAreaText,
			iconCls: 'query-area',
			map: self.mapPanel.map,
			toggleGroup: 'mapToolbar',	

			control: new OpenLayers.Control.SelectFeature(
                    self.layer,
                    {
                        clickout: false, toggle: false,
                        multiple: false, hover: false,
                        toggleKey: "ctrlKey", // ctrl key removes from selection
                        multipleKey: "shiftKey", // shift key adds to selection
                        box: true
                    }
                )
		})

		mapPanel.getTopToolbar().add(item);
		
		var control = new OpenLayers.Control.GetFeature({
			protocol: OpenLayers.Protocol.WFS.fromWMSLayer(layer),
			box: true,
			hover: true,
			multipleKey: "shiftKey",
			toggleKey: "ctrlKey"
		});
		control.events.register("featureselected", this, function(e) {
			vectorLayer.addFeatures([e.feature]);
		});
		control.events.register("featureunselected", this, function(e) {
			vectorLayer.removeFeatures([e.feature]);
		});
		control.events.register("hoverfeature", this, function(e) {
			vectorLayer.addFeatures([e.feature]);
		});
		control.events.register("outfeature", this, function(e) {
			vectorLayer.removeFeatures([e.feature]);
		});

		
		var item = new GeoExt.Action({
			text: this.queryAreaText,
			iconCls: 'query-area',
			map: self.mapPanel.map,
			toggleGroup: 'mapToolbar',	

			control: control
		})
		
;
		
		

		mapPanel.getTopToolbar().add(item);
		
		
		
		
    }

});

Ext.preg("gc_featureinfo", GisClient.plugins.FeatureInfo);
	
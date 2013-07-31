Ext.namespace("GisClient.plugins");
GisClient.plugins.Coordinates = Ext.extend(Ext.util.Observable, {

	coordsLabel: '',
	scaleLabel: '',
	projLabel: 'PROIEZIONE: ',
	lonText:'X: ',
	latText:'Y: ',
	coordPrecision:3,
	
    constructor: function(config) {
        Ext.apply(this.initialConfig, Ext.apply({}, config));
        Ext.apply(this, config);
        GisClient.plugins.Measure.superclass.constructor.apply(this, arguments);
    },

    init: function(mapPanel){

		var onMouseMove = function(e) {
			var lonLat = mapPanel.map.getLonLatFromPixel(e.xy);
			if (!lonLat) {
				return;
			}
			if (mapPanel.map.displayProjection) {
				lonLat.transform(mapPanel.map.getProjectionObject(), mapPanel.map.displayProjection);
			}
			Ext.getCmp("x-coord").setText(this.lonText + lonLat.lon.toFixed(this.coordPrecision));
			Ext.getCmp("y-coord").setText(this.latText + lonLat.lat.toFixed(this.coordPrecision));
		};
		mapPanel.map.events.register("mousemove", this, onMouseMove);
		

		var onMapMove = function(e){
			//console.log(mapPanel.getState());		
		}
		mapPanel.map.events.register("moveend", this.map, onMapMove);
		
		var scaleStore = new GeoExt.data.ScaleStore({map: mapPanel.map});
		scaleStore.data.each(function(item, index ) {
			item.data["scale"] = Math.round(item.data["scale"]);
		});
		var zoomSelector = new Ext.form.ComboBox({
			store: scaleStore,
			width:100,
			emptyText: "Zoom Level",
			tpl: '<tpl for="."><div class="x-combo-list-item">1 : {[parseInt(values.scale)]}</div></tpl>',
			editable: false,
			triggerAction: 'all', // needed so that the combo box doesn't filter by its current content
			mode: 'local' // keep the combo box from forcing a lot of unneeded data refreshes
		});

		zoomSelector.on('select', 
			function(combo, record, index) {
				mapPanel.map.zoomTo(record.data.level);
			},
			this
		);     

		mapPanel.map.events.register('zoomend', this, function() {
			var scale = scaleStore.queryBy(function(record){
				return this.map.getZoom() == record.data.level;
			});

			if (scale.length > 0) {
				scale = scale.items[0];
				zoomSelector.setValue("1 : " + parseInt(scale.data.scale));
			} else {
				if (!zoomSelector.rendered) return;
				zoomSelector.clearValue();
			}
		});

		var items = [
				zoomSelector,
				{
					text: this.coordsLabel,
					xtype: "tbtext"
				},
				{
					id: 'x-coord',
					text: this.lonText,
					width: 100,
					xtype: "tbtext"
				},
				{
					id: 'y-coord',
					text: this.latText,
					width: 100,
					xtype: "tbtext"
				}
				/*
				{
					id: 'bbar_measure',
					text: "",
					width: 200,
					xtype: "tbtext"
				}
				*/
			];
			if(mapPanel.projectionDescription)
				items.push('->',
					{
						id: 'proj-desc',
						text: this.projLabel + mapPanel.projectionDescription,
						xtype: "tbtext"
					});
			
			
		mapPanel.gcTools["coordinates"] = items;
		mapPanel.getBottomToolbar().add(new Ext.Toolbar({items:[items]}))
    }
	
});

Ext.preg("gc_coordinates", GisClient.plugins.Coordinates);
	
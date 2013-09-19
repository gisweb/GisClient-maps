Ext.namespace("GisClient.plugins");
GisClient.plugins.Navigation = Ext.extend(Ext.util.Observable, {

	label: 'Misure: ',
	lengthText: 'Lunghezza',
	areaText: 'Area',
	toggleGroup: 'mapToolbar',
	
    constructor: function(config) {
        Ext.apply(this.initialConfig, Ext.apply({}, config));
        Ext.apply(this, config);
        GisClient.plugins.Measure.superclass.constructor.apply(this, arguments);
    },

    init: function(mapPanel){
	
		var ctrlNavigation = new OpenLayers.Control.NavigationHistory();
		mapPanel.map.addControl(ctrlNavigation);
		var items =  [
			new GeoExt.Action({
				control: new OpenLayers.Control.ZoomToMaxExtent(),
				map: mapPanel.map,
				iconCls: 'zoomfull',
				toggleGroup: this.toggleGroup,
				tooltip: 'Zoom to full extent'
			}),
			" ","-"," ",
			new GeoExt.Action({
				control: new OpenLayers.Control.ZoomBox(),
				tooltip: 'Zoom in: click in the map or use the left mouse button and drag to create a rectangle',
				map: mapPanel.map,
				iconCls: 'zoomin',
				toggleGroup: this.toggleGroup
			}),
			" ",
			new GeoExt.Action({
				control: new OpenLayers.Control.ZoomBox({
					out: true
				}),
				tooltip: 'Zoom out: click in the map or use the left mouse button and drag to create a rectangle',
				map: mapPanel.map,
				iconCls: 'zoomout',
				toggleGroup: this.toggleGroup
			}),
			" ",
			new GeoExt.Action({
				control: new OpenLayers.Control.DragPan({
					//interval:10,
					isDefault: true
				}),
				tooltip: 'Pan map: keep the left mouse button pressed and drag the map',
				map: mapPanel.map,
				iconCls: 'pan',
				toggleGroup: this.toggleGroup
			}),
			" ","-"," ",
			new GeoExt.Action({
				   tooltip: "Previous view",
				   control: ctrlNavigation.previous,
				   iconCls: 'back',
				   disabled: true
			   }),
			" ", 
			new GeoExt.Action({
				   tooltip: "Next view",
				   control: ctrlNavigation.next,
				   iconCls: 'next',
				   disabled: true
			})
		];
		
		mapPanel.gcTools["navigation"] = items;
		mapPanel.getTopToolbar().add(items);
    }
	
});

/** api: ptype = gx_treenodeactions */
Ext.preg("gc_navigation", GisClient.plugins.Navigation);
	
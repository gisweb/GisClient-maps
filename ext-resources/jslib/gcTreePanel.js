var TreePanel = function(mapPanel,menu){ 
	var map = mapPanel.map;
	var treeCollapsed = (typeof(menu)=='undefined')?(Ext.util.Cookies.get('gcTreeCollapsed')=='true'?true:false):null;
	var activeNode;
	var treePanel = new GeoExt.ux.tree.LayerTreeBuilder({
        region: "west",
        width: 250,
		height:200,
        autoScroll: true,
		useArrows: true,
		animate: true,
        enableDD: false,
        rootVisible: false,
		layerStore:mapPanel.layers,
		anchor:'30%',
        lines: true,
		collapsed:treeCollapsed,
		collapsible:(typeof(menu)=='undefined'),
		title:(typeof(menu)=='undefined')?"Livelli in mappa":null,
		otherLayersText:'Altri livelli',
		baseLayersText:'Servizi',
		iconCls: 'layers-menu',
        // widget custom properties
		
		//DA CONFIGURARE SE CI SONO GLI STRUMENTI DEI SELEZIONE	
		listeners:{
			collapse:function(p){
				Ext.util.Cookies.set('gcTreeCollapsed', p.collapsed);
			},
			expand:function(p){
				Ext.util.Cookies.set('gcTreeCollapsed', p.collapsed);
			},
			click:function(node){
				if(node.layer instanceof OpenLayers.Layer.WMS && (node.layer.featureTypes || (node.layer.gcname && node.layer.gcname.indexOf('gc_redline_')!=-1))){
					mapPanel.setActiveLayer(node.layer);
					activeNode = node;
				}
				else{
					//NON SELEZIONO IL NODO
					return false;
				}
			},
			disabledchange: function(node,disabled){
				//PER RISPRISTINARE LA SELEZIONE DEL NODO DOPO CHE VIENE DISABILITATO E ABILITATO
				if(node == activeNode && !disabled){
					node.select();
				}
			}
			
		},
		
        wmsLegendNodes: false,
        vectorLegendNodes: false


    });
	return treePanel;
}


var TreeMenu = function(mapPanel){

	var tbar = mapPanel.getTopToolbar();

	var treeP = {
			xtype: "treepanel",
			ref: "tree",
			width: 300,
			height: 250,
			autoScroll: true,
			enableDD: true,
			root: new GeoExt.tree.LayerContainer({
				expanded: true
			})
		}
	
	
	// = TreePanel(mapPanel,1);
	treeP.iconCls = null;
	var menu = new Ext.menu.Menu({
        id: 'mainMenu',
        style: {
            overflow: 'visible'     // For the Combo popup
        },
        items: [
			treeP
        ]
    });
	tbar.insert(0," ");	
	tbar.insert(0,"-");	
	tbar.insert(0," ");
	tbar.insert(0,{
		xtype:'splitbutton',
		width:100,
		text:'Livelli in Mappa',
		iconCls: 'layers-menu',  // <-- icon
		menu: menu  // assign menu by instance
	});
	
}
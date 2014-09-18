var valvoleEscluse = []; 


var setValvole = function(panelId, layerId, objId){
return;
	var v = objId.split('.');
    var dv = Ext.getCmp('dv-' + v[0] + '.' + v[1]);
    var idx = dv.store.find('fid',objId);
    var rec = dv.store.getAt(idx);
    var feature = rec.getFeature();
	feature.style = {strokeColor: "blue", strokeOpacity: "0.7", strokeWidth: 2, fillColor: "red", pointRadius: 8, cursor: "pointer"};
	
    var geom = feature.geometry;
    var center = geom.getBounds().getCenterLonLat();
	var map = Ext.getCmp(panelId).map;

    if(geom) map.setCenter(center,map.zoom);
	
	
	valvoleEscluse.push(v[2]);


}


var zoomObject = function(panelId, layerId, objId){

    //RIVEDERE E RIPULIRE
    var v = objId.split('.');
    var dv = Ext.getCmp('dv-' + v[0] + '.' + v[1]);
    var idx = dv.store.find('fid',objId);
    var rec = dv.store.getAt(idx);
    var feature = rec.getFeature();
    var geom = feature.geometry;
    var map = Ext.getCmp(panelId).map;
    var layer = map.getLayer(layerId);
    var selected = layer.selectedFeatures;
    if(selected){
        for (i=0;i<selected.length;i++)	selectControl.unselect(selected[i]);
    }
    if(!feature.layer) layer.addFeatures([feature]);
    selectControl.select(feature);
    var center = geom.getBounds().getCenterLonLat();
    if(geom) map.setCenter(center,map.zoom);

};



var setListWidth = function(combo) {
    if (!combo.listLayerEl && !combo.innerListEl) {
        combo.listLayerEl = Ext.query('.x-combo-list').pop();
        combo.innerListEl = Ext.query('.x-combo-list-inner').pop();

        var itemEl = combo.view && combo.view.getEl() && combo.view.getEl().child(combo.itemSelector || ".x-combo-list-item");

        if (!combo.listLayerEl || !combo.innerListEl || !itemEl) {
            return;
        }

        var textMetrics = Ext.util.TextMetrics.createInstance(itemEl);
        var autoWidth = Math.max(combo.minListWidth, combo.getWidth());

        combo.getStore().each(function(record) {
            autoWidth = Math.max(autoWidth, textMetrics.getWidth(record.get(combo.displayField)) + 25);
        });

        combo.innerListEl.style.width = autoWidth + "px";
        combo.listLayerEl.style.width = autoWidth + "px";
    }
};

var myStyleMap = new OpenLayers.StyleMap({
    'default': {
        fill: false,
        fillColor: "#ff0000",
        //fillOpacity: 0.4,
        hoverFillColor: "white",
        hoverFillOpacity: 0.8,
        strokeColor: "#ffff00",
        strokeOpacity: 1,
        strokeWidth: 2,
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
        fillColor: "yellow",
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
        fillColor: "00ffff",
        fillOpacity: 0.2,
        hoverFillColor: "white",
        hoverFillOpacity: 0.8,
        strokeColor: "#00ffff",
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
});




/******************************************************/

var ToolPanel = function(mapPanel){

	var map = mapPanel.map;



	
	var featureTypes={};
	


/*
modifyControl = new OpenLayers.Control.ModifyFeature(resultVectLayer);
selectControl = new OpenLayers.Control.SelectFeature(resultVectLayer);
highlightCtrl = new OpenLayers.Control.SelectFeature(resultVectLayer,
    {
        hover: true,
        highlightOnly: true,
        renderIntent: "temporary"
              ,eventListeners: {
                beforefeaturehighlighted: function(e){selectControl.activate()},
                featurehighlighted: featureSelected,
                featureunhighlighted: function(e){featureUnselected(e);selectControl.deactivate()}
        }
    }
);

map.addControl(highlightCtrl);
highlightCtrl.activate();
map.addControl(modifyControl);
modifyControl.activate();
map.addControl(selectControl);
*/


    var setComboFeatureTypes = function(selectControl){
		if(!Ext.getCmp('featuresList')) return;
	
        //PER OGNI LAYER WMS ATTIVO IN SELEZIONE ELENCO LE FEATURETYPES NELLA COMBO
        //TODO AGGREGAZIONE PER LAYER... E NUMLAYERS >1
        var aFeatures = [[null,' --- ',false,null]];
		//console.log(selectControl);
        for(i=0;i<selectControl.layers.length;i++){
            for(j=0;j<selectControl.layers[i].featureTypes.length;j++){
                cache = selectControl.layers[i].featureTypes[j];
                var properties = cache.properties;
                for (var k=0; k<properties.length; k++) {
                    var property = properties[k];
                    var type = property.type;
                    if ((type.indexOf('LineString') >= 0) ||
                        (type.indexOf('GeometryAssociationType') >=0) ||
                        (type.indexOf('GeometryPropertyType') >= 0) ||
                        (type.indexOf('Point') >= 0) ||
                        (type.indexOf('Polygon') >= 0) ) {
                            geometryAttribute = property;
                    }
                }
                aFeatures.push([cache.typeName,(cache.title?cache.title:cache.typeName),cache.editable?true:false,selectControl.layers[i],geometryAttribute]);
            }
        }


        //TODO SISTEMARE L'OGGETTO E RENDERE USABILE SU JQUERY
        Ext.getCmp('featuresList').getStore().loadData(aFeatures);
        Ext.getCmp('featuresList').setValue('');
        OpenLayers.Control.SLDSelect.prototype.currentFeature = null;
    }

    var InfoContinua = function(){
    if(!AUTOINFO) return;

    //DA FEATURE CORRENTE DA SELEZIONARE NELLA COMBO DOVE TROVIAMO L'ELENCO DELLE FEATURE INTERROGABILI PER I WMS SETTATI NELL'ALBERO
            var typeName = Ext.getCmp('featuresList').getValue();
            var rec = Ext.getCmp('featuresList').store.getById(typeName);
            //if(!rec.editable) return;
            var title = rec.get('title');
            var layer = rec.get('layer');

            var options = {
                url: layer.url,
                params: {
                    PROJECT:layer.params.PROJECT,
                    MAP:layer.params.MAP,
                    SERVICE: "WFS",
                    MAXFEATURES:100,
                    TYPENAME: typeName,
                    SRS:layer.params.SRS,
                    REQUEST: "GetFeature",
                    VERSION: "1.0.0",
                    BBOX:map.getExtent().toBBOX()

                },
                callback: function(response) {
                    var doc = response.responseXML;
                    if (!doc || !doc.documentElement) {
                        doc = response.responseText;
                    }
                    var format = new OpenLayers.Format.GML();
                    var resp=format.read(doc);
                    if(resp.length>0){
                        gcFeatureInfo({
                            layer: layer,
                            typeName:typeName,
                            features:resp
                        });
                    }
                },
                scope: this
            };
            OpenLayers.Request.GET(options);

    };


// Globale, per memorizzare la finestra del Query Panel, in questo modo
// può venire creata la prima volta e riutilizzata in seguito.
var qpwin = null;
        function featureTools(){

        //CI METTO ANCHE QUERYPANEL!!!!!

            var featureCombo = new Ext.form.ComboBox({


                                name: "currentFeature",
                                fieldLabel: 'Elementi:',
                                id:"featuresList",
                                //hiddenName: 'typeName',

                                store: new Ext.data.ArrayStore({
                                    // store configs
                                    autoDestroy: true,
                                    storeId: 'myStore',
                                    // reader configs
                                    idIndex: 0,
                                    fields: ['name','title','editable','layer','geometrytype']
                                }),

                                //value: layerStore.getAt(5).get("name"),
                                displayField: "title",
                                valueField: "name",
                                //
                                typeAhead: true,
                                triggerAction: 'all',
                                lazyRender:true,
                                mode: "local",
                                width:250,
                                //tpl: featureListTpl,
                                //itemSelector: 'div.search-item',
                                allowBlank: true,
                                editable: false,
                                //triggerAction: "all",
                                listeners: {
                                /*
                                    beforeselect: function(combo, record, index) {
                                        return this.fireEvent("beforelayerchange", this, record);
                                    },
                                    */
                                    select: function(combo, record, index) {
                                        //console.log(combo.getValue());
                                        OpenLayers.Control.SLDSelect.prototype.currentFeature = combo.getValue();
                                        if(record.get('editable'))
                                            Ext.getCmp("toolPanel").getBottomToolbar().add(EditToolbar(map,resultVectLayer,record.get('geometrytype')));
                                        else
                                            Ext.getCmp("toolPanel").getBottomToolbar().removeAll();
                                        Ext.getCmp("toolPanel").syncSize();

                                    },

                                    expand:setListWidth
                                }



            });

			/*
			
           // Funzionerebbe anche in lazy loading ma qui serve un'istanza per collegarla
            // al pulsante "Query" della finestra ...
            var queryPanel = new GisClient.QueryPanel({
                map: map,
                remoteValueStoreURL: './values.php' // Cambiare il default in gcQueryPanel.js
                ,title: 'Filters'
            });

            // ... e per aggiornare l'elenco campi se cambia il valore in featureCombo
            featureCombo.on('change', function(combo){
                queryPanel.createFilterBuilder(combo.getValue());
            });

			*/
			
            //var toolbar = new Ext.Toolbar({
                var items =['Elementi: ',
                    featureCombo,
                    {
                        text: 'Auto',
                        iconCls: 'edit-feature',
                        toggleGroup: 'select',
                        handler: function(){
                            AUTOINFO = this.pressed;
                            //console.log(featureTypes);
                        }
                    },
                    {
                        text: 'Query',
                        iconCls: 'edit-feature',
                        handler: function(){
                            if(featureCombo.getValue()){
                                if (!qpwin) {
                                    qpwin = new Ext.Window({
                                        layout:'fit'
                                        ,width:400
                                        ,id:'qp-win'
                                        ,height:400
                                        ,bodyStyle: "padding: 10px"
                                        ,autoScroll:true
                                        ,closeAction:'hide'
                                        ,title: 'Query'
                                        ,items: [{
                                            xtype: 'tabpanel',
                                            activeTab: 0, // index or id
                                            items: [
                                                //queryPanel,
                                                {
                                                    title: 'Style',
                                                    id: 'style_tab',
                                                    bodyStyle: "padding: 10px",
                                                    items : [
                                                        { 'xtype': 'gxp_fillsymbolizer', 'colorManager': Styler.ColorManager, 'id' : 'fill_style'},
                                                        { 'xtype': 'gxp_strokesymbolizer', 'colorManager': Styler.ColorManager, 'id' : 'stroke_style'},
                                                    ]
                                                }
                                            ]
                                        }]
                                        ,bbar: ["->", {
                                            text: "Query",
                                            handler: function() {
                                                var gc_id = featureCombo.getStore().getAt(featureCombo.selectedIndex).data.layer.gc_id;
                                                var featureType = featureCombo.getValue();
                                                var spatialFilter = queryPanel.getSpatialFilter() ? queryPanel.getSpatialFilter().value : map.maxExtent;
												if(typeof(console)!="undefined"){
													console.log(queryPanel.getAttributeFilters());
													console.log(spatialFilter);
													// Queste due righe causano un errore se il tab non è stato mai mostrato (rendered)
													//console.log(Ext.getCmp('fill_style').getForm().getValues());
													//console.log(Ext.getCmp('stroke_style').getForm().getValues());
													// Queste invece sono sempre buone (però non restituiscono i valori di default se l'utente non ha attivato il controllo)
													console.log(Ext.getCmp('fill_style').symbolizer);
													console.log(Ext.getCmp('stroke_style').symbolizer);
												}
                                                alert('passare i valori a SLDSelect');
                                            }
                                        }]
                                    });
                                };
                                qpwin.show();
                            } else {
                                featureCombo.markInvalid();
                                Ext.MessageBox.alert('Error', 'No layers selected, please selected a layer from the combo box.');
                            }

                        }
                    }

                ]
            //});

            return items;

        }

/*

            //var toolbar = new Ext.Toolbar({
                var items =['Elementi: ',
                    featureCombo,
                    {
                        text: 'Auto',
                        iconCls: 'edit-feature',
                        toggleGroup: 'select',
                        handler: function(){
                            AUTOINFO = this.pressed;
                            //console.log(featureTypes);
                        }
                    },
                    {
                        text: 'Query',
                        iconCls: 'edit-feature',
                        handler: function(){
                            alert('Query panel?')
                        }
                    }

                ]
            //});

            return items;

        }

*/

//*************** TOOLBAR ******************

	/*	
var boxAction =  new GeoExt.Action({
                control: new OpenLayers.Control.GisClientSLDSelect(
                        OpenLayers.Handler.RegularPolygon,
                        {
                            clearOnDeactivate:false,
                            layers: map.getLayersBy("gc_id","occupazione_suolo.elementi_scavi"),
							//resultLayer:resultVectLayer,
                            highLight: false,
                            wfsCache:featureTypes,
                            handlerOptions: {
                                irregular: true
                            },
                            eventListeners:{
                                activate: function(){

                                    //console.log(this);
                                },
                                featuresLoaded: function(){
                                    setComboFeatureTypes(this);
                                }
                            }
                        }
                    ),

                tooltip: 'Seleziona box',
                map: map,
                text:'box',
                iconCls: 'edit-feature',
                toggleGroup: 'mapToolbar'
        });

var polyAction =  new GeoExt.Action({
                control: new OpenLayers.Control.GisClientSLDSelect(
                        OpenLayers.Handler.Polygon,
                        {
                            clearOnDeactivate:false,
                            layers: [],
                            highLight: true,
                            wfsCache:featureTypes,
                            eventListeners:{
                                activate: function(){

                                    //console.log(this);
                                },
                                featuresLoaded: function(){
                                    setComboFeatureTypes(this);
                                }
                            }
                        }
                    ),

                tooltip: 'Seleziona poligono',
                map: map,
                text:'poligono',
                iconCls: 'edit-feature',
                toggleGroup: 'mapToolbar'
        });

var circleAction = new GeoExt.Action({
                control: new OpenLayers.Control.GisClientSLDSelect(
                        OpenLayers.Handler.RegularPolygon,
                        {
                            clearOnDeactivate:false,
                            layers: [],
                            highLight: true,
                            wfsCache:featureTypes,
                            handlerOptions: {
                                sides: 30
                            },
                            eventListeners:{
                                activate: function(){

                                    //console.log(this);
                                },
                                featuresLoaded: function(){
                                    setComboFeatureTypes(this);
                                }
                            }
                        }
                    ),

                tooltip: 'Seleziona cerchio',
                map: map,
                text:'cerchio',
                iconCls: 'edit-feature',
                toggleGroup: 'mapToolbar'
        });
		
		
var selectPipeAction = new GeoExt.Action({
					control: new OpenLayers.Control.PIPESelect(
							OpenLayers.Handler.Click,
                            {
								clearOnDeactivate:false,
								//serviceURL:'http://demo.gisclient.net/gisclient/services/iren/findpipes.php',
								serviceURL:'/gisclient/services/iren/findpipes.php',

                                pipelayer: 'RATRACCIA.traccia_table',
								distance:50,
								highLight: true,
								eventListeners:{
									activate: function(){
										//valvoleEscluse = []; 
										//console.log(this);
									}//,
							
									selected: gcFeatureInfo,
									beforeSelect: cleanPanel,

									featuresLoaded: function(){
										setComboFeatureTypes(this);
									}
								}
                            }
                        ),
					
					tooltip: 'Seleziona condotta',
					map: mapPanel.map,
					text:'Ricerca Valvole',
					iconCls: 'map-base',
					toggleGroup: 'mapToolbar'
	});

										*/

var selectionToolbar = function(map, dataViewPanel){

    var toolbarItems = [
        boxAction,
        " ","-"," ",
        polyAction,
		" ","-"," ",
        circleAction
		/*,
        " ","-"," ",		
		selectPipeAction
		*/
    ];

	
	map.addLayer(resultVectLayer);
    return toolbarItems;
}

/////////////////////////////////////////////////////////////////
//
// Creazione e configurazione del gcDataViewPanel
// bind degli eventi.
//
/////////////////////////////////////////////////////////////////


//this.map.addLayer(this.resultLayer);

//map.addLayer(resultVectLayer);

var dataViewPanel = new GisClient.DataViewPanel({
    id: "dataViewPanel",
   // title: "Informazioni in mappa",
    max_features: 100,
	mapPanel:mapPanel
    //select_control: selectControl,
    //modify_control: modifyControl,
});
//dataViewPanel.addResultLayer();


//console.log(dataViewPanel);
// Aggiunge eventi al selectionLayer
/*
selectionLayer.events.on({
    featureselected: dataViewPanel.featureSelected,
    featureunselected: dataViewPanel.featureUnselected,
    scope: dataViewPanel
});

// Aggiunge eventi ai controlli ol in mappa
Ext.each([selectControl, modifyControl, highlightCtrl], function(ctrl){
    ctrl.events.register('beforefeaturehighlighted', dataViewPanel, function(e){selectControl.activate();});
    ctrl.events.register('featurehighlighted', dataViewPanel, dataViewPanel.featureSelected);
    ctrl.events.register('featureunhighlighted', dataViewPanel, dataViewPanel.featureUnselected);
});
*/
// Aggiunge gli eventi ai controlli ol delle azioni
/*
Ext.each([polyAction.control, boxAction.control, circleAction.control], function(ctrl){
    ctrl.events.register('selected', dataViewPanel, dataViewPanel.gcFeatureInfo);
    ctrl.events.register('beforeSelect', dataViewPanel, dataViewPanel.cleanPanel);
});
*/

	var toolCollapsed = Ext.util.Cookies.get('gcToolCollapsed')=='true'?true:false;
	
	
			var queryInfo = new Ext.Panel({
				title:'Info',
				items:[
					dataViewPanel	
				]
			});
			var queryPipes = new Ext.Panel({
                title: 'Valvole',
                html: '&lt;empty panel&gt;',
                cls:'empty'
            });
	        var item1 = new Ext.Panel({
                title: 'Accordion Item 1',
                html: '&lt;empty panel&gt;',
                cls:'empty'
            });
            var item2 = new Ext.Panel({
                title: 'Accordion Item 2',
                html: '&lt;empty panel&gt;',
                cls:'empty'
            });
            var item3 = new Ext.Panel({
                title: 'Accordion Item 3',
                html: '&lt;empty panel&gt;',
                cls:'empty'
            });
	
	
	

/*
	var accordion = new Ext.Panel({
                region:'east',
				title:'Informazioni in mappa',
                margins:'5 0 5 5',
				collapsible: true,
				autoScroll: true,
				collapsed: toolCollapsed,
                split:true,
                width: 410,
                layout:'accordion',
                items: [queryInfo,queryPipes,item1,item2,item3]
    });
	

	
	
	var tabs = new Ext.TabPanel({
		region: "east",
	
		collapsible: true,
		autoScroll: true,
		collapsed: toolCollapsed,
        width:350,
        activeTab: 0,
        frame:true,
        defaults:{autoHeight: true},
        items:[queryInfo,queryPipes,item1,item2,item3]
    });
	*/
	
	
	
    var panel = {
                xtype:'panel',
                region: "east",
                title:'Risultati interrogazione',
                id: "toolPanel",
                collapsible: true,
                autoScroll: true,
                collapsed: toolCollapsed,
				iconCls:'queryresult',
                width: 350,
                items:[
					
                        dataViewPanel
					
                   

                ],

                //Toolbar per il pannello delle feature
                tbar: {
					//xtype: 'container',
					//layout: 'anchor',
					//defaultType: 'toolbar',
					items:[{id:"tb-result",xtype:"tbtext",text:'',height:24}]// [{items: selectionToolbar(map, dataViewPanel)},{items:featureTools(map)}]
				},
                bbar: [],
				listeners:{
					collapse:function(p){
						Ext.util.Cookies.set('gcToolCollapsed', p.collapsed);
					},
					expand:function(p){
						Ext.util.Cookies.set('gcToolCollapsed', p.collapsed);
					}
				}

            };



    return panel;

}


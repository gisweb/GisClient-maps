/*
Ext Class to handle WMS GetFeature requests data view
*/

Ext.namespace("GisClient");

/*
resultTemplate['confini_comunali.bc_confinicomunali_plg']={
		html: ['<div id="{fid}" class="myTool" style="color:white;background-color:grey;border-style:solid;border-color:white;">',
																			'====> Escludi',
																		'</div>'],
		options:{}
	};
*/

GisClient.DataViewPanel = Ext.extend(Ext.Panel, {
    // Variabili Pubbliche
    
	layout:'accordion',
	
    max_features :  100, // Mumero massimo di features

	mapPanel:null,
	resultLayer:null,
	selectControl:null,
	resultTemplate:{},
	dvList: {},
	panelList:{},

    initComponent: function(){
		
		//Se ho i controlli di selezione regstro l'evento selected di ogni controllo
		if(this.mapPanel.gcTools["query"]){
			if(!this.resultLayer) this.resultLayer = this.mapPanel.gcTools["query"].resultLayer;
			if(!this.resultLayer) alert('Manca il layer vettoriale!!')
			if(!this.selectControl) this.selectControl = this.mapPanel.gcTools["query"].selectControl;
			if(!this.highlightControl) this.highlightControl = this.mapPanel.gcTools["query"].highlightControl;
			
			this.mapPanel.gcTools["query"].on('featureload',this.showResult,this);

			
			this.resultLayer.events.register('featureselected', this, this.featureSelected);
			this.resultLayer.events.register('featureunselected', this, this.featureUnselected);
			
			this.highlightControl.events.register('featurehighlighted', this, this.featureSelected);
			
		};

		this.addEvents(
			"done","pippo"
		
		);
		
		
        GisClient.DataViewPanel.superclass.initComponent.apply(this, arguments);
		
    },	

	showResult: function(e){
	
		if(e.start){
			if(this.collapsed) this.expand();
			this.dvList={};
			this.panelList={};
			this.removeAll();
		}
		else if(e.end){
			//this.doLayout();
			this.mapPanel.fireEvent('loading',{end:true});
			this.fireEvent("done", this, this.resultLayer);
		}
		else
			this.addDataView(e);
	},

	addDataView:function(e){

		var typeName = e.featureType.typeName;
        var title = e.featureType.title;
        var resultTpl = this.getFeatureTemplate(e.featureType);
		

		var dv = this.dvList[typeName];
        if(!dv){
		    if(typeof(console)!="undefined") console.log('Adding DV for ' + typeName + ', title: ' + title);
			dv = new Ext.DataView({
			    id: 'dv-' + typeName,
                title: title,
                store: new GeoExt.data.FeatureStore({
                    features: e.features
                }),
                tpl           : resultTpl,
                singleSelect  : true,
                overClass     : 'emplOver',
                selectedClass : 'emplSelected',
                itemSelector  : 'div.emplWrap',
                emptyText     : 'No images to display',
                style         : 'background-color: #FFFFFF;',
                autoScroll    : true
            });
            // Add listeners
            dv.on("click", function(thisDv, index) {
                var record = thisDv.store.getAt(index);
                var feature = record.getFeature();
                var selected = this.resultLayer.selectedFeatures;
                if(selected){
                    for(i=0; i<selected.length; i++){
                        this.selectControl.unselect(selected[i]);
                    }
                }
                //La seleziono solo se la feature è stata aggiunta al layer altimenti la aggiungo
                if(!feature.layer){
                    this.resultLayer.addFeatures([feature]);
                }
                this.selectControl.select(feature);
                //ZOOM SOLO SE AUTOINFO=FALSE
				var center = feature.geometry.getBounds().getCenterLonLat();
				this.mapPanel.map.setCenter(center,this.mapPanel.map.zoom);
            }, this);
            dv.on("dblclick", function(thisDv, index) {
			return;
				var record = thisDv.store.getAt(index);
				var feature = record.getFeature();
                //window.open('/scavi/'+feature.attributes.istanza,'istanze-scavi');return;
                if(!feature.layer) {
                    this.resultLayer.addFeatures([feature]);
                }
                this.mapPanel.modifyControl.selectFeature(feature);
                this.editFeature(thisDv, index, e);
                /*
                QUI HO TUTTO QUELLO CHE MI SERVE
                IN e.layer.featureType ho quello che ho messo in author!!!
                */

                /*

                */


                /*
                var formPanel = Ext.getCmp('updateform');

                formPanel.selectedRecord = record;
                formPanel.getForm().loadRecord(record);
                */
            }, this);
            dv.on('selectionchange', function(thisDv,nodes){
                // TODO: do something
            }, this);
            dv.on('afterrender', function(thisDv){
				var self = this;
				Ext.select('div.featureLink').on('click', function(e) {
					self.mapPanel.openUrl({
						url:this.getAttribute('link'),
						title:this.getAttribute('linktitle'),
						width:parseInt(this.getAttribute('linkwidth')),
						height:parseInt(this.getAttribute('linkheight'))
					})
				})
			
            }, this);
			
            dv.on('mouseenter', function(thisDv,index){
			    var record = thisDv.store.getAt(index);
                var feature = record.getFeature();
				if(feature) this.highlightControl.overFeature(feature);
            }, this);
			
            dv.on('mouseleave', function(thisDv,index){
			    var record = thisDv.store.getAt(index);
                var feature = record.getFeature();
				if(feature) this.highlightControl.outFeature(feature);
            }, this);


			var panel = new Ext.Panel({
				onResize: function() {
					// We override this method because if we don't it will wipe our DataView out
					// XXX
				},
				title: "Interrogazione di " + title,
 				items: dv
			});

			this.dvList[typeName]=dv;
			this.panelList[typeName]=panel;
			this.add(panel);
			
        } else {
            dv.getStore().loadData(e.features);
			
        }

		this.doLayout();
		//this.resultLayer.addFeatures(e.features);

	},
	
	
    // Metodo per creare il template in base alle caratteristiche del layer
    getFeatureTemplate : function(featureType) {

        if (!(featureType.typeName in this.resultTemplate)){
            var tpl = '';
            var _tpl;
            /*
            1 = Stringa di testo o numero
            2 = Collegamento (una url)
            3 = indirizzo email
            8 = immagine (le dimensioni le forziamo sul template ... almeno così funziona ora)
            */
            Ext.each(featureType.properties, function(p){
                var _tpl;
               // if(typeof(console)!="undefined") console.log('DataType for ' + p.name + ' is ' + p.type);
                switch (p.fieldType) {
                    case 2:
                        _tpl = '<div><span class="title">' + p.header + ':</span> <a  href="{'+ p.name +'}">{' + p.name + '}</a></div>';
                    break;
                    case 3:
                        _tpl = '<div><span class="title">' + p.header + ':</span> <a href="mailto:"{' + p.name + '}">{' + p.name + '}</a></div>';
                    break;
                    case 8:
                        _tpl = '<div><span class="title">' + p.header + ':</span> <img src="{' + p.name + '}" /></div>';
                    break;
                    case 1:
                        _tpl = '<div><span class="title">' + p.header + ':</span> {' + p.name + '}</div>';
                    break;
					case 9:
                        _tpl = '<input type="hidden" value="{' + p.name + '}" id="' + p.name + '" />';
                    break;
					case 98:
                        _tpl = '<div><span class="title"><input type="checkbox" />' + p.header + ':</span> {' + p.name + '}</div>';
                    break;	
					case 99:
                        _tpl = '<div><span class="title"><input class="myTool" type="checkbox" />' + p.header + ':</span> {' + p.name + '}</div>';
                    break;	
					default:
						if((p.name != 'gc_objid') && (p.type.indexOf('Line') == -1) && (p.type.indexOf('Point') == -1) && (p.type.indexOf('Polygon')== -1))
							_tpl = '<div><span class="title">' + p.name + ':</span> {' + p.name + '}</div>';
                    break;
                }
                if(_tpl){
                    tpl += _tpl;
                }
            });

			Ext.each(featureType.link, function(link){
				tpl += '<div class="featureLink" link="'+ link.url + '" linktitle="'+ link.name +'" linkwidth="'+ link.width +'" linkheight="'+ link.height +'" ><img class="qtlink" src="'+ Ext.BLANK_IMAGE_URL +'" alt="" />'+ link.name +'</div>';
			});
			
            var resultTpl = new Ext.XTemplate(
                '<div class="featureTitle">' + featureType.title + '</div>',
                '<tpl for=".">',
					 '<tpl for="feature">',
						'<div class="emplWrap" id="{fid}">',
							'<tpl for="attributes">',
								tpl,
							'</tpl>',
						'</div>',
					'</tpl>',
					'<hr>',
                '</tpl>'
            );
            this.resultTemplate[featureType.typeName] = resultTpl;
        }
        return this.resultTemplate[featureType.typeName];
    },	

	
    featureSelected: function(e){
        //Gli oggetti sono tutti sullo stesso livello vettoriale
        //Trovo il dv in base al fid

        var fid=(e.feature.fid);
        var v = e.feature.fid.split('.');
       // var dv = Ext.getCmp('dv-' + v[0] + '.' + v[1]);
		var key =  v[0] + '.' + v[1];
		var dv = this.dvList[key];
		var panel = this.panelList[key];
		if (panel.collapsed) panel.expand()
		if(dv){
			var rec = dv.store.getRecordFromFeature(e.feature);
			dv.select(rec);
			Ext.fly(dv.getNode(rec)).scrollIntoView(dv.getEl().dom.parentNode.parentNode.parentNode.parentNode);
		}
    },
	
	
    featureUnselected: function(e){
        var fid=(e.feature.fid);
        var v = e.feature.fid.split('.');
        //var dv = Ext.getCmp('dv-' + v[0] + '.' + v[1]);
		var key =  v[0] + '.' + v[1];
		var dv = this.dvList[key];
        if(dv) dv.clearSelections();
    },
	
    featureZoom: function(f){

    },

    // TODO:
    editFeature: function(thisDv, index, e){
        //alert('editFeature: Not implemented!');
		//console.log(e)
    }
	
});

Ext.reg('gc_dataviewpanel', GisClient.DataViewPanel);


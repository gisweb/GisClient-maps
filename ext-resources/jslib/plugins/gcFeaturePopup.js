Ext.namespace("GisClient.plugins");
//Strumento di interrogazione di un elenco di layer (mapPanel.activeLayers)

GisClient.plugins.FeaturePopup = Ext.extend(Ext.util.Observable, {

	labelText: 'Info: ',
	resultLayer:null,
	selectControl:null,
	resultTemplate:{},
	popupList:{},
	
    constructor: function(config) {
        Ext.apply(this.initialConfig, Ext.apply({}, config));
        Ext.apply(this, config);
		GisClient.plugins.FeaturePopup.superclass.constructor.apply(this, arguments); 
	},

    init: function(mapPanel){
		//Se ho i controlli di selezione regstro l'evento selected di ogni controllo
		this.mapPanel=mapPanel;
		if(this.mapPanel.gcTools["query"]){
			if(!this.resultLayer) this.resultLayer = this.mapPanel.gcTools["query"].resultLayer;
			if(!this.resultLayer) alert('Manca il layer vettoriale!!')
			if(!this.selectControl) this.selectControl = this.mapPanel.selectControl;
			this.mapPanel.gcTools["query"].on('featureload',this.showResult,this);

			this.resultLayer.events.register('featureselected', this, this.pippo);
			this.resultLayer.events.register('featureunselected', this, this.pippo);
			
			this.mapPanel.gcTools["query"].highlightControl.events.register('featurehighlighted', this, this.tooltipSelect);
			this.mapPanel.gcTools["query"].highlightControl.events.register('featureunhighlighted', this, this.tooltipUnselect);

		};

		this.addEvents(
			"done","pippo"
		
		);
		
		
		
    },
	
	
	getFeaturePopup: function(featureType){
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
                '</tpl>'
            );
            this.resultTemplate[featureType.typeName] = resultTpl;
        }
        return this.resultTemplate[featureType.typeName];
	},
	
	showResult: function(e){
	
		if(e.start){
			//console.log('RIPULISCO')
		}
		else if(e.end){
			//console.log('FINE')
		}
		else
			this.addPopups(e);
	
	},
	
	addPopups:function(e){
	
		//console.log(e)
//AGGIUNGO QUI POPUP DA USARE INDICIZZATI PER TYPENAME 

		var typeName = e.featureType.typeName;
        var title = e.featureType.title;
        var resultTpl = this.getFeaturePopup(e.featureType);

		var popup = this.popupList[typeName];
		if(!popup){
			var self=this;
	        if(typeof(console)!="undefined") console.log('Adding POPUP for ' + typeName + ', title: ' + title);
			popup = new OpenLayers.Popup('popup-' + typeName, null, null,null,true, function(){this.map.removePopup(this)});
			//popup.opacity = 0.5;
			//popup.contentDiv.style.backgroundColor='ffffcb';

			//popup.closeDiv.style.backgroundColor='bbbbbb';
			popup.contentDiv.style.overflow='hidden';
			//popup.groupDiv.style.backgroundColor = 'Transparent';
			//popup.contentDiv.style.padding='3px';
			popup.contentDiv.style.margin='0';
			popup.autoSize = true;
			popup.setBackgroundColor('');
			this.popupList[typeName] = popup;

		}
		//console.log(popup)
		//console.log(this.mapPanel.gcTools["query"].wfsCache);
	},
	
	
	tooltipSelect: function(e){
	
           var feature = e.feature;
           var selectedFeature = feature;

		   
           //if there is already an opened details window, don\'t draw the    tooltip
           //if(feature.popup != null){
             //  return;
          // }
		   
		    var fid=(e.feature.fid);
			var v = e.feature.fid.split('.');
			var key =  v[0] + '.' + v[1];
			//console.log(key)

		   	var tooltipPopup = this.popupList[key];	
			
			tooltipPopup.setContentHTML(this.resultTemplate[key].applyTemplate(e));
			tooltipPopup.lonlat = feature.geometry.getBounds().getCenterLonLat();
			tooltipPopup.updatePosition()
 


			e.feature.popup = tooltipPopup;
			this.mapPanel.map.addPopup(tooltipPopup);

			var self=this;
					
			Ext.select('div.featureLink').on('click', function(e) {
				self.mapPanel.openUrl({
					url:this.getAttribute('link'),
					title:this.getAttribute('linktitle'),
					width:parseInt(this.getAttribute('linkwidth')),
					height:parseInt(this.getAttribute('linkheight'))
				})
			})   
		   
		   
       },
	   
	   
       tooltipUnselect: function(e){
           var feature = e.feature;
           if(feature != null && feature.popup != null){
               this.mapPanel.map.removePopup(feature.popup);
               //feature.popup.visible(false);
               //delete feature.popup;
               //tooltipPopup = null;
               //lastFeature = null;
           }
       }
	

});

Ext.preg("gc_featurepopup", GisClient.plugins.FeaturePopup);
	
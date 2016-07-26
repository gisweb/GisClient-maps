OpenLayers.GisClient.queryToolbar = OpenLayers.Class(OpenLayers.Control.Panel,{
    
    // **** baseUrl - Gisclient service URL
    baseUrl : '/gisclient',
    resultLayer:null,
    queryLayers:[],
    queryFilters:{},
    wfsCache:{},
    layers:[],
    selgroup:null,
    featureTypes:null,
    visibleLayers:[],
    renderQueue: [],
    resultStyle:null,
    maxWfsFeatures:100,
    maxVectorFeatures:500,
    pointZoomLevel:8,
    selectControl:null,
    highlightControl:null,
    modifyControl:null,
    resultTarget:null,
    resultLayout:'TABLE',//LIST POPUP
    searchButtonHander: null,
    popup: null,
    popupOpenTimeout: null,
    
    vectorFeaturesOverLimit: [], //oggetti non renderizzati per il maxVectorFeatures

    initialize: function(options) {
        OpenLayers.Control.Panel.prototype.initialize.apply(this, [options]);

        var controls = [
            new OpenLayers.Control.QueryMap(
                OpenLayers.Handler.RegularPolygon,
                {
                    baseUrl: this.baseUrl,
                    wfsCache:this.wfsCache,
                    layers:this.visibleLayers,       
                    queryFilters:this.queryFilters, 
                    resultLayer:this.resultLayer, 
                    maxFeatures:this.maxWfsFeatures,   
                    maxVectorFeatures:this.maxVectorFeatures,       
                    handlerOptions: {
                        irregular: true
                    },
                    iconclass:"glyphicon-white glyphicon-fullscreen", 
                    title:"Interroga la mappa",
                    text:"Box",
                    eventListeners: {'activate': function(){this.map.currentControl.deactivate();this.map.currentControl=this}}

                }
            ),
            new OpenLayers.Control.QueryMap(
                OpenLayers.Handler.RegularPolygon,
                {
                    baseUrl: this.baseUrl,
                    wfsCache:this.wfsCache,
                    layers:this.visibleLayers,                    
                    queryFilters:this.queryFilters, 
                    resultLayer:this.resultLayer, 
                    maxFeatures:this.maxWfsFeatures,   
                    maxVectorFeatures:this.maxVectorFeatures,   
                    handlerOptions: {
                        sides: 30
                    },
                    iconclass:"glyphicon-white glyphicon-screenshot", 
                    title:"Interroga la mappa",
                    text:"Circle",
                    eventListeners: {'activate': function(){this.map.currentControl.deactivate();this.map.currentControl=this}}

                }
            ),
            new OpenLayers.Control.QueryMap(
                OpenLayers.Handler.Polygon,
                {
                    baseUrl: this.baseUrl,
                    wfsCache:this.wfsCache,
                    layers:this.visibleLayers,                    
                    queryFilters:this.queryFilters, 
                    resultLayer:this.resultLayer, 
                    maxFeatures:this.maxWfsFeatures,   
                    maxVectorFeatures:this.maxVectorFeatures,   
                    handlerOptions: {
                        irregular: false,
                        freehand: true
                    },
                    iconclass:"glyphicon-white glyphicon-edit", 
                    title:"Interroga la mappa",
                    text:"free",
                    eventListeners: {'activate': function(){this.map.currentControl.deactivate();this.map.currentControl=this}}

                }
            )
        ];
        
        if(typeof(this.searchButtonHander) == 'function') {
            controls.push(new OpenLayers.Control.Button({
                //type: OpenLayers.Control.TYPE_TOGGLE, 
                iconclass:"glyphicon-white glyphicon-search", 
                title:"Ricerca",
                text:"Ricerca",
                trigger:this.searchButtonHander
            }));
        }

        this.addControls(controls);
    },
    
    deactivate: function() {
        var result = OpenLayers.Control.Panel.prototype.deactivate.apply(this);
        
        if(result) {
            this.map.defaultControl.activate();
            this.map.currentControl = this.map.defaultControl;
            this.deactivateVectorControl();
        } else {
            return false;
        }
    },

    //boh non so se inizializzare qui oppure passare la wfscache già pronta ...  da vedere per ora scelgo la 2
    initWfsCache:function(){//NON USATA INIZIALIZZO FUORI
        var layer;
        for (var i = 0; i < this.map.config.featureTypes.length; i++) {
            //console.log(this.map.config.featureTypes[i].WMSLayerName, this.map.config.featureTypes);
            layer =  this.map.getLayersByName(this.map.config.featureTypes[i].WMSLayerName)[0];
            if(layer){
                if(typeof(this.wfsCache[layer.id])=='undefined') this.wfsCache[layer.id] = {featureTypes:[]};
                this.wfsCache[layer.id].featureTypes.push(this.map.config.featureTypes[i]);
            }
        };
        //console.log(this.wfsCache)
        //this.addfeaturesCombo();
    },

    //AGGIUNGE LA SELECT CON LE FEATURES INTERROGABILI
    addfeaturesCombo: function(){
        var featureTypes, group = '', optionGroup = {};
        if(!this.wfsCache){
            var span = document.createElement("div");
            OpenLayers.Element.addClass(span, "olControlQueryMapSelect");
            span.innerHTML = "Nessun livello interrogabile";
            this.featuresCombo = span;
            return;
        }

        var option, options, list = document.createElement("select");
        list.add(this.getOption("LIVELLI VISIBILI",OpenLayers.GisClient.queryToolbar.VISIBLE_LAYERS));
        //AGGIUNGO I GRUPPI DI SELEZIONE
        if(this.map.config.selgroup){
            for (index in this.map.config.selgroup){
                list.add(this.getOption("Gruppo: "+this.map.config.selgroup[index].title,this.map.config.selgroup[index].type_name.join(",")));
            }
        } 
        //AGGIUNGO GLI ALTRI RAGGRUPPATI PER TEMI
        for (index in this.wfsCache){
            featureTypes = this.wfsCache[index].featureTypes; 
            options=[];
            for(var i=0;i<featureTypes.length;i++){
                if(featureTypes[i].searchable == 1 || featureTypes[i].searchable == 2){
                    option = this.getOption(featureTypes[i].title,featureTypes[i].typeName);
                    OpenLayers.Element.addClass(option, "olOptionDisabled");
                    options.push(option);
                }
            }

            if(options.length > 0) {
                if(group != featureTypes[0].group) {
                    group = featureTypes[0].group;
                    option = document.createElement("optgroup");
                    option.label="Tema: " + group;
                    list.add(option);
                }
                for(var i=0;i<options.length;i++)  list.add(options[i]);
            }

        };

        list.add(this.getOption("--------",""));
        list.add(this.getOption("TUTTI I LIVELLI INTERROGABILI",OpenLayers.GisClient.queryToolbar.ALL_LAYERS));
        var self=this;
        list.onchange = function(e){self.setQueryLayers(e.target.value)};//VEDERE SE VA SENZA JQUERY
        OpenLayers.Element.addClass(list, "olControlQueryMapSelect");
        this.featuresCombo = list;
    },

    //TROVA IL LAYER WMS A CUI APPARTINE LA FEATURE INTERROGABILE. UTILE PER LE QUERY CON SLD
    getLayerFromFeature: function(typeName){
        for (index in this.wfsCache){
            for(var i=0;i<this.wfsCache[index].featureTypes.length;i++){
                if(this.wfsCache[index].featureTypes[i].typeName == typeName) return this.map.getLayer(index);
            }
        }
        return false;
    },

    //IMPOSTA I LAYERS INTERROGABILI NEI CONTROLLI QUERYMAP DELLA TOOLBAR
    setQueryLayers: function(value){
        var layer, layers=[];
        var typeName=false;

        if(value == OpenLayers.GisClient.queryToolbar.VISIBLE_LAYERS){
            for(var i=0;i<this.map.layers.length;i++){
                layer = this.map.layers[i];
                
                if(this.wfsCache[layer.id]) {
                    if(GisClientMap.mapsetTiles && GisClientMap.mapsetTileLayer.getVisibility()) {
                        if (layer.nodes)
                        {
                            var tot_layer_nodes = layer.nodes.length;
                            for (var k = 0; k < tot_layer_nodes; k++){
                                if(GisClientMap.default_layers.indexOf(layer.nodes[k].layer) > -1){
                                    layers.push(layer);
                                    break;
                                }
                            }
                        }
                        else if(GisClientMap.default_layers.indexOf(layer.name) > -1) {
                            layers.push(layer);
                        }
                    } else {
                        if(layer.getVisibility() && layer.calculateInRange()) {
                            layers.push(layer);
                        }
                    }
                }
                //console.log(layer.id, this.wfsCache[layer.id], layer.getVisibility(), layer.calculateInRange());
                //il getVisibility torna false nel caso di layer "veloce", quindi bisogna controllare anche se è acceso quello e se il layer corrente fa parte di quelli
                //if(this.wfsCache[layer.id] && layer.getVisibility() && layer.calculateInRange()) layers.push(layer);
            }
            this.visibleLayers = layers;
        }

        else if(value == OpenLayers.GisClient.queryToolbar.ALL_LAYERS){
            layers = this.map.layers;
        }
        else if(value.indexOf(',') != -1){
            var typeNames = value.split(',');
            for(var i=0;i<typeNames.length;i++){
                //DA SISTEMARE PERCHÈ ORA PRENDE I LIVELLI E NON LE FEATURETYPE.
                layers.push(this.getLayerFromFeature(typeNames[i]))
            }
        }else{
            layer = this.getLayerFromFeature(value);
            layers.push(layer);
            typeName = value;
        }
        for(var i=0;i<this.controls.length;i++){
            if(this.controls[i] instanceof OpenLayers.Control.QueryMap){
                this.controls[i].layers=layers;
                this.controls[i].queryFeatureType = typeName;
                this.controls[i].onlyVisibleLayers= (value == OpenLayers.GisClient.queryToolbar.VISIBLE_LAYERS)
            } 
        }

        var featureTypes = GisClientMap.featureTypes,
            len = featureTypes.length, fType, i;
         
        for(i = 0; i < len; i++) {
            if(featureTypes[i].typeName == typeName) {
                fType = featureTypes[i];
                break;
            }
        }
        
        if(!fType) return;
        
        this.events.triggerEvent('featureTypeSelected', fType);
        
    },

    //crea una option per select
    getOption: function(text,value){
        option = document.createElement("option");
        option.text=text;
        option.value=value;
        return option;
    },

    //TIENE AGGIORNATO L'ELENCO DEI LAYERS VISIBILI
    updateVisibleLayers: function(e){
        if(typeof(this.wfsCache[e.layer.id])!='undefined'){
            var index = -1;
            for (var i = 0; i < this.visibleLayers.length; i++) {
                if(this.visibleLayers[i].id == e.layer.id) index = i
            };
            if(e.layer.visibility && e.layer.inRange){
                index==-1 && this.visibleLayers.push(e.layer); 
            }
            else{
                index!=-1 && this.visibleLayers.splice(index,1);
            }
            this.updateFeatureCombo(e.layer)
        };
    },

    //TIENE AGGIORNATO L'ELENCO DELLE FEATURES INTERROGABILI IN FUNZIONE DEI LAYERS VISIBILI
    updateFeatureCombo: function(layer){
        var featureTypes = this.wfsCache[layer.id].featureTypes;
        for (var i = 0; i < this.featuresCombo.options.length; i++) {
            for (var j = 0; j < featureTypes.length; j++) {
                if(this.featuresCombo.options[i].value == featureTypes[j].typeName){
                    if(layer.visibility && layer.inRange)
                        OpenLayers.Element.removeClass(this.featuresCombo.options[i], "olOptionDisabled");
                    else
                        OpenLayers.Element.addClass(this.featuresCombo.options[i], "olOptionDisabled");
                }
            }
        }

    },


    //SOVRASCRIVE IL METODO AGGIUNGENDO QUELLO CHE SERVE
    draw:function(){
        this.initResultLayer();
        this.initWfsCache();
        this.addfeaturesCombo();
        for (var i=0, len=this.controls.length; i<len; i++) {
            if(this.controls[i] instanceof OpenLayers.Control.QueryMap){
                this.controls[i].resultLayer = this.resultLayer;
                this.controls[i].events.register('startQueryMap', this, this.initResultPanel);
                this.controls[i].events.register('featuresLoaded', this, this.handleFeatureResult);
                this.controls[i].events.register('endQueryMap', this, this.writeAllResultPanel);
            }
        }
        OpenLayers.Control.Panel.prototype.draw.apply(this);
        return this.div
    },

    redraw: function() {

        OpenLayers.Control.Panel.prototype.redraw.apply(this);
        //this.resultLayer.setVisibility(this.active);
        var currentHeight = this.div.style.height;
        if (this.active) {
            this.resultLayer.setVisibility(true);
            this.setQueryLayers(this.featuresCombo.value);
            for(var i=0;i<this.map.layers.length;i++) if(this.wfsCache[this.map.layers[i].id]) this.updateFeatureCombo(this.map.layers[i]);
            this.activateVectorControl();
            this.map.events.register('changelayer',this,this.updateVisibleLayers);
            if (this.outsideViewport){
                this.div.appendChild(this.featuresCombo);
                this.div.style.height="60px";
            }
            else
                this.map.div.appendChild(this.featuresCombo);
        }
        else{
            //this.deactivateVectorControl();
            this.map.events.unregister('changelayer',this,this.updateVisibleLayers);
            this.div.style.height="0px";   
           // this.featuresCombo.parentNode.removeChild(this.featuresCombo);
        }

    },
    
    clearResults: function() {
        this.resultLayer.removeAllFeatures();
        this.resultLayer.setVisibility(false);
        this.deactivateVectorControl();
        this.resultTarget.innerHTML = '';
        this.events.triggerEvent('clearresults');
    },

    //INIZIALIZZA IL LAYER VETTORIALE PER I RISULTATI
    initResultLayer: function(){

        //SE NON PASSO LO STYLE PER IL LAYER VETTORIALE PER I RISULTATI LO AGGIUNGO
        if (!this.resultStyle) {
            this.resultStyle = new OpenLayers.StyleMap({
                'default': {
                    fill: false,
                    fillColor: "#ff00FF",
                    fillOpacity: 0.1,
                    hoverFillColor: "white",
                    hoverFillOpacity: 0.1,
                    strokeColor: "yellow",
                    strokeOpacity: 0.4,
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
                    cursor: "inherit"
                },
                'select': {
                    fill: true,
                    fillColor: "blue",
                    fillOpacity: 0.4,
                    hoverFillColor: "white",
                    hoverFillOpacity: 0.8,
                    strokeColor: "blue",
                    strokeOpacity: 1,
                    strokeWidth: 6,
                    strokeLinecap: "round",
                    strokeDashstyle: "solid",
                    hoverStrokeColor: "red",
                    hoverStrokeOpacity: 1,
                    hoverStrokeWidth: 0.4,
                    pointRadius: 8,
                    hoverPointRadius: 1,
                    hoverPointUnit: "%",
                    pointerEvents: "visiblePainted",
                    cursor: "pointer"
                },
                'temporary': {
                    fill: true,
                    fillColor: "EEA652",
                    fillOpacity: 0.2,
                    hoverFillColor: "white",
                    hoverFillOpacity: 0.8,
                    strokeColor: "#EEA652",
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
        };

        var resultLayer = new OpenLayers.Layer.Vector('wfsResults', {
            visibility:false,
            styleMap: this.resultStyle,
            displayInLayerSwitcher: true
        });
        
        this.map.addLayer(resultLayer);

        //Setto i controlli
        var selectControl = new OpenLayers.Control.SelectFeature(resultLayer);
        //var modifyControl = new OpenLayers.Control.ModifyFeature(resultLayer);
        var highlightControl = new OpenLayers.Control.SelectFeature(resultLayer,
            {
                hover: true,
                autoActivate: false,
                highlightOnly: true,
                box: false,
                renderIntent: "temporary"
            }
        );
        
        selectControl.events.register('featurehighlighted', this, this.handleFeatureSelected);
        selectControl.events.register('featureunhighlighted', this, this.handleFeatureUnSelected);

        highlightControl.events.register('featurehighlighted', this, this.handleFeatureHighlighted);
        highlightControl.events.register('featureunhighlighted', this, this.handleFeatureUnHighlighted);

        //this.map.addControl(modifyControl);
        this.map.addControl(selectControl); 
        this.map.addControl(highlightControl);
    
        this.selectControl = selectControl;
        this.highlightControl = highlightControl;
        //this.modifyControl = modifyControl;
        
        this.resultLayer = resultLayer;

    },

    activateVectorControl: function(e){
        var lastLayer = this.map.layers[this.map.layers.length -1],
            maxIndex = this.map.getLayerIndex(lastLayer),
            resultIndex = this.map.getLayerIndex(this.resultLayer);
        
        if(resultIndex < maxIndex) this.map.raiseLayer(this.resultLayer, (maxIndex - resultIndex));
        
        this.highlightControl.activate();
        this.selectControl.activate();
    },
    
    deactivateVectorControl: function(e){
        this.selectControl.deactivate();
        this.highlightControl.deactivate();
    },

    //SCRIVE IL VALORE DELL'ATTRIBUTO: DA RIPRISTINARE IL RENDER COME NELLA 2 (LINK, IMMAGINE.....)
    writeDataAttribute: function(type,value){
        switch(type) {
            case 2: //collegamento
                if(value) {
                    value = '<a href="'+value+'" target="_blank" class="olControlButtonItemInactive olButton olLikeButton"><span class="glyphicon-white glyphicon-link"></span></a>';
                }
            break;
        }
        return value || '&nbsp;';

    },

    writeDataTable: function(featureType){
        var col, colIndex, values, htmlTable, htmlHeaders = '', aCols = [], relation;
        
        if(featureType.features.length == 0) return false;//VEDERE DI METTRE NELLE OPZIONI SE AGGIUNGERE COMUNQUE GLI HEADERS        
                
        htmlHeaders += '<th>Azioni</th>';
        
        for (var i = 0; i < featureType.properties.length; i++) {
            col = featureType.properties[i];
            if(col.header && col.resultType!=4 && col.relationType!=2){
                htmlHeaders += '<th>' + col.header + '</th>';
                aCols.push(col.name);
            }
        }; 
        
        colIndex = aCols.length;
        //if(colIndex == 0) return false;
               
        var fLen = featureType.features.length;
        htmlTable = '<span>'+featureType.title+ ' ('+fLen+')';
        //link a tutte le features disabilitato per adesso... vediamo prima se serve
        if(false) htmlTable += ' <a href="#" zoomFType="'+featureType.typeName+'">Zoom</a>';
        // **** Add links for xml/pdf export
        htmlTable += ' <a href="#" " featureType="'+featureType.typeName+'" action="xls" style="float:right"><img src="../resources/themes/icons/xls.gif">&nbsp;</a>';
        htmlTable += ' <a href="#" " featureType="'+featureType.typeName+'" action="pdf" style="float:right"><img src="../resources/themes/icons/acrobat.gif">&nbsp;</a>';
        htmlTable += '</span><table class="featureTypeData"><thead><tr>' + htmlHeaders + '</tr><tbody>';
        for (var j = 0; j < fLen; j++) {
            values = '<td feature-col="Azioni"><a class="olControlButtonItemInactive olButton olLikeButton" href="#" featureType="'+featureType.typeName+'" featureId="'+featureType.features[j].id+'" action="zoom"  buffer="'+(featureType.zoomBuffer || 0)+'" title="Zoom" style="margin:0"><span class="glyphicon-white glyphicon-search"></span></a>';
            if(featureType.relations) {
                for(var f = 0; f < featureType.relations.length; f++) {
                    relation = featureType.relations[f];
                    if(relation.relationType != 2) continue;

                    values += '| <a href="#" featureType="'+featureType.typeName+'" featureId="'+featureType.features[j].id+'" action="viewDetails" relationName="'+relation.relationName+'">'+relation.relationTitle+'</a>';

                }
            }
            values += '</td>';
                    
            for (var i = 0; i < colIndex; i++) {
                var fieldName = aCols[i];
                var field = this.getFieldByName(featureType, fieldName);
                values += '<td feature-col="' + field.header + '">'+ this.writeDataAttribute(field.fieldType, featureType.features[j].attributes[fieldName]) +'</td>';
            }
            htmlTable +=  '<tr featureType="'+featureType.typeName+'" featureId="'+featureType.features[j].id+'">'+values+'</tr>';        
        }

        htmlTable += '</tbody></table>';

        return htmlTable;
        /*
        var featureTypeDiv = document.createElement("div");
        OpenLayers.Element.addClass(featureTypeDiv, "featureTypeTitle");
        featureTypeDiv.innerHTML = cssHeaders + htmlTable;
        return featureTypeDiv;
        */
    },
    
    getFieldByName: function(featureType, fieldName) {
        var field = null,
            len = featureType.properties.length, property, i;
        
        for(i = 0; i < len; i++) {
            property = featureType.properties[i];
            
            if(property.name == fieldName) field = property;
        }
        
        return field;
    },

    writeDataPopup: function (event) {
        var col, colIndex, values, aCols = [], relation;
        var feature = event.feature;
        var featureType = GisClientMap.getFeatureType(feature.featureTypeName);

        if (!event.object.handlers.feature.hasOwnProperty('evt'))
            return;
        // **** fill popupInfo ****

        for (var i = 0; i < featureType.properties.length; i++) {
            col = featureType.properties[i];
            if(col.header && col.resultType!=4 && col.resultType != 20 && col.relationType!=2){
                aCols.push(col.name);
            }
        }; 
        colIndex = aCols.length;
        
        var htmlPopup = '<span>' +featureType.title+ '</span><table class="featureTypeData"><tbody>';

        
        values = '';
                    
        for (var i = 0; i < colIndex; i++) {
            var fieldName = aCols[i];
            var field = this.getFieldByName(featureType, fieldName);
            values += '<td feature-col="' + field.header + '">'+ this.writeDataAttribute(field.fieldType, feature.attributes[fieldName]) +'</td>';
         }
         
        htmlPopup +=  '<tr featureType="'+featureType.typeName+'" featureId="'+feature.id+'">'+values+'</tr>';        

        htmlPopup += '</tbody></table>';
        
        var popupInfo = '<div class="smalltable"><div class="featureTypeTitle">' + htmlPopup + '</div></div>';

        var pPosX = event.object.handlers.feature.evt.layerX;
        var pPosY = event.object.handlers.feature.evt.layerY;
        var nMapXCenter = this.map.getExtent().getCenterPixel().x;
        var nMapYCenter = this.map.getExtent().getCenterPixel().y;
        
        var oPopupPos = this.map.getLonLatFromPixel(new OpenLayers.Pixel(pPosX, pPosY));

        var popup = new OpenLayers.Popup.FramedCloud(
                "gcPopup",
                oPopupPos,
                new OpenLayers.Size(50, 50),
                popupInfo,
                new OpenLayers.Icon(
        '',
        new OpenLayers.Size(0, 0),
        new OpenLayers.Pixel(0, 0)
    ),
    true,
    null
);
popup.minSize = new OpenLayers.Size(300, 40);
popup.maxSize = new OpenLayers.Size(300, 500);
popup.autoSize = true;
//popup.offset = 20;
        popup.setBackgroundColor('#6a6a6a');
        popup.setOpacity(.9);
        //popup.anchor.offset.x = 5;
        //popup.anchor.offset.y =  -8;
        popup.padding = new OpenLayers.Bounds(2,2,2,2);
        popup.keepInMap = true; 
        //popup.contentDiv.className = "smalltable olPopupContent";
        feature.popup = popup;
        var self = this;
        popup.onclick = function () {
            return false
        };

        if (self.popup)
            this.map.removePopup(self.popup);

        self.popup = popup;
    },

    removePopup: function (e) {
		var feature=e.feature;
		if(!feature) return;
		if(feature.popup) this.map.removePopup(feature.popup);
                feature.popup.blocks = new Array();
		feature.popup.destroy();
		feature.popup = null;
    },

    initResultPanel: function(e) {
        var loadingControl = this.map.getControlsByClass('OpenLayers.Control.LoadingPanel')[0];
        loadingControl.maximizeControl();
        //this.resultTarget.innerHTML =  '';
        this.events.triggerEvent('startQueryMap');
    },
    
    handleFeatureResult: function(e) {
        this.renderQueue.push(e);
    },

    //questa per adesso non viene usata, proviamo a fare il rendering tutto insieme per vedere se le performance migliorano...
    writeResultPanel: function(e) {
        
        var me = this;
        //opzioni tabella lista popup todo
        //attivare opzione scrivo anche se la lista dei risultati è vuota
        if(e.properties){
            var resDiv = me.writeDataTable(e);
            resDiv && me.resultTarget.appendChild(resDiv);
            
            var links = me.resultTarget.getElementsByTagName('a'),
                len = links.length, link, i;
            
            for(i = 0; i < len; i++) {
                link = links[i];
                
                if(!link.addEventListener) continue;
                link.addEventListener('click', function(event) {
                    event.stopPropagation();
                    
                    var action = this.getAttribute('action');
                    var featureType = this.getAttribute('featureType');
                    var featureId = this.getAttribute('featureId');
                    if(action) {
                        switch(action) {
                            case 'zoom':
                                if(featureId) {
                                    //var feature = me.findFeature(featureId);
                                    var feature = me.resultLayer.getFeatureById(featureId);
                                    if(!feature) console.log('zoom: non trovo la feature ', featureType, featureId);
                                    me.map.zoomToExtent(feature.geometry.getBounds());
                                }
                            break;
                            case 'viewDetails':
                                if(featureId) {
                                    var relationName = this.getAttribute('relationName');
                                    var params = {
                                        featureType: featureType
                                    };
                                    var feature = me.resultLayer.getFeatureById(featureId);
                                    if(!feature) return console.log('viewDetails: non trovo la feature ', featureType, featureId);
                                    params.feature = feature;
                                    
                                    me.getFeatureDetails(featureType, feature, relationName);
                                }
                            break;
                        }
                    }
                    
                }, false);
            }
        }

    },
    writeAllResultPanel: function(e) {
        var me = this,
            len = me.renderQueue.length, event, i,
            divs = '', html, resultDiv;

        for(i = 0; i < len; i++) {
            event = this.renderQueue[i];
            
            if(!event || !event.properties) continue;
            
            html = me.writeDataTable(event);
            
            if(!html) continue;
            
            divs += '<div class="featureTypeTitle">' + html + '</div>';
        }
        
        this.renderQueue = [];
        
        if(divs.length) {
            if(me.resultTarget.firstChild) {
                console.log('removeChild...');
                me.resultTarget.removeChild(me.resultTarget.firstChild);
            }
        
            resultDiv = document.createElement("div");
            resultDiv.innerHTML = divs;
            
            me.resultTarget.appendChild(resultDiv);

            var links = me.resultTarget.getElementsByTagName('a'),
                len = links.length, link, i;
            
            for(i = 0; i < len; i++) {
                link = links[i];
                
                if(!link.addEventListener) continue;
                link.addEventListener('click', function(event) {
                    event.stopPropagation();
                    
                    var action = this.getAttribute('action');
                    var featureType = this.getAttribute('featureType');
                    var featureId = this.getAttribute('featureId');
                    if(action) {
                        switch(action) {
                            case 'zoom':
                                if(featureId) {
                                    var buffer = this.getAttribute('buffer');
                                    var feature = me.findFeature(featureId);
                                    if(!feature) {
                                        return console.log('zoom: non trovo la feature ', featureType, featureId);
                                    }
                                    me.selectControl.unselectAll();
                                    me.selectControl.select(feature);
                                    var bounds = feature.geometry.getBounds();
                                    if(buffer) {
                                        buffer = parseFloat(buffer);
                                        var bArr = bounds.toArray();
                                        bArr[0] = bArr[0] - buffer;
                                        bArr[1] = bArr[1] - buffer;
                                        bArr[2] = bArr[2] + buffer;
                                        bArr[3] = bArr[3] + buffer;
                                        bounds = new OpenLayers.Bounds.fromArray(bArr);
                                    }
                                    me.map.zoomToExtent(bounds);
                                }
                            break;
                            case 'viewDetails':
                                if(featureId) {
                                    var relationName = this.getAttribute('relationName');
                                    var params = {
                                        featureType: featureType
                                    };
                                    var feature = me.resultLayer.getFeatureById(featureId);
                                    if(!feature) return console.log('viewDetails: non trovo la feature ', featureType, featureId);
                                    params.feature = feature;
                                    
                                    me.getFeatureDetails(featureType, feature, relationName);
                                }
                            break;
                            case 'xls':
                                me.exportFeatureType(featureType, 'xls');
                            break;
                            case 'pdf':
                                me.exportFeatureType(featureType, 'pdf');
                            break;
                         
                        }
                    }
                    
                }, false);
            }
        }
        
        var loadingControl = this.map.getControlsByClass('OpenLayers.Control.LoadingPanel')[0];
        loadingControl.minimizeControl();

        var event = {
            layer: me.resultLayer,
            mode: e.mode
        };
        if(e.vectorFeaturesOverLimit) {
            for(var i = 0; i < e.vectorFeaturesOverLimit.length; i++) {
                for(var j = 0; j < e.vectorFeaturesOverLimit[i].length; j++) {
                    this.vectorFeaturesOverLimit.push(e.vectorFeaturesOverLimit[i][j]);
                }
            }
            event.vectorFeaturesOverLimit = true;
        }
        this.events.triggerEvent('endQueryMap', event);
    },
    
    findFeature: function(featureId) {
        var feature = this.resultLayer.getFeatureById(featureId);
        if(feature) return feature;
        
        var len = this.vectorFeaturesOverLimit.length, i,
            feature = null;

        for(i = 0; i < len; i++) {
            if(this.vectorFeaturesOverLimit[i].id == featureId) {
                feature = this.vectorFeaturesOverLimit[i];
            }
        }
        
        if(feature) {
            this.resultLayer.addFeatures([feature]);
        }
        return feature;
    },
    
    exportFeatureType: function (featureType, format){
        var data = [], fields = [], propLen, featLen;
        var fType = GisClientMap.getFeatureType(featureType);
        
        if(!fType) return alert('Errore: il featureType '+featureType+' non esiste');
        
        propLen = fType.properties.length;
        
        for (var i = 0; i < propLen; i++) {
            var col = fType.properties[i];
            if(col.header && col.resultType!=4 && col.relationType!=2){
                fields.push({field_name:col.name, title:col.header, type:col.fieldType});
            }
        }; 
        
        featLen = this.resultLayer.features.length;
        
        for (var j = 0; j < featLen; j++){
            var feat = this.resultLayer.features[j];
            if (feat.featureTypeName == featureType) {
                var tmpArr = new Object;
                for (var k = 0; k < fields.length; k++) {
                    var field = fields[k];
                    tmpArr [field.field_name] = feat.attributes[field.field_name];
                }
                data.push(tmpArr);
            } 
        }
        
        var params = {
            export_format: format,
            feature_type: featureType,
            data: data,
            fields: fields
        };
        
        var request = OpenLayers.Request.POST({
            url: this.baseUrl + '/services/export.php',
            data: JSON.stringify(params),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            callback: function(response) {
                    var fmt = format;
                    if(!response || typeof(response) != 'object' || !response.status || response.status != 200) {
                        return alert('Errore di sistema');
                    }
                
                    if (!response.responseText) {
                        return alert('Nessun file generato, errore non previsto');
                    }
                    
                    var responseObj = JSON.parse(response.responseText);
                    
                    if (!responseObj.result || responseObj.result != 'ok') {
                        var errMessage = 'Errore in generazione file';
                        if (responseObj.error)
                            errMessage += ' - Dettagli: ' + responseObj.error;
                        return alert (errMessage);
                    }
                    
                    if (fmt == 'xls') {
                        window.location.assign(responseObj.file);
                    }
                    else {
                        var win = window.open(responseObj.file, '_blank');
                        win.focus();
                    }
            },
            scope: this
        });
    },
    
    getFeatureDetails: function(featureType, feature, relationName) {
        var fType = GisClientMap.getFeatureType(featureType);
        
        if(!feature) return console.log('Feature undefined');
        if(!fType) return alert('Errore: il featureType '+featureType+' non esiste');
        
        var len = fType.properties.length, property, i,
            pkey;

        for(i = 0; i < len; i++) {
            property = fType.properties[i];
            
            if(property.isPrimaryKey) {
                pkey = property.name;
                break;
            }
        }
        
        if(!pkey) {
            return alert('Errore: la primary key non è tra i campi del layer, impossibile visualizzare i dati collegati');
        }
        
        if(!feature.attributes[pkey]) {
            return alert('Errore: la feature selezionata non ha un valore per la primary key '+pkey);
        }
        
        var params = {
            projectName: GisClientMap.projectName,
            mapsetName: GisClientMap.mapsetName,
            srid: GisClientMap.map.projection,
            featureType: featureType,
            featureId: feature.attributes[pkey],
            relationName: relationName,
            action: 'viewdetails'
        };
        var request = OpenLayers.Request.POST({
            url: this.baseUrl + '/services/xMapQuery.php',
            data: OpenLayers.Util.getParameterString(params),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            callback: function(response) {
                if(!response || typeof(response) != 'object' || !response.status || response.status != 200) {
                    return alert('Errore di sistema');
                }
                
                var eventData = {
                    featureType: featureType,
                    feature: feature,
                    relation: {relationName: relationName},
                    response: response
                };
                
                this.events.triggerEvent('viewdetails', eventData);
            },
            scope: this
        });
    },
    
    handleFeatureSelected: function(event) {
        var me = this,
            feature = event.feature;
        
        me.writeDataPopup(event);
        me.events.triggerEvent('featureselected', {feature:feature});
    },
    
    handleFeatureUnSelected: function(event) {
        var me = this,
            feature = event.feature;
        
        me.events.triggerEvent('featureunselected', {feature:feature});
    },
    
    handleFeatureHighlighted: function(event) {
        var me = this,
            feature = event.feature;

        me.writeDataPopup(event);
        me.events.triggerEvent('featurehighlighted', {feature:feature});
    },
    
    handleFeatureUnHighlighted: function(event) {
        var me = this,
            feature = event.feature;
        
        me.events.triggerEvent('featureunhighlighted', {feature:feature});
    },

    CLASS_NAME: "OpenLayers.GisClient.queryToolbar"

});
OpenLayers.GisClient.queryToolbar.ALL_LAYERS = "OL_ALL_LAYERS";
OpenLayers.GisClient.queryToolbar.VISIBLE_LAYERS = "OL_VISIBLE_LAYERS";
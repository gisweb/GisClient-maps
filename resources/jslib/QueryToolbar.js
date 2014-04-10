OpenLayers.GisClient.queryToolbar = OpenLayers.Class(OpenLayers.Control.Panel,{

    
    resultLayer:null,
    queryLayers:[],
    queryFilters:{},
    wfsCache:{},
    layers:[],
    selgroup:null,
    featureTypes:null,
    visibleLayers:[],
    resultLayer:null,
    resultStyle:null,
    maxWfsFeatures:100,
    maxVectorFeatures:500,
    selectControl:null,
    highlightControl:null,
    modifyControl:null,
    resultTarget:null,
    resultLayout:'TABLE',//LIST POPUP


    initialize: function(options) {
        OpenLayers.Control.Panel.prototype.initialize.apply(this, [options]);

        var controls = [
            new OpenLayers.Control.QueryMap(
                OpenLayers.Handler.RegularPolygon,
                {
                    wfsCache:this.wfsCache,
                    layers:this.visibleLayers,       
                    queryFilters:this.queryFilters, 
                    resultLayer:this.resultLayer, 
                    maxWfsFeatures:this.maxWfsFeatures,   
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
                    wfsCache:this.wfsCache,
                    layers:this.visibleLayers,                    
                    queryFilters:this.queryFilters, 
                    resultLayer:this.resultLayer, 
                    maxWfsFeatures:this.maxWfsFeatures,   
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
                    wfsCache:this.wfsCache,
                    layers:this.visibleLayers,                    
                    queryFilters:this.queryFilters, 
                    resultLayer:this.resultLayer, 
                    maxWfsFeatures:this.maxWfsFeatures,   
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
            ),
            new OpenLayers.Control.Button({
                //type: OpenLayers.Control.TYPE_TOGGLE, 
                iconclass:"glyphicon-white glyphicon-search", 
                title:"Ricerca",
                text:"Ricerca",
                trigger:ricerca
            })
/*
            ,new OpenLayers.Control.Button({
                //type: OpenLayers.Control.TYPE_TOGGLE, 
                iconclass:"glyphicon-white glyphicon-search", 
                title:"Avanzata",
                text:"Avanzata",
                trigger:ricercaAvanzata

            })
*/
        ];
        this.addControls(controls);
    },

    //boh non so se inizializzare qui oppure passare la wfscache già pronta ...  da vedere per ora scelgo la 2
    initWfsCache:function(){//NON USATA INIZIALIZZO FUORI
        var layer;
        for (var i = 0; i < this.map.config.featureTypes.length; i++) {
            layer =  this.map.getLayersByName(this.map.config.featureTypes[i].WMSLayerName)[0];
            if(typeof(this.wfsCache[layer.id])=='undefined') this.wfsCache[layer.id] = {featureTypes:[]};
            this.wfsCache[layer.id].featureTypes.push(this.map.config.featureTypes[i]);
        };
        this.addfeaturesCombo();
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

        var option, list = document.createElement("select");
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
            if(group != featureTypes[0].group){
                group=featureTypes[0].group;
                option = document.createElement("optgroup");
                option.label="Tema: " + group;
                list.add(option);
            }
            for(var i=0;i<featureTypes.length;i++){
                option = this.getOption(featureTypes[i].title,featureTypes[i].typeName);
                OpenLayers.Element.addClass(option, "olOptionDisabled");
                list.add(option);
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
            for(var i=0;i<this.map.layers.length;i++)
                if(this.wfsCache[this.map.layers[i].id] && this.map.layers[i].visibility && this.map.layers[i].inRange) layers.push(this.map.layers[i]);
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
            } 
        }

        //temporaneamente funziona con la var globale conditionBuilderFields, poi del conditionBuilder si farà una classe e verrà fatto diversamente
        var featureTypes = GisClientMap.featureTypes,
            len = featureTypes.length, fType, i;
         
        conditionBuilderFields = [];
         
        for(i = 0; i < len; i++) {
            if(featureTypes[i].typeName == typeName) {
                fType = featureTypes[i];
                break;
            }
        }
        
        if(!fType) return;
        
        var properties = fType.properties, 
            len = properties.length, property, i;

        for(i = 0; i < len; i++) {
            property = properties[i];

            if(!property.searchType) continue;
            
            conditionBuilderFields.push({
                name: property.name,
                label: property.header
            });
        }
        $('.query').empty();
        addqueryroot('.query', true);
        //fine cose temporanee
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
                this.controls[i].events.register('featuresLoaded', this, this.writeResultPanel);
                this.controls[i].events.register('endQueryMap', this, this.writeAllResultPanel);
            }
        }
        OpenLayers.Control.Panel.prototype.draw.apply(this);
        return this.div
    },

    redraw: function() {

        OpenLayers.Control.Panel.prototype.redraw.apply(this);
        this.resultLayer.setVisibility(this.active);
        var currentHeight = this.div.style.height;
        if (this.active) {
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
            this.deactivateVectorControl();
            this.map.events.unregister('changelayer',this,this.updateVisibleLayers);
            this.div.style.height="0px";   
           // this.featuresCombo.parentNode.removeChild(this.featuresCombo);
        }

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
            styleMap: this.resultLayerStyle,
            displayInLayerSwitcher: true
        });
        
        this.map.addLayer(resultLayer);

        //Setto i controlli
        var selectControl = new OpenLayers.Control.SelectFeature(resultLayer);
        var modifyControl = new OpenLayers.Control.ModifyFeature(resultLayer);
        var highlightControl = new OpenLayers.Control.SelectFeature(resultLayer,
            {
                hover: true,
                highlightOnly: true,
                renderIntent: "temporary"
            }
        );

        this.map.addControl(modifyControl);
        this.map.addControl(selectControl); 
        this.map.addControl(highlightControl);
    
        this.selectControl = selectControl;
        this.highlightControl = highlightControl;
        this.modifyControl = modifyControl;
        
        this.resultLayer = resultLayer;

    },

    activateVectorControl: function(e){
        this.highlightControl.activate();
        this.selectControl.activate();
    },
    
    deactivateVectorControl: function(e){
        this.selectControl.deactivate();
        this.highlightControl.deactivate();
    },

    //SCRIVE IL VALORE DELL'ATTRIBUTO: DA RIPRISTINARE IL RENDER COME NELLA 2 (LINK, IMMAGINE.....)
    writeDataAttribute: function(type,value){

        return value

    },

    writeDataTable: function(featureType){

        var col, colIndex, values, htmlTable, htmlHeaders = '', cssHeaders = '', aCols = [];
        for (var i = 0; i < featureType.properties.length; i++) {
            col = featureType.properties[i];
            if(col.header && col.resultType!=4){
                htmlHeaders += '<th>' + col.header + '</th>';
                aCols.push(col.name);
                colIndex = aCols.length;
                cssHeaders += '.smalltable td:nth-of-type(' + colIndex + '):before { content: "' + col.header + '";}\n'
            };
        };
        if(aCols.length == 0) return false;
        if(featureType.features.length == 0) return false;//VEDERE DI METTRE NELLE OPZIONI SE AGGIUNGERE COMUNQUE GLI HEADERS

        cssHeaders = '<style>' + cssHeaders + '</style>';

        htmlTable = "<span class='featureTypeTitlexxx'>"+featureType.title+"</span><table class='featureTypeData'><thead><tr>" + htmlHeaders + '</tr><tbody>';
        for (var j = 0; j < featureType.features.length; j++) {
            values = '';
            for (var i = 0; i < aCols.length; i++) {
                values += '<td>'+ this.writeDataAttribute(featureType.properties[i].fieldType,featureType.features[j].attributes[aCols[i]]) +'</td>';
            }
            htmlTable +=  '<tr>'+values+'</tr>';        
        }

        htmlTable += '</tbody></table>';

        var featureTypeDiv = document.createElement("div");
        OpenLayers.Element.addClass(featureTypeDiv, "featureTypeTitle");
        featureTypeDiv.innerHTML = cssHeaders + htmlTable;
        return featureTypeDiv;

    },

    writeDataPopup: function(featureType){

        //SCRIVE IL POPUP PER OGNI FEATURE

    },


    initResultPanel: function(e) {
        var loadingControl = this.map.getControlsByClass('OpenLayers.Control.LoadingPanel')[0];
        loadingControl.maximizeControl();
        this.resultTarget.innerHTML =  '';
        this.events.triggerEvent('startQueryMap');
    },

    writeResultPanel: function(e) {

        //opzioni tabella lista popup todo
        //attivare opzione scrivo anche se la lista dei risultati è vuota
        if(e.properties){
            var resDiv = this.writeDataTable(e);
            resDiv && this.resultTarget.appendChild(resDiv);
        }

    },
    writeAllResultPanel: function(e) {
        var loadingControl = this.map.getControlsByClass('OpenLayers.Control.LoadingPanel')[0];
        loadingControl.minimizeControl();
        //SCRIVO TUTTA LA TABELLA (???)
        this.events.triggerEvent('endQueryMap');

    },

    CLASS_NAME: "OpenLayers.GisClient.queryToolbar"

});
OpenLayers.GisClient.queryToolbar.ALL_LAYERS = "OL_ALL_LAYERS";
OpenLayers.GisClient.queryToolbar.VISIBLE_LAYERS = "OL_VISIBLE_LAYERS";
/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
OpenLayers.GisClient.geoNoteToolbar = OpenLayers.Class(OpenLayers.Control.Panel,{
    // **** baseUrl - Gisclient service URL
    baseUrl : '/gisclient',
    redlineLayer : null,
    div: null,
    redlineColor: '#FF00FF',
    divdrawbtns: null,
    divopsgbtns: null,
    divopsnbtns: null,
    
    noteID: null,
    noteTitle: 'Nota senza nome',
    savedState: false,
    loading: false,
    
    baseURL: '/gisclient3/',
    
    
    initialize: function(options) {
        OpenLayers.Control.Panel.prototype.initialize.apply(this, [options]);
        
        this.serviceURL = this.baseURL + 'services/plugins/geonote/redline.php';
        
        var redlineStyleDefault = new OpenLayers.Style({
            pointRadius: 5, 
            fillOpacity: 0.7, 
            fontSize: "12px",
            fontFamily: "Courier New, monospace",
            fontWeight: "bold",
            labelAlign: "cm",
            labelXOffset: 0,
            labelYOffset: 10,
            fillColor: '${color}', 
            strokeColor: '${color}',
            label: '${label}',
            externalGraphic: '${attach}',
            graphicWidth: 50,
            graphicHeight: 50
            }
        );
        
        var redlineStyleTemporary = new OpenLayers.Style({
            pointRadius: 5, 
            fillOpacity: 0.4, 
            fontSize: "12px",
            fontFamily: "Courier New, monospace",
            fontWeight: "bold",
            labelAlign: "cm",
            labelXOffset: 0,
            labelYOffset: 10,
            fillColor: '#ee9900', 
            strokeColor: '#ee9900',
            label: '',
            externalGraphic: ''
            }
        );
        
        var redlineStyleSelect = new OpenLayers.Style({
            pointRadius: 5, 
            fillOpacity: 0.4, 
            fontSize: "12px",
            fontFamily: "Courier New, monospace",
            fontWeight: "bold",
            labelAlign: "cm",
            labelXOffset: 0,
            labelYOffset: 10,
            fillColor: '#ee9900', 
            strokeColor: '#ee9900',
            label: ''
            }
        );
        
        var redlineStyleMap = new OpenLayers.StyleMap({
            'default': redlineStyleDefault,
            'temporary': redlineStyleTemporary,
            'select': redlineStyleSelect
	});

        var saveStrategy = new OpenLayers.Strategy.Save(
            {
                eventListeners: {
                    start: this.saveSuccess,
                    success: this.saveSuccess,
                    fail: this.saveFail,
                    scope:this
                },
                pippo:'pippo'
            }
        );

        var loadStrategy = new OpenLayers.Strategy.Fixed(
            {
                loadend:{
                        callback: this.loadSuccess,
                        scope:this
                },
                update:{
                        callback:function(response){console.log('UPDATE')},
                        scope:this
                },
                pippo:'pippo'
            }
        );

        saveStrategy.events.register('fail', this, this.saveFail);
        
        this.redlineLayer = new OpenLayers.Layer.Vector('Redline', {
            displayInLayerSwitcher:false,
            styleMap: redlineStyleMap,
            strategies: [
                saveStrategy, loadStrategy
            ]
        });
        
        var controls = [
            new OpenLayers.Control.DrawFeature(
                this.redlineLayer, 
                OpenLayers.Handler.Point,
                {
                    containerDiv: this.divdrawbtns,
                    handlerOptions:{ options : { label:''}},
                    iconclass:"glyphicon-white glyphicon-tag", 
                    text:"Etichetta", 
                    title:"Inserisci etichetta",
                    eventListeners: {
                        'activate': function(){
                            this.map.currentControl.deactivate();
                            this.map.currentControl=this;
                        }
                    }
                }
            ),
            new OpenLayers.Control.DrawFeature(
                this.redlineLayer, 
                OpenLayers.Handler.Path,
                {
                    div: this.divdrawbtns,
                    handlerOptions:{freehand:false},
                    iconclass:"glyphicon-white glyphicon-pencil", 
                    text:"Linea", 
                    title:"Inserisci linea",
                    eventListeners: {'activate': function(){
                            this.map.currentControl.deactivate();
                            this.map.currentControl=this;
                        }
                    }
                }
            ),
            new OpenLayers.Control.DrawFeature(
                this.redlineLayer, 
                OpenLayers.Handler.Polygon,
                {
                    div: this.divdrawbtns,
                    iconclass:"glyphicon-white glyphicon-unchecked", 
                    text:"Poligono", 
                    title:"Inserisci poligono",
                    eventListeners: {'activate': function(){
                            this.map.currentControl.deactivate();
                            this.map.currentControl=this;
                        }
                    }
                }
            ),
            new OpenLayers.Control.DrawFeature(
                this.redlineLayer, 
                OpenLayers.Handler.RegularPolygon,
                {
                    handlerOptions: {sides: 50},
                    div: this.divdrawbtns,
                    iconclass:"glyphicon-white glyphicon-record", 
                    text:"Cerchio", 
                    title:"Inserisci cerchio",
                    eventListeners: {'activate': function(){
                            this.map.currentControl.deactivate();
                            this.map.currentControl=this;
                        }
                    }
                }
            ),
            new OpenLayers.Control(
                {
                    type: OpenLayers.Control.TYPE_BUTTON ,
                    displayClass: "olToolbarSeparator",
                    iconclass:"glyphicon-white glyphicon-option-vertical",
                    trigger: function() {}
                }
            ),
            new OpenLayers.Control(
                {
                    ctrl: this,
                    type: OpenLayers.Control.TYPE_BUTTON, 
                    displayClass: "jscolor",
                    iconclass:"glyphicon-white glyphicon-tint", 
                    text:"Colore", 
                    title:"Scegli colore",
                    trigger: this.colorPicker
                }
            ),
            new OpenLayers.Control.ModifyFeature(
                this.redlineLayer,
                {
                    mode: OpenLayers.Control.ModifyFeature.ROTATE | OpenLayers.Control.ModifyFeature.RESIZE | OpenLayers.Control.ModifyFeature.DRAG,
                    vertexRenderIntent: 'temporary',
                    iconclass:"glyphicon-white glyphicon-pencil", 
                    text:"Modifica", 
                    title:"Modifica geometrie - ruota, sposta, scala",
                    eventListeners: {
                        'activate': function(){
                            this.map.currentControl.deactivate();
                            
                            var origLayerIndex = this.map.getLayerIndex(this.layer);
                            var maxIndex = this.map.getLayerIndex(this.map.layers[this.map.layers.length -1]);
                            if(origLayerIndex < maxIndex) this.map.raiseLayer(this.layer, (maxIndex - origLayerIndex));
                            this.map.resetLayersZIndex();
                            
                            this.map.currentControl=this
                        }
                    }
                }
            ),
            new OpenLayers.Control.SelectFeature(
                this.redlineLayer,
                {
                    ctrl: this,
                    iconclass:"glyphicon-white glyphicon-remove", 
                    text:"Cancella", 
                    title:"Cancella geometria",
                    eventListeners: {'activate': function(){this.map.currentControl.deactivate();this.map.currentControl=this}},
                    onSelect:function(feature){
                        var self = this;
                        
                        var origLayerIndex = this.map.getLayerIndex(this.layer);
                        var maxIndex = this.map.getLayerIndex(this.map.layers[this.map.layers.length -1]);
                        if(origLayerIndex < maxIndex) this.map.raiseLayer(this.layer, (maxIndex - origLayerIndex));
                        this.map.resetLayersZIndex();
                        
                        self.unselectAll();
                        if (confirm('Eliminare la geometria selezionata?')) {
                            self.layer.removeFeatures([feature]);
                            this.ctrl.savedState = false;
                        }
                    }
                }
            ),
            new OpenLayers.Control(
                {
                    type: OpenLayers.Control.TYPE_BUTTON ,
                    displayClass: "olToolbarSeparator",
                    iconclass:"glyphicon-white glyphicon-option-vertical",
                    trigger: function() {}
                }
            ),
            new OpenLayers.Control(
                {
                    ctrl: this,
                    type: OpenLayers.Control.TYPE_BUTTON ,
                    iconclass:"glyphicon-white glyphicon-list-alt", 
                    text:"Nuova", 
                    title:"Nuova nota",
                    trigger: this.noteNew
                }
            ),
            new OpenLayers.Control(
                {
                    ctrl: this,
                    type: OpenLayers.Control.TYPE_BUTTON ,
                    iconclass:"glyphicon-white glyphicon-floppy-saved", 
                    text:"Salva", 
                    title:"Salva nota",
                    trigger: this.noteSave
                }
            ),
            new OpenLayers.Control(
                {
                    ctrl: this,
                    type: OpenLayers.Control.TYPE_BUTTON ,
                    iconclass:"glyphicon-white glyphicon-floppy-open", 
                    text:"Carica", 
                    title:"Carica nota",
                    trigger: this.noteLoad
                }
            ),
            new OpenLayers.Control(
                {
                    ctrl: this,
                    type: OpenLayers.Control.TYPE_BUTTON ,
                    iconclass:"glyphicon-white glyphicon-floppy-remove", 
                    text:"Elimina", 
                    title:"Elimina nota",
                    trigger: this.noteDelete
                }
            ),
    
        ];
        
    this.addControls(controls);
    },
    
    draw:function(){
        this.initRedlineLayer();
        OpenLayers.Control.Panel.prototype.draw.apply(this);
        
        for (var i=0, len=this.controls.length; i<len; i++) {
            if(this.controls[i] instanceof OpenLayers.Control.DrawFeature){
                //this.controls[i].layer = this.redlineLayer;
                //this.controls[i].events.register('startQueryMap', this, this.initResultPanel);
                //this.controls[i].events.register('featuresLoaded', this, this.handleFeatureResult);
                //this.controls[i].events.register('endQueryMap', this, this.writeAllResultPanel);
            }
        }

        var mainDiv = this.div.parentElement;
        var divNoteTitle = document.createElement('div');
        divNoteTitle.setAttribute('id', 'geonote_note_title_div');
        mainDiv.appendChild(divNoteTitle);
        var txtNoteHeader = document.createElement('span');
        txtNoteHeader.setAttribute('id', 'geonote_note_header');
        divNoteTitle.appendChild(txtNoteHeader);
        var txtNoteTitle = document.createElement('span');
        txtNoteTitle.setAttribute('id', 'geonote_note_title');
        divNoteTitle.appendChild(txtNoteTitle);
        
        return this.div
    },
    
    redraw: function() {

        OpenLayers.Control.Panel.prototype.redraw.apply(this);

        for (var i=0, len=this.controls.length; i<len; i++) {
            if (this.controls[i].div)
            if(this.controls[i] instanceof OpenLayers.Control.DrawFeature){
                //this.controls[i].div = drawBtns;
                //this.controls[i].events.register('startQueryMap', this, this.initResultPanel);
                //this.controls[i].events.register('featuresLoaded', this, this.handleFeatureResult);
                //this.controls[i].events.register('endQueryMap', this, this.writeAllResultPanel);
            }
        }
        
        var divNoteTitle = document.getElementById("geonote_note_title_div");
        var txtNoteHeader = document.getElementById("geonote_note_header");
        var txtNoteTitle = document.getElementById("geonote_note_title");
        
        if (this.active) {
            divNoteTitle.className = 'olInfoBar';
            txtNoteHeader.className = 'spanHeader';
            txtNoteHeader.textContent = 'Titolo nota:';
            txtNoteTitle.className = 'spanTitle';
            txtNoteTitle.textContent = this.noteTitle;
            //divNoteTitle.style.width = txtNoteTitle.offsetWidth + 20 + 'px';    
        }
        else
        {
            divNoteTitle.className = '';
            txtNoteHeader.className = '';
            txtNoteHeader.textContent = '';   
            txtNoteTitle.className = '';
            txtNoteTitle.textContent = '';   
        }
        
    },

    initRedlineLayer: function() {
        var ctrl = this;
        
        this.redlineLayer.protocol = new OpenLayers.Protocol.HTTP({
            url: this.serviceURL,
            format: new OpenLayers.Format.GeoJSON({
                ignoreExtraDims: true
                //internalProjection: mapPanel.map.baseLayer.projection
                //externalProjection: wgs84
            }),
            params:{
                PROJECT: GisClientMap.projectName,
                MAPSET: GisClientMap.mapsetName,
                SRS: this.map.projection
            },
            headers: {"Content-Type": "application/x-www-form-urlencoded"}
        });

        this.map.addLayer(this.redlineLayer);
        this.redlineLayer.events.on({
            "loadend" : ctrl.noteLoaded,
            //"sketchstarted" : ctrl.setFeatureDefaults,
            "sketchcomplete": ctrl.styleFeature,
            "featureadded": ctrl.setLabel,
            "featuremodified": ctrl.featureModified,
            "featureremoved": ctrl.featureModified,
            "vertexmodified": ctrl.featureModified,
            scope: ctrl
        });
    },
    
    activate: function() {
        var activated = OpenLayers.Control.prototype.activate.call(this);
        if(activated) {
            this.noteReset();
        }
    },
    
    deactivate: function() {
        if (!this.savedState && this.redlineLayer.features.length > 0) { 
            if (!confirm('Alcuni elementi della nota corrente non sono stati salvati\nSe si disattiva il tool note andranno persi. Continuare?')) {
                return;
            }
        } 
        var deactivated = OpenLayers.Control.prototype.deactivate.call(this);
        if(deactivated) {
            this.noteReset();
            this.map.currentControl.deactivate();
            this.map.currentControl=this.map.defaultControl;
        }
    },
    
    setLabel: function(obj) {
        var ctrl = this;
        if(obj.feature.geometry.CLASS_NAME == "OpenLayers.Geometry.Point" && ctrl.loading == false) {
            var request = new XMLHttpRequest();
            request.addEventListener("load", function(evt){ 
                ctrl.addPopup(200, 200, this.response);
                document.getElementById("geonote_label_attach").addEventListener('click', function () {
                    document.getElementById("geonote_label_attachment").click();
                });
                
                var attachFormData = new FormData();
                var saveDone = true;
                
                document.getElementById("geonote_label_attachment").addEventListener('change', function () {
                    var fileName = (Date.now().toString(36) + Math.random().toString(36).substr(2, 9)).toUpperCase();
                    var divUploads = document.getElementById("geonote_popup_uploads");
                    divUploads.innerHTML = "";
                    
                    var button = document.createElement('a'),
                    icon = document.createElement('span'),
                    textSpan = document.createElement('span'),
                    pBarSpan = document.createElement('span');

                    button.className += 'geonote-upload-button';
                    icon.className += "glyphicon-white glyphicon-file";
                    textSpan.className += 'geonote-upload-text';
                    pBarSpan.className += 'geonote-upload-pbar';
                    button.appendChild(icon);
                    textSpan.innerHTML = this.files[0].name;
                    pBarSpan.appendChild(textSpan)
                    button.appendChild(pBarSpan);
                    
                    divUploads.appendChild(button);
                                        
                    attachFormData.append("REQUEST", "attUpload");
                    attachFormData.append("FILENAME", fileName);
                    attachFormData.append("ATTACHMENT", this.files[0]); 
                    
                    var attachRequest = new XMLHttpRequest();
                    
                    attachRequest.upload.addEventListener("progress", function(e) {
                        var totSize = textSpan.getBoundingClientRect().width;
			var pc = parseInt(e.loaded / e.total * totSize);
                        console.log(pc);
			pBarSpan.style.width = pc + "px";
                    }, false);
                    
                    attachRequest.onreadystatechange = function(e) {
			if (attachRequest.readyState == 4 && attachRequest.status == 200) {
                            if (attachRequest.response) {
                                var responseObj = JSON.parse(attachRequest.response);
                                if (responseObj.error) {
                                    alert ('Errore in salvataggio file nella nota: ' + responseObj.error);
                                    divUploads.removeChild(button);
                                    saveDone = true;
                                }
                                else {
                                    obj.feature.attributes.attach = responseObj.attachUrl;
                                    saveDone = true;
                                }
                            }                             
			}
                    };

                    saveDone = false;
                    attachRequest.open('POST', ctrl.serviceURL);
                    attachRequest.send(attachFormData);
                });
                
                document.getElementById("geonote_setlabel_button").addEventListener("click", function (evt) {
                    if (!saveDone) {
                        alert("Upload di un allegato in corso, attendere il completamento dell'operazione");
                        return;
                    }
                        
                    obj.feature.attributes.label = document.getElementById("geonote_label_text").value;
                    ctrl.redlineLayer.redraw();

                    if(ctrl.popup)	
                    ctrl.map.removePopup(ctrl.popup);
                    ctrl.popup.destroy();
                    ctrl.popup = null;
                }); 
                
            }, false);
            
            request.open('GET', 'geonote_label.html', true),
            request.send();
       }
    },
    
    featureModified: function(obj) {
        this.savedState = false;
    },
    
    styleFeature: function(obj) {
        this.savedState = false;
        obj.feature.attributes.color = this.redlineColor;
        if (!obj.feature.attributes.label)
            obj.feature.attributes.label = '';
        if (!obj.feature.attributes.attach)
            obj.feature.attributes.attach = '';
    },
    
    addPopup: function(popupWidth, popupHeight, popupContent, oPopupPos) {
        var oPopupPos;
	var nReso = this.map.getResolution();
	
        if (!oPopupPos) {
            oPopupPos = new OpenLayers.LonLat(this.map.getExtent().getCenterPixel().x,this.map.getExtent().getCenterPixel().y);
            oPopupPos.lon -= popupWidth/2 * nReso;
            oPopupPos.lat += popupHeight/2 * nReso;
        }
	
        var popup = new OpenLayers.Popup.Anchored(
                "geonote-popup", 
                oPopupPos,
                new OpenLayers.Size(popupWidth,popupHeight),
                '<div id="geonote-popup-content"></div>',
                null, true);
        
        //popup.closeOnMove = true;
        var self=this;
        
        popup.onclick = function(){
            return false
        };
        
        popup.addCloseBox(function(e){
                //Event.stop(e)
                if(self.popup){
                    this.map.removePopup(self.popup);
                    self.popup.destroy();
                    self.popup = null;
                }
                
                //self.activate();

        });
        
        if(self.popup)	
            self.map.removePopup(self.popup);
            self.map.addPopup(popup);
            self.popup = popup;
        
        if (popupContent) {
                document.getElementById("geonote-popup-content").innerHTML=popupContent;
        };      
    },
    
    colorPicker: function () {
        var self = this;
       
        if (self.ctrl.popup) {
            if (document.getElementById('geonote_color-picker')) {
                self.ctrl.map.removePopup(self.ctrl.popup);
                self.ctrl.popup.destroy();
                self.ctrl.popup = null;
                return;
            }                
        }
        
        var popupWidth = 280;
        var popupHeight = 280;
        var nReso = this.map.getResolution();       
        var tmpClass = document.getElementsByClassName('jscolorItemInactive');
        var colorPickerBtn = tmpClass[0];
        var btnX = colorPickerBtn.getBoundingClientRect().left;
        var btnY = document.getElementById(self.ctrl.div.id).getBoundingClientRect().bottom;
        var oPopupPos = this.map.getLonLatFromPixel({x:btnX, y:btnY});
        //oPopupPos.lon -= popupWidth/2 * nReso;
        oPopupPos.lat += 25 * nReso;

        var request = new XMLHttpRequest();
        request.addEventListener("load", function(evt){ 
            self.ctrl.addPopup(popupWidth, popupHeight, this.response, oPopupPos);
            var tmpColor = null;
            var noteColorPicker = ColorPicker(
                document.getElementById('geonote_color-picker'),

                function(hex, hsv, rgb) {
                document.getElementById("geonote_setcolor").style.backgroundColor = hex;  
                tmpColor = hex;
                });
            noteColorPicker.setHex(self.ctrl.redlineColor);
            
            document.getElementById("geonote_setcolor_button").addEventListener("click", function (evt) {
                if (tmpColor) {
                    self.ctrl.redlineColor = tmpColor;
                    if(self.ctrl.popup) {
                        self.ctrl.map.removePopup(self.ctrl.popup);
                        self.ctrl.popup.destroy();
                        self.ctrl.popup = null;
                    }
                }
            });
                
        }, false);
         
        request.open('GET', 'geonote_colorpicker.html', true),
        request.send();
   }, 
   
   noteSave: function () {
        var self = this;
        
        self.map.currentControl.deactivate();
        self.map.currentControl=self.map.defaultControl;
       
        if (self.ctrl.popup) {
            if (document.getElementById('geonote_note_name')) {
                self.ctrl.map.removePopup(self.ctrl.popup);
                self.ctrl.popup.destroy();
                self.ctrl.popup = null;
                return;
            }                
        }

        var request = new XMLHttpRequest();
            request.addEventListener("load", function(evt){ 
                self.ctrl.addPopup(200, 200, this.response);
                
                document.getElementById("geonote_note_name").value = self.ctrl.noteTitle;
                
                document.getElementById("geonote_save").addEventListener("click", function (evt) {
                    var noteTitle = document.getElementById("geonote_note_name").value;
                    
                    var reqParams = self.ctrl.redlineLayer.protocol.params;
                    
                    
                    reqParams["TITLE"] = noteTitle;
                    reqParams["REQUEST"] = 'SaveLayer';
                    //self.ctrl.redlineLayer.protocol.params["SRS"] = self.ctrl.map.projection;
                    if (self.ctrl.noteID)
                        reqParams["REDLINEID"] = self.ctrl.noteID;
                    else
                        reqParams["REDLINEID"] = null;
                    
                    var geojson_format = new OpenLayers.Format.GeoJSON();
                    reqParams.features = geojson_format.write(self.ctrl.redlineLayer.features);
                    
                    var request = OpenLayers.Request.POST({
                        url: self.ctrl.serviceURL,
                        data: OpenLayers.Util.getParameterString(reqParams),
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded"
                        },
                        callback: function(response) {
                            var self = this;
                            if(!response || typeof(response) != 'object' || !response.status || response.status != 200) {
                                return alert('Errore di sistema');
                            }

                            if (!response.responseText) {
                                    return alert('Errore di sistema, impossibile accedere alle note salvate');
                            }

                            var responseObj = JSON.parse(response.responseText);
                            
                            if (responseObj.error) {
                                alert('Errore in salvataggio nota:' + responseObj.error);
                                this.savedState = false;
                            }
                            
                            this.noteTitle = responseObj.redlineTitle;
                            this.noteID = responseObj.redlineId;
                            this.savedState = true;
                            
                            this.noteLoader(this.noteID);
                            
                            this.redraw();
                            if(this.popup) {	
                                this.map.removePopup(this.popup);
                                this.popup.destroy();
                                this.popup = null;
                            }
                        },
                        scope: self.ctrl
                    });
                }); 
                
            }, false);
            
        request.open('GET', 'geonote_save.html', true),
        request.send();
   }, 
   
   saveSuccess: function (response) {
		
    },
	
    saveFail: function(response) {
       
       
    },
    
    
    noteLoad: function(redlineID) {
        var self = this;
        
        self.map.currentControl.deactivate();
        self.map.currentControl=self.map.defaultControl;
        
        if (self.ctrl.popup) {
            if (document.getElementById('geonote_note_name')) {
                self.ctrl.map.removePopup(self.ctrl.popup);
                self.ctrl.popup.destroy();
                self.ctrl.popup = null;
                return;
            }                
        }
        
        var params = {
            PROJECT: self.ctrl.redlineLayer.protocol.params['PROJECT'],
            MAPSET: self.ctrl.redlineLayer.protocol.params['MAPSET'],
            SRS: self.ctrl.redlineLayer.protocol.params['SRS'],
            REQUEST: 'GetLayers' 
        };
        var request = OpenLayers.Request.POST({
            url: self.ctrl.serviceURL,
            data: OpenLayers.Util.getParameterString(params),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            callback: function(response) {
                var self = this;
                if(!response || typeof(response) != 'object' || !response.status || response.status != 200) {
                    return alert('Errore di sistema');
                }
                
                if (!response.responseText) {
                        return alert('Errore di sistema, impossibile accedere alle note salvate');
                }

                var responseObj = JSON.parse(response.responseText);
                
                if (responseObj.layers)
                    self.ctrl.notesList = responseObj.layers;
                
                var request = new XMLHttpRequest();
                request.addEventListener("load", function(evt){ 
                    self.ctrl.addPopup(200, 200, this.response);
                    
                    for (var i=0; i < self.ctrl.notesList.length; i++){
                        var noteOpt = document.createElement( 'option' ); 
                        noteOpt.value = self.ctrl.notesList[i].redline_id;
                        noteOpt.text = self.ctrl.notesList[i].redline_title;
                        document.getElementById("geonote_note_list").add(noteOpt);
                    }

                    document.getElementById("geonote_load").addEventListener("click", function (evt) {
                        
                        if (!self.ctrl.savedState && self.ctrl.redlineLayer.features.length > 0) { 
                            if (!confirm('Alcuni elementi della nota corrente non sono stati salvati\nSe si procede con il caricamento andranno persi. Continuare?')) {
                                if(self.ctrl.popup) {	
                                    self.ctrl.map.removePopup(self.ctrl.popup);
                                    self.ctrl.popup.destroy();
                                    self.ctrl.popup = null;
                                }
                                return;
                            }
                        }
                        var redlineList = document.getElementById("geonote_note_list");
                        var redlineID = redlineList.value;
                        
                        if (!redlineID)
                            return;
                        
                        var redlineTitle = redlineList.options[redlineList.selectedIndex].innerHTML;
                        
                        self.ctrl.noteTitle = redlineTitle;
                        self.ctrl.noteID = redlineID;
                        self.ctrl.redraw();
                        
                        self.ctrl.noteLoader(redlineID);

                        if(self.ctrl.popup) {	
                            self.ctrl.map.removePopup(self.ctrl.popup);
                            self.ctrl.popup.destroy();
                            self.ctrl.popup = null;
                        }
                    }); 
                
                }, false);
            
                request.open('GET', 'geonote_load.html', true),
                request.send();
            },
            scope: this
        });
        
        
    },
    
    noteLoader: function(redlineID) {
        this.loading =true;
        this.redlineLayer.removeAllFeatures();
        this.redlineLayer.protocol.params["REQUEST"] = 'GetLayer';
        this.redlineLayer.protocol.params["REDLINEID"] = redlineID;
        this.redlineLayer.strategies[1].load();
        
    },
    
    noteLoaded: function(obj) {
        if (obj.response.priv.status != 200) {
            alert ("Caricamento nota fallito");
            this.noteTitle = 'Nota senza nome';
            this.noteID = null;
            this.savedState = false;
            this.loading = false;
        }
        this.redlineLayer.redraw();
        this.savedState = true;
        this.loading = false;
        
        if (this.redlineLayer.features.length > 0)
            this.map.zoomToExtent(this.redlineLayer.getDataExtent());
    },
    
    noteDelete: function() {
        if (this.ctrl.redlineLayer.features.length == 0)
            return;
        
        if (confirm('Eliminare la nota corrente?')) {
            if (this.ctrl.noteID) {
                var self = this;
                var params = {
                    PROJECT: self.ctrl.redlineLayer.protocol.params['PROJECT'],
                    MAPSET: self.ctrl.redlineLayer.protocol.params['MAPSET'],
                    REDLINEID: this.ctrl.noteID,
                    REQUEST: 'DeleteLayer' 
                };
                var request = OpenLayers.Request.POST({
                    url: this.ctrl.serviceURL,
                    data: OpenLayers.Util.getParameterString(params),
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    callback: function(response) {
                        if(!response || typeof(response) != 'object' || !response.status || response.status != 200) {
                            return alert('Errore di sistema');
                        }

                        if (!response.responseText) {
                                return alert('Errore di sistema, impossibile eliminare la nota corrente');
                        }

                        var responseObj = JSON.parse(response.responseText);
                        
                        if (responseObj.error) {
                                alert('Errore in eliminazione nota:' + responseObj.error);
                                this.ctrl.savedState = false;
                                return;
                        }
                        
                        this.ctrl.noteReset();    
                        
                    },
                    scope: this
                });  
            }
            else {
                this.ctrl.noteReset();
            }
        }
    },
    
    noteNew: function() {
        if (!this.ctrl.savedState && this.ctrl.redlineLayer.features.length > 0) { 
            if (!confirm('Alcuni elementi della nota corrente non sono stati salvati\nSe si procede con la creazione di una nuova nota andranno persi. Continuare?')) {
                return;
            }
        } 
        this.ctrl.noteReset();
    },
    
    noteReset: function () {
        this.redlineLayer.removeAllFeatures();
        this.noteTitle = 'Nota senza nome';
        this.noteID = null;
        this.savedState = false;
        this.redraw();        
    }
    
 });


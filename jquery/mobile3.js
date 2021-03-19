var GisClientMap; //POI LO TOGLIAMO!!!!
var mycontrol,ismousedown;


var sidebarPanel = {
    closeTimeout: null,
    isOpened: false,
    
    init: function(selector) {
        var self = this;
        
        self.selector = selector;
        self.$element = $(selector);
        
        $('.panel-close', self.$element).click(function(){
            self.close();
        });
        $('.panel-expand', self.$element).click(function(){
            self.expand();
        });
        $('.panel-collapse', self.$element).click(function(){
            self.collapse();
        });
    },
    
    show: function(panelId) {
        var self = this;
        
        $('div.panel-content', self.$element).children('div').each(function() {
            if($(this).hasClass('panel-header')) return;
            
            $(this).hide();
        });
        $('#'+panelId, self.$element).show();
        
        self.open();
    },
    
    hide: function(panelId) {
        var self = this;
        
        $('#'+panelId, self).hide();
        
        self.closeTimeout = setTimeout(function() {
            self.close();
        }, 100);
    },
    
    open: function() {
        if(this.closeTimeout) clearTimeout(this.closeTimeout);
        
        var el = $("#map-overlay-panel");
        //var w = width || 300;
        var w = 300;
        //var ell = document.getElementById("map-overlay-panel");
        //ell.style.width = "300px";

        //el.css({width:w+"px"});
        el.animate({width:w+"px"});
        el.addClass("panel-open");
        if(w == 300) {
            $("#resultpanel").addClass("smalltable");
        }
        $('div.panel-header', this.$element).show();
        $('#map-overlay-panel').css('right', '25px');
        
        this.isOpened = true;
    },
    
    close: function() {
        var el = $("#map-overlay-panel");
        //var w = width || 45;
        var w = 45;
        //var ell = document.getElementById("map-overlay-panel");
        //ell.style.width = "45px";

        //el.css({width:w+"px"});
        el.animate({width:w+"px"});
        el.removeClass("panel-open");
        $("#resultpanel").addClass("smalltable");
        $('div.panel-header', this.$element).hide();
        $('#map-overlay-panel').css('right', '0px');
        
        this.isOpened = false;
    },
    
    expand: function() {
        var el = $('#map-overlay-panel');
        var width = ($(document).width() / 3) * 2;
        el.animate({width: width + 'px'});
        $('#resultpanel').removeClass('smalltable');
        
        $('.panel-expand', this.$element).hide();
        $('.panel-collapse', this.$element).show();
    },
        
    collapse: function() {
        var el = $('#map-overlay-panel');
        el.animate({width: '300px'});
        $('#resultpanel').addClass('smalltable');
        
        $('.panel-expand', this.$element).show();
        $('.panel-collapse', this.$element).hide();
    }
};



//INITMAP PER FARCI QUALCOSA
$(function() {

var customCreateControlMarkup = function(control) {
    var button = document.createElement('a'),
        icon = document.createElement('span'),
        textSpan = document.createElement('span');
    //icon.className="myicon glyphicon-white ";
    if(control.tbarpos) button.className += control.tbarpos;
    if(control.iconclass) icon.className += control.iconclass;
    button.appendChild(icon);
    if (control.text) {
        textSpan.innerHTML = control.text;
    }
    button.appendChild(textSpan);
    return button;
};


var initMap = function(){
    var map=this.map;
    document.title = this.title;

    //SETTO IL BASE LAYER SE IMPOSTATO
    /*
    if(this.baseLayerName) {
        var ret = map.getLayersByName(this.baseLayerName);
        if(ret.length > 0) map.setBaseLayer(ret[0]);
    }
*/
    //setto osm come base... vedere perché non va da author
/*     var ret = map.getLayersByName("osm");
    if(ret.length > 0) map.setBaseLayer(ret[0]); */

    sidebarPanel.init('#sidebar-panel');


    //SE HO SETTATO LA NAVIGAZIONE VELOCE????
    if(this.mapsetTiles){
        for(i=0;i<map.layers.length;i++){
            if(!map.layers[i].isBaseLayer && map.layers[i].visibility){
                map.layers[i].setVisibility(false);
                this.activeLayers.push(map.layers[i]);
            }
        }
        
        $(".dataLayersDiv").hide();
        this.mapsetTileLayer.setVisibility(true);

       // console.log(this.activeLayers)

        var chk = $("<input class='fast-navigate' type='checkbox'>");
        $(".baseLbl").html("Livelli di base")
        $(".dataLbl")
        .html(" Naviga veloce sulla mappa")
        .append(chk);
        $(".dataLbl").append($("<div class='fast-navigate'>STAI NAVIGANDO SULLA MAPPA IMPOSTATA SUI LIVELLI VISIBILI IN AVVIO.<BR />DISATTIVA LA NAVIGAZIONE VELOCE PER TORNARE ALL'ALBERO DEI LIVELLI</div>"))
        chk.attr("checked",true);

        var self = this;
        chk.on("click",function(){

            //SPENGO TUTTI I LAYERS IN OVERLAY ACCESI DOPO EVER MEMORIZZATO LA LISTA E ATTIVO LA NAVIGAZIONE VELOCE

            if($(this).is(':checked')){
                $(".dataLayersDiv").hide();
                $("div.fast-navigate").show();
                self.activeLayers = [];
                for(i=0;i<map.layers.length;i++){
                    if(!map.layers[i].isBaseLayer && map.layers[i].visibility){
                        map.layers[i].setVisibility(false);
                        self.activeLayers.push(map.layers[i]);
                    }
                }
                self.mapsetTileLayer.setVisibility(true);

            }
            else{
                $(".dataLayersDiv").show();
                $("div.fast-navigate").hide();
                self.mapsetTileLayer.setVisibility(false);
                for(var i=0; i<self.activeLayers.length;i++){
                    self.activeLayers[i].setVisibility(true);
                }
            }



        })



  }

/*
    var vectorEditor = new OpenLayers.Editor(map, {
        activeControls: ['Navigation', 'SnappingSettings', 'CADTools', 'TransformFeature', 'Separator', 'DeleteFeature', 'DragFeature', 'SelectFeature', 'Separator', 'DrawHole', 'ModifyFeature', 'Separator'],
        featureTypes: ['regular', 'polygon', 'path', 'point']
    });

*/
    //******************** TOOLBARS STRUMENTI (IN ALTO A SX) *****************************************

    //
    
    if(ConditionBuilder) ConditionBuilder.init('.query');
    var queryToolbar = new OpenLayers.GisClient.queryToolbar({
        createControlMarkup:customCreateControlMarkup,
        resultTarget:document.getElementById("resultpanel"),
        resultLayout:"TABLE",
        div:document.getElementById("map-toolbar-query"),
        autoActivate:false,
        saveState:true,
        eventListeners: {
            //'startQueryMap': function() { sidebarPanel.show('resultpanel');},
            'endQueryMap': function(event) {        //Aggiungo l'animazione (???? da spostare sulla pagina)
                if(event.layer.features && event.layer.features.length) {
                    if($(window).width() > 1000) {
                        sidebarPanel.show('resultpanel');
                    }
                    $("#resultpanel .featureTypeTitle").on('click',function(){
                        $(this).children('.featureTypeData').slideToggle(200).next('.featureTypeData').slideUp(500);
                    });
                    if(event.vectorFeaturesOverLimit) {
                        alert('I risultati dell\'interrogazione sono troppi: alcuni oggetti non sono stati disegnati su mappa ');
                    }
                    console.log(event.mode);
                    console.log(event.layer.getDataExtent());
                    if(event.mode == 'fast') {
                        GisClientMap.map.zoomToExtent(event.layer.getDataExtent());
                    }
                } else {
                    alert('Nessun risultato');
                }
            },
            'featureTypeSelected': function(fType) {
                if(ConditionBuilder) {
                    ConditionBuilder.setFeatureType(fType);
                }
            },
            'featureselected': function(event) {
                var feature = event.feature,
                    featureType = feature.featureTypeName;

                var element = $('#resultpanel tr[featureType="'+featureType+'"][featureId="'+feature.id+'"]');
                var container = $('#sidebar-panel div.panel-content');
                container.scrollTop(0);
                if(element.length) {
                    //var containerTop = $('#sidebar-panel').scrollTop(); 
                    var containerTop = 0; 
                    var containerBottom = containerTop + container.height(); 
                    var elemTop = element.offset().top;
                    //var elemTop = 0;
                    var elemBottom = elemTop + $(element).height(); 

                    if (elemTop < containerTop) {
                        container.scrollTop(elemTop);
                    } else if (elemBottom > containerBottom) {
                        container.scrollTop(elemBottom - container.height());
                    }
                    element.css('background-color', 'yellow');
                    
                    if(!sidebarPanel.isOpened) {
                        sidebarPanel.show('resultpanel');
                    }
                } else {
                    console.log('non trovo ', featureType, feature.id);
                }
            },
            'featureunselected': function(event) {
                var feature = event.feature,
                    featureType = feature.featureTypeName;

                $('#resultpanel tr[featureType="'+featureType+'"][featureId="'+feature.id+'"]').css('background-color', 'white');
            },
            'featurehighlighted': function(event) {
                var feature = event.feature,
                    featureTypeName = feature.featureTypeName,
                    featureType = GisClientMap.getFeatureType(featureTypeName);

                if(featureType && featureType.title) {
                    $('#sidebar-panel div.panel-title').html(featureType.title);
                }
            },
            'featureunhighlighted': function(event) {
                $('#sidebar-panel div.panel-title').empty();
            },
            'viewdetails': function(event) {
                var featureType = event.featureType,
                    fType = GisClientMap.getFeatureType(featureType),
                    len = fType.properties.length, i, property,
                    table = '<table><thead><tr>', 
                    cols = [], col, j,
                    results, result, value, title;
                
                try {
                    results = $.parseJSON(event.response.responseText);
                } catch(e) {
                    return alert('Errore di sistema');
                }

                for(i = 0; i < len; i++) {
                    property = fType.properties[i];
                    
                    if(!property.relationName || property.relationName != event.relation.relationName) continue;
                    
                    title = property.header || property.name;
                    table += '<th>'+title+'</th>';
                    cols.push(property.name);
                }
                table += '</tr></thead><tbody>';

                for(i = 0; i < results.length; i++) {
                    result = results[i];
                    
                    table += '<tr>';
                    
                    for(j = 0; j < cols.length; j++) {
                        col = cols[j];
                        value = result[col] || '';
                        
                        table += '<td>'+value+'</td>';
                    }
                    table += '</tr>';
                }
                table += '</tbody></table>';
                
                $('#DetailsWindow div.modal-body').html(table);
                var title = event.relation.relationTitle || event.relation.relationName;
                $('#DetailsWindow h4.modal-title').html(title + ' di ' + fType.title);
                $('#DetailsWindow').modal('show');
            }
        },
        searchButtonHander: function(selectedFeatureType, mode) {
            var mode = mode || 'default',
                selectedFeatureType = selectedFeatureType || $('select.olControlQueryMapSelect').val(),
                queryToolbar = this,
                fType;

            if(mode == 'default') {
                $('li[role="advanced-search"]').show();
            } else {
                $('li[role="advanced-search"]').hide();
            }
                
            if(selectedFeatureType == OpenLayers.GisClient.queryToolbar.VISIBLE_LAYERS ||
                selectedFeatureType == OpenLayers.GisClient.queryToolbar.ALL_LAYERS) {
                return alert('Seleziona un livello prima');
            }
            
            fType = GisClientMap.getFeatureType(selectedFeatureType);
            if(!fType) return alert('Errore: il featureType '+selectedFeatureType+' non esiste');
            
            var form = '',
                properties = fType.properties, 
                len = properties.length, property, i;
            
            $('#searchFormTitle').html('Ricerca '+fType.title);
            
            //form += '<form role="form">';
            form += '<table>';
            
            for(i = 0; i < len; i++) {
                property = properties[i];
                
                if(!property.searchType || property.relationType == 2) continue; //searchType undefined oppure 0
                
                //form += '<div class="form-group">'+
                //            '<label for="search_form_input_'+i+'">'+property.header+'</label>';
                form += '<tr><td>'+property.header+'</td><td>';
                
                switch(property.searchType) {
                    case 1:
                    case 2: //testo
                        form += '<input type="text" name="'+property.name+'" searchType="'+property.searchType+'" class="form-control" id="search_form_input_'+i+'">';
                    break;
                    case 3: //lista di valori
                        form += '<input type="text" name="'+property.name+'" fieldId="'+property.fieldId+'" searchType="'+property.searchType+'" id="search_form_input_'+i+'"  style="width:300px;">';
                    break;
                    case 4: //numero
                        form += '<div class="form-inline">'+
                            '<select name="'+property.name+'_operator" class="form-control">'+
                            '<option value="'+OpenLayers.Filter.Comparison.EQUAL_TO+'">=</option>'+
                            '<option value="'+OpenLayers.Filter.Comparison.NOT_EQUAL_TO+'">!=</option>'+
                            '<option value="'+OpenLayers.Filter.Comparison.LESS_THAN+'">&lt;</option>'+
                            '<option value="'+OpenLayers.Filter.Comparison.GREATER_THAN+'">&gt;</option>'+
                            '</select>'+
                            '<input type="number" name="'+property.name+'" searchType="'+property.searchType+'" class="form-control" id="search_form_input_'+i+'">'+
                            '</div>';
                    break;
                    case 5: //data
                        form += '<input type="date" name="'+property.name+'" searchType="'+property.searchType+'" class="form-control" id="search_form_input_'+i+'">';
                    break;
                    case 6: //lista di valori non wfs
                        form += '<input type="number" name="'+property.name+'" searchType="'+property.searchType+'" id="search_form_input_'+i+'" style="width:300px;">';
                    break;
                }
                
                //form += '</div>';
                form += '</td></tr>';
            }
            form += '</table>';
            
            if(mode == 'default') {
                form += '<div class="form-group"><input type="checkbox" name="use_current_extent" gcfilter="false"> Filtra sull\'extent attuale</div>';
            }
            form += '<button type="submit" class="btn btn-default">Cerca</button>'+
                '</form>';
            
            $('#ricerca').empty().append(form);
            
            $('#ricerca input[searchType="3"],#ricerca input[searchType="6"]').each(function(e, input) {
                var fieldId = $(input).attr('fieldId');
                
                $(input).select2({
                    minimumInputLength: 0,
                    query: function(query) {
                        $.ajax({
                            url: '/gisclient3/services/xSuggest.php',
                            data: {
                                suggest: query.term,
                                field_id: fieldId
                            },
                            dataType: 'json',
                            success: function(data) {
                                var results = [];
                                $.each(data.data, function(e, val) {
                                    results.push({
                                        id: val.value,
                                        text: val.value
                                    });
                                });
                                query.callback({results:results});
                            }
                        });
                    }
                });
            });
            
            $('#ricerca button[type="submit"]').click(function(event) {
                event.preventDefault();
                
                var filters = [];
                $('#ricerca input[gcfilter!="false"]').each(function(e, input) {
                    var name = $(input).attr('name'),
                        value = $(input).val(),
                        searchType = $(input).attr('searchType'),
                        type = OpenLayers.Filter.Comparison.EQUAL_TO;
                    
                    if(!value || value == '') return;
                    
                    if(searchType == 4) {
                        type = $('#ricerca input[name="'+name+'_operator"]').val();
                    }
                    if(searchType == 2) {
                        type = OpenLayers.Filter.Comparison.LIKE;
                        value = '%'+value+'%';
                    }
                    
                    filters.push(new OpenLayers.Filter.Comparison({
                        type: type,
                        property: name,
                        value: value
                    }));
                    
                });
                
                if(filters.length == 0) return alert('Specificare almeno un parametro di ricerca');
                
                var geometry;
                if($('#ricerca input[name="use_current_extent"]').prop('checked')) {
                    geometry = GisClientMap.map.getExtent();
                } else {
                    geometry = GisClientMap.map.getMaxExtent();
                }
                
                if(filters.length > 1) {
                    var filter = new OpenLayers.Filter.Logical({
                        type: OpenLayers.Filter.Logical.AND,
                        filters: filters
                    });
                } else {
                    var filter = filters[0];
                }
                
                var control = GisClientMap.map.getControlsByClass('OpenLayers.Control.QueryMap')[0];
                if(mode == 'fast') {
                    control.layers = [queryToolbar.getLayerFromFeature(fType.typeName)];
                }
                var oldQueryFilters = control.queryFilters[fType.typeName];
                control.queryFilters[fType.typeName] = filter;
                //var oldHighlight = control.highLight;
                //control.highLight = true;

                control.select(geometry, mode);
                
                control.queryFilters[fType.typeName] = oldQueryFilters;
                control.highLight = oldHighlight;

                $('#SearchWindow').modal('hide');
            });
        
            //$('#myModal').modal({remote:'test_table.html'});
            $('#SearchWindow').modal('show');
        
        }

    });
    queryToolbar.defaultControl = queryToolbar.controls[0];
    map.addControl(queryToolbar);


    
    $('.panel-clearresults').click(function(event) {
        event.preventDefault();
        
        queryToolbar.clearResults();
        
        //sidebarPanel.close();
    });




    //popolo la select nel footer per le ricerche veloci
    var options = [];
    for(var layerId in queryToolbar.wfsCache) {
        var layer = queryToolbar.wfsCache[layerId];
        for(var i = 0; i < layer.featureTypes.length; i++) {
            var featureType = layer.featureTypes[i];
            
            if(featureType.searchable != 2) continue;
            options.push('<option value="'+featureType.typeName+'">'+featureType.title+'</option>');
        }
    }
    $('#map-fast-search select').html(options);
    $('#map-fast-search a').click(function(event) {
        queryToolbar.searchButtonHander.call(queryToolbar, $('#map-fast-search select').val(), 'fast');
    });
    
    var measureToolbar = new OpenLayers.Control.Panel({
        createControlMarkup:customCreateControlMarkup,
        div:document.getElementById("map-toolbar-measure"),
        autoActivate:false,
        saveState:true
    })
    var controls = [
            new OpenLayers.Control.DynamicMeasure(OpenLayers.Handler.Path,{
                iconclass:"glyphicon-white glyphicon-resize-horizontal", 
                text:"Misura distanza", 
                title:"Misura distanza",
                eventListeners: {'activate': function(){map.currentControl.deactivate();map.currentControl=this}}
            }),
            new OpenLayers.Control.DynamicMeasure(OpenLayers.Handler.Polygon,{
                iconclass:"glyphicon-white glyphicon-retweet", 
                text:"Misura superficie", 
                title:"Misura superficie",
                eventListeners: {'activate': function(){map.currentControl.deactivate();map.currentControl=this}}
            })
        ]
    measureToolbar.addControls(controls)
    map.addControl(measureToolbar);
    //measureToolbar.activate();


    var redlineToolbar = new OpenLayers.Control.Panel({
        createControlMarkup:customCreateControlMarkup,
        div:document.getElementById("map-toolbar-redline"),
        autoActivate:false,
        saveState:true,
    })
    var redlineLayer = new OpenLayers.Layer.Vector('Redline');
    map.addLayer(redlineLayer);
    var controls = [
            new OpenLayers.Control.DrawFeature(
                redlineLayer, 
                OpenLayers.Handler.Path,
                {
                    handlerOptions:{freehand:true},
                    iconclass:"glyphicon-white glyphicon-pencil", 
                    text:"Testo penna", 
                    title:"Testo penna",
                    eventListeners: {'activate': function(){map.currentControl.deactivate();map.currentControl=this}}
                }
            ),
            new OpenLayers.Control.DrawFeature(
                redlineLayer, 
                OpenLayers.Handler.Path,
                {
                    handlerOptions:{freehand:false},
                    iconclass:"glyphicon-white glyphicon-tag", 
                    text:"Testo etichetta", 
                    title:"Testo etichetta",
                    eventListeners: {'activate': function(){map.currentControl.deactivate();map.currentControl=this}}
                }
            ),
        ]
    redlineToolbar.addControls(controls)
    map.addControl(redlineToolbar);
    //redlineToolbar.activate();



    var toolsToolbar = new OpenLayers.Control.Panel({
        createControlMarkup:customCreateControlMarkup,
        div:document.getElementById("map-toolbar-tools"),
        autoActivate:false,
        saveState:true,
    })
    toolsToolbar.addControls([
        new OpenLayers.Control.PIPESelect(
            OpenLayers.Handler.Click,
            {
                type: OpenLayers.Control.TYPE_TOGGLE, 
                clearOnDeactivate:false,
                serviceURL:'../../services/iren/findPipes.php',
                pipelayer: 'RATRACCIA.traccia_table',
                distance:50,
                highLight: true,
                iconclass:"glyphicon-white glyphicon-tint", 
                text:"Ricerca valvole", 
                title:"Ricerca valvole",
                eventListeners: {'activate': function(){map.currentControl.deactivate();map.currentControl=this}}
            }
        )]
    )
    map.addControls(toolsToolbar);
    //toolsToolbar.activate();


    //******************** TOOLBAR VERTICALE *****************************************

    var sideBar = new OpenLayers.GisClient.Toolbar({
        div:document.getElementById("map-sidebar"),
        createControlMarkup:customCreateControlMarkup
    });
    


    
    var defaultControl = new OpenLayers.Control.DragPan({iconclass:"glyphicon-white glyphicon-move", title:"Sposta", eventListeners: {'activate': function(){map.currentControl && map.currentControl.deactivate();map.currentControl=this}}});
    map.defaultControl = defaultControl;
    
    var geolocateControl = new OpenLayers.Control.Geolocate({
        tbarpos:"last", 
        iconclass:"glyphicon-white glyphicon-map-marker", 
        title:"La mia posizione",
        watch:false,
        bind:false,
        geolocationOptions: {
            enableHighAccuracy: true, // required to turn on gps requests!
            maximumAge: 3000,
            timeout: 50000
        }
    });
    geolocateControl.events.register('locationfailed', self, function() {
        alert('Impossibile ottenere la posizione dal GPS');
    });
    geolocateControl.events.register('locationuncapable', self, function() {
        alert('Impossibile ottenere la posizione dal GPS');
    });
    geolocateControl.events.register('locationupdated', self, function(event) {
        var point = event.point;
        //alert('Found position X:' + point.x + ', Y:' + point.y);
        var lonLat = new OpenLayers.LonLat(point.x, point.y);
        if(!map.isValidLonLat(lonLat)) return alert('Posizione '+lonLat.lon+' '+lonLat.lat+' non valida');
        if(!map.getMaxExtent().containsLonLat(lonLat)) return alert('Posizione '+lonLat.lon+' '+lonLat.lat+' fuori extent');
        map.setCenter(lonLat);
        map.zoomToScale(1000, true);
    });
    

    sideBar.addControls([
        //new OpenLayers.Control.ZoomIn({tbarpos:"first", iconclass:"glyphicon-white glyphicon-white glyphicon-plus", title:"Zoom avanti"}),

        new OpenLayers.Control.ZoomBox({tbarpos:"first", iconclass:"glyphicon-white glyphicon-zoom-in", title:"Zoom riquadro", eventListeners: {'activate': function(){map.currentControl && map.currentControl.deactivate();map.currentControl=this}}}),
        new OpenLayers.Control.ZoomOut({iconclass:"glyphicon-white glyphicon-zoom-out", title:"Zoom indietro"}),
        defaultControl,
        new OpenLayers.Control.Button({
            trigger: function() {
                if (this.map) {
                    this.map.zoomToExtent(this.map.maxExtent);
                }    
            },
            iconclass:"glyphicon-white glyphicon-globe", 
            title:"Zoom estensione"
        }),
        geolocateControl,
        


        btnSearch = new OpenLayers.Control.Button({
            type: OpenLayers.Control.TYPE_TOGGLE, 
            iconclass:"glyphicon-white  glyphicon-info-sign", 
            title:"Pannello di ricerca",
            tbarpos:"first",
            eventListeners: {
                'activate': function(){queryToolbar.activate();},
                'deactivate': function(){queryToolbar.deactivate();}
            }
        }),
        btnLayertree = new OpenLayers.Control.Button({
            type: OpenLayers.Control.TYPE_TOGGLE,
            exclusiveGroup: 'sidebar',
            iconclass:"icon-layers", 
            title:"Pannello dei livelli",
            eventListeners: {
                'activate': function(){sidebarPanel.show('layertree');},
                'deactivate': function(){sidebarPanel.hide('layertree');}
            }
        }),
        btnResult = new OpenLayers.Control.Button({
            type: OpenLayers.Control.TYPE_TOGGLE, 
            exclusiveGroup: 'sidebar',
            iconclass:"glyphicon-white glyphicon-list-alt", 
            title:"Tabella dei risultati",
            tbarpos:"last",
            eventListeners: {
                'activate': function(){sidebarPanel.show('resultpanel');},
                'deactivate': function(){sidebarPanel.hide('resultpanel');}
            }
        }),

        new OpenLayers.Control.Button({tbarpos:"first",iconclass:"glyphicon-white glyphicon-resize-small", type: OpenLayers.Control.TYPE_TOGGLE, title:"Misure",

            eventListeners: {
                'activate': function(){measureToolbar.activate();},
                'deactivate': function(){measureToolbar.deactivate();}
            }
        }),

/*
        new OpenLayers.Control.Button({iconclass:"glyphicon-white glyphicon-edit", type: OpenLayers.Control.TYPE_TOGGLE, title:"Editor vettoriale",

            eventListeners: {
                'activate': function(){vectorEditor.startEditMode();},
                'deactivate': function(){vectorEditor.stopEditMode();}
            }
        }),
        
   */     
        new OpenLayers.Control.Button({iconclass:"glyphicon-white glyphicon-pencil", type: OpenLayers.Control.TYPE_TOGGLE, title:"Redline",

            eventListeners: {
                'activate': function(){redlineToolbar.activate();},
                'deactivate': function(){redlineToolbar.deactivate();}
            }
        }),
        
    /*    
        new OpenLayers.Control.Button({tbarpos:"last", iconclass:"glyphicon-white glyphicon-tint", type: OpenLayers.Control.TYPE_TOGGLE, exclusiveGroup: 'sidebar', title:"Tools aggiunti tipo ricerca valvole",

            eventListeners: {
                'activate': function(){toolsToolbar.activate();},
                'deactivate': function(){toolsToolbar.deactivate();}
                }

        }),
*/
        btnPrint = new OpenLayers.Control.Button({
            tbarpos:"first", 
            type: OpenLayers.Control.TYPE_TOGGLE, 
            exclusiveGroup: 'sidebar',
            iconclass:"glyphicon-white glyphicon-print", 
            title:"Pannello di stampa",
            eventListeners: {
                'activate': function(){
                    if($.trim($('#printpanel').html()) == '') {
                        $("#printpanel").load('print_panel.html');
                    }
                    sidebarPanel.show('printpanel');
                },
                'deactivate': function(){
                    sidebarPanel.hide('printpanel');
                }
            }
        }),
        
        new OpenLayers.Control.Button({
            type: OpenLayers.Control.TYPE_TOGGLE, 
            iconclass:"glyphicon-white  glyphicon-eye-open", 
            title:"Mappa di riferimento",
            tbarpos:"last",
            eventListeners: {
                'activate': function(){GisClientMap.overviewMap.show();},
                'deactivate': function(){GisClientMap.overviewMap.hide();}
            }
        })
        
   /*     
        ,
        btnSettings = new OpenLayers.Control.Button({
            tbarpos:"last", 
            exclusiveGroup: 'sidebar',
            type: OpenLayers.Control.TYPE_TOGGLE, 
            iconclass:"glyphicon-white glyphicon-wrench", 
            title:"Settings",

        })
*/
    ]);

    sideBar.defaultControl = sideBar.controls[2];
    map.addControl(sideBar);

    //VISUALIZZAZIONE DELLE COORDINATE
    var projection = this.mapOptions.displayProjection || this.mapOptions.projection;
    var v = projection.split(":");
    map.addControl(new OpenLayers.Control.MousePosition({
        element:document.getElementById("map-coordinates"),
        prefix: '<a target="_blank" ' + 'href="http://spatialreference.org/ref/epsg/' + v[1] + '/">' + projection + '</a> coordinate: '
    }));



    //ELENCO DELLE SCALE
    var scale, zoomLevel = 0, option;

    //lo zoomLevel non parte da minZoomLevel ma sempre da 0, quindi lo zoomLevel 0 è sempre = al minZoomLevel
    for(var i=this.mapOptions.minZoomLevel;i<this.mapOptions.maxZoomLevel;i++){
        scale = OpenLayers.Util.getScaleFromResolution (this.mapOptions.serverResolutions[i],this.mapOptions.units);
        option = $("<option></option>");
        option.val(zoomLevel);
        zoomLevel += 1;
        option.text('Scala 1:'+ parseInt(scale));
        $('#map-select-scale').append(option);
    }
    $('#map-select-scale').val(map.getZoom());
    $('#map-select-scale').change(function(){
        map.zoomTo(this.value);
    });
    map.events.register('zoomend', null, function(){
        $('#map-select-scale').val(map.getZoom());
    });



/*    return;


    var showCurrentScale = function() {
        var currentZoom = map.getZoom();
        
        $('#map-select-scale').val(currentZoom);
    };
    showCurrentScale.call(null);
    
    map.events.register('zoomend', null, showCurrentScale);*/


    //TOLTO IL 29/8/14 a cosa serviva?????
    //if(this.mapOptions.center) map.setCenter(this.mapOptions.center);
   // if(this.mapOptions.zoom) map.setCenter(this.mapOptions.center,this.mapOptions.zoom);
    //queryToolbar.activate();
    //queryToolbar.controls[0].activate();
    // if(this.mapOptions.center){
    //     var center = new OpenLayers.LonLat(this.mapOptions.center[0],this.mapOptions.center[1]).transform(map.displayProjection, map.projection);
    //     map.setCenter(center);
    // }
    // if(this.mapOptions.scale){
    //     map.zoomToScale(this.mapOptions.scale)
    // }


    $('#mapset-title').html(GisClientMap.title);

    if(!GisClientMap.logged_username) {
        $('#mapset-login').html("<a action='login' href='#'>Accedi</a>");

        $('#LoginWindow button').on('click',function(e){
            e.preventDefault();

            $.ajax({
                url: '/gisclient3/login.php',
                type: 'POST',
                dataType: 'json',
                data: {
                    username: $('#LoginWindow input[name="username"]').val(),
                    password: $('#LoginWindow input[name="password"]').val()
                },
                success: function(response) {
                    if(response && typeof(response) == 'object' && response.result == 'ok') {
                        window.location.reload();
                    } else {
                        alert('Username e/o password errati');
                    }
                },
                failure: function() {
                    alert('Errore di sistema');
                }
            });
        });
    } else {
        $('#mapset-login').html(GisClientMap.logged_username+', <a href="#" action="logout">Logout</a>');
    }

    $('#mapset-login a[action="login"]').on('click',function(event){
        event.preventDefault();
        $('#LoginWindow').modal('show');
    });
    $('#mapset-login a[action="logout"]').on('click',function(event){
        event.preventDefault();
        
        $.ajax({
            url: '/gisclient3/logout.php',
            type: 'POST',
            dataType: 'json',
            success: function(response) {
                if(response && typeof(response) == 'object' && response.result == 'ok') {
                    window.location.reload();
                } else {
                    alert('Errore di sistema');
                }
            },
            failure: function() {
                alert('Errore di sistema');
            }
        });
    });
    
    
    var onResize = function() {
        if($(window).width() < 1000) $('#map-coordinates').hide();
        var panelContentHeight = $(window).height() - $('div.panel-header').height() - $('#map-footer').height() - 35;
        $('#sidebar-panel div.panel-content').height(panelContentHeight);
    }
    $(window).resize(onResize);
    onResize.call();


    //queryToolbar.activate();
    //queryToolbar.controls[0].activate();
    //map.zoomToScale(2000)

        
}//END initMap






    OpenLayers.ImgPath = "../resources/themes/openlayers/img/";
    GisClientMap = new OpenLayers.GisClient('/gisclient3/services/gcmap.php' + window.location.search,'map',{
        useMapproxy:true,
        mapProxyBaseUrl:"/ows",
        mapOptions:{
            controls:[
                new OpenLayers.Control.Navigation(),
                new OpenLayers.Control.Attribution(),
                new OpenLayers.Control.LoadingPanel(),
                //new OpenLayers.Control.PanZoomBar(),
                /*
                new OpenLayers.Control.TouchNavigation({
                    dragPanOptions: {
                        enableKinetic: true
                    }
                }),
                //new OpenLayers.Control.PinchZoom(),
*/
                new OpenLayers.Control.LayerTree({
                    emptyTitle:'Base vuota', 
                    div:OpenLayers.Util.getElement('layertree-tree')
                 })
/*
                 ,
                // new OpenLayers.Control.LayerLegend({
                //     div:OpenLayers.Util.getElement('layerlegend')
                })*/ 
            ]
            //scale:2000,
            //center:[8.92811, 44.41320]
        },
        callback:initMap
    })




});





OpenLayers.GisClient.Toolbar = OpenLayers.Class(OpenLayers.Control.Panel, {
    CLASS_NAME: "OpenLayers.GisClient.Toolbar",
    
    activateControl: function(control) {
        var len = this.controls.length, i;
        
        if(control.exclusiveGroup) {
            for(i = 0; i < len; i++) {
                if(this.controls[i] != control &&
                    this.controls[i].exclusiveGroup == control.exclusiveGroup) {
                    this.controls[i].deactivate();
                }
            }
        }
        
        OpenLayers.Control.Panel.prototype.activateControl.apply(this, [control]);
    }
});



var GisClientMap; //POI LO TOGLIAMO!!!!
var mycontrol,ismousedown;

function adjustPanZoomBar(olControl, toolOffset){
    var cZoom = $('.olControlPanZoomBar').offset();
    if (toolOffset)
    {
        if (olControl.active) {
            if (olControl.div)
                if (olControl.div.id == "map-toolbar-redline")
                    $('#map-toolbars').css('top', '50px');
            $('.olControlPanZoomBar').offset({top: cZoom.top + toolOffset, left: cZoom.left } );
        }
        else {
            $('.olControlPanZoomBar').offset({top: cZoom.top - toolOffset, left: cZoom.left } );
            if (olControl.div)
                if (olControl.div.id == "map-toolbar-redline")
                    $('#map-toolbars').css('top', '2px');
        }
    }
}

var sidebarPanel = {
    closeTimeout: null,
    isOpened: false,
    // **** Avoid ghost chicks from JQuery/Openlayers conflicts in mobile browsers
    handleEvent: false,
    
    init: function(selector) {
        var self = this;
        
        self.selector = selector;
        self.$element = $(selector);
        
        $('.panel-close', self.$element).click(function(){
            GisClientMap.map.getControlsBy('id', 'button-layertree')[0].deactivate();
            GisClientMap.map.getControlsBy('id', 'button-resultpanel')[0].deactivate();
            self.close();
        });
        $('.panel-expand', self.$element).click(function(){
            self.expand();
        });
        $('.panel-collapse', self.$element).click(function(){
            self.collapse();
        });  

        $('.panel-clearresults').hide();
        
        // **** Avoid ghost chicks from JQuery/Openlayers conflicts in mobile browsers
        $("#map-sidebar").unbind('mouseup').mouseup(function(e){
            self.handleEvent = true;
            return false;
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
        if(this.closeTimeout) {
            clearTimeout(this.closeTimeout);
            this.closeTimeout = null;
        }
        
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
        el.animate({width: width + 'px'}, {
            complete: function() {
                $('#resultpanel').find('.featureTypeData').first().slideDown(200);
            }
        });
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
    //icon.className="myicon glyphicon-whitLIKEe ";
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
    map.Z_INDEX_BASE['Popup'] = 1500;
    map.Z_INDEX_BASE['Control'] = 1550;
    var self = this;

    document.title = this.mapsetTitle;

    var serviceURL = self.baseUrl + "services/";


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
        //$(".baseLbl").html("Livelli di base");
        $(".baseLbl :checkbox").addClass('fast-navigate');
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
    
    if(ConditionBuilder) {
        ConditionBuilder.baseUrl = self.baseUrl;
    }
    
    var reportToolbar = new OpenLayers.GisClient.reportToolbar({
        baseUrl: self.baseUrl,
        createControlMarkup:customCreateControlMarkup,
        //resultTarget:document.getElementById("resultpanel"),
        //resultLayout:"TABLE",
        div:document.getElementById("map-toolbar-report"),
        autoActivate:false,
        saveState:true,
        rowsPerPage: 200,
        selectedCols: [],
        filterButtonHander: function (event) {
            
            var selectedReport =  $('select.olControlReportMapSelect').val();

            if(selectedReport < 1){
                return alert('Nessun modello di report selezionato');
            }
            
            var reportDef = reportToolbar.getReportDef(selectedReport);
            
            if (!reportDef) {
                return alert('Defininzione del modello di report non trovata, ID: ' + selectedReport);
            }

            if(ConditionBuilder) {
                ConditionBuilder.init('.query-report');
                ConditionBuilder.setFeatureType(reportDef);
             }
                
            var form = '',
                len = reportDef.properties.length, property, i;
            
            $('#searchReportTitle').html('Filtra Report '+reportDef.title);
            
            //form += '<form role="form">';
            form += '<table>';
            
            for(i = 0; i < len; i++) {
                property = reportDef.properties[i];
                
                if(!property.searchType) continue; //searchType undefined oppure 0
                
                //form += '<div class="form-group">'+
                //            '<label for="search_form_input_'+i+'">'+property.header+'</label>';
                form += '<tr><td>'+property.header+'</td><td>';
                
                switch(property.searchType) {
                    case 1:
                    case 2: //testo
                        form += '<input type="text" name="'+property.name+'" searchType="'+property.searchType+'" class="form-control" id="search_form_input_'+i+'">';
                    break;
                    case 3: //lista di valori
                        form += '<input type="text" name="'+property.name+'" fieldId="'+property.fieldId+'" fieldFilter="'+property.fieldFilter+'" searchType="'+property.searchType+'" id="search_form_input_'+i+'"  style="width:300px;">';
                    break;
                    case 4: //numero
                        form += '<div class="form-inline">'+
                            '<select name="'+property.name+'_operator" class="form-control">'+
                            '<option value="=">=</option>'+
                            '<option value="<>">!=</option>'+
                            '<option value="<">&lt;</option>'+
                            '<option value=">">&gt;</option>'+
                            '</select>'+
                            '<input type="number" name="'+property.name+'" searchType="'+property.searchType+'" class="form-control" id="search_form_input_'+i+'">'+
                            '</div>';
                    break;
                    case 5: //data
                        form += '<input type="date" name="'+property.name+'" searchType="'+property.searchType+'" class="form-control" id="search_form_input_'+i+'">';
                    break;
                    case 6: //lista di valori non wfs
                        form += '<input type="number" name="'+property.name+'" searchType="'+property.searchType+'" fieldFilter="'+property.fieldFilter+'" id="search_form_input_'+i+'" style="width:300px;">';
                    break;
                }
                
                //form += '</div>';
                form += '</td></tr>';
            }
            form += '</table>';

            form += '<button type="submit" class="btn btn-default">Filtra</button>'+
                '</form>';
             
            $('#ricerca-report').empty().append(form);
         
            $('#ricerca-report input[searchType="3"],#ricerca-report input[searchType="6"]').each(function(e, input) {
                var fieldId = $(input).attr('fieldId');
                var fieldFilter = $(input).attr('fieldFilter');
                        
                $(input).select2({
                    minimumInputLength: 0,
                    query: function(query) {
                        var filterValue = null;

                        if (fieldFilter !== 'undefined'){
                            if (typeof $('#ricerca-report input[fieldId="'+fieldFilter+'"]').select2('data') !== "undefined" && $('#ricerca-report input[fieldId="'+fieldFilter+'"]').select2('data') !== null)
                                filterValue =  $('#ricerca-report input[fieldId="'+fieldFilter+'"]').select2('data').text;
                        }
                        if (typeof $('#ricerca-report input[fieldIFilter="'+fieldId+'"]').select2('data') !== "undefined" && $('#ricerca-report input[fieldFilter="'+fieldId+'"]').select2('data') !== null)
                            $('#ricerca-report input[fieldFilter="'+fieldId+'"]').select2('data', null);
                        
                        $.ajax({
                            url: self.baseUrl + 'services/xRpSuggest.php',
                            data: {
                                suggest: query.term,
                                field_id: fieldId,
                                filtervalue: filterValue
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
             
            $('#ricerca-report button[type="submit"]').click(function(event) {
                event.preventDefault();
                
                
                var query = '';
                var values = {};
                var par_idx = 0;
                
                $('#ricerca-report input').each(function(e, input) {
                    var name = $(input).attr('name'),
                        value = $(input).val(),
                        searchType = $(input).attr('searchType'),
                        type = '=',
                        param_x = ':param_' + par_idx;
                        
                    if(!value || value == '') return;
                    
                    if(searchType == 4) {
                        type = $('#ricerca input[name="'+name+'_operator"]').val();
                    }
                    if(searchType == 2) {
                        type = 'ILIKE';
                        value = '%'+value+'%';
                    }
                    
                    if (query.length > 0) query += ' AND ';
                    
                    query += name + ' ' + type + ' ' + param_x;
                    values[param_x] = value;
                    
                    par_idx++;
                });
                
                if(query.length == 0) return alert('Specificare almeno un parametro di ricerca');
                
                reportToolbar.displayReportHandler({'query': query, 'values': values});

                $('#SearchReportWindow').modal('hide');
            });
        
            $('#SearchReportWindow').modal('show');
        

        },
        eventListeners: {
            'initreport': function(event) {
                    var self = this;
                    var reportDef = event.reportDef,
                        len = reportDef.properties.length, i, property,
                        table = '<table id="reportTbl"><thead><tr>', 
                        exportLinks = ' <a href="#" class="reportTbl_export" action="xls" reportID="' + event.reportID + '" ><img src="../resources/themes/icons/xls.gif">&nbsp;Esporta in Excel</a>'
                                    + ' <a href="#" class="reportTbl_export" action="pdf" reportID="' + event.reportID + '" ><img src="../resources/themes/icons/acrobat.gif">&nbsp;Esporta in PDF</a>',
                        cols = [], col, j,
                        results, result, value, title;
                    
                    table =  exportLinks + table;
                   // **** Insert ID column
                   table += '<th>ID</th>';
                   self.selectedCols.push('gc_objid');
                    for(i = 0; i < len; i++) {
                        property = reportDef.properties[i];
                        title = property.header || property.name;
                        table += '<th>'+title+'</th>';
                        self.selectedCols.push(property.name);
                    }
                    table += '</tr></thead><tbody>';

                    table += '</tr>';
                    
                    table += '</tbody></table>';

                    $('#DetailsWindow div.modal-body').html(table);
                    $('#DetailsWindow h4.modal-title').html('Report ' + reportDef.title);
                    $('#DetailsWindow').modal('show');
                    
                    self.getReportData(event.reportID, self.currentPage, event.filter);
                    
                    $('.reportTbl_export').click(function() {
                        var action = this.getAttribute('action');
                        var reportID = this.getAttribute('reportID');
                        var me = self;
                        me.exportReport(reportID, action, event.filter);
                    });
                    
                    self.evt = event;
                    
                    $("#DetailsWindow").scroll(function() {
                        var me = self;
                        if (me.totalRows <= me.currentPage*me.rowsPerPage)
                            return;
                        var docViewTop = $("#DetailsWindow").scrollTop();
                        var rowMarker = $("#reportTbl tr").eq($("#reportTbl > tbody > tr").length - me.rowsPerPage/4);
                        if (rowMarker) {
                            var elemTop = rowMarker[0].offsetTop;
                            if (elemTop <= docViewTop && me.dataLoading == false){
                                me.currentPage += 1;
                                me.getReportData(self.evt.reportID, self.currentPage, self.evt.filter);
                            }
                        }
                    });
                },
           'insertrows': function (data) {
               var row, col, value, rowHtml;
               var table = $("#reportTbl > tbody:last");
               for(i = 0; i < data.length; i++) {
                   row = data[i];
                   rowHtml = '<tr>';
                   for(var j = 0; j < this.selectedCols.length; j++) {
                        col = this.selectedCols[j];
                        value = row[col] || '';

                        rowHtml += '<td>'+value+'</td>';
                   }
                   rowHtml += '</tr>';
                   table.append(rowHtml);
                }
           }    
        }
    });
    map.addControl(reportToolbar);
    
    var queryToolbar = new OpenLayers.GisClient.queryToolbar({
        baseUrl: self.baseUrl,
        createControlMarkup:customCreateControlMarkup,
        resultTarget:document.getElementById("resultpanel"),
        resultLayout:"TABLE",
        div:document.getElementById("map-toolbar-query"),
        autoActivate:false,
        saveState:true,
        maxWfsFeatures:MAX_LAYER_FEATURES,
        maxVectorFeatures:MAX_QUERY_FEATURES,
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
                    
                    $('.panel-clearresults').show();
                    //console.log(event.mode);
                    //console.log(event.layer.getDataExtent());
                    if(event.mode == 'fast') {
                        GisClientMap.map.zoomToExtent(event.layer.getDataExtent());
                    }
                } else {
                    alert('Nessun risultato');
                }
            },
            'featureTypeSelected': function(fType) {
                
            },
            'featureselected': function(event) {

                var self = this;
                if(self.popupOpenTimeout) {
                    clearTimeout(self.popupOpenTimeout);
                    self.popupOpenTimeout = null;
                    self.removePopup(event);
                }
                
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
                var feature = event.feature;

                var self = this;
                var queryResLayer = map.getLayersByName("wfsResults")[0];
                if (queryResLayer.selectedFeatures.indexOf(feature) < 0 && POPUP_TIMEOUT > 0)
                {
                    self.popupOpenTimeout = setTimeout(function() {
                        if (self.popup)
                            self.map.addPopup(self.popup);
                    }, POPUP_TIMEOUT);
                }
            },
            'featureunhighlighted': function(event) {
                var self = this;
                if(self.popupOpenTimeout) {
                    clearTimeout(self.popupOpenTimeout);
                    self.popupOpenTimeout = null;
                }
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
            
            if(ConditionBuilder) {
                ConditionBuilder.init('.query');
                ConditionBuilder.setFeatureType(fType);
            }
            
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
                        form += '<input type="text" name="'+property.name+'" fieldId="'+property.fieldId+'" fieldFilter="'+property.fieldFilter+'" searchType="'+property.searchType+'" id="search_form_input_'+i+'"  style="width:300px;">';
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
                        form += '<input type="number" name="'+property.name+'" searchType="'+property.searchType+'" fieldFilter="'+property.fieldFilter+'" id="search_form_input_'+i+'" style="width:300px;">';
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
                var fieldFilter = $(input).attr('fieldFilter');
                        
                $(input).select2({
                    minimumInputLength: 0,
                    query: function(query) {
                        var filterValue = null;

                        if (fieldFilter !== 'undefined'){
                            if (typeof $('#ricerca input[fieldId="'+fieldFilter+'"]').select2('data') !== "undefined" && $('#ricerca input[fieldId="'+fieldFilter+'"]').select2('data') !== null)
                                filterValue =  $('#ricerca input[fieldId="'+fieldFilter+'"]').select2('data').text;
                        }
                        if (typeof $('#ricerca input[fieldIFilter="'+fieldId+'"]').select2('data') !== "undefined" && $('#ricerca input[fieldFilter="'+fieldId+'"]').select2('data') !== null)
                            $('#ricerca input[fieldFilter="'+fieldId+'"]').select2('data', null);
                        
                        $.ajax({
                            url: self.baseUrl + 'services/xSuggest.php',
                            data: {
                                suggest: query.term,
                                field_id: fieldId,
                                filtervalue: filterValue
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
                var oldQueryFeatureType = null;
                var oldOnlyVisibleLayers = null;
                var oldLayers = null;
                
                if(mode == 'fast') {
                    oldLayers = control.layers;
                    oldQueryFeatureType = control.queryFeatureType;
                    oldOnlyVisibleLayers = control.onlyVisibleLayers;
                    control.layers = [queryToolbar.getLayerFromFeature(fType.typeName)];
                    control.queryFeatureType = fType.typeName;
                    control.onlyVisibleLayers = false;
                }
                
                var oldQueryFilters = control.queryFilters[fType.typeName];
                control.queryFilters[fType.typeName] = filter;
                //var oldHighlight = control.highLight;
                //control.highLight = true;

                control.select(geometry, mode);
                
                control.queryFilters[fType.typeName] = oldQueryFilters;
                if (mode == 'fast'){
                    control.layers = oldLayers;
                    control.queryFeatureType = oldQueryFeatureType;
                    control.onlyVisiblelayers = oldOnlyVisibleLayers;
                    if (queryToolbar.resultLayer)
                        queryToolbar.resultLayer.setVisibility(true);
                }
                //control.highLight = oldHighlight;

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
        if ($('#resultpanel').is(":visible"))
            sidebarPanel.hide();
        this.style.display = 'none';
        //sidebarPanel.close();
    });




    //RICERCA E INTERROGAZIONE VELOCE DA COMBO IN BASSO
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
    $('#map-fast-search a.searchButton').click(function(event) {
        queryToolbar.searchButtonHander.call(queryToolbar, $('#map-fast-search select').val(), 'fast');
    });
    $('#map-fast-search a.infoButton').click(function(event) {
        if($(this).hasClass('active')){
            queryToolbar.controls[0].deactivate();
        }
        else{
            var control = queryToolbar.controls[0];
            var layer =  queryToolbar.getLayerFromFeature($('#map-fast-search select').val());
            control.layers = [layer];
            control.queryFeatureType = $('#map-fast-search select').val();
            control.activate();
        }
    });

    var isGeodesicMeasure = (this.map.projection == 'EPSG:3857' || this.map.projection == 'EPSG:4326')?true:false;

    var measureToolbar = new OpenLayers.Control.Panel({
        createControlMarkup:customCreateControlMarkup,
        div:document.getElementById("map-toolbar-measure"),
        autoActivate:false,
        saveState:true,
    })
    var controls = [
            new OpenLayers.Control.DynamicMeasure(OpenLayers.Handler.Path,{
                iconclass:"glyphicon-white glyphicon-resize-horizontal", 
                text:"Misura distanza", 
                title:"Misura distanza",
                geodesic:isGeodesicMeasure,
                eventListeners: {'activate': function(){map.currentControl.deactivate();map.currentControl=this}}
            }),
            new OpenLayers.Control.DynamicMeasure(OpenLayers.Handler.Polygon,{
                iconclass:"glyphicon-white glyphicon-retweet", 
                text:"Misura superficie", 
                title:"Misura superficie",
                geodesic:isGeodesicMeasure,
                eventListeners: {'activate': function(){map.currentControl.deactivate();map.currentControl=this}}
            })
        ]
    measureToolbar.addControls(controls)
    map.addControl(measureToolbar);
    //measureToolbar.activate();


    var redlineToolbar = new OpenLayers.GisClient.geoNoteToolbar({
        createControlMarkup:customCreateControlMarkup,
        div:document.getElementById("map-toolbar-redline"),
        autoActivate:false,
        saveState:true,
        divdrawbtns: "map-toolbar-redline-draw",
        divopsgbtns: "map-toolbar-redline-opsg",
        divopsnbtns: "map-toolbar-redline-opsn"
    })
    
    /*
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
 */
    map.addControl(redlineToolbar);
    //redlineToolbar.activate();

    var toolsToolbar = new OpenLayers.Control.Panel({
        createControlMarkup:customCreateControlMarkup,
        div:document.getElementById("map-toolbar-tools"),
        autoActivate:false,
        saveState:true,
    })

    var pSelect = new OpenLayers.Control.PIPESelect(
            OpenLayers.Handler.Click,
            {
                clearOnDeactivate:true,
                serviceURL:self.baseUrl + 'services/iren/findPipes.php',
                distance:50,
                highLight: true,
                iconclass:"glyphicon-white glyphicon-tint", 
                tbarpos:"last", 
                title:"Ricerca valvole",
                trigger: function() {
                    if (this.active) {
                        this.deactivate();
                    }
                    else
                    {
                        sidebarPanel.close();
                        map.currentControl.deactivate();
                        map.currentControl=this;
                        this.activate();
                    }
                }
            }
        );

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
        },
        eventListeners: {
            'activate': function(){
                var self=this;
                self.title="Rilevamento posizione in corso";
            }
        }
    });
    geolocateControl.events.register('locationfailed', self, function() {
        alert('Posizione GPS non acquisita');
        map.getControlsByClass("OpenLayers.Control.Geolocate")[0].deactivate();
    });
    geolocateControl.events.register('locationuncapable', self, function() {
        alert('Acquisizione della posizione GPS non supportata dal browser');
        map.getControlsByClass("OpenLayers.Control.Geolocate")[0].deactivate();
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
            iconclass:"glyphicon-white  glyphicon-info-sign", 
            title:"Pannello di ricerca",
            tbarpos:"first",
            trigger: function() {
                if (sidebarPanel.handleEvent)
                {
                    if (this.active) {
                        this.deactivate();
                        queryToolbar.deactivate();
                        //adjustPanZoomBar(queryToolbar, 60);
                    }
                    else
                    {
                        this.activate();
                        queryToolbar.activate();
                        if (this.map.currentControl != queryToolbar.controls[0])
                            queryToolbar.controls[0].activate();
                        //adjustPanZoomBar(queryToolbar, 60);
                        
                    }
                    sidebarPanel.handleEvent = false;
                }
            }  
        }),
        btnLayertree = new OpenLayers.Control.Button({
            id: 'button-layertree',
            exclusiveGroup: 'sidebar',
            iconclass:"icon-layers", 
            title:"Pannello dei livelli",
            trigger: function() {
                if (sidebarPanel.handleEvent)
                {
                    if (this.active) {
                        this.deactivate();
                        sidebarPanel.hide('layertree');
                    }
                    else
                    {
                        this.activate();
                        sidebarPanel.show('layertree');
                    }
                    sidebarPanel.handleEvent = false;
                }
            }  
        }),
        btnResult = new OpenLayers.Control.Button({ 
            id: 'button-resultpanel',
            exclusiveGroup: 'sidebar',
            iconclass:"glyphicon-white glyphicon-list-alt", 
            title:"Tabella dei risultati",
            trigger: function() {
                if (sidebarPanel.handleEvent)
                {
                    if (this.active) {
                        this.deactivate();
                        sidebarPanel.hide('resultpanel');
                    }
                    else
                    {
                        this.activate();
                        sidebarPanel.show('resultpanel');
                    }
                    sidebarPanel.handleEvent = false;
                }
            }  
        }),
        
        btnReport = new OpenLayers.Control.Button({
            iconclass:"glyphicon-white  glyphicon-stats", 
            title:"Pannello di visualizzazione reports",
            tbarpos:"last",
            trigger: function() {
                if (sidebarPanel.handleEvent)
                {
                    if (this.active) {
                        this.deactivate();
                        reportToolbar.deactivate();
                        //adjustPanZoomBar(reportToolbar, 60);
                    }
                    else
                    {
                        this.activate();
                        reportToolbar.activate();
                        //queryToolbar.controls[0].activate();
                        //adjustPanZoomBar(reportToolbar, 60);
                        
                    }
                    sidebarPanel.handleEvent = false;
                }
            }  
        }),

        new OpenLayers.Control.Button({tbarpos:"first",iconclass:"glyphicon-white glyphicon-resize-small", title:"Misure",
            trigger: function() {
                if (sidebarPanel.handleEvent)
                {
                    if (this.active) {
                        this.deactivate();
                        measureToolbar.deactivate();
                        //adjustPanZoomBar(measureToolbar, 27);
                    }
                    else
                    {
                        this.activate();
                        measureToolbar.activate();
                        //adjustPanZoomBar(measureToolbar, 27);
                    }
                    sidebarPanel.handleEvent = false;
                }
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
        new OpenLayers.Control.Button({iconclass:"glyphicon-white glyphicon-pencil", title:"Redline",
            trigger: function() {
                if (sidebarPanel.handleEvent)
                {
                    if (this.active) {
                        
                        this.deactivate();
                        redlineToolbar.deactivate();
                        $('#map-toolbars').css('top', '2px');
                        //adjustPanZoomBar(redlineToolbar, 44);
                    }
                    else
                    {
                        this.activate();
                        redlineToolbar.activate();
                        var nShift = $('#map-toolbars-edit').heigth() + 3;
                        $('#map-toolbars').css('top', nShift + 'px');
                        //adjustPanZoomBar(redlineToolbar, 44);
                    }
                    sidebarPanel.handleEvent = false;
                }
            }      
        }),
        
        pSelect,

        btnPrint = new OpenLayers.Control.PrintMap({
            tbarpos:"first", 
            //type: OpenLayers.Control.TYPE_TOGGLE, 
            baseUrl:self.baseUrl,
            defaultLayers: self.mapsetTiles?self.activeLayers.slice(0):[],
            formId: 'printpanel',
            exclusiveGroup: 'sidebar',
            iconclass:"glyphicon-white glyphicon-print", 
            title:"Pannello di stampa",
            waitFor: 'panelready',
            allowDrag: true,
            printLegend: 'yes',
            defaultTemplateHTML: PRINT_TEMPLATE_HTML,
            defaultTemplatePDF: PRINT_TEMPLATE_PDF,
            trigger: function() {
                if (sidebarPanel.handleEvent)
                {
                    if (this.active) {
                        this.deactivate();
                        sidebarPanel.hide('printpanel');
                    }
                    else
                    {
                        this.activate();
                        var me = this;
                    
                        if($.trim($('#printpanel').html()) == '') {
                            $("#printpanel").load('print_panel.html', function() {
                                me.events.triggerEvent('panelready');
                            });
                        }
                        else {
                            //this.drawPrintArea();
                        }
                            
                        sidebarPanel.show('printpanel');
                    }
                    sidebarPanel.handleEvent = false;
                }
            },
            eventListeners: {
                'panelready': function(event) {
                    var me = this, timerid,
                    scale = Math.round(me.map.getScale()),
                    userScale = $('#'+me.formId+' input[name="scale"]').val();

                    if(!userScale) {
                        me.boxScale?$('#'+me.formId+' input[name="scale"]').val(me.boxScale):$('#'+me.formId+' input[name="scale"]').val(scale);
                        $('#'+me.formId+' input[name="scale"]').prop('disabled', true);
                    }

                    if (me.pages) {
                        var pagesList;
                        $('#'+me.formId+' select[name="formato"]').children().remove().end();
                        $('#'+me.formId+' input[name="direction"]:checked').val() == 'vertical'?pagesList=me.pages.vertical:pagesList=me.pages.horizontal;
                        $.each(pagesList, function (page, dims) {
                            if (page == me.pageFormat) {
                                $('#'+me.formId+' select[name="formato"]').append('<option selected value="' + page + '">' + page + '</option>');
                            }
                            else {
                                $('#'+me.formId+' select[name="formato"]').append('<option value="' + page + '">' + page + '</option>');
                            }
                        });
                    }
                    
                    $('#'+me.formId+' input[name="scale_mode"]').change(function() {
                        if (this.value == 'user') {
                            $('#'+me.formId+' input[name="scale"]').prop('disabled', false);
                            var userScale = $('#'+me.formId+' input[name="scale"]').val();
                            var currentScale = me.boxScale?me.boxScale:me.map.getScale();
                            if (userScale > currentScale) {
                                userScale = Math.round(currentScale);
                                $('#'+me.formId+' input[name="scale"]').val(userScale);
                            }
                            me.boxScale = userScale;
                            me.updatePrintBox();
                        }
                        else {
                            $('#'+me.formId+' input[name="scale"]').prop('disabled', true);
                            me.removePrintBox();
                            me.boxScale = null;
                            me.drawPrintBox.apply(me);
                        }
                    });
                    $('#'+me.formId+' input[name="scale"]').on('input', function() {
                        var value = $(this).val();
                        if($(this).data("lastval")!= value){

                            $(this).data("lastval",value);        
                            clearTimeout(timerid);

                            timerid = setTimeout(function() {
                                if ($('#'+me.formId+' input[name="scale_mode"]:checked').val() == 'user') {
                                    me.boxScale = value;
                                    me.updatePrintBox();
                                }
                            },500);
                        };
                    });
                    
                    $('#'+me.formId+' input[name="direction"]').change(function() {
                        if (me.pages) {
                            var pagesList;
                            $('#'+me.formId+' select[name="formato"]').children().remove().end();
                            $('#'+me.formId+' input[name="direction"]:checked').val() == 'vertical'?pagesList=me.pages.vertical:pagesList=me.pages.horizontal;
                            $.each(pagesList, function (page, dims) {
                                if (page == me.pageFormat) {
                                    $('#'+me.formId+' select[name="formato"]').append('<option selected value="' + page + '">' + page + '</option>');
                                }
                                else {
                                    $('#'+me.formId+' select[name="formato"]').append('<option value="' + page + '">' + page + '</option>');
                                }
                            });
                        }
                        me.pageLayout= $('#'+me.formId+' input[name="direction"]:checked').val();
                        if ( $('#'+me.formId+' input[name="scale_mode"]:checked').val() == 'user') {
                            me.updatePrintBox();
                        }
                        else {
                            me.removePrintBox();
                            me.boxScale = null;
                            me.drawPrintBox.apply(me);
                        }
                    });
                    $('#'+me.formId+' select[name="formato"]').change(function() {
                        me.pageFormat = $('#'+me.formId+' select[name="formato"]').val();
                        me.updatePrintBox();
                    });
                    
                    $('#'+me.formId+' select[name="print_resolution"]').change(function() {
                        me.printResolution = this.value;
                    });
                    
                    $('#'+me.formId+' textarea[name="text"]').change(function() {
                        me.printText = this.value;
                    });
                    
                    $('#'+me.formId+' input[name="date"]').change(function() {
                        me.printDate = this.value;
                    });
                    
                    $('#'+me.formId+' input[name="legend"]').change(function() {
                        this.value=='yes'?me.printLegend = this.value:me.printLegend=null;
                    });

                    $('#'+me.formId+' input[name="format"]').change(function() {
                        me.printFormat = this.value;
                    });

                    $('#'+me.formId).on('click', 'a[role="html"],a[role="pdf"]', function(event) {
                        if($(this).attr("href") == "#") event.preventDefault();
                    });

                    $('#'+me.formId).on('click', 'button[role="print"]', function(event) {
                        event.preventDefault();
                        $('#'+me.formId+' a[role="pdf"], #printpanel a[role="html"]').attr('href', '#');
                        $('#'+me.formId+' span[role="icon"]').removeClass('glyphicon-white').addClass('glyphicon-disabled');
                        me.doPrint();
                    });

                },
                'deactivate' : function(event) {
                    sidebarPanel.hide('printpanel');
                    this.removePrintBox();
                },
                'activate' : function(event) {
                    var me = this;
                    if (me.map.currentControl!=me) {
                        me.map.currentControl.deactivate();
                        me.map.currentControl=me;
                    }
                    $('#'+me.formId+' input[name="scale_mode"]:checked').val() == 'user' ? me.boxScale = $('#'+me.formId+' input[name="scale"]').val() : me.boxScale = null;
                    me.drawPrintBox.apply(me);
                },
                'printed' : function (event) {
                    var me = this;
                    if(event.format == 'HTML') {
                        $('#'+me.formId+' a[role="html"]').attr('href', event.file);
                        $('#'+me.formId+' a[role="html"] span[role="icon"]').removeClass('glyphicon-disabled').addClass('glyphicon-white');
                    } else if(event.format == 'PDF') {
                        $('#'+me.formId+' a[role="pdf"]').attr('href', event.file);
                        $('#'+me.formId+' a[role="pdf"] span[role="icon"]').removeClass('glyphicon-disabled').addClass('glyphicon-white');
                    }
                    
                    var win = window.open(event.file, '_blank');
                    win.focus();
                }
            }
        }),
        
        new OpenLayers.Control.Button({ 
            iconclass:"glyphicon-white  glyphicon-eye-open", 
            title:"Mappa di riferimento",
            tbarpos:"last",
            trigger: function() {
                if (sidebarPanel.handleEvent)
                {
                    if (this.active) {
                        this.deactivate();
                        GisClientMap.overviewMap.hide();
                    }
                    else
                    {
                        this.activate();
                        GisClientMap.overviewMap.show();
                    }
                    sidebarPanel.handleEvent = false;
                }
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
    for(var i=0;i<this.mapOptions.resolutions.length;i++){
        scale = OpenLayers.Util.getScaleFromResolution (this.mapOptions.resolutions[i],this.mapOptions.units);
        option = $("<option></option>");
        option.val(zoomLevel);
        zoomLevel += 1;
        scale = scale<1001?Math.round(scale/10)*10:Math.round(scale/1000)*1000;
        option.text('Scala 1:'+ scale);
        $('#map-select-scale').append(option);
    }
    $('#map-select-scale').val(map.getZoom());
    $('#map-select-scale').change(function(){
        map.zoomTo(this.value);
    });
    map.events.register('zoomend', null, function(){
        $('#map-select-scale').val(map.getZoom());
        if (queryToolbar.active)
            queryToolbar.redraw();
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
                url: self.baseUrl + 'login.php',
                type: 'POST',
                dataType: 'json',
                data: {
                    username: $('#LoginWindow input[name="username"]').val(),
                    password: md5($('#LoginWindow input[name="password"]').val())
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
            url: self.baseUrl + 'logout.php',
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
    
    var len = GisClientMap.mapsets.length, i, mapset,
        options = [], option;

    for(i = 0; i < len; i++) {
        mapset = GisClientMap.mapsets[i];
        
        option = '<option value="'+mapset.mapset_name+'"';
        if(mapset.mapset_name == GisClientMap.mapsetName) option += ' selected ';
        option += '>'+mapset.mapset_title+'</option>';
        
        options.push(option);
    }
    $('#mapset-switcher select').html(options);
    $('#mapset-switcher select').change(function() {
        var mapset = $(this).val();
        if(mapset == GisClientMap.mapsetName) return;
        
        var currentUrl = window.location.href;
        var newUrl = currentUrl.replace('mapset='+GisClientMap.mapsetName, 'mapset='+mapset);
        
        window.location.href = newUrl;
    });

        
}//END initMap




    var layerLegend = new OpenLayers.Control.LayerLegend({
        div: OpenLayers.Util.getElement('layerlegend'),
        autoLoad: false
    });
    $('a[href="#layerlegend"]').click(function() {
        if(!layerLegend.loaded) {
            layerLegend.load();
        }
    });

    OpenLayers.ImgPath = "../resources/themes/openlayers/img/";
    var GisClientBaseUrl = GISCLIENT_URL + "/"
    GisClientMap = new OpenLayers.GisClient(GisClientBaseUrl + 'services/gcmap.php' + window.location.search,'map',{
        useMapproxy:true,
        mapProxyBaseUrl:MAPPROXY_URL,
        baseUrl: GisClientBaseUrl,
        mapOptions:{
            controls:[
                new OpenLayers.Control.Navigation(),
                new OpenLayers.Control.Attribution(),
                new OpenLayers.Control.LoadingPanel(),
                new OpenLayers.Control.PanZoomBar(),
                new OpenLayers.Control.ScaleLine(),
                /*
                new OpenLayers.Control.TouchNavigation({
                    dragPanOptions: {
                        enableKinetic: true
                    }
                }),
                //new OpenLayers.Control.PinchZoom(),
*/
                new OpenLayers.Control.LayerTree({
                    emptyTitle:'', 
                    div:OpenLayers.Util.getElement('layertree-tree')
                }),
                layerLegend
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
/*
$(document).on('pagebeforeshow', null, function(){       
    $(document).on('click', null,function(e) {
        alert('Button click');
    }); 
    $(document).on('mouseup', null,function(e) {
        alert('Button click');
    }); 
});
*/
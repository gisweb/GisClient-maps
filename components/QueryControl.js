// **** Set query toolbar defaults, fast search controls integration
window.GCComponents.InitFunctions.setQueryToolbar = function(map) {
    // **** Get main selection control
    var selectControls = map.getControlsBy('gc_id', 'control-querytoolbar');
    if (selectControls.length < 1) {
        $('#map-fast-search select').hide();
        $('#map-fast-search a.searchButton').hide();
        return;
    }
    if (!selectControls[0].controls) {
        $('#map-fast-search select').hide();
        $('#map-fast-search a.searchButton').hide();
       return;
   }
   $('#map-fast-search select').show();
   $('#map-fast-search a.searchButton').show();
    var queryToolbar = selectControls[0];

    queryToolbar.defaultControl = queryToolbar.controls[0];
    $('#searchWindowModalContent').css('height', clientConfig.SEARCH_WINDOW_H+"px");
    $('#searchWindowModalContent .modal-body') .css('height', (clientConfig.SEARCH_WINDOW_H-100)+"px")

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
            var selected = ((typeof(clientConfig.FAST_SEARCH_DEFAULT) !== 'undefined') && (clientConfig.FAST_SEARCH_DEFAULT == featureType.typeName)) ? "selected" : "";
            options.push('<option value="'+featureType.typeName+'" '+selected+'>'+featureType.title+'</option>');
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
};

window.GCComponents.InitFunctions.initAdvancedQueryButtons = function(map) {
    $('#btnAdvancedQuery').click(function(event) {
        console.log('advanced query click');
        event.preventDefault();
        var selectedFeatureType = $('select.olControlQueryMapSelect').val(),
            fType = GisClientMap.getFeatureType(selectedFeatureType);
        if(!fType) return alert('Errore: il featureType '+selectedFeatureType+' non esiste');
        var queryMap = map.getControlsByClass('OpenLayers.Control.QueryMap')[0];
        queryMap.resultLayer.removeAllFeatures();
        queryMap.events.triggerEvent('startQueryMap');
        var params = ConditionBuilder.getQuery();
        params.projectName = GisClientMap.projectName;
        params.mapsetName = GisClientMap.mapsetName;
        params.srid = GisClientMap.map.projection;
        params.featureType = selectedFeatureType;
        $.ajax({
            url: clientConfig.GISCLIENT_URL + '/services/xMapQuery.php',
            method: 'POST',
            dataType: 'json',
            data: params,
            success: function(response) {
                if(!response || typeof(response) != 'object') {
                    queryMap.events.triggerEvent('endQueryMap');
                    return alert('Errore di sistema');
                }
                if(!response.length) {
                    queryMap.events.triggerEvent('endQueryMap');
                    return;
                }
                var features = [], len = response.length, result, i, geometry, feature;
                for(i = 0; i < len; i++) {
                    result = response[i];
                    geometry = result.gc_geom && OpenLayers.Geometry.fromWKT(result.gc_geom);
                    if(!geometry) continue;
                    delete result.gc_geom;
                    feature = new OpenLayers.Feature.Vector(geometry, result);
                    feature.featureTypeName = selectedFeatureType;
                    features.push(feature);
                }
                fType.features = features;
                queryMap.events.triggerEvent('featuresLoaded',fType);
                queryMap.resultLayer.addFeatures(features);
                queryMap.events.triggerEvent('endQueryMap');
                $('#SearchWindow').modal('hide');
                $("#resultpanel").addClass("smalltable"); //non so perchè l'ho dovuto mettere qui....
            },
            error: function() {
              queryMap.events.triggerEvent('endQueryMap');
              alert('Errore di sistema');
            }
        });
    });
}

// **** Query toolbar
window.GCComponents["Controls"].addControl('control-querytoolbar', function(map){
    return  new OpenLayers.GisClient.queryToolbar({
        gc_id: 'control-querytoolbar',
        baseUrl: GisClientMap.baseUrl,
        createControlMarkup:customCreateControlMarkup,
        resultTarget:document.getElementById("resultpanel"),
        resultLayout:"TABLE",
        div:document.getElementById("map-toolbar-query"),
        autoActivate:false,
        saveState:true,
        maxWfsFeatures:clientConfig.MAX_LAYER_FEATURES,
        maxVectorFeatures:clientConfig.MAX_QUERY_FEATURES,
        resultStyle:typeof(clientConfig.RESULT_LAYER_STYLE)!='undefined'?new OpenLayers.StyleMap(clientConfig.RESULT_LAYER_STYLE):null,
        eventListeners: {
            'endQueryMap': function(event) {        //Aggiungo l'animazione (???? da spostare sulla pagina)
                if(event.layer.features && event.layer.features.length) {
                    if($(window).width() > 1000) {
                        sidebarPanel.show('resultpanel');
                        map.getControlsBy('id', 'button-resultpanel')[0].activate();
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
                    if ($('#resultpanel').is(":visible"))
                        sidebarPanel.hide();
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
                if (queryResLayer.selectedFeatures.indexOf(feature) < 0 && clientConfig.POPUP_TIMEOUT > 0)
                {
                    self.popupOpenTimeout = setTimeout(function() {
                        if (self.popup)
                            self.map.addPopup(self.popup);
                    }, clientConfig.POPUP_TIMEOUT);
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
                    cols = [], types = [], formats = [], col, j,
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
                    types.push(property.fieldType);
                    formats.push(typeof(property.fieldFormat) != 'undefined'?property.fieldFormat:null);
                }
                table += '</tr></thead><tbody>';

                for(i = 0; i < results.length; i++) {
                    result = results[i];

                    table += '<tr>';

                    for(j = 0; j < cols.length; j++) {
                        col = cols[j];
                        value = result[col] || '';

                        table += '<td>'+this.writeDataAttribute(types[j], value, formats[j])+'</td>';
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
            debugger;
            var mode = mode || 'default',
                selectedFeatureType = selectedFeatureType || $('select.olControlQueryMapSelect').val(),
                selectedFeatureTypeArr = selectedFeatureType.split(','),
                queryToolbar = this,
                fType;

            if (selectedFeatureTypeArr.length > 1) {
                selectedFeatureType = selectedFeatureTypeArr[0];
            }
            selectedFeatureTypeArr = selectedFeatureTypeArr.splice(1);

            if(mode == 'default' && selectedFeatureTypeArr.length == 0) {
                $('li[role="advanced-search"]').show();
            } else {
                $('li[role="advanced-search"]').hide();
                $('#ricerca').addClass('active');
                $('#avanzata').removeClass('active');
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
                properties = JSON.parse(JSON.stringify(fType.properties));

            for (var k = 0; k < selectedFeatureTypeArr.length; k++) {
                var fTypeK = GisClientMap.getFeatureType(selectedFeatureTypeArr[k]);
                if(!fTypeK) return alert('Errore: il featureType '+selectedFeatureTypeArr[k]+' non esiste');
                var propertiesK = fTypeK.properties;
                var propertiesTmp = [];
                for (var idx = 0; idx < propertiesK.length; idx++) {
                    var tmpArr = properties.filter(function( obj ) {
                        return (obj.name == propertiesK[idx].name &&
                            obj.fieldType == propertiesK[idx].fieldType &&
                            obj.dataType == propertiesK[idx].dataType);
                    });
                    if (tmpArr.length > 0) {
                        if (propertiesK[idx].hasOwnProperty('fieldId')) {
                            tmpArr[0].fieldId += ',' + propertiesK[idx].fieldId;
                        }
                        delete tmpArr[0].fieldFilter;
                        propertiesTmp = propertiesTmp.concat(tmpArr);
                    }
                }
                properties = propertiesTmp;
            }

            var len = properties.length, property, i, hasProperties = false;;

            if (selectedFeatureTypeArr.length == 0) {
                $('#searchFormTitle').html('Ricerca '+fType.title);
            }
            else {
                $('#searchFormTitle').html('Ricerca '+$('select.olControlQueryMapSelect option:selected').text());
            }

            //form += '<form role="form">';
            form += '<table>';

            for(i = 0; i < len; i++) {
                property = properties[i];

                if(!property.searchType || property.relationType == 2) continue; //searchType undefined oppure 0

                hasProperties = true;
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

            if (!hasProperties) {
                $('#ricerca').empty().append('<div>Nessun campo ricercabile per questo layer/gruppo di ricerca</div>');
                $('#SearchWindow').modal('show');
                return;
            }

            if(mode == 'default') {
                form += '<div class="form-group"><input type="checkbox" name="use_current_extent" gcfilter="false"> Filtra sull\'extent attuale</div>';
            }

            if ($.mobile) {
                form += '<button type="submit" class="btn btn-default ui-btn ui-shadow ui-corner-all">Cerca</button>'
            }
            else {
                form += '<button type="submit" class="btn btn-default">Cerca</button>'
            }

            form += '</form>';

            $('#ricerca').empty().append(form);

            $('#ricerca input[searchType="3"],#ricerca input[searchType="6"]').each(function(e, input) {
                var fieldId = $(input).attr('fieldId');
                var fieldFilter = $(input).attr('fieldFilter');

                $(input).select2({
                    minimumInputLength: 0,
                    query: function(query) {
                        var filterValue = '';
                        var filterFields = '';
                        var fieldFilterTmp = fieldFilter;

                        while (fieldFilterTmp !== 'undefined' && fieldFilterTmp !== null){
                            if ($('#ricerca input[fieldId="'+fieldFilterTmp+'"]').length === 0) {
                                break;
                            }
                            if (typeof $('#ricerca input[fieldId="'+fieldFilterTmp+'"]').select2('data') !== "undefined" && $('#ricerca input[fieldId="'+fieldFilterTmp+'"]').select2('data') !== null) {
                                var filterSelect = $('#ricerca input[fieldId="'+fieldFilterTmp+'"]').select2('data');
                                filterValue +=  $('#ricerca input[fieldId="'+fieldFilterTmp+'"]').select2('data').text + ',';
                                filterFields += fieldFilterTmp + ',';
                            }
                            fieldFilterTmp = $('#ricerca input[fieldId="'+fieldFilterTmp+'"]').attr('fieldFilter');
                        }
                        if (filterValue.length > 0) {
                            filterValue = filterValue.slice(0, -1);
                            filterFields = filterFields.slice(0, -1);
                        }

                        if (typeof $('#ricerca input[fieldFilter="'+fieldId+'"]').select2('data') !== "undefined" && $('#ricerca input[fieldFilter="'+fieldId+'"]').select2('data') !== null)
                            $('#ricerca input[fieldFilter="'+fieldId+'"]').select2('data', null);

                        $.ajax({
                            url: GisClientMap.baseUrl + 'services/xSuggest.php',
                            data: {
                                suggest: query.term,
                                field_id: fieldId,
                                filterfields: filterFields,
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
                        type = $('#ricerca select[name="'+name+'_operator"]').val();
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
                    geometry = GisClientMap.map.maxExtent;
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
                if (typeof(oldQueryFilters) != 'undefined') {
                    alert (oldQueryFilters);
                }
                control.queryFilters[fType.typeName] = filter;
                for (var k = 0; k < selectedFeatureTypeArr.length; k++) {
                    var fTypeK = GisClientMap.getFeatureType(selectedFeatureTypeArr[k]);
                    control.queryFilters[fTypeK.typeName] = filter;
                }
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
});

// **** Toolbar button
// **** Query Toolbar Button
window.GCComponents["SideToolbar.Buttons"].addButton (
    'button-querytoolbar',
    'Pannello di ricerca',
    'glyphicon-white  glyphicon-info-sign',
    function() {
        if (sidebarPanel.handleEvent || typeof(sidebarPanel.handleEvent) === 'undefined')
        {
            var ctrl = this.map.getControlsBy('gc_id', 'control-querytoolbar')[0];

            if (ctrl.active) {
                ctrl.deactivate();
                this.deactivate();
            }
            else
            {
                ctrl.activate();
                this.activate();
                if (this.map.currentControl != ctrl.controls[0]) {
                    ctrl.controls[0].activate();
                }
            }
            if (typeof(sidebarPanel.handleEvent) !== 'undefined')
                sidebarPanel.handleEvent = false;
        }
    },
    {button_group: 'data'}
);


// **** Result panel button
window.GCComponents["SideToolbar.Buttons"].addButton (
    'button-resultpanel',
    'Tabella dei risultati',
    'glyphicon-white glyphicon-list-alt',
    function() {
        if (sidebarPanel.handleEvent || typeof(sidebarPanel.handleEvent) === 'undefined')
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
            if (typeof(sidebarPanel.handleEvent) !== 'undefined')
                sidebarPanel.handleEvent = false;
        }
    },
    {button_group: 'data', sidebar_panel: 'resultpanel'}
);

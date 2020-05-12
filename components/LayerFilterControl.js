// **** Set query toolbar defaults, fast search controls integration
window.GCComponents.Functions.gcLayerFilter = {};

window.GCComponents.InitFunctions.gcLayerFilterInit = function(map) {
    if ($.mobile) { // **** TODO: interface for mobile
        return;
    }
    // **** Load filters
    GisClientMap.gcLayerFilter = {};
    GisClientMap.gcLayerFilter.wfsCache = null;
    GisClientMap.gcLayerFilter.config = {};

    var params = {
        'projectName' : GisClientMap.projectName,
        'mapsetName' : GisClientMap.mapsetName,
        'action' : 'list'
    };
    $.ajax({
        url: clientConfig.GISCLIENT_URL + '/services/gcFilterLayer.php',
        method: 'POST',
        dataType: 'json',
        data: params,
        success: function(response) {
            if(!response || typeof(response) != 'object') {
                alert('Errore di sistema - nessuna risposta da servizio impostazione filtro');
                return;
            }
            if(response.result != 'ok') {
                if (response.hasOwnProperty('error')) {
                    alert ('Errore in impostazione filtro layer: ' + response.message);
                }
                else {
                    alert('Errore di sistema - risposta da servizio impostazione filtro non valida');
                }
            }
            else {
                // **** initialize filters list
                GisClientMap.gcLayerFilter.config = response.conditions;
                // **** Build filter panel
                window.GCComponents.Functions.gcLayerFilter.setPanel();
                window.GCComponents.Functions.gcLayerFilter.initButtons(map);
            }
        },
        error: function() {
          alert('Errore di sistema - servizio impostazione filtro');
        }
    });
};

window.GCComponents.Functions.gcLayerFilter.setPanel = function()  {
    // **** Create/Acquire wfsCache
    var selectControls = GisClientMap.map.getControlsBy('gc_id', 'control-querytoolbar');
    if (selectControls.length == 1) {
        GisClientMap.gcLayerFilter.wfsCache = selectControls[0].wfsCache;
    }
    else { // **** create wfsCache as in QueryToolbar

    }
    if (!GisClientMap.gcLayerFilter.wfsCache) {
        return;
    }
    // **** Create panel
    $('#layertree a[href="#layerfilter"]').show();
    $('#layerfilter').append('<div id="layerfilter_add"></div>');
    $('#layerfilter_add').append('<span>Crea o modifica filtro sul layer:</span>');
    $('#layerfilter').append('<div id="layerfilter_list"></div>');
    $('#layerfilter_list').append('<span>Filtri layer sulla mappa:</span>');

    // **** Create Layers select
    $('#layerfilter_add').append('<select id="layerfilter_add_layer"</select>');
    $('#layerfilter_add_layer').append(new Option ("Seleziona layer", "__select__"));
    var group, option;
    for (index in GisClientMap.gcLayerFilter.wfsCache){
        var featureTypes = GisClientMap.gcLayerFilter.wfsCache[index].featureTypes;
        var options=[];
        for(var i=0;i<featureTypes.length;i++){
            option = new Option (featureTypes[i].title,featureTypes[i].typeName);
            options.push(option);
        }
        if(options.length > 0) {
            if(group != featureTypes[0].group) {
                group = featureTypes[0].group;
                option = document.createElement("optgroup");
                option.label="Tema: " + group;
                $('#layerfilter_add_layer').append(option);
            }
            for(var i=0;i<options.length;i++)  $('#layerfilter_add_layer').append(options[i]);
        }
    };
    $('#layerfilter_add_layer').val("__select__");
    $('#layerfilter_add_layer').change(function(){
        var selectedFeatureType = $(this).val()
        if (selectedFeatureType == "__select__") {
            return;
        }
        var filter = GisClientMap.gcLayerFilter.config[selectedFeatureType];
        var fType = GisClientMap.getFeatureType(selectedFeatureType);
        if(!fType) return alert('Errore: il featureType '+selectedFeatureType+' non esiste');
        if(ConditionBuilder) {
            ConditionBuilder.init('.query-layerfilter');
            if (typeof(filter) == 'undefined') {
                ConditionBuilder.setFeatureType(fType);
            }
            else {
                ConditionBuilder.setFeatureType(fType,filter);
            }
            $('#SetLayerFilterTitle').html('Filtra Layer ' + fType.title);
            $('#SetLayerFilterWindow').modal('show');
        }
        $('#layerfilter_add_layer').val("__select__");
    });

    // **** Create filters list
    $.each(GisClientMap.gcLayerFilter.config, function(index, value) {
        window.GCComponents.Functions.gcLayerFilter.setListElem(index, true);
        window.GCComponents.Functions.gcLayerFilter.toggleFilterOnMap(index, true, false);
    });
};


window.GCComponents.Functions.gcLayerFilter.initButtons = function(map) {
    $('#btnLayerFilter').click(function(event) {
        console.log('layer filter click');
        event.preventDefault();
        var selectedFeatureType = ConditionBuilder.featureType.typeName;
        var params = {'condition':JSON.stringify(ConditionBuilder.getQuery(null, true))};
        params.projectName = GisClientMap.projectName;
        params.mapsetName = GisClientMap.mapsetName;
        params.featureType = selectedFeatureType;
        params.action = 'set';
        $.ajax({
            url: clientConfig.GISCLIENT_URL + '/services/gcFilterLayer.php',
            method: 'POST',
            dataType: 'json',
            data: params,
            success: function(response) {
                if(!response || typeof(response) != 'object') {
                    alert('Errore di sistema - nessuna risposta da servizio impostazione filtro');
                    $('#SetLayerFilterWindow').modal('hide');
                    return;
                }
                if(response.result != 'ok') {
                    if (response.hasOwnProperty('error')) {
                        alert ('Errore in impostazione filtro layer: ' + response.message);
                    }
                    else {
                        alert('Errore di sistema - risposta da servizio impostazione filtro non valida');
                    }
                }
                else {
                    // **** Update local filters list
                    GisClientMap.gcLayerFilter.config[selectedFeatureType] = response.conditions[selectedFeatureType];
                    // **** Create Item in filters list
                    window.GCComponents.Functions.gcLayerFilter.setListElem(selectedFeatureType, true);
                    // **** Update Map and layerTree
                    window.GCComponents.Functions.gcLayerFilter.toggleFilterOnMap(selectedFeatureType, true, true);
                }

                $('#SetLayerFilterWindow').modal('hide');

            },
            error: function() {
              alert('Errore di sistema - servizio impostazione filtro');
            }
        });
    });
};

window.GCComponents.Functions.gcLayerFilter.toggleFilterOnMap = function(featureType, toggle, redraw) {
    // **** Relod filtered layers
    var index, nFilters, fLayer = null;
    for (index in GisClientMap.gcLayerFilter.wfsCache){
        nFilters = 0;
        for(var i=0;i<GisClientMap.gcLayerFilter.wfsCache[index].featureTypes.length;i++){
            if(GisClientMap.gcLayerFilter.wfsCache[index].featureTypes[i].typeName == featureType) {
                fLayer = GisClientMap.map.getLayer(index);
            }
            if (typeof(GisClientMap.gcLayerFilter.config[GisClientMap.gcLayerFilter.wfsCache[index].featureTypes[i].typeName]) != 'undefined') {
                nFilters++;
            }
        }
        if (fLayer) {
            break;
        }
    }
    if (redraw) {
        fLayer.redraw();
    }

    var layerTreeCtrl = GisClientMap.map.getControlsBy('gc_id', 'control-layertree');
    var treeElem = layerTreeCtrl[0].getNode(fLayer);

    if ($.mobile) {

    }
    else {
        var filterSpan = $(treeElem.target).find('.tree-layer-filtered');
        if (filterSpan.length > 0 && !toggle) {
            if (nFilters == 1) {
                filterSpan.remove();
            }
        }
        else if (filterSpan.length == 0 && toggle){
            $(treeElem.target).append('<span class="tree-layer-filtered"></span>');
        }
    }
};

window.GCComponents.Functions.gcLayerFilter.setListElem = function(featureType, toggle) {
    var itemID = 'gcLayerFilter_list_'+featureType;
    itemID =itemID.replace('.','-');
    var filterItem = $('#layerfilter_list').find('#'+itemID);
    if (filterItem.length == 0 && toggle) {
        var fType = GisClientMap.getFeatureType(featureType);
        $('#layerfilter_list').append('<div id="'+itemID+'" class="layerfilter-listitem"><span class="layerfilter-listname"></span><span class="layerfilter-listbuttons"></span></div>');
        $('#'+itemID).find('.layerfilter-listname').html(fType.title);
        // **** Add buttons
        $('#'+itemID).find('.layerfilter-listbuttons').append('<a href="#" id="'+itemID+'_del"><span class="icon-delete"></span></a>');
        $('#'+itemID).find('.layerfilter-listbuttons').append('<a href="#" id="'+itemID+'_upd"><span class="icon-update"></span></a>');
        $('#'+itemID+'_upd').click(function() {
            var fType = GisClientMap.getFeatureType(featureType);
            var filter = GisClientMap.gcLayerFilter.config[featureType];
            if(!fType) return alert('Errore: il featureType '+featureType+' non esiste');
            if(ConditionBuilder) {
                ConditionBuilder.init('.query-layerfilter');
                if (typeof(filter) == 'undefined') {
                    ConditionBuilder.setFeatureType(fType);
                }
                else {
                    ConditionBuilder.setFeatureType(fType,filter);
                }
                $('#SetLayerFilterTitle').html('Filtra Layer ' + fType.title);
                $('#SetLayerFilterWindow').modal('show');
            }
        });
        $('#'+itemID+'_del').click(function() {
            var params = {
                'projectName' : GisClientMap.projectName,
                'mapsetName' : GisClientMap.mapsetName,
                'featureType' : featureType,
                'action' : 'set'
            };
            $.ajax({
                url: clientConfig.GISCLIENT_URL + '/services/gcFilterLayer.php',
                method: 'POST',
                dataType: 'json',
                data: params,
                success: function(response) {
                    if(!response || typeof(response) != 'object') {
                        alert('Errore di sistema - nessuna risposta da servizio impostazione filtro');
                        $('#SetLayerFilterWindow').modal('hide');
                        return;
                    }
                    if(response.result != 'ok') {
                        if (response.hasOwnProperty('error')) {
                            alert ('Errore in impostazione filtro layer: ' + response.message);
                        }
                        else {
                            alert('Errore di sistema - risposta da servizio impostazione filtro non valida');
                        }
                    }
                    else {
                        // **** Create Item in filters list
                        window.GCComponents.Functions.gcLayerFilter.setListElem(featureType, false);
                        // **** Update Map and layerTree
                        window.GCComponents.Functions.gcLayerFilter.toggleFilterOnMap(featureType, false, true);
                        // **** Update local filters list
                        delete GisClientMap.gcLayerFilter.config[featureType];
                    }
                },
                error: function() {
                  alert('Errore di sistema - servizio impostazione filtro');
                }
            });
        });
    }
    else if (filterItem.length == 1 && !toggle) {
        filterItem.remove();
    }
};

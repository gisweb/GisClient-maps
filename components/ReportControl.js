// **** Report toolbar
window.GCComponents["Controls"].addControl('control-reports', function(map){
    return  new OpenLayers.GisClient.reportToolbar({
        gc_id: 'control-reports',
        baseUrl: GisClientMap.baseUrl,
        createControlMarkup:customCreateControlMarkup,
        //resultTarget:document.getElementById("resultpanel"),
        //resultLayout:"TABLE",
        div:document.getElementById("map-toolbar-report"),
        autoActivate:false,
        saveState:true,
        rowsPerPage: 200,
        selectedCols: [],
        filterButtonHander: function (event) {
            var reportToolbar = this.map.getControlsBy('gc_id', 'control-reports')[0];

            var selectedReport =  $('select.olControlReportMapSelect').val();

            if(selectedReport < 1){
                return alert('Nessun modello di report selezionato');
            }

            var reportDef = reportToolbar.getReportDef(selectedReport);

            if (!reportDef) {
                return alert('Defininzione del modello di report non trovata, ID: ' + selectedReport);
            }

            if (typeof(reportDef.properties) == 'undefined') {
                alert ('Definizione del modello di report non valida');
                return;
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

            if ($.mobile) {
                form += '<button type="submit" class="btn btn-default ui-btn ui-shadow ui-corner-all">Cerca</button>'
            }
            else {
                form += '<button type="submit" class="btn btn-default">Cerca</button>'
            }

            form += '</form>';

            $('#ricerca-report').empty().append(form);

            $('#ricerca-report input[searchType="3"],#ricerca-report input[searchType="6"]').each(function(e, input) {
                var fieldId = $(input).attr('fieldId');
                var fieldFilter = $(input).attr('fieldFilter');

                $(input).select2({
                    minimumInputLength: 0,
                    query: function(query) {
                        var filterValue = '';
                        var filterFields = '';
                        var fieldFilterTmp = fieldFilter;

                        while (fieldFilterTmp !== 'undefined' && fieldFilterTmp !== null){
                            if ($('#ricerca-report input[fieldId="'+fieldFilterTmp+'"]').length === 0) {
                                break;
                            }
                            if (typeof $('#ricerca-report input[fieldId="'+fieldFilterTmp+'"]').select2('data') !== "undefined" && $('#ricerca-report input[fieldId="'+fieldFilterTmp+'"]').select2('data') !== null) {
                                var filterSelect = $('#ricerca-report input[fieldId="'+fieldFilterTmp+'"]').select2('data');
                                filterValue +=  $('#ricerca-report input[fieldId="'+fieldFilterTmp+'"]').select2('data').text + ',';
                                filterFields += fieldFilterTmp + ',';
                            }
                            fieldFilterTmp = $('#ricerca-report input[fieldId="'+fieldFilterTmp+'"]').attr('fieldFilter');
                        }
                        if (filterValue.length > 0) {
                            filterValue = filterValue.slice(0, -1);
                            filterFields = filterFields.slice(0, -1);
                        }

                        if (typeof $('#ricerca-report input[fieldFilter="'+fieldId+'"]').select2('data') !== "undefined" && $('#ricerca-report input[fieldFilter="'+fieldId+'"]').select2('data') !== null)
                            $('#ricerca-report input[fieldFilter="'+fieldId+'"]').select2('data', null);

                        $.ajax({
                            url: GisClientMap.baseUrl + 'services/xRpSuggest.php',
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
                        type = $('#ricerca select[name="'+name+'_operator"]').val();
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
                    var reportDef = event.reportDef;
                    if (typeof(reportDef.properties) == 'undefined') {
                        alert ('Definizione del modello di report non valida');
                        return;
                    }
                    var len = reportDef.properties.length, i, property,
                        table = '<table id="reportTbl"><thead><tr>',
                        exportLinks = ' <a href="#" class="reportTbl_export" action="xls" reportID="' + event.reportID + '" ><img src="../../resources/themes/icons/xls.gif">&nbsp;Esporta in Excel</a>'
                                    + ' <a href="#" class="reportTbl_export" action="pdf" reportID="' + event.reportID + '" ><img src="../../resources/themes/icons/acrobat.gif">&nbsp;Esporta in PDF</a>',
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
});

// **** Toolbar button
window.GCComponents["SideToolbar.Buttons"].addButton (
    'button-reports',
    'Pannello di visualizzazione reports',
    'glyphicon-white  glyphicon-stats',
    function() {
        if (sidebarPanel.handleEvent || typeof(sidebarPanel.handleEvent) === 'undefined')
        {
            var ctrl = this.map.getControlsBy('gc_id', 'control-reports')[0];

            if (ctrl.active) {
                ctrl.deactivate();
                this.deactivate();
            }
            else
            {
                ctrl.activate();
                this.activate();
            }
            if (typeof(sidebarPanel.handleEvent) !== 'undefined')
                sidebarPanel.handleEvent = false;
        }
    },
    {button_group: 'data'}
);

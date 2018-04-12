// **** Print control
window.GCComponents["Controls"].addControl('control-printmap', function(map){
    return new OpenLayers.Control.PrintMap({
        gc_id: 'control-printmap',
        baseUrl:GisClientMap.baseUrl,
        defaultLayers: self.mapsetTiles?self.activeLayers.slice(0):[],
        formId: 'printpanel',
        waitFor: 'panelready',
        allowDrag: true,
        printLegend: 'yes',
        defaultTemplateHTML: PRINT_TEMPLATE_HTML,
        defaultTemplatePDF: PRINT_TEMPLATE_PDF,
        eventListeners: {
            'panelready': function(event) {
                var me = this, timerid,
                scale = Math.round(map.getScale()),
                userScale = $('#'+me.formId+' input[name="scale"]').val();

                if ($.mobile) {
                    $('#print_panel_legend').controlgroup();
                    $('#print_panel_layout').controlgroup();
                    $('#print_panel_format').controlgroup();
                    $('#print_panel_scalemode').controlgroup();
                    $('#'+me.formId+' input[name="scale"]').textinput();
                }

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
                        var currentScale = me.boxScale?me.boxScale:map.getScale();
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
                var btnControl = map.getControlsBy('id', 'button-printmap')[0];
                if (btnControl.active)
                    btnControl.deactivate();
            },
            'activate' : function(event) {
                var me = this;
                if (map.currentControl!=me) {
                    map.currentControl.deactivate();
                    map.currentControl=me;
                }
                $('#'+me.formId+' input[name="scale_mode"]:checked').val() == 'user' ? me.boxScale = $('#'+me.formId+' input[name="scale"]').val() : me.boxScale = null;
                me.drawPrintBox.apply(me);
                var btnControl = map.getControlsBy('id', 'button-printmap')[0];
                if (!btnControl.active)
                    btnControl.activate();
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
    });
});

// **** Toolbar button
window.GCComponents["SideToolbar.Buttons"].addButton (
    'button-printmap',
    'Pannello di stampa',
    'glyphicon-white glyphicon-print',
    function() {
        if (sidebarPanel.handleEvent || typeof(sidebarPanel.handleEvent) === 'undefined')
        {
            var ctrlPrint = this.map.getControlsBy('gc_id', 'control-printmap')[0];

            if (ctrlPrint.active) {
                ctrlPrint.deactivate();
                this.deactivate();
                sidebarPanel.hide('printpanel');
            }
            else
            {
                ctrlPrint.activate();
                this.activate();
                var panelPath = GisClientMap.rootPath + 'panels/';
                if ($.mobile) {
                    panelPath += 'print_panel_mobile.html';
                }
                else {
                    panelPath += 'print_panel.html';
                }
                if($.trim($('#printpanel').html()) == '') {
                    $("#printpanel").load(panelPath, function() {
                        ctrlPrint.events.triggerEvent('panelready');
                    });
                }
                else {
                    //this.drawPrintArea();
                }

                sidebarPanel.show('printpanel');
            }
            if (typeof(sidebarPanel.handleEvent) !== 'undefined')
                sidebarPanel.handleEvent = false;
        }
    },
    {button_group: 'print', sidebar_panel: 'printpanel', gc_control: 'control-printmap'}
);

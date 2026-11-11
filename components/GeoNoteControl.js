// **** GeoNote Toolbar control
window.GCComponents["Controls"].addControl('control-redline', function(map){
        return new OpenLayers.GisClient.geoNoteToolbar({
        gc_id: 'control-redline',
        baseUrl: GisClientMap.baseUrl,
        createControlMarkup:customCreateControlMarkup,
        div:document.getElementById("map-toolbar-redline"),
        autoActivate:false,
        saveState:true,
        noteDefaultTitle: clientConfig.hasOwnProperty('GEONOTE_DEFAULT_TITLE')?clientConfig.GEONOTE_DEFAULT_TITLE:'Nuova nota',
        noteStatusList: clientConfig.GEONOTE_STATUS_LIST,
        noteTypeList: (clientConfig.GEONOTE_TYPE_LIST_MAP.hasOwnProperty(GisClientMap.mapsetName)?clientConfig.GEONOTE_TYPE_LIST_MAP[GisClientMap.mapsetName]:clientConfig.GEONOTE_TYPE_LIST),
        symbolFontFiles: (clientConfig.GEONOTE_SYMBOL_MAP.hasOwnProperty(GisClientMap.mapsetName)?clientConfig.GEONOTE_SYMBOL_MAP[GisClientMap.mapsetName]:[]),
        symbolPatternFirst: clientConfig.GEONOTE_SYMBOL_PATTERN_FIRST,
        symbolPatternLast: clientConfig.GEONOTE_SYMBOL_PATTERN_LAST,
        redlineColor: (clientConfig.GEONOTE_DEFAULTS_MAP.hasOwnProperty(GisClientMap.mapsetName) && clientConfig.GEONOTE_DEFAULTS_MAP[GisClientMap.mapsetName].hasOwnProperty('color')?clientConfig.GEONOTE_DEFAULTS_MAP[GisClientMap.mapsetName].color:clientConfig.GEONOTE_COLOR),
        redlineColorM: (clientConfig.GEONOTE_DEFAULTS_MAP.hasOwnProperty(GisClientMap.mapsetName) && clientConfig.GEONOTE_DEFAULTS_MAP[GisClientMap.mapsetName].hasOwnProperty('color')?clientConfig.GEONOTE_DEFAULTS_MAP[GisClientMap.mapsetName].color:clientConfig.GEONOTE_COLOR),
        redlineColorPalette: clientConfig.GEONOTE_COLOR_PALETTE,
        defaultPointRadius: (clientConfig.GEONOTE_DEFAULTS_MAP.hasOwnProperty(GisClientMap.mapsetName) && clientConfig.GEONOTE_DEFAULTS_MAP[GisClientMap.mapsetName].hasOwnProperty('pointRadius')?clientConfig.GEONOTE_DEFAULTS_MAP[GisClientMap.mapsetName].pointRadius:clientConfig.GEONOTE_POINT_RADIUS),
        defaultStrokeWidth: (clientConfig.GEONOTE_DEFAULTS_MAP.hasOwnProperty(GisClientMap.mapsetName) && clientConfig.GEONOTE_DEFAULTS_MAP[GisClientMap.mapsetName].hasOwnProperty('strokeWidth')?clientConfig.GEONOTE_DEFAULTS_MAP[GisClientMap.mapsetName].strokeWidth:clientConfig.GEONOTE_STROKE_WIDTH),
        defaultFillOpacity: clientConfig.GEONOTE_FILL_OPACITY,
        defaultLineType: (clientConfig.GEONOTE_DEFAULTS_MAP.hasOwnProperty(GisClientMap.mapsetName) && clientConfig.GEONOTE_DEFAULTS_MAP[GisClientMap.mapsetName].hasOwnProperty('lineType')?clientConfig.GEONOTE_DEFAULTS_MAP[GisClientMap.mapsetName].lineType:clientConfig.GEONOTE_LINE_TYPE),
        defaultFontSize: clientConfig.GEONOTE_FONT_SIZE
    });
});

// **** Toolbar button
window.GCComponents["SideToolbar.Buttons"].addButton (
    'button-redline',
    'Prima Nota',
    'glyphicon-white glyphicon-pencil',
    function() {
        if (sidebarPanel.handleEvent || typeof(sidebarPanel.handleEvent) === 'undefined')
        {
            var ctrl = this.map.getControlsBy('gc_id', 'control-redline')[0];

            if (ctrl.active) {
                ctrl.deactivate();
                this.deactivate();
                $('#map-toolbars').css('top', '2px');
            }
            else
            {
                ctrl.activate();
                this.activate();
                var nShift = $('#map-toolbars-edit').height() + 3;
                $('#map-toolbars').css('top', nShift + 'px');
            }
            if (typeof(sidebarPanel.handleEvent) !== 'undefined')
                sidebarPanel.handleEvent = false;
        }
    },
    {button_group: 'tools'}
);

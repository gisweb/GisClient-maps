// **** GeoNote Toolbar control
window.GCComponents["Controls"].addControl('control-redline', function(map){
        return new OpenLayers.GisClient.geoNoteToolbar({
        gc_id: 'control-redline',
        baseUrl: GisClientMap.baseUrl,
        panelsUrl: GisClientMap.rootPath + 'panels/',
        createControlMarkup:customCreateControlMarkup,
        div:document.getElementById("map-toolbar-redline"),
        autoActivate:false,
        saveState:true,
        divdrawbtns: "map-toolbar-redline-draw",
        divopsgbtns: "map-toolbar-redline-opsg",
        divopsnbtns: "map-toolbar-redline-opsn"
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

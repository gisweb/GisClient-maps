// **** Print control
window.GCComponents["Controls"].addControl('control-pipeselect', function(map){
    return  new OpenLayers.Control.PIPESelect(
        OpenLayers.Handler.Click,
        {
            type: null,
            gc_id: 'control-pipeselect',
            clearOnDeactivate:true,
            serviceURL:GisClientMap.baseUrl + 'services/iren/findPipes.php',
            distance:50,
            highLight: true,
            eventListeners: {
                'deactivate': function(event) {
                    OpenLayers.Control.PIPESelect.prototype.deactivate.apply(event);
                    var btnControl = map.getControlsBy('id', 'button-pipeselect')[0];
                    if (btnControl.active)
                        btnControl.deactivate();
                }
            }
        }
    );
});

// **** Toolbar button
window.GCComponents["SideToolbar.Buttons"].addButton (
    'button-pipeselect',
    'Ricerca valvole',
    'glyphicon-white glyphicon-tint',
    function() {
        if (sidebarPanel.handleEvent || typeof(sidebarPanel.handleEvent) === 'undefined')
        {
            var ctrl = this.map.getControlsBy('gc_id', 'control-pipeselect')[0];

            if (ctrl.active) {
                ctrl.deactivate();
                this.deactivate();

            }
            else
            {
                sidebarPanel.close();
                ctrl.map.currentControl.deactivate();
                ctrl.map.currentControl=ctrl;
                ctrl.activate();
                this.activate();
                sidebarPanel.close();
            }
            if (typeof(sidebarPanel.handleEvent) !== 'undefined')
                sidebarPanel.handleEvent = false;
        }
    },
    {button_group: 'tools'}
);

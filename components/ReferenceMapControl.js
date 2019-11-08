// **** Toolbar button
window.GCComponents["SideToolbar.Buttons"].addButton (
    'button-refmap',
    'Mappa di riferimento',
    'glyphicon-white  glyphicon-eye-open',
    function() {
        if (sidebarPanel.handleEvent || typeof(sidebarPanel.handleEvent) === 'undefined')
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
            if (typeof(sidebarPanel.handleEvent) !== 'undefined')
                sidebarPanel.handleEvent = false;
        }
    },
    {button_group: 'print'}
);

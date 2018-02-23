// **** Result panel button
window.GCComponents["SideToolbar.Buttons"].addButton (
    'button-layertree',
    'Pannello dei livelli',
    'icon-layers',
    function() {
        if (sidebarPanel.handleEvent || typeof(sidebarPanel.handleEvent) === 'undefined')
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
            if (typeof(sidebarPanel.handleEvent) !== 'undefined')
                sidebarPanel.handleEvent = false;
        }
    },
    {button_group: 'data', sidebar_panel: 'layertree'}
);

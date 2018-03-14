$.getScript("https://maps.googleapis.com/maps/api/js?key=AIzaSyCqG2a5aKkhA4eGamsp8Y4mrdeEqp8Ez9g", function( data, textStatus, jqxhr ) {
  window.GCComponents["Controls"].addControl('control-streetview', function(map){
    return new OpenLayers.GisClient.streetViewToolbar({
        gc_id: 'control-streetview',
        map: map,
        createControlMarkup:customCreateControlMarkup,
        div:document.getElementById("map-toolbar-streetview"),
        divbtns: "map-toolbar-streetview-btn",
        autoActivate:false,
    });
  });

  // **** Result panel button
  window.GCComponents["SideToolbar.Buttons"].addButton (
    'button-streetview',
    'StreetView',
    'icon-street',
    function() {
      if (sidebarPanel.handleEvent || typeof(sidebarPanel.handleEvent) === 'undefined') {
          var ctrl = this.map.getControlsBy('gc_id', 'control-streetview')[0];
          if (ctrl.active) {
            ctrl.deactivate();
            this.deactivate();
          } else {
            ctrl.activate();
            this.activate();
          }
          if (typeof(sidebarPanel.handleEvent) !== 'undefined')
            sidebarPanel.handleEvent = false;
      }
    },
    {button_group: 'alone', tbarpos:'alone'}
 );
});

$.getScript("https://maps.googleapis.com/maps/api/js?key=AIzaSyCqG2a5aKkhA4eGamsp8Y4mrdeEqp8Ez9g", function( data, textStatus, jqxhr ) {
  window.GCComponents["Controls"].addControl('control-streetview', function(map){
    return new OpenLayers.GisClient.streetViewViewer({
        gc_id: 'control-streetview',
        map: map,
        createControlMarkup:customCreateControlMarkup,
        div: document.getElementById("map-toolbar-streetview"),
        autoActivate:false
    });
  });
  window.GCComponents["Controls"].addControl('control-streetview-commander', function(map){
    return new OpenLayers.GisClient.streetViewToolbar({
        gc_id: 'control-streetview-commander',
        map: map,
        createControlMarkup:customCreateControlMarkup,
        div: document.getElementById("map-toolbar-streetview-commander"),
        autoActivate:false
    });
  });

  // **** Result panel button
  window.GCComponents["SideToolbar.Buttons"].addButton (
    'button-streetview',
    'StreetView',
    'glyphicon-white glyphicon-road',
    function() {
      if (sidebarPanel.handleEvent || typeof(sidebarPanel.handleEvent) === 'undefined') {
          var ctrl = this.map.getControlsBy('gc_id', 'control-streetview')[0];
          var commander = this.map.getControlsBy('gc_id', 'control-streetview-commander')[0];
          if (ctrl.active) {
            ctrl.deactivate();
            commander.deactivate();
            this.deactivate();
          } else {
            ctrl.activate();
            commander.activate();
            this.activate();
          }
          if (typeof(sidebarPanel.handleEvent) !== 'undefined')
            sidebarPanel.handleEvent = false;
      }
    },
    {button_group: 'alone', tbarpos:'alone'}
 );
});

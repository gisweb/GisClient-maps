window.GCComponents["Controls"].addControl('control-unredo', function(map){
  var undoredo = new OpenLayers.GisClient.UnRedo({
    gc_id: 'control-unredo',
    map: map,
    createControlMarkup:customCreateControlMarkup,
    autoActivate:false
  });
  map.events.register('moveend', map, function() {
    undoredo.recordZoomAndPosition()
  });
  return undoredo;
});


// **** Result panel button
window.GCComponents["SideToolbar.Buttons"].addButton (
  'button-undo',
  'Annulla',
  'glyphicon-white glyphicon-backward',
  function() {
    if (sidebarPanel.handleEvent || typeof(sidebarPanel.handleEvent) === 'undefined') {
      var ctrl = this.map.getControlsBy('gc_id', 'control-unredo')[0];
      ctrl.undo();
      if (typeof(sidebarPanel.handleEvent) !== 'undefined')
        sidebarPanel.handleEvent = false;
      }
  }
);
window.GCComponents["SideToolbar.Buttons"].addButton (
  'button-redo',
  'Ripeti',
  'glyphicon-white glyphicon-forward',
  function() {
    if (sidebarPanel.handleEvent || typeof(sidebarPanel.handleEvent) === 'undefined') {
      var ctrl = this.map.getControlsBy('gc_id', 'control-unredo')[0];
      ctrl.redo();
      if (typeof(sidebarPanel.handleEvent) !== 'undefined')
        sidebarPanel.handleEvent = false;
      }
  }
);

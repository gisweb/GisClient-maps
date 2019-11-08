//aggiungere qui entità che si occupa di fare undo e redo

OpenLayers.GisClient.UnRedo = OpenLayers.Class(OpenLayers.Control,{
  status: [],
  future: [],
  initialize: function(options) {
    OpenLayers.Control.Panel.prototype.initialize.apply(this, [options]);
    this.status.push({position: this.map.center, zoom: this.map.zoom});
  },
  recordZoomAndPosition: function() {
    OpenLayers.Control.DragPan.prototype.panMapStart.apply(this.map.defaultControl, arguments);
    if(!this.checkInsert(this.map.center, this.map.zoom)) {
      this.status.push({position: this.map.center, zoom: this.map.zoom});
      this.future = [];
    }
  },
  undo: function() {
    if(this.status.length > 1) {
      this.future.push(this.status.pop());
      var current = this.status[this.status.length - 1];
      this.map.setCenter(current.position, current.zoom);
    } else {
      window.alert("Impossibile procedere");
    }
  },
  redo: function() {
    if(this.future.length > 0) {
      this.status.push(this.future.pop());
      var current = this.status[this.status.length - 1];
      this.map.setCenter(current.position, current.zoom);
    } else {
      window.alert("Impossibile procedere");
    }
  },
  checkInsert: function(center, zoom) {
    var len = this.status.length;
    if(len > 0) {
      var curr = this.status[len - 1];
      var diffX = almostEqual(curr.position.lon, center.lon);
      var diffY = almostEqual(curr.position.lat, center.lat);
      return diffX && diffY && curr.zoom === zoom;
    }
    return false;
  }
});

 function almostEqual(a, b, absoluteError, relativeError) {
   var d = Math.abs(a - b)
   if (absoluteError == undefined) absoluteError = FLT_EPSILON;
   if (relativeError == undefined) relativeError = absoluteError;
   if(d <= absoluteError) {
     return true
   }
   if(d <= relativeError * Math.min(Math.abs(a), Math.abs(b))) {
     return true
   }
   return a === b
 }

var FLT_EPSILON = 1.19209290e-7
var DBL_EPSILON = 2.2204460492503131e-16

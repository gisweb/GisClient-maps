var omeminoCtrl = null;
OpenLayers.GisClient.streetViewToolbar = OpenLayers.Class(OpenLayers.Control.Panel,{
  div: null,
  divbtns: null,
  initialize: function(options) {
    OpenLayers.Control.Panel.prototype.initialize.apply(this, [options]);
    omeminoCtrl = new OpenLayers.Control.Button({
        type: OpenLayers.Control.TYPE_TOGGLE,
        active: false,
        iconclass:"glyphicon-white glyphicon-user",
        title:"Puntatore StreetView",
        trigger: function() {
          if(this.active)
            this.deactivate();
          else
            this.activate();
        },
        activate: function() {
          OpenLayers.Control.Button.prototype.activate.call(this);
          GisClientMap.map.events.register("mousemove", GisClientMap.map, displayCursor);
          GisClientMap.map.events.register("mouseout", GisClientMap.map, hideCursor);
          GisClientMap.map.currentControl.deactivate();
          GisClientMap.map.currentControl = omeminoCtrl;
          click.activate();
          this.active = true;
        },
        deactivate: function() {
          OpenLayers.Control.Button.prototype.deactivate.call(this);
          hideCursor();
          GisClientMap.map.events.unregister("mousemove", GisClientMap.map, displayCursor);
          GisClientMap.map.events.unregister("mouseout", GisClientMap.map, hideCursor);
          //per fare quanto segue deve esserci un controller di default e soprattutto un currentControl già assegnato
          if(GisClientMap.map.defaultControl !== undefined && GisClientMap.map.currentControl !== undefined && GisClientMap.map.currentControl != GisClientMap.map.defaultControl) {
            GisClientMap.map.currentControl = GisClientMap.map.defaultControl;
            GisClientMap.map.currentControl.activate();
            GisClientMap.map.currentControl.active = true;
            click.deactivate();
          }
          this.active = false;
        }
      });
    this.addControls([omeminoCtrl]);
  },
  draw: function() {
    OpenLayers.Control.Panel.prototype.draw.apply(this);
    return this.div
  },
  redraw: function() {
    OpenLayers.Control.Panel.prototype.redraw.apply(this);
  },
  activate: function() {
    activated = OpenLayers.Control.prototype.activate.call(this);
    omeminoCtrl.activate();
    this.redraw();
  },
  deactivate: function() {
    OpenLayers.Control.prototype.deactivate.call(this);
    omeminoCtrl.deactivate();
    this.redraw();
  }
});

function displayCursor(e) {
  OpenLayers.Util.getElement("tooltip").innerHTML = "<img src=\"../../resources/img/omemino_fly.png\" alt=\"puntatore\" width=\"25px\" height=\"25px\">";
  $("#tooltip").css({position:"absolute", left:e.x+10,top:e.y});
}

function hideCursor(e) {
  OpenLayers.Util.getElement("tooltip").innerHTML = "";
  $("#tooltip").css({});
}

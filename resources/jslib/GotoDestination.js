var gotoCtrl, findoCtrl;

OpenLayers.GisClient.ChoordsCapturer = OpenLayers.Class(OpenLayers.Control, {
  timeoutHandler: null,
  defaultHandlerOptions: {
    'single': true,
    'double': false,
    'pixelTolerance': 0,
    'stopSingle': false,
    'stopDouble': false
  },

  initialize: function(options) {
    this.handlerOptions = OpenLayers.Util.extend({}, this.defaultHandlerOptions);
    OpenLayers.Control.prototype.initialize.apply(this, arguments);
    this.handler = new OpenLayers.Handler.Click( this, {'click': this.trigger}, this.handlerOptions);
  },

  trigger: function(e) {
    if(this.timeoutHandler != null)
      clearTimeout(this.timeoutHandler);
    var currLonLat = this.map.getLonLatFromPixel(e.xy);
    var lonlat = currLonLat.transform(this.map.projection, $("#projectionGoto").val());
    $('#latitudeInput').val(lonlat.lat);
    $('#longitudeInput').val(lonlat.lon);
    OpenLayers.Util.getElement("treeMarker").innerHTML = "<img src=\"../../resources/img/tree_marker.png\" alt=\"albero\" width=\"24px\" height=\"24px\">";
    $("#treeMarker").css({position:"absolute", left:(e.x - 12),top:(e.y - 24), display: ""});
    this.timeoutHandler = setTimeout(function(){ $("#treeMarker").css({display: "none"}); }, 5000)
  }
});

var capturer = new OpenLayers.GisClient.ChoordsCapturer();


OpenLayers.GisClient.gotoDestinationPanel = OpenLayers.Class(OpenLayers.Control.Panel,{
  div: null,
  divOpts:null,
  expectedChoords: clientConfig.GOTO_DEFAULT_EPSG,
  initialize: function(options) {
    OpenLayers.Control.Panel.prototype.initialize.apply(this, [options]);
    gotoCtrl = new OpenLayers.Control.Button({
        type: OpenLayers.Control.TYPE_BUTTON,
        iconclass:"glyphicon-white glyphicon-map-marker",
        title:"Vai a destinazione",
        trigger: function() {
          if($('.choordGoto').filter(function() { return $(this).val() != ""; }).size() != $('.choordGoto').size())
            window.alert("Specificare entrambi i campi");
          else {
            //window.alert();
            var lonLat = new OpenLayers.LonLat($('#longitudeInput').val(), $('#latitudeInput').val());
            var srid = $("#projectionGoto").val();
            if (this.map.projection != srid)
              lonLat.transform(srid, this.map.projection);
            if(!this.map.isValidLonLat(lonLat)){
              window.alert('Posizione non valida: X ' +lonLat.lon+', Y '+lonLat.lat+', SRID ' + srid);
            } else if(!this.map.getMaxExtent().containsLonLat(lonLat)){
              window.alert('Posizione fuori extent: X ' +lonLat.lon+', Y '+lonLat.lat+', SRID ' + srid);
            } else {
              this.map.setCenter(lonLat, this.map.getNumZoomLevels() - 1);
            }
          }
        }
    });
    findoCtrl = new OpenLayers.Control.Button({
        type: OpenLayers.Control.TYPE_BUTTON,
        iconclass:"glyphicon-white glyphicon-tree-conifer",
        title:"Recupera coordinata",
        trigger: function() {
          if(this.active)
            this.deactivate();
          else
            this.activate();
        },
        activate: function() {
          OpenLayers.Control.Button.prototype.activate.call(this);
          this.map.events.register("mousemove", this.map, displayPointer);
          this.map.events.register("mouseout", this.map, hidePointer);
          this.map.currentControl.deactivate();
          this.map.currentControl = findoCtrl;
          //recuperare click
          this.map.addControl(capturer);
          capturer.activate();
          $("[class^='choordGoto']").val("");
          $("[class^='choordGoto']").attr('disabled', true);
          this.active = true;
        },
        deactivate: function() {
          OpenLayers.Control.Button.prototype.deactivate.call(this);
          //hideCursor();
          this.map.events.unregister("mousemove", this.map, displayPointer);
          this.map.events.unregister("mouseout", this.map, hidePointer);
          //per fare quanto segue deve esserci un controller di default e soprattutto un currentControl già assegnato
          if(this.map.defaultControl !== undefined && this.map.currentControl !== undefined && this.map.currentControl != this.map.defaultControl) {
            this.map.currentControl = this.map.defaultControl;
            this.map.currentControl.activate();
            this.map.currentControl.active = true;
            //recuperare click
            capturer.deactivate();
            this.map.removeControl(capturer);
          }
          $("[class^='choordGoto']").attr('disabled', false);
          $("[class^='choordGoto']").val("");
          this.active = false;
        }
    });
    this.addControls([findoCtrl, gotoCtrl]);
  },
  draw: function(){
    //OpenLayers.Control.Panel.prototype.draw.apply(this);
    var mainDiv = this.divOpts;
    //sposta SU DRAW
    var style = (this.active) ? "" : "style='display: none;'"
    var tempHtml = "<div class='gotoPanelLabel' "+style+">X (Longitudine)</div>"
      + "<div class='gotoPanelElement' "+style+"><input type=\"text\" class=\"choordGoto\" id=\"longitudeInput\"></div>"
      + "<div class='gotoPanelElement' "+style+"><select id=\"projectionGoto\">";
    if(this.expectedChoords.indexOf(this.map.projection) === -1) this.expectedChoords.push(this.map.projection);
    this.expectedChoords.forEach(function(item, index) {
      tempHtml += "<option value='"+item+"'>"+item+"</option>";
    });
    tempHtml += "</select></div><div "+style+" class=\"gotoPanelSeparator\"></div>"
      + "<div class='gotoPanelLabel' "+style+">Y (Latitudine)</div>"
      + "<div class='gotoPanelElement' "+style+"><input type=\"text\" class=\"choordGoto\" id=\"latitudeInput\"></div><div "+style+" class=\"gotoPanelSeparator\"></div>";
    mainDiv.innerHTML += tempHtml;
    OpenLayers.Control.Panel.prototype.draw.apply(this);
    this.events.triggerEvent("initialized", this);
    $('#projectionGoto').focusin(function(){
      $(this).data('prev', $(this).val());
    });
    $('#projectionGoto').change(function() {
      var prev = $(this).data('prev');
      var current = $(this).val();
      $(this).data('prev', current);
      if(prev != current && $('#latitudeInput').val()!="" && $('#longitudeInput').val()!="") {
        var lonlat = new OpenLayers.LonLat($('#longitudeInput').val(),$('#latitudeInput').val()).transform(prev, current);
        $('#latitudeInput').val(lonlat.lat);
        $('#longitudeInput').val(lonlat.lon);
      }
    });
    return this.div;

  },
  redraw: function() {
    OpenLayers.Control.Panel.prototype.redraw.apply(this);
    this.div.appendChild(this.divOpts);
    $('[class^="gotoPanel"]').css("display",this.active ? "" : "none");
  },
  activate: function() {
    OpenLayers.Control.prototype.activate.call(this);
    findoCtrl.activate();
    this.redraw();
    return true;
  },
  deactivate: function() {
    OpenLayers.Control.prototype.deactivate.call(this);
    findoCtrl.deactivate();
    this.redraw();
    return true;
  }
});

function displayPointer(e) {
  OpenLayers.Util.getElement("tooltip").innerHTML = "<img src=\"../../resources/img/tree_marker.png\" alt=\"albero\" width=\"24px\" height=\"24px\">";
  $("#tooltip").css({position:"absolute", left:e.x+10,top:e.y});
}

function hidePointer(e) {
  OpenLayers.Util.getElement("tooltip").innerHTML = "";
  $("#tooltip").css({});
}

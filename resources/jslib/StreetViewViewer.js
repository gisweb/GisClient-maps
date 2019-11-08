var yOffset = 1;
var currentRotation = 0;
var currentPosition;
var markerLayer = new OpenLayers.Layer.Vector("Navigatore");
var pointerLayer = new OpenLayers.Layer.Vector("Pointer");
var marker;
var pointer;
var streetview;
var streetviewService;
var currentMarkerStyle = {
    externalGraphic: '../../resources/img/omemino.png',
    pointRadius: 22,
    graphicZIndex: 10
};
var currentMarkerPointerLineStyle ={
    externalGraphic: '../../resources/img/pointer.png',
    pointRadius: 26,
    rotation: 0,
    display: "",
    graphicZIndex: 1
};
var projection;

OpenLayers.GisClient.Click = OpenLayers.Class(OpenLayers.Control, {
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
    var currLonLat = this.map.getLonLatFromPixel(e.xy);
    var lonlat = currLonLat.transform(this.map.projection, 'EPSG:4326');
    var theloc = new google.maps.LatLng(lonlat.lat,lonlat.lon);
    streetviewService.getPanorama({location: theloc},(theloc.lng() == 8.534108 && theloc.lat() == 44.536001) ?
      function(result, status) {
        streetview.setPano('eggZio');
      } : function(result, status){
        if (status === 'ZERO_RESULTS') {
          streetview.setPano('noview');
        }
      }
    );
    streetview.setPosition(theloc);
  }
});

var click = new OpenLayers.GisClient.Click();

OpenLayers.GisClient.streetViewViewer = OpenLayers.Class(OpenLayers.Control.Panel,{
  div: null,
  map: null,
  online: false,
  initialize: function(options) {
    OpenLayers.Control.Panel.prototype.initialize.apply(this, [options]);
    currentPosition = new OpenLayers.LonLat(0,0);
    projection = this.map.projection;
    pointer = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(currentPosition.lon, currentPosition.lat + yOffset), null, currentMarkerPointerLineStyle);
    pointer.move(new OpenLayers.Geometry.Point(currentPosition.lon, currentPosition.lat));
    pointerLayer.addFeatures([pointer]);
    pointerLayer.setVisibility(false);
    marker = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(currentPosition.lon, currentPosition.lat + yOffset), null, currentMarkerStyle);
    markerLayer.addFeatures([marker]);
    markerLayer.setVisibility(false);
    this.map.addLayers([pointerLayer, markerLayer]);

    if(typeof(google) == "undefined") {
      for(var provider in this.map.mapProviders) {
        if(provider.include("maps.googleapis.com")) {
          return;
        }
      }
      var self = this
      $.get(GisClientMap.baseUrl + "/services/clientConfig.php", { variable: "GMAPURL"},
        function(returnedData){
        if(returnedData != "") {
          $.getScript(returnedData, function( data, textStatus, jqxhr ) {
            self.initStreetView();
            this.online = true;
          });
        }
      });
    } else {
      this.initStreetView();
    }
  },
  initStreetView: function() {
    streetviewService = new google.maps.StreetViewService;
    streetview = new google.maps.StreetViewPanorama(this.div, {
      pov: {heading:0, pitch:10},
      map: this.map
    });
    streetview.registerPanoProvider(this.getGeoWebProvider);
    streetview.addListener('position_changed', this.manageMarker);
    streetview.addListener('pov_changed', this.manageMarker);
    this.online = true;
  },
  draw: function() {
    OpenLayers.Control.Panel.prototype.draw.apply(this);
  },
  activate: function() {
    if(!this.online) {
      window.alert("Funzione StreetView non disponibile. Google Maps non accessibile.");
      return false;
    } else {
      var activated = OpenLayers.Control.prototype.activate.call(this);
      if(activated) {
        markerLayer.setVisibility(true);
        pointerLayer.setVisibility(true);
        this.map.addControl(click);
        click.activate();
        $("#"+ this.div.id).addClass("openedStreetView");//="width: 250px; height: 250px;"
        google.maps.event.trigger(streetview, 'resize');
        return true;
      }
    }
  },
  deactivate: function() {
    if(!this.online) {
      window.alert("Funzione StreetView non disponibile. Google Maps non accessibile.");
      return false;
    } else {
      var deactivated = OpenLayers.Control.prototype.deactivate.call(this);
      if(deactivated) {
        markerLayer.setVisibility(false);
        pointerLayer.setVisibility(false);
        click.deactivate();
        this.map.removeControl(click);
        $("#"+ this.div.id).removeClass("openedStreetView");
        return true;
     }
   }
  },
  getGeoWebProvider: function(pano) {
    if (pano === 'eggZio') {
      marker.style["externalGraphic"] = '../../resources/img/pericolo.png';
      markerLayer.redraw();
      return {
        location: {
          pano: 'eggZio',
          description: 'La tana dello zio - Easter Egg',
          latLng: new google.maps.LatLng(44.536001, 8.534108),
        },
        links: [],
        copyright: 'ZioSim (c) 2018 Iren',
        tiles: {
          tileSize: new google.maps.Size(500, 500),
          worldSize: new google.maps.Size(500, 500),
          getTileUrl: getEggZioPanoramaTileUrl
        },
        sensor: false
      };
    } else if(pano === 'noview') {
      marker.style["externalGraphic"] = '../../resources/img/notfound.png';
      markerLayer.redraw();
      return {
        location: {
          pano: 'noview',
          description: 'Immagine non disponibile',
          latLng: streetview.getPosition()
        },
        links: [],
        tiles: {
          tileSize: new google.maps.Size(500, 500),
          worldSize: new google.maps.Size(500, 500),
          getTileUrl: getNoViewPanoramaTileUrl
        }
      };
    }
    marker.style["externalGraphic"] = '../../resources/img/omemino.png';
    markerLayer.redraw();
    return null;
  },
  manageMarker: function() {
    var currLonLat = streetview.getPosition();
    var angle = streetview.getPov().heading;
    var lonLatPointer = new OpenLayers.LonLat(currLonLat.lng(),currLonLat.lat()).transform('EPSG:4326', projection);
    if(!this.map.getExtent().containsLonLat(lonLatPointer))
      this.map.setCenter(lonLatPointer);
    if(lonLatPointer.lat != currentPosition.lat || currentPosition.lon != lonLatPointer.lon) {
      var lonLatFeature = new OpenLayers.LonLat(currLonLat.lng(),currLonLat.lat()).transform('EPSG:4326', projection);
      lonLatFeature.lat += yOffset;
      pointer.move(lonLatPointer);
      marker.move(lonLatFeature);
      currentPosition = lonLatPointer;
    }
    pointer.style.rotation = angle;
    markerLayer.redraw();
    pointerLayer.redraw();
  },
  zoomEnd: function(passedZoom) {
    if(this.active) {
      pointer.style.display = "";
      pointerLayer.redraw();
    }
  }
});

function getEggZioPanoramaTileUrl(pano, zoom, tileX, tileY) {
  return "../../resources/img/easter.png";
}

function getNoViewPanoramaTileUrl(pano, zoom, tileX, tileY) {
  return "";
}

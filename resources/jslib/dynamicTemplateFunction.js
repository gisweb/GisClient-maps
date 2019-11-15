var GisClientMap;
var GisClientBaseUrl = clientConfig.GISCLIENT_URL + "/";

OpenLayers.ImgPath = "../../resources/themes/openlayers/img/";

var customCreateControlMarkup = function(control) {
  var button = document.createElement('a'),
    icon = document.createElement('span'),
    textSpan = document.createElement('span');
  if(control.tbarpos) button.className += control.tbarpos;
  if(control.iconclass) icon.className += control.iconclass;
  button.appendChild(icon);
  if (control.text)  textSpan.innerHTML = control.text;
  button.appendChild(textSpan);
  return button;
};

function setZoomAndScales(self) {
  //ELENCO DELLE SCALE
  var zoomLevel = 0;
  //lo zoomLevel non parte da minZoomLevel ma sempre da 0, quindi lo zoomLevel 0 è sempre = al minZoomLevel
  for(var i=0; i<self.mapOptions.resolutions.length; i++){
    var scale = OpenLayers.Util.getScaleFromResolution (self.mapOptions.resolutions[i], self.mapOptions.units);
    var option = $("<option></option>");
    option.val(zoomLevel);
    zoomLevel += 1;
    scale = scale<1001 ? Math.round(scale/10)*10 : Math.round(scale/1000)*1000;
    option.text('Scala 1:'+ scale);
    $('#map-select-scale').append(option);
  }
  $('#map-select-scale').val(self.map.getZoom());
  $('#map-select-scale').change(function(){
    self.map.zoomTo(this.value);
  });
  self.map.events.register('zoomend', null, function(){
    $('#map-select-scale').val(self.map.getZoom());
    self.map.controls.forEach(function(b) {
      if(b.gc_id != undefined) {
        if(b.zoomEnd != undefined)
        b.zoomEnd(self.map.getZoom());
      }
    });
  });
}

function manageLoginLogout() {
  $('#mapset-title').html(GisClientMap.title);
  if(!GisClientMap.logged_username) {
    $('#mapset-login').html("<a action='login' href='#'>Accedi</a>");
    $('#LoginWindow #LoginButton').on('click',function(e){
      e.preventDefault();
      $.ajax({
        url: GisClientBaseUrl + 'login.php',
        type: 'POST',
        dataType: 'json',
        data: {
          username: $('#LoginWindow input[name="username"]').val(),
          password: md5($('#LoginWindow input[name="password"]').val())
        },
        success: function(response) {
          if(response && typeof(response) == 'object' && response.result == 'ok')
            window.location.reload();
          else
            alert('Username e/o password errati');
        },
        failure: function() {
          alert('Errore di sistema');
        }
      });
    });
    $('#LoginWindow .close').on('click',function(e){
      e.preventDefault();
      $('#LoginWindow input[name="username"]').val("");
      $('#LoginWindow input[name="password"]').val("");
    });
  } else
    $('#mapset-login').html(GisClientMap.logged_username+', <a href="'+GisClientBaseUrl+'logout.php'+location.search+'" data-ajax="false" action="logout">Logout</a>');
  $('#mapset-login a[action="login"]').on('click',function(event){
    event.preventDefault();
    $('#LoginWindow').modal('show');
  });
}

function manageMapsets(){
  var options = [];
  for(var i = 0; i < GisClientMap.mapsets.length; i++) {
    var mapset = GisClientMap.mapsets[i];
    var option = '<option value="'+mapset.mapset_name+'"';
    if(mapset.mapset_name == GisClientMap.mapsetName)
      option += ' selected ';
    option += '>'+mapset.mapset_title+'</option>';
    options.push(option);
  }
  $('#mapset-switcher select').html(options);
  $('#mapset-switcher select').change(function() {
    var mapset = $(this).val();
    if(mapset == GisClientMap.mapsetName) return;
    var mapCenter = GisClientMap.map.getExtent().getCenterLonLat();
    if (clientConfig.MAPSET_EXTENT_STICKY === true) {
        if (storageAvailable('localStorage')) {
            localStorage.setItem('gcMapsetX', mapCenter.lon);
            localStorage.setItem('gcMapsetY', mapCenter.lat);
            localStorage.setItem('gcMapsetSRID', GisClientMap.map.getProjection());
            localStorage.setItem('gcMapsetZoom', GisClientMap.map.getScale());
        }
    }
    var newUrl = (window.location.href).replace('mapset='+GisClientMap.mapsetName, 'mapset='+mapset);
    window.location.href = newUrl;
  });
}

function createLayerLegend() {
  var layerLegend = new OpenLayers.Control.LayerLegend({
    div: OpenLayers.Util.getElement('layerlegend'),
    gc_id: 'control-legend',
    autoLoad: false
  });
  $('a[href="#layerlegend"]').click(function() {
    if(!layerLegend.loaded)
      layerLegend.load();
  });
  return layerLegend;
}

function centerMapset() {
    if (storageAvailable('localStorage')) {
        var xCoord = localStorage.getItem('gcMapsetX');
        if (typeof(xCoord) === 'undefined' || xCoord === null)
            return;
        var yCoord = localStorage.getItem('gcMapsetY');
        if (typeof(yCoord) === 'undefined' || yCoord === null)
            return;
        var srid = localStorage.getItem('gcMapsetSRID');
        if (typeof(srid) === 'undefined' || srid === null)
            return;
        var zoom = localStorage.getItem('gcMapsetZoom');
        if (typeof(zoom) === 'undefined' || zoom === null)
            return;

        var lonLat = new OpenLayers.LonLat(xCoord, yCoord);
        var GCMap = GisClientMap.map;
        var retValue = {result: 'ok'};
        if (srid != GCMap.projection) {
            lonLat.transform(srid, GCMap.projection);
        }
        if(!GCMap.isValidLonLat(lonLat)){
            retValue.result = 'error';
            retValue.message = 'Posizione non valida: X ' +lonLat.lon+', Y '+lonLat.lat+', SRID ' + srid;
            alert(retValue.message);
            return retValue;
        }
        if(!GCMap.getMaxExtent().containsLonLat(lonLat)){
            retValue.result = 'error';
            retValue.message = 'Posizione fuori extent: X ' +lonLat.lon+', Y '+lonLat.lat+', SRID ' + srid;
            alert(retValue.message);
            return retValue;
        }
        GCMap.setCenter(lonLat);
        GCMap.zoomToScale(zoom, true);

        localStorage.removeItem('gcMapsetX');
        localStorage.removeItem('gcMapsetY');
        localStorage.removeItem('gcMapsetSRID');
        localStorage.removeItem('gcMapsetZoom');

        return retValue;
    }
}

function storageAvailable(type) {
    try {
        var storage = window[type],
            x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch(e) {
        return e instanceof DOMException && (
            // everything except Firefox
            e.code === 22 ||
            // Firefox
            e.code === 1014 ||
            // test name field too, because code might not be present
            // everything except Firefox
            e.name === 'QuotaExceededError' ||
            // Firefox
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            // acknowledge QuotaExceededError only if there's something already stored
            storage.length !== 0;
    }
}

serializePostData = function(obj) {
  var str = [];
  for (var p in obj)
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
  return str.join("&");
}

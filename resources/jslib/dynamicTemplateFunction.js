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
    var newUrl = (window.location.href).replace('mapset='+GisClientMap.mapsetName, 'mapset='+mapset);
    window.location.href = newUrl;
  });
}

function createLayerLegend() {
  var layerLegend = new OpenLayers.Control.LayerLegend({
     div: OpenLayers.Util.getElement('layerlegend'),
    autoLoad: false
  });
  $('a[href="#layerlegend"]').click(function() {
    if(!layerLegend.loaded)
      layerLegend.load();
  });
  return layerLegend;
}

(function ($) {

  "use strict";

  $(function () {

 function addMapLayers() {





  }

    function addMapLayers() {

      var layerOptions, layer, layers = {};




  //Sposto i livelli nel menù della mappa
  var me = this;
  var container = document.createElement("div");
  var layerMenu = document.getElementById("layerbox");
  container.appendChild(document.getElementById("layerContainer"));

  container.onmouseover = function() {
   if (me.timer) clearTimeout(me.timer);
    layerMenu.style.display = "block";
  };

  container.onmouseout = function() {
   me.timer = setTimeout(function() {
   layerMenu.style.display = "none";
   }, 300);
  };





      //OVERLAYS
      $("input[name='layers']").each(function(_,element){
        var layerName = $(element).data("layerName");
        var layerType = $(element).data("layerType");
        var layerOpacity = $(element).data("layerOpacity");
        if(layerOpacity) layerOpacity = layerOpacity/100;

        if(layerName){
          layerOptions = {
            tileSize: new google.maps.Size(256, 256),
            isPng: true,
            opacity: layerOpacity || 1,
            name: layerName,
            getTileUrl: getTileUrl(layerName,layerType)
          }
          layer = new google.maps.ImageMapType(layerOptions);
          layers[layerName] = layer;
          if($(element).data("layerOn")==1){
            $(element).attr("checked","checked")
            map.overlayMapTypes.setAt(map.overlayMapTypes.length, layer);
          }
        }

      });

      //LAYER DI SFONDO FISSI
      layerOptions = {
        tileSize: new google.maps.Size(256, 256),
        isPng: true,
        name: "OSM",
        maxZoom: 19,
        minZoom: 0,
        getTileUrl: function(coord, zoom) {
            return "http://tile.openstreetmap.org/" +
            zoom + "/" + coord.x + "/" + coord.y + ".png";
        }
      }
      var osmMapType = new google.maps.ImageMapType(layerOptions);
      map.mapTypes.set("OSM", osmMapType); //AGGINGO E LO SETTO DI DEFAULT
      var mapTypeIds = ["OSM",google.maps.MapTypeId.ROADMAP,google.maps.MapTypeId.TERRAIN,google.maps.MapTypeId.SATELLITE,google.maps.MapTypeId.HYBRID];

      //Ortofoto
      layerOptions = {
        tileSize: new google.maps.Size(256, 256),
        isPng: false,
        name: "ORTOFOTO",
        maxZoom: 19,
        minZoom: 0,
        getTileUrl: getTileUrl("grp_agea","WMTS")
      }
      layerOptions.isPng = false;
      var ortofotoMapType = new google.maps.ImageMapType(layerOptions);
      map.mapTypes.set("ORTOFOTO", ortofotoMapType); //AGGINGO E LO SETTO DI DEFAULT
      var mapTypeIds = ["ORTOFOTO","OSM",google.maps.MapTypeId.ROADMAP,google.maps.MapTypeId.TERRAIN,google.maps.MapTypeId.SATELLITE,google.maps.MapTypeId.HYBRID];
      map.setMapTypeId(google.maps.MapTypeId.ROADMAP);

      map.setOptions({"mapTypeControlOptions": {
        "mapTypeIds": mapTypeIds,
        "style": google.maps.MapTypeControlStyle.DROPDOWN_MENU
      }});


  //LAYERS
  $("input[name='layers']").bind("click",toggleLayer);

        //AGGIUNGE IN MAPPA IL BOTTONE DEI LAYERS
  map.controls[google.maps.ControlPosition.TOP_RIGHT].push(container);
    }



    //CALCOLA LA URL PER I TILE A SECONDA DEL TIPO DI LIVELLO WMS O WMTS (TILES IN CACHE)
    function getTileUrl (layerName,layerType){
      var fn;
      if(layerType == "WMS"){

          fn = function(tile, zoom) {
              var projection = map.getProjection();
              var zpow = Math.pow(2, zoom);
              var ul = new google.maps.Point(tile.x * 256.0 / zpow, (tile.y + 1) * 256.0 / zpow);
              var lr = new google.maps.Point((tile.x + 1) * 256.0 / zpow, (tile.y) * 256.0 / zpow);
              var ulw = projection.fromPointToLatLng(ul);
              var lrw = projection.fromPointToLatLng(lr);
              var bbox = ulw.lng() + "," + ulw.lat() + "," + lrw.lng() + "," + lrw.lat();
              return owsBaseURL +  "/service?LAYERS=" + layerName  + "&SERVICE=WMS&TRANSPARENT=TRUE&VERSION=1.1.1&EXCEPTIONS=XML&REQUEST=GetMap&STYLES=default&FORMAT=image%2Fpng&SRS=EPSG:4326&BBOX=" + bbox + "&width=256&height=256";
          }
      }
      else if(layerType == "WMTS"){
          fn = function (coord, zoom) {
              return owsBaseURL + "/wmts/" + layerName + "/" + tileGridName + "/" + zoom + "/" + coord.x + "/" + coord.y + ".png";
          };
      }
      return fn
    }

    //ACCENDE E SPEGNE I LIVELLI DA CHECKBOX
    function toggleLayer (){
      var layer;
      layerName = $(this).data("layerName");
      layer = mapOverlays[layerName]
      if(!layer) return;

      if ($(this).is(':checked')) {
          map.overlayMapTypes.setAt(map.overlayMapTypes.length, layer);
      } else {
          map.overlayMapTypes.forEach(function(element,index){
              if(element && element.name == layerName){
                  map.overlayMapTypes.removeAt(index);
              }
          });
      }
    }

  if (!google.maps.AddMapLayers) {
       google.maps.MapLayers = {addMapLayers:addMapLayers};

  }

  console.log(google.maps)



});

})(jQuery);



       
(function ($) {

  "use strict";
  
  $(function () {

    //PER LE PROVE E LA CACHE DI FIREFOX
    $('input').val('');

    var serviceURL = "./services/serviceInfo.json";
    var gisclientUrl = "/gisclient/services/ows.php?MAP=cariplo";
    var owsBaseURL ="http://sit.gisweb.it/ows/cariplo";
    var iconPath = "images";
    var tileGridName = "epsg3857";
    var delayOnRequest = 1;
    var markerDraggable = true;
    var drawingShapes = [];

    var $element, $buttonElement, $txtIndirizzo;
    //DEFINIZIONE DEL SISTEMA PROIETTIVO PER IL RICALCOLO DELLE COORDINATE
    Proj4js.defs["EPSG:3004"] = "+proj=tmerc +lat_0=0 +lon_0=15 +k=0.9996 +x_0=2520000 +y_0=0 +ellps=intl +units=m +no_defs +towgs84=-104.1,-49.1,-9.9,0.971,-2.917,0.714,-11.68"
    var projSource = new Proj4js.Proj("EPSG:4326"); 
    var projDest = new Proj4js.Proj("EPSG:3004"); 



    //OPZIONI DELLA MAPPA DI GOOGLE SETTATE QUI A MENO CHE NON VOGLIATE CREARE UN PANNELLO DI CONFIGURAZIONE 
    //SULL'APPLICAZIONE. IN QUESTO CASO LE IMPOSTAZIONI DELLA MAPPA POTREBBERO ESSERE MEMORIZZATE SU HTML5 ATTRIBUTES
    var mapOptions = {
      center: new google.maps.LatLng(45.2,9.8),
      zoom: 8
    };
    var map = new google.maps.Map($("#gmap").get(0),mapOptions);
    google.maps.event.addListener(map, 'mousemove', onMouseMove);


    //MARKER USATE PER INDIVIDUARE LA POSIZIONE DELLA SEGNALAZIONE
    //SETTARE LE OPZIONI DA QUALCHE CONFIGURAZIONE
    var infowindow = new google.maps.InfoWindow({maxWidth:400});
    var marker = new google.maps.Marker({
      draggable:true,
      map: map,
      anchorPoint: new google.maps.Point(0, -29)
    });

    $txtIndirizzo = $("#indirizzo");
    var gMapAutocomplete = new google.maps.places.Autocomplete($txtIndirizzo.get(0));
    gMapAutocomplete.bindTo('bounds', map);
    google.maps.event.addListener(gMapAutocomplete, 'place_changed', function() {
      
      infowindow.close();
      marker.setVisible(false);
      var place = gMapAutocomplete.getPlace();
      if (!place.geometry) {
        return;
      }

      if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
      } else {
        map.setCenter(place.geometry.location);
        map.setZoom(17);  
      }

      marker.setIcon({
        url: place.icon,
        size: new google.maps.Size(71, 71),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(35, 35)
      });
      marker.setPosition(place.geometry.location);
      marker.setVisible(true);
      updateCoordinates(place.geometry.location.lat(),place.geometry.location.lng());

    });


    google.maps.event.addListener(marker, 'drag', function(e) {
        updateCoordinates(e.latLng.lat(),e.latLng.lng());
    });

    //AGGIUNTO UN DELAY PER EVITARE CHIAMATE INUTILI
    //QUESTA CHIAMATA PERMETTE DI RICERCARE INFORMAZIONI UTILI DATA LA POSIZIONE (DISABILITATA)
    google.maps.event.addListener(marker, 'dragend', function(e) {

      setTimeout(function() {
        //updatePositionInfo(e.latLng.lat(),e.latLng.lng());
      }, delayOnRequest);

    });

    google.maps.event.addListener(map, 'zoom_changed', function(e) {
        $("[name='form.widgets.zoom_scheda']").val(map.getZoom());
    });



    addDrawingManager();



   
    var updateCoordinates = function(lat,lng){
        //RIPROIEZIONE ????????????

        //var p = new Proj4js.Point(lng,lat);  
        //Proj4js.transform(projSource, projDest, p);
        $("[name='form.widgets.lat_scheda']").val(lat);
        $("[name='form.widgets.lon_scheda']").val(lng);


    }



    var updatePositionInfo = function(lat,lng){

      //AGGIUNGERE UNA IMAGE LOADING IN WAITING!!!!!!!!!!!!!!!!!!
      $.ajax({
        url: serviceURL,
        data:{"request":"infoposizione","lat":lat, "lng":lng},
        dataType: "jsonp",
        jsonpCallback: "callback",
        async: false,
        success: function( response ) {

          if(response.success){
            for(key in response.results){
              $("[data-bind$=':" + key + "']").val(response.results[key]);
            }
            var position = new google.maps.LatLng(response.results.Lat,response.results.Lng);
            marker.setPosition(position);

          }
        }

      })

    }



    var updateMarkerPosition = function(){

      var position = new google.maps.LatLng($(this).data("lat"),$(this).data("lng"));
      marker.setPosition(position);
      marker.setVisible(true);
      map.setCenter(position)
      updateCoordinates($(this).data("lat"),$(this).data("lng"));
      updatePositionInfo($(this).data("lat"),$(this).data("lng"));

    }

  $("button.icon-marker").bind("click",updateMarkerPosition);

  //LAYERS
  var mapOverlays = addMapLayers();
  $("input[name='layers']").bind("click",toggleLayer);

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
 
  //AGGINGE IN MAPPA IL BOTTONE DEI LAYERS
  map.controls[google.maps.ControlPosition.TOP_RIGHT].push(container); 
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(document.getElementById("indirizzo"));
/*
  var outer = document.createElement("div");
  outer.style.width = "60px";

  var inner = document.createElement("div");
  inner.id = "more_inner";
  inner.className = "button";
  inner.title ="Crea immagine per la stampa";
  var text = document.createElement("div");
  text.id = "clicktarget";
  //text.appendChild(); 
  //inner.appendChild(text);
  //outer.appendChild(document.getElementById("pac-input"));

  // Take care of the clicked target
  inner.onclick = function(){mapImage({"segnalazione":1,"layers":'osm.osm-wms,grp_particelle,grp_fabbricati',"width":800,"height":600,"lat":43.598295 ,"lng":13.514557,"scale":866666})};
  //inner.onclick = function(){mapImage({layers:'osm.osm-wms',width:800,height:600,xc:2371336,yc:4765551,scale:1692})};

  map.controls[google.maps.ControlPosition.TOP_RIGHT].push(outer); 
*/
    function addMapLayers() {

      var layerOptions, layer, layers = {};

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

      return layers;

    }



    //AGGIUNGE LE FUNZIONALITÀ DI DISEGNO
    function addDrawingManager(){

      var drawingManager;
      var selectedShape;
      var colors = ['#1E90FF', '#FF1493', '#32CD32', '#FF8C00', '#4B0082'];
      var selectedColor;
      var colorButtons = {};
      var pointSize = 4;
      var selectedPointSize = 8;

      function setSelection(shape) {
        clearSelection();
        selectedShape = shape;
        if(selectedShape.getIcon){
          var symbol = selectedShape.getIcon();
          //symbol.scale =  selectedPointSize;
          selectedShape.setIcon(symbol);
          selectColor(symbol.strokeColor);
          selectedShape.setDraggable(true);
        } 
        else{
          selectedShape.setEditable(true);
          selectColor(shape.get('fillColor') || shape.get('strokeColor'));
        }
      }

      function clearSelection() {
        if (selectedShape) {
          if(selectedShape.getIcon){
            var symbol = selectedShape.getIcon();
            //symbol.scale =  pointSize;
            selectedShape.setIcon(symbol);
            selectedShape.setDraggable(false);
          }
          else
            selectedShape.setEditable(false);
          selectedShape = null;
        }
      }

      function deleteSelectedShape() {
        if (selectedShape) {
          selectedShape.setMap(null);
          for (var i=0;i<drawingShapes.length;i++){
            if(drawingShapes[i].overlay == selectedShape){
              drawingShapes.splice(i,1);
            }
          }
        }
      }

      function selectColor(color) {
        selectedColor = color;
        for (var i = 0; i < colors.length; ++i) {
          var currColor = colors[i];
          colorButtons[currColor].style.border = currColor == color ? '2px solid #789' : '2px solid #fff';
        }

        if(!drawingManager.drawingMode) return
        var markerOptions = drawingManager.get('markerOptions');
        markerOptions.icon.strokeColor = color;
        drawingManager.set('markerOptions', markerOptions);

        var polylineOptions = drawingManager.get('polylineOptions');
        polylineOptions.strokeColor = color;
        drawingManager.set('polylineOptions', polylineOptions);

        var rectangleOptions = drawingManager.get('rectangleOptions');
        rectangleOptions.fillColor = color;
        drawingManager.set('rectangleOptions', rectangleOptions);

        var polygonOptions = drawingManager.get('polygonOptions');
        polygonOptions.fillColor = color;
        drawingManager.set('polygonOptions', polygonOptions);


      }

      function setSelectedShapeColor(color) {
        if (selectedShape) {
          if(selectedShape.getIcon){
            var symbol = selectedShape.getIcon();
            symbol.strokeColor =  color;
            selectedShape.setIcon(symbol);
          } else if (selectedShape.type == google.maps.drawing.OverlayType.POLYLINE) {
            selectedShape.set('strokeColor', color);
          } else {
            selectedShape.set('fillColor', color);
          }
        }
      }

      function makeColorButton(color) {
        var button = document.createElement('span');
        button.className = 'color-button';
        button.style.backgroundColor = color;
        google.maps.event.addDomListener(button, 'click', function() {
          selectColor(color);
          setSelectedShapeColor(color);
        });

        return button;
      }

      function buildColorPalette() {
        var colorPalette = document.getElementById('draw-color-palette');
        for (var i = 0; i < colors.length; ++i) {
          var currColor = colors[i];
          var colorButton = makeColorButton(currColor);
          colorPalette.appendChild(colorButton);
          colorButtons[currColor] = colorButton;
        }
        selectColor(colors[0]);
      }

      var polyOptions = {
        strokeWeight: 0,
        fillOpacity: 0.45,
        editable: true
      };

      //PRENDO L'ID DALLA PAGINA (IN ALTERNATIVA GLIELO PASSO COME LA FUNCT SOTTO)
      function getDrawingShapes (){


        var id = $("campoid").val();  id=2;
        var editable = true; //todo!!!!!!!!!!!!!!
        var data = {
          request:"getdata",
          id:id
        }
        $.ajax({
          url: serviceURL,
          data:data,
          dataType: "jsonp",
          jsonpCallback: "callback",
          method: "POST",
          async: false,
          success: function( response ) {

            if(response.success){
              var geom, overlay, points;
              for(var i=0;i<response.results.length;i++){
                overlay = response.results[i];
                geom = overlay[1];
                path = [];

                if(geom.indexOf("POINT")!=-1){
                  points = geom.substring(6,geom.length-1);
                  p = points.split(/\s+/);
                  position = new google.maps.LatLng(parseFloat(p[1]),parseFloat(p[0]))
                  var marker = new google.maps.Marker({
                    map:map,
                    position:position,
                    icon: {
                      path: google.maps.SymbolPath.CIRCLE,
                      strokeColor: overlay[0]||'#000',
                      scale: pointSize
                    }
                  });
                  drawingShapes.push({
                    "type":google.maps.drawing.OverlayType.MARKER,
                    "overlay":marker
                  })
                  google.maps.event.addListener(marker, 'click', function() {
                    setSelection(this);
                  });
                }

                if(geom.indexOf("LINESTRING")!=-1){
                  points = geom.substring(11,geom.length-1).split(",");
                  for (var j=0;j<points.length;j++){
                    p = points[j].split(/\s+/)
                    path.push(new google.maps.LatLng(parseFloat(p[1]),parseFloat(p[0])));
                  }
                  var poly = new google.maps.Polyline({
                    path: path,
                    strokeColor: overlay[0]
                  });
                  poly.setMap(map);
                  drawingShapes.push({
                    "type":google.maps.drawing.OverlayType.POLYLINE,
                    "overlay":poly
                  })
                  google.maps.event.addListener(poly, 'click', function() {
                    setSelection(this);
                  });
                }

                if(geom.indexOf("POLYGON")!=-1){
                  points = geom.substring(9,geom.length-2).split(",");
                  for (var j=0;j<points.length-1;j++){
                    p = points[j].split(/\s+/)
                    path.push(new google.maps.LatLng(parseFloat(p[1]),parseFloat(p[0])));
                  }
                  var poly = new google.maps.Polygon({
                    path: path,
                    fillColor: overlay[0],
                    strokeColor: overlay[0]
                  });
                  poly.setMap(map);
                  drawingShapes.push({
                    "type":google.maps.drawing.OverlayType.POLYGON,
                    "overlay":poly
                  })
                  google.maps.event.addListener(poly, 'click', function() {
                    setSelection(this);
                  });
                }
              }

            }

          }
        })


      }


      //SALVA LE GEOMETRIE DISEGNATE SULLA MAPPA CON I DAI PASSATI NEL DIZIONARIO attributes (obbligatorio l'attributo id)
      //OPPURE TOGLI L'ARGOMENTO ATTRIBUTES E RICAVI GLI ATTRIBUTI DALLA PAGINA
      function saveDrawingShapes (attributes){
        var type, overlay,points,obj;
        var data = attributes || {};
        if(!marker.getPosition()){
          alert("manca il marker");
          return;
        }
        data.request = "savedata";
        data.geom = "SRID=4326;POINT(" + marker.getPosition().lng().toFixed(6) + " " + marker.getPosition().lat().toFixed(6) + ")";
        data.overlays = []; 
        for (var i=0;i<drawingShapes.length;i++){
          type = drawingShapes[i].type;
          points = [];
          obj = {};
          overlay = drawingShapes[i].overlay
          if(type == google.maps.drawing.OverlayType.MARKER){
            obj.geom = "SRID=4326;POINT(" + overlay.getPosition().lng().toFixed(6) + " " + overlay.getPosition().lat().toFixed(6) + ")";
            var symbol = overlay.getIcon();
            obj.color = symbol.strokeColor;
          }
          else if(type == google.maps.drawing.OverlayType.RECTANGLE){
            points.push(overlay.getBounds().getSouthWest().lng().toFixed(6) + " " + overlay.getBounds().getSouthWest().lat().toFixed(6));
            points.push(overlay.getBounds().getNorthEast().lng().toFixed(6) + " " + overlay.getBounds().getSouthWest().lat().toFixed(6));
            points.push(overlay.getBounds().getNorthEast().lng().toFixed(6) + " " + overlay.getBounds().getNorthEast().lat().toFixed(6));
            points.push(overlay.getBounds().getSouthWest().lng().toFixed(6) + " " + overlay.getBounds().getNorthEast().lat().toFixed(6));
            points.push(points[0]);
            obj.geom = "SRID=4326;POLYGON((" + points.join(",") + "))";
            obj.color = overlay.fillColor;
          }
          else{
              overlay.getPath().forEach(function(point,_){
              points.push(point.lng().toFixed(6) + " " +point.lat().toFixed(6));
            });
            if(type == google.maps.drawing.OverlayType.POLYLINE){
              obj.geom = "SRID=4326;LINESTRING(" + points.join(",") + ")";
              obj.color = overlay.strokeColor;
            }
            if(type == google.maps.drawing.OverlayType.POLYGON){
              points.push(points[0]);
              obj.geom = "SRID=4326;POLYGON((" + points.join(",") + "))";
              obj.color = overlay.fillColor;
            }

          }

          data.overlays.push(obj);

        }


        $.ajax({
          url: serviceURL,
          data:data,
          dataType: "jsonp",
          jsonpCallback: "callback",
          method: "POST",
          async: false,
          success: function( response ) {

            if(response.success){
              console.log("geometrie salvate");


            }

          }
        })

      }

      var drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl:true,
        drawingControlOptions:{
          drawingModes: [
            google.maps.drawing.OverlayType.MARKER,
          ]
        },
        markerOptions: {
          draggable: true,
          icon:''
        },
        polylineOptions: {
          editable: true
        },
        rectangleOptions: polyOptions,
        polygonOptions: polyOptions,
        map: map
      });



      google.maps.event.addListener(infowindow, 'domready', function() {
        //NASCONDO LA X CLOSE
        $(".gm-style-iw").next("div").hide();
        infowindow.isOpen = true;
        $("#btn_elemento_salva").click(function(){
          infowindow.elemento.set("descrizione",$("[name='descrizione']").val());
          infowindow.close();
          infowindow.isOpen=false;

        });
        $("#btn_elemento_annulla").click(function(){
          if(typeof(infowindow.elemento.get("descrizione")=='undefined')){
            infowindow.elemento.setMap(null);
            drawingShapes.pop();
          }
          infowindow.close();
          infowindow.isOpen=false;

        });
        $("#btn_elemento_chiudi").click(function(){
          infowindow.close();
          infowindow.isOpen=false;
        })

      });

      google.maps.event.addListener(drawingManager, 'overlaycomplete', function(e) {

        //PRIMA DI AGGIUNGERE IL NUOVO ELEMENTO VERIFICO ELIMINO QUELLI CHE NON HANNO SETTATO LE PROPRIETÀ OBBLIGATORIE 
        //DOVREBBE ESSERE SOLO L'ULTIMO INSERITO - VERFÌIFCARE SE VALE LA PENA CICLARE SU TUTTI
        if(drawingShapes.length>0){
          var lastShape = drawingShapes[drawingShapes.length-1];
          if(typeof(lastShape.overlay.get("descrizione"))=='undefined'){
            lastShape.overlay.setMap(null);
            drawingShapes.pop();
          }
        }


        drawingShapes.push(e);
        drawingManager.setDrawingMode(null);



        //if (e.type != google.maps.drawing.OverlayType.MARKER) {
          // Switch back to non-drawing mode after drawing a shape.
          
          // Add an event listener that selects the newly-drawn shape when the user
          // mouses down on it.
          var newShape = e.overlay;
          newShape.type = e.type;
          google.maps.event.addListener(newShape, 'click', function() {
            if(!infowindow.isOpen){
              setSelection(newShape);
              infowindow.elemento=newShape;
              infowindow.setContent('descrizione:' + newShape.get("descrizione") + '<button id="btn_elemento_chiudi">Chiudi</button>');
              if(newShape.type == google.maps.drawing.OverlayType.MARKER){
                infowindow.open(map,newShape);
              }else{
                var path = newShape.getPath();
                var lastPoint = path.getAt(path.getLength()-1);
                infowindow.setPosition(lastPoint);
                infowindow.open(map);
              }
            }

          });
          setSelection(newShape);

        //}

        infowindow.setContent('<h3>TODO html per data entry della descrizione</h3><input type="text" name="descrizione"><button id="btn_elemento_salva">Salva</button><button id="btn_elemento_annulla">Annulla</button>');




        infowindow.set('elemento',newShape);
        if(newShape.type == google.maps.drawing.OverlayType.MARKER){
          infowindow.open(map,newShape);
        }else{
          var path = newShape.getPath();
          var lastPoint = path.getAt(path.getLength()-1);
          infowindow.setPosition(lastPoint);
          infowindow.open(map);
        }
       



        




      });


      google.maps.event.addListener(drawingManager, 'drawingmode_changed', clearSelection);
      google.maps.event.addListener(map, 'click', clearSelection);
      google.maps.event.addDomListener(document.getElementById('draw-delete-button'), 'click', deleteSelectedShape);
      buildColorPalette();



      //Aggiungo le geometrie salvate su DB
      getDrawingShapes ();
      //DA CHIAMARE VIA CODICE IL BUTTON SOLO PER I TEST
      $("#draw-save-button").bind("click",function(){
        saveDrawingShapes({"id":2,"pippo":10,"pluto":15})
      });


      //OPZIONI DEL DRAWING MANAGER PRESE DAI HTML5 ATTRIBUTES
      $("input[name='elemento-geom']").change(function(e){
        var $element = $("input[name='elemento-geom']:checked");
        var drawingOptions = {
          "drawingMode": $element.data("drawingMode"),
          "drawingControlOptions":{"drawingModes":[$element.data("drawingMode")]}
        };
        if($element.data("drawingMode")=="marker") {
          drawingOptions["markerOptions"] = {};
          if($element.data("markerIcon")) drawingOptions["markerOptions"]["icon"] = iconPath + "/" + $element.data("markerIcon");
        }
        else{
          var options = {};
          if($element.data("strokeColor")) options["strokeColor"] = $element.data("strokeColor");
          if($element.data("strokeOpacity")) options["strokeOpacity"] = $element.data("strokeOpacity");
          if($element.data("strokeWeight")) options["strokeWeight"] = $element.data("strokeWeight");
          if($element.data("fillColor")) options["fillColor"] = $element.data("fillColor");
          if($element.data("fillOpacity")) options["fillOpacity"] = $element.data("fillOpacity");

          if($element.data("drawingMode")=="polyline") drawingOptions["polylineOptions"] = options;
          if($element.data("drawingMode")=="polygon") drawingOptions["polygonOptions"] = options;

        }

        drawingManager.setOptions(drawingOptions);

      });

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

    //MOSTRA LE COORDINATE RELATIVE ALLA POSIZIONE DEL MOUSE
    function onMouseMove(e){
      var position = 'Coordinate: Lng: ' + e.latLng.lng().toFixed(6) + ' Lat: ' + e.latLng.lat().toFixed(6);
      var p = new Proj4js.Point(e.latLng.lng(),e.latLng.lat());  
      Proj4js.transform(projSource, projDest, p);
      position = position + ' - X: ' + p.x.toFixed(2) + ' Y: ' + p.y.toFixed(2);
      $("#coords").text(position);


    };


  });

})(jQuery);



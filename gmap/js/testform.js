       
(function ($) {

  $(function () {

    //PER LE PROVE E LA CACHE DI FIREFOX
    $('input').val('');

    var serviceURL = "/gisclient/services/consorziobonifica/serviceInfo.php";
    var gisclientUrl = "/gisclient/services/ows.php?MAP=consorziobonifica";
    var mapBaseURL ="http://sit.bonificamarche.it/ows/consorziobonifica";
    var tileGridName = "epsg3857";
    var delayOnRequest = 1;
    var markerDraggable = true;
    var drawingShapes = [];

    var $element, $buttonElement;
    //DEFINIZIONE DEL SISTEMA PROIETTIVO PER IL RICALCOLO DELLE COORDINATE
    Proj4js.defs["EPSG:3004"] = "+proj=tmerc +lat_0=0 +lon_0=15 +k=0.9996 +x_0=2520000 +y_0=0 +ellps=intl +units=m +no_defs +towgs84=-104.1,-49.1,-9.9,0.971,-2.917,0.714,-11.68"
    var projSource = new Proj4js.Proj("EPSG:4326"); 
    var projDest = new Proj4js.Proj("EPSG:3004"); 


    //CARICO L'ELENCO UNA VOLTA SOLO IN AVVIO COSÌ L'AUTOCOMPLETE È PIÙ VELOCE. USO JSOP PER EVITARE PROBLEMI LEGATI AL XDOMAIN
    var elencoComuni;
    $.ajax({
      url: serviceURL,
      dataType: "jsonp",
      data:{"request":"comuni"},
      jsonpCallback: "callback",
      async: false,
      success: function( response ) {
        //TODO gestire errori da server

        elencoComuni=response.results;

      }

    })

    //OPZIONI DELLA MAPPA DI GOOGLE SETTATE QUI A MENO CHE NON VOGLIATE CREARE UN PANNELLO DI CONFIGURAZIONE 
    //SULL'APPLICAZIONE. IN QUESTO CASO LE IMPOSTAZIONI DELLA MAPPA POTREBBERO ESSERE MEMORIZZATE SU HTML5 ATTRIBUTES
    var mapOptions = {
      center: new google.maps.LatLng(43.3,13.2),
      zoom: 8
    };
    var map = new google.maps.Map($("#mappa").get(0),mapOptions);
    google.maps.event.addListener(map, 'mousemove', onMouseMove);


    //MARKER USATE PER INDIVIDUARE LA POSIZIONE DELLA SEGNALAZIONE
    //SETTARE LE OPZIONI DA QUALCHE CONFIGURAZIONE
    var marker = new google.maps.Marker({
        map: map,
        draggable: markerDraggable,
        animation: google.maps.Animation.DROP,
        icon: 'images/marker48.png'
    });

    $txtIndirizzo = $("input[data-bind='value:Indirizzo']");
    var gMapAutocomplete = new google.maps.places.Autocomplete($txtIndirizzo.get(0));
    gMapAutocomplete.bindTo('bounds', map);
    google.maps.event.addListener(gMapAutocomplete, 'place_changed', function() {

      marker.setVisible(false);
      var place = gMapAutocomplete.getPlace();
      if (!place.geometry) {
        return;
      }

      $buttonElement = $txtIndirizzo.parents(".input-group").find(".icon-marker");
      // If the place has a geometry, then present it on a map.
      if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
        $buttonElement.data("lat",place.geometry.viewport.getCenter().lat());
        $buttonElement.data("lng",place.geometry.viewport.getCenter().lng());

      } else {
        map.setCenter(place.geometry.location);
        map.setZoom(17);  // Why 17? Because it looks good.
        $buttonElement.data("lat",place.geometry.location.lat());
        $buttonElement.data("lng",place.geometry.location.lng());

      }
      $buttonElement.removeClass("disabled");


    });


    google.maps.event.addListener(marker, 'drag', function(e) {
        updateCoordinates(e.latLng.lat(),e.latLng.lng());
    });

    //AGGIUNTO UN DELAY PER EVITARE CHIAMATE INUTILI
    google.maps.event.addListener(marker, 'dragend', function(e) {

      setTimeout(function() {
        updatePositionInfo(e.latLng.lat(),e.latLng.lng());
      }, delayOnRequest);

    });

    addDrawingManager();


    $txtComune = $("input[data-bind='value:DescComune']");
    $txtComune.typeahead({
      hint: true,
      highlight: true,
      minLength: 1
    },
    {
      name: 'comune',
      displayKey: 'value',
      source: function (q, cb) {
        var matches, substrRegex;
  
        matches = [];
     
        // CERCO I TESTI CHE INIZIANO PER..
        substrRegex = new RegExp('^' + q, 'i');
     
        $.each(elencoComuni, function(_, comune) {
          if (substrRegex.test(comune[1])) {
              matches.push({value: comune[1], extent:comune[3], codice:comune[0]});
          }
        })
        cb(matches);
      }

    });


    $txtFoglio = $("input[data-bind='value:Foglio']");
    $txtFoglio.typeahead({
      hint: true,
      highlight: true,
      minLength: 1
    },
    {
      name: 'foglio',
      displayKey: 'value',
      source: function (q, cb) {
        var matches, substrRegex;
  
        matches = [];
     
        // CERCO I TESTI CHE INIZIANO PER..
        substrRegex = new RegExp('^' + q, 'i');
     
        $.each(elencoFogli, function(_, foglio) {
          if (substrRegex.test(foglio[1])) {
              matches.push({id:foglio[0], value: foglio[1], extent:foglio[2]});
          }
        })
        cb(matches);
      }

    });
    
    
    $txtComune.bind('typeahead:selected', function(obj, datum, name) {      
      var extent=datum.extent.split(",");

      var bounds = new google.maps.LatLngBounds(new google.maps.LatLng(parseFloat(extent[1]),parseFloat(extent[0])),new google.maps.LatLng(parseFloat(extent[3]),parseFloat(extent[2])))

      map.fitBounds(bounds);

      $buttonElement = $txtComune.parents(".input-group").find(".icon-marker");
      $buttonElement.data("lat",bounds.getCenter().lat());
      $buttonElement.data("lng",bounds.getCenter().lng());
      $buttonElement.removeClass("disabled");

      $.ajax({
        url: serviceURL,
        data:{"request":"localita","comune":datum.codice},
        dataType: "jsonp",
        jsonpCallback: "callback",
        async: false,
        success: function( response ) {

          elencoLocalita=response.results;

        }
      })
      
      $.ajax({
        url: serviceURL,
        data:{"request":"fogli","comune":datum.codice},
        dataType: "jsonp",
        jsonpCallback: "callback",
        async: false,
        success: function( response ) {

          elencoFogli=response.results;

        }
      })
      

    });

    $txtLocalita = $("input[data-bind='value:Localita']");
    $txtLocalita.typeahead({
        hint: true,
        highlight: true,
        minLength: 1
    },
    {
      name: 'localita',
      displayKey: 'value',
      source: function (q, cb) {
        var matches, substrRegex;
          matches = [];
          //CERCO I TESTI CHE CONTENGONO LA SOTTOSTRINGA
          substrRegex = new RegExp(q, 'i');

          $.each(elencoLocalita, function(_, localita) {
            if (substrRegex.test(localita[0])) {
                matches.push({value: localita[0], lat:localita[1], lng:localita[2] });
            }
          })
          cb(matches);
        }
    });

    $txtLocalita.bind('typeahead:selected', function(obj, datum, name) {      

      map.setCenter(new google.maps.LatLng(parseFloat(datum.lat),parseFloat(datum.lng)));
      map.setZoom(17); 

      $buttonElement = $txtLocalita.parents(".input-group").find(".icon-marker");

      $buttonElement.data("lat",parseFloat(datum.lat));
      $buttonElement.data("lng",parseFloat(datum.lng));
      $buttonElement.removeClass("disabled");

    });


   
    var updateCoordinates = function(lat,lng){
        var p = new Proj4js.Point(lng,lat);  
        Proj4js.transform(projSource, projDest, p);
        $("span[data-bind='text:CoordX']").html(Math.round(p.x));
        $("span[data-bind='text:CoordY']").html(Math.round(p.y));
        delete(p);
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

  var outer = document.createElement("div");
  outer.style.width = "60px";

  var inner = document.createElement("div");
  inner.id = "more_inner";
  inner.className = "button";
  inner.title ="Crea immagine per la stampa";
  var text = document.createElement("div");
  text.id = "clicktarget";
  text.appendChild(document.createTextNode("Stampa")); 
  inner.appendChild(text);
  outer.appendChild(inner);

  // Take care of the clicked target
  inner.onclick = function(){mapImage({"segnalazione":1,"layers":'osm.osm-wms,grp_particelle,grp_fabbricati',"width":800,"height":600,"lat":43.598295 ,"lng":13.514557,"scale":866666})};
  //inner.onclick = function(){mapImage({layers:'osm.osm-wms',width:800,height:600,xc:2371336,yc:4765551,scale:1692})};

  map.controls[google.maps.ControlPosition.TOP_RIGHT].push(outer); 

    function addMapLayers() {

      var layer, layers = {};

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
      map.setMapTypeId("OSM");

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
      map.setMapTypeId("OSM");

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
          symbol.scale =  selectedPointSize;
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
            symbol.scale =  pointSize;
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
        drawingControlOptions:{
          drawingModes: [
            google.maps.drawing.OverlayType.MARKER,
            google.maps.drawing.OverlayType.POLYLINE,
            google.maps.drawing.OverlayType.POLYGON,
            google.maps.drawing.OverlayType.RECTANGLE
          ]
        },
        markerOptions: {
          draggable: true,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: pointSize
          }
        },
        polylineOptions: {
          editable: true
        },
        rectangleOptions: polyOptions,
        polygonOptions: polyOptions,
        map: map
      });

      google.maps.event.addListener(drawingManager, 'overlaycomplete', function(e) {
        drawingShapes.push(e);
        drawingManager.setDrawingMode(null);


        //if (e.type != google.maps.drawing.OverlayType.MARKER) {
          // Switch back to non-drawing mode after drawing a shape.
          
          // Add an event listener that selects the newly-drawn shape when the user
          // mouses down on it.
          var newShape = e.overlay;
          newShape.type = e.type;
          google.maps.event.addListener(newShape, 'click', function() {
            setSelection(newShape);
          });
          setSelection(newShape);

        //}
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
  


    /****************** MISURA DELLA DISTANZA *************************/
      //disegno la linea per misurare
      var measureLineOptions = {
              strokeColor : "blue",
              strokeOpacity : 0.5,
              strokeWeight : 2,
              editable:true
      };
      var measurePoly = new google.maps.Polyline(measureLineOptions);
      measurePoly.setMap(map);
      var measurePath = measurePoly.getPath();

      google.maps.event.addListener(measurePath, 'set_at', function(index) {
        infoString = 'Lunghezza: ' + google.maps.geometry.spherical.computeLength(this).toFixed(2);
        $("#measure").text(infoString);
      });
      google.maps.event.addListener(measurePath, 'insert_at', function(index) {
        infoString = 'Lunghezza: ' + google.maps.geometry.spherical.computeLength(this).toFixed(2);
        $("#measure").text(infoString);
      });

      //BUTTON DI ATTIVAZIONE
      $('#measure-button').bind("click",function(){
          $(this).toggleClass('active');
          var clickListener;     
          if($(this).hasClass('active')){
            map.setOptions({ draggableCursor: 'crosshair' });
            clickListener = google.maps.event.addListener(map, 'click', function(e){
              measurePath.push(e.latLng);
            });

          }
          else{
            measurePath.clear();
            google.maps.event.removeListener(clickListener);  
            map.setOptions({ draggableCursor: 'auto' });
   
          }
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
              return mapBaseURL +  "/service?LAYERS=" + layerName  + "&SERVICE=WMS&TRANSPARENT=TRUE&VERSION=1.1.1&EXCEPTIONS=XML&REQUEST=GetMap&STYLES=default&FORMAT=image%2Fpng&SRS=EPSG:4326&BBOX=" + bbox + "&width=256&height=256";
          }
      }
      else if(layerType == "WMTS"){
          fn = function (coord, zoom) {
              return mapBaseURL + "/wmts/" + layerName + "/" + tileGridName + "/" + zoom + "/" + coord.x + "/" + coord.y + ".png";
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

    function onMouseMove(e){
      var position = 'Coordinate: Lng: ' + e.latLng.lng().toFixed(6) + ' Lat: ' + e.latLng.lat().toFixed(6);
      var p = new Proj4js.Point(e.latLng.lng(),e.latLng.lat());  
      Proj4js.transform(projSource, projDest, p);
      position = position + ' - X: ' + p.x.toFixed(2) + ' Y: ' + p.y.toFixed(2);
      $("#coords").text(position);
      delete(p);

    };

    //genera la url di una immagine con dimensione w,h in pixels, centrata nel punto lon ,y (coordinate GB 3004) a scala scale
    //per una migliore qualità degli sfondi di osm o google usa una di queste scale (o valori prossimi) 423 * 2 ^ p
    function mapImage(cfg){ 
      var segnalazioni = ",segnalazioni.segnalazioni,segnalazioni.segnalazioni_p,segnalazioni.segnalazioni_l,segnalazioni.segnalazioni_plg&GCFILTERS=segnalazioni.segnalazioni@id="+cfg.segnalazione+",segnalazioni.segnalazioni_p@segnalazione="+cfg.segnalazione+",segnalazioni.segnalazioni_l@segnalazione="+cfg.segnalazione+",segnalazioni.segnalazioni_plg@segnalazione="+cfg.segnalazione;
      var resolution = cfg.scale/(39.3701*72);
      var dx = cfg.width * resolution / 2;
      var dy = cfg.height * resolution / 2;
      var projSource = new Proj4js.Proj("EPSG:4326"); 
      var projDest = new Proj4js.Proj("EPSG:900913"); 
      var p = new Proj4js.Point(cfg.lng,cfg.lat);  
      Proj4js.transform(projSource, projDest, p);
      var bbox = (p.x - dx) + ',' + (p.y - dy) + ',' + (p.x + dx) + ',' + (p.y + dy);
      var url = gisclientUrl + "&LAYERS=" + cfg.layers + segnalazioni  + "&SERVICE=WMS&TRANSPARENT=TRUE&VERSION=1.1.1&EXCEPTIONS=XML&REQUEST=GetMap&STYLES=default&FORMAT=image%2Fpng&SRS=EPSG:900913&BBOX=" + bbox + "&width=" + cfg.width + "&height=" + cfg.height;
      delete (projSource);
      delete (projDest);
      delete (p);
      console.log(url)

    }

    //genera la url di una immagine con dimensione w,h in pixels, centrata nel punto lat,lng (coordinate 4326) a scala scale
    //per una migliere qualità degli sfonfi di osm o google usa una di queste scale (o valori prossimi) 423 * 2 ^ p
    function mapImage2(cfg){ 

      var resolution = cfg.scale/(39.3701*72);
      var dx = cfg.width * resolution / 2;
      var dy = cfg.height * resolution / 2;

      var projection = map.getProjection();
      var g  = new google.maps.LatLng(cfg.lat,cfg.lng);
      var p = projection.fromLatLngToPoint(g);
      console.log(p)
      var bbox = (p.x - dx) + ',' + (p.y - dy) + ',' + (p.x + dx) + ',' + (p.y + dy);
      var url = mapBaseURL +  "/service?LAYERS=" + cfg.layers  + "&SERVICE=WMS&TRANSPARENT=TRUE&VERSION=1.1.1&EXCEPTIONS=XML&REQUEST=GetMap&STYLES=default&FORMAT=image%2Fpng&SRS=EPSG:3857&BBOX=" + bbox + "&width=" + cfg.width + "&height=" + cfg.height;
      //console.log(url)

    }

  });

})(jQuery);



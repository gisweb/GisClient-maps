       
(function ($) {

  "use strict";


  $(function () {
 
    //DEFINIZIONE DEL SISTEMA PROIETTIVO PER IL RICALCOLO DELLE COORDINATE SE SERVE???
    Proj4js.defs["EPSG:3004"] = "+proj=tmerc +lat_0=0 +lon_0=15 +k=0.9996 +x_0=2520000 +y_0=0 +ellps=intl +units=m +no_defs +towgs84=-104.1,-49.1,-9.9,0.971,-2.917,0.714,-11.68"
    var projSource = new Proj4js.Proj("EPSG:4326"); 
    var projDest = new Proj4js.Proj("EPSG:3004"); 

    var serviceURL = "./services/serviceInfo.json";
    var gisclientUrl = "/gisclient/services/ows.php?MAP=cariplo";
    var owsBaseURL ="http://sit.gisweb.it/ows/cariplo";

    var tileGridName = "epsg3857";
    var iconPath = "images";

    var fieldGeometries = "geometries";
    var markerPosition = "MapMarker_PushPin1__Pink.png";

 	var drawingToolElement = "elemento-geom"; //???LASCIAMO IL NOME COSÌ????
 	var layersElement = "layers";

    var delayOnRequest = 1;
    var markerDraggable = true;
    var drawingShapes = [];
    var mapOverlays = {};
    var timer;


    var $address = $("#gplaces");
    var $map = $("#gmap");
    var $coords = $("#coords");
    var $lat = $("#formfield-form-widgets-lat_progetto");
    var $lng = $("#formfield-form-widgets-lon_progetto");
    var $zoom = $("#formfield-form-widgets-zoom_progetto");
    var $geometries = $("#form-widgets-geometries");

 	//ROMA di default
    var lat0 = parseFloat($lat.val())||42;
    var lng0 = parseFloat($lng.val())||12;
    var zoom0 = parseFloat($zoom.val())||5

    var mapOptions = {
      	center: new google.maps.LatLng(lat0,lng0),
      	zoom: zoom0,
      	streetViewControl:false,
      	scrollwheel:false

    };

    var map = new google.maps.Map($map.get(0),mapOptions);
    google.maps.event.addListener(map, 'mousemove', onMouseMove);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push($address.get(0));



    //MARKER USATO PER INDIVIDUARE LA POSIZIONE DELLA SCHEDA DI PROGETTO
    //SETTARE LE OPZIONI IN QUALCHE CONFIGURAZIONE
    var marker = new google.maps.Marker({
    	icon:iconPath + "/" + markerPosition,
      	draggable:true,
      	map: map,
     	position:new google.maps.LatLng(lat0,lng0)
    });

    //POPUP ANCORATO AL MARKER
    var infowindow = new google.maps.InfoWindow({height:300, maxWidth:500});
   	infowindow.setContent('<div id="infoWin"><p>Descrizione</p><textarea id="iw-description"></textarea><br><button id="btn_elemento_salva">Salva</button><button id="btn_elemento_annulla">Annulla</button></div>');


    //AUTOCOMPLETE CON GLI INDIRIZZI GOOGLE PLACES
    
    var gMapAutocomplete = new google.maps.places.Autocomplete($address.get(0));
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

/*
      	marker.setIcon({
	        url: place.icon,
	        size: new google.maps.Size(71, 71),
	        origin: new google.maps.Point(0, 0),
	        anchor: new google.maps.Point(17, 34),
	        scaledSize: new google.maps.Size(35, 35)
      	});
*/
      	marker.setPosition(place.geometry.location);
      	marker.setVisible(true);
      	updateCoordinates(place.geometry.location.lat(),place.geometry.location.lng());

    });


    google.maps.event.addListener(marker, 'drag', function(e) {
        updateCoordinates(e.latLng.lat(),e.latLng.lng());
    });


    google.maps.event.addListener(map, 'zoom_changed', function(e) {
        $zoom.val(map.getZoom());
    });


    addDrawingManager();
	$address.show();
	addMapLayers();


    var updateCoordinates = function(lat,lng){
        //RIPROIEZIONE ????????????
        //var p = new Proj4js.Point(lng,lat);  
        //Proj4js.transform(projSource, projDest, p);
        $lat.val(lat);
        $lng.val(lng);
    }

    //MOSTRA LE COORDINATE RELATIVE ALLA POSIZIONE DEL MOUSE
    function onMouseMove(e){
      var position = 'Coordinate: Lng: ' + e.latLng.lng().toFixed(6) + ' Lat: ' + e.latLng.lat().toFixed(6);
      var p = new Proj4js.Point(e.latLng.lng(),e.latLng.lat());  
      Proj4js.transform(projSource, projDest, p);
      position = position + ' - X: ' + p.x.toFixed(2) + ' Y: ' + p.y.toFixed(2);
      $coords.text(position);


    };

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
	          	//selectColor(symbol.strokeColor);
	          	selectedShape.setDraggable(true);
	        } 
	        else{
	          	selectedShape.setEditable(true);
	          	//selectColor(shape.get('fillColor') || shape.get('strokeColor'));
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




/* COLORI CUSTOM DISABILITATI POI VEDIAMO SE SERVE
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


*/

      	function deleteSelectedShape() {
	        if (selectedShape) {
	          	selectedShape.setMap(null);
	          	for (var i=0;i<drawingShapes.length;i++){
		            if(drawingShapes[i].overlay == selectedShape){
		              	drawingShapes.splice(i,1);
		            }
	          	}
	          	infowindow.close();
          		infowindow.isOpen=false;
				updateGeometryField();
	        }
      	}

    	//REGISTRA GLI EVENTI PER TENERE AGGIONATI I CAMPI DELLE GEOMETRIE MODIFICANDO O SPOSTANDO GLI OGGETTI
    	function registerEvents (element){
	        var overlay,encodeString,infoString;
	        overlay = element.overlay;

	        if (element.type != google.maps.drawing.OverlayType.MARKER) {
	            if(overlay.editMode){
	                overlay.setEditable(true);
	                google.maps.event.addListener(overlay.getPath(), 'set_at', function(index) {
	                    overlay.infoGeom = google.maps.geometry.encoding.encodePath(this);
	                    overlay.infoLength = google.maps.geometry.spherical.computeLength(this).toFixed(2);
	                    if (overlay.geometryType == google.maps.drawing.OverlayType.POLYGON) overlay.infoArea += google.maps.geometry.spherical.computeArea(this).toFixed(2);
	                    updateGeometryField(overlay);
	                });
	                google.maps.event.addListener(overlay.getPath(), 'insert_at', function(index) {
	                    overlay.infoGeom = google.maps.geometry.encoding.encodePath(this);
	                    overlay.infoLength = google.maps.geometry.spherical.computeLength(this).toFixed(2);
	                    if (overlay.geometryType == google.maps.drawing.OverlayType.POLYGON) overlay.infoArea = google.maps.geometry.spherical.computeArea(this).toFixed(2);
	                    updateGeometryField(overlay);
	                });
	            }
	      		overlay.infoGeom = google.maps.geometry.encoding.encodePath(overlay.getPath());
	            overlay.infoLength = google.maps.geometry.spherical.computeLength(overlay.getPath()).toFixed(2);
	            if (overlay.geometryType == google.maps.drawing.OverlayType.POLYGON) overlay.infoArea = google.maps.geometry.spherical.computeArea(this).toFixed(2);
	        }
	        else{
		        if(overlay.editMode){
		           	overlay.setDraggable(true);
		            google.maps.event.addListener(overlay, 'dragend', function() {
		            	overlay.infoGeom = overlay.getPosition().toString();
		                updateGeometryField(overlay);
		            })
		        }
		        overlay.infoGeom = [overlay.getPosition().lng(),overlay.getPosition().lat()];
		        //updateGeometryField(overlay);
	        }

	        //POPUP O SUL MARKER O SULL'ULTIMO PUNTO DI LINEA O POLIGONO
		    google.maps.event.addListener(overlay, 'click', function() {
		        if(!infowindow.isOpen){
		          	setSelection(overlay);
		          	infowindow.elemento=overlay;
		          	if(overlay){
		            	infowindow.open(map,overlay);
			        }else{
			            var path = overlay.getPath();
			            var lastPoint = path.getAt(path.getLength()-1);
			            infowindow.setPosition(lastPoint);
			            infowindow.open(map);
			        }
		        }

		    });

    	}

    
	    function updateGeometryField (){

	        var jsonGeom = [];var obj,overlay;
	        for (var i=0;i<drawingShapes.length;i++){
	          	obj = {}
	          	overlay = drawingShapes[i].overlay;
	          	//obj.strokeColor = overlay.strokeColor;
	          	//obj.strokeOpacity = overlay.strokeOpacity;
	          	//obj.strokeWeight = overlay.strokeWeight;
	          	obj.element = overlay.get("elementType");   
	          	obj.description = overlay.get("description");          
      
	          	obj.geom = overlay.infoGeom;

	          	jsonGeom.push($.toJSON(obj));


	        }

	        if(jsonGeom.length>0) 
	           	$geometries.val("[" + jsonGeom + "]")
	       	else
	       		$geometries.val("")


	    }

		//CARICA LE GEOMETRIE DAL CAMPO IN JSON
		function loadGeometries () {
			var $element, drawingOption, options, geom, overlay, obj, path;
			var jsonGeom = $geometries.val() && $.parseJSON($geometries.val());
			if(typeof(jsonGeom)!='object') return; //TODO GESTIRE L'ERRORE

			for (var i=0;i<jsonGeom.length;i++){
				obj={};
				$element = $("input[name='"+drawingToolElement+"']").filter("[data-element-type='" + jsonGeom[i].element + "']");
				obj.type = $element.data("drawingMode");
				if(obj.type != google.maps.drawing.OverlayType.MARKER){
					path = google.maps.geometry.encoding.decodePath(jsonGeom[i].geom);
					options = {
						strokeColor: $element.data("strokeColor"),
						strokeOpacity: $element.data("strokeOpacity"),
						strokeWeight: $element.data("strokeWeight")
					}
					if(obj.type == google.maps.drawing.OverlayType.POLYLINE){
						overlay = new google.maps.Polyline(options);
					}
					else{
						options["fillColor"] = $element.data("fillColor");
						options["fillOpacity"] = $element.data("fillOpacity");
						overlay = new google.maps.Polygon(options);
					}
					overlay.setPath(path);
					overlay.setMap(map);

				}
				else{
					geom = jsonGeom[i].geom;
					overlay = new google.maps.Marker({
						icon:iconPath + "/" + $element.data("markerIcon"),
     					position:new google.maps.LatLng(geom[1],geom[0]),
     					map:map
					});



				}
				overlay.set("description",jsonGeom[i].description);
				obj.overlay = overlay;
				overlay.editMode = true;
				registerEvents(obj);
				drawingShapes.push(obj);

			}
  
		}



		function setDrawingTools (){
	      	//OPZIONI DEL DRAWING MANAGER PRESE DAI HTML5 ATTRIBUTES
	      	$("input[name='"+drawingToolElement+"']").change(function(e){
		        var $element = $("input[name='"+drawingToolElement+"']:checked");
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
		        drawingOptions["elementType"] = $element.data("elementType");
		        drawingManager.setOptions(drawingOptions);

	      	});
       	}


	  	google.maps.event.addListener(infowindow, 'domready', function() {
	        //NASCONDO LA X CLOSE
	        $(".gm-style-iw").next("div").hide();
			$("#iw-description").val(infowindow.elemento.get("description"))


	        infowindow.isOpen = true;
	        $("#btn_elemento_salva").click(function(){
	          	infowindow.elemento.set("description",$("#iw-description").val());
	          	infowindow.close();
	          	infowindow.isOpen=false;
	          	updateGeometryField();

	        });
	        $("#btn_elemento_annulla").click(function(){
	          	if(typeof(infowindow.elemento.get("description"))=='undefined'){
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


      	drawingManager = new google.maps.drawing.DrawingManager({
	        drawingMode: null,
	        drawingControl:false,
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
	        rectangleOptions: {
	        	strokeWeight: 0,
	        	fillOpacity: 0.45,
	        	editable: true
	      	},
	        polygonOptions: {
	        	strokeWeight: 0,
	        	fillOpacity: 0.45,
	        	editable: true
	      	},
	        map: map
      	});

      	google.maps.event.addListener(drawingManager, 'overlaycomplete', function(e) {

	        //PRIMA DI AGGIUNGERE IL NUOVO ELEMENTO VERIFICO ELIMINO QUELLI CHE NON HANNO SETTATO LE PROPRIETÀ OBBLIGATORIE 
	        //DOVREBBE ESSERE SOLO L'ULTIMO INSERITO - VERFÌIFCARE SE VALE LA PENA CICLARE SU TUTTI
	        if(drawingShapes.length>0){
	          	var lastShape = drawingShapes[drawingShapes.length-1];
	          	if(typeof(lastShape.overlay.get("description"))=='undefined'){
	            	lastShape.overlay.setMap(null);
	            	drawingShapes.pop();
	          	}
	        }

	        e.overlay.editMode = true;
	        e.overlay.set("elementType",this.elementType);
	        drawingShapes.push(e);
	        registerEvents(e);
	        //drawingManager.setDrawingMode(null);

	        var newShape = e.overlay;
	        newShape.type = e.type;

	        setSelection(newShape);

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

    	//buildColorPalette();
		setDrawingTools();

		//CARICA LE GEOMETRIE DAL CAMPO IN JSON
		loadGeometries();






    }








	//LAYERS WMS WMTS IN OVERLAY!!!!


    function addMapLayers() {

      var layerOptions, layer, layers = {};

	  //Sposto i livelli nel menù della mappa

      //OVERLAYS
      $("input[name='"+layersElement+"']").each(function(_,element){

        var layerName = $(element).data("layerName");
        var layerType = $(element).data("layerType");
        var layerOpacity = $(element).data("layerOpacity");
        var layerURL = $(element).data("layerUrl");
        if(layerOpacity) layerOpacity = layerOpacity/100;

        if(layerName){
          layerOptions = {
            tileSize: new google.maps.Size(256, 256),
            isPng: true,
            opacity: layerOpacity || 1,
            name: layerName,
            getTileUrl: getTileUrl(layerURL,layerName,layerType)
          }
          layer = new google.maps.ImageMapType(layerOptions);
          mapOverlays[layerName] = layer;
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
      map.setMapTypeId(google.maps.MapTypeId.ROADMAP);

      map.setOptions({"mapTypeControlOptions": {
        "mapTypeIds": mapTypeIds,
        "style": google.maps.MapTypeControlStyle.DROPDOWN_MENU
      }});


  	  $("input[name='"+layersElement+"']").bind("click",toggleLayer);


	  var container = document.createElement("div");
	  var layerMenu = document.getElementById("layerbox");
	  container.appendChild(document.getElementById("layerContainer"));

	  container.onmouseover = function() {
	   if (timer) clearTimeout(timer);
	    layerMenu.style.display = "block";
	  };

	  container.onmouseout = function() {
	   timer = setTimeout(function() {
	   layerMenu.style.display = "none";
	   }, 300);
	  };


      //AGGIUNGE IN MAPPA IL BOTTONE DEI LAYERS
  	  map.controls[google.maps.ControlPosition.TOP_RIGHT].push(container);

  	  $("#layerContainer").show()

    }



    //CALCOLA LA URL PER I TILE A SECONDA DEL TIPO DI LIVELLO WMS O WMTS (TILES IN CACHE)
    function getTileUrl (baseUrl,layerName,layerType){
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
              return baseUrl +  "&LAYERS=" + layerName  + "&SERVICE=WMS&TRANSPARENT=TRUE&VERSION=1.1.1&EXCEPTIONS=XML&REQUEST=GetMap&STYLES=default&FORMAT=image%2Fpng&SRS=EPSG:4326&BBOX=" + bbox + "&width=256&height=256";
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
      var layer, layerName;
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






  });

})(jQuery);



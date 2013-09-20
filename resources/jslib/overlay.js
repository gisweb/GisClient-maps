 //setting up the dual maps
    var mapA;
    

    // this variable will collect the html which will eventually be placed in the side_bar 
    var side_bar_html = "";

    // arrays to hold copies of the markers and html used by the side_bar 

    var gmarkers = [];


    //creating the variable for the geocoder
    var geocoder;

    //setting up the variables for the different map type to appear in the dropdown above each map.  There needs to a new var for each new wms layer

    var wmsMapType;
    var wmsMapTypeB;
    var wmsMapTypeC;
    var wmsMapTypeD;

    //setting up the variables for the different kml layers to be included.  If the user adds a new KML layer a new var for that layer must be included
    var county_layer;
    
    var tribal_lands;


    function initialize() {
        geocoder = new google.maps.Geocoder();
        //Set the center of the map
        var connecticut = new google.maps.LatLng(41.4636111, -72.6855556);

        var mapA_setup = {
            zoom: 9,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            MapTypeControl: true,
            mapTypeControlOptions: { style: google.maps.MapTypeControlStyle.DROPDOWN_MENU },
            navigationControl: true,
            navigationControlOptions: { style: google.maps.NavigationControlStyle.ZOOM_PAN },
            backgroundColor: 'White',
            scrollwheel: false,
            maxZoom: 17,
            minZoom: 6,
            scaleControl: true,
            center: connecticut
        }

        mapA = new google.maps.Map(document.getElementById("mapA"), mapA_setup);
      
        google.maps.event.addListener(mapA_setup, 'click', function() {
            infowindow.close();
        });

        // Add markers to the map for specific locations.  For each location the user wishes to add they need to ad a point and then a marker.  If the user would like the same point
        //to be aviable on each map they would first declare a point then then a marker for each map pointing to a different createMaker function.  In the marker declaration
        //the user can add elements to the pop-up window, such as links, embedded images and much more.  

        var point = new google.maps.LatLng(41.759788, -72.249472);
        var marker = createMarker(point, "Sample Location 1", "Sample Location 1");

        var point = new google.maps.LatLng(41.766052, -72.687285);
        var marker = createMarker(point, "Sample Location 2", "Sample Location 2");

        var point = new google.maps.LatLng(41.311508, -72.927381);;
        var marker = createMarker(point, "Sample Location 3", "Sample Location 3")

        // Put the assembled side_bar_html contents into the side_bar div
        document.getElementById("side_bar").innerHTML = side_bar_html;



        //Set-up the kml layers to toggle.  The address to the KML layer should include the whole web address.  KML and KMZ files in a WGS84 projection will work.
        county_layer = new google.maps.KmlLayer('http://www.gisdoctor.com/data/csanecitytownareact_37800_0000_2010_s100_census_1_kml.kmz', { preserveViewport: true });
       
       
        tribal_lands = new google.maps.KmlLayer('http://www.gisdoctor.com/data/concitiesct_37800_0000_2010_s100_census_1_kml.kmz', { preserveViewport: true });


        //Creating the WMS layer options.  This code creates the Google imagemaptype options for each wms layer.  In the options the function that calls the individual 
        //wms layer is set 

        var wmsOptions = {
            alt: "ArcGIS Server Layer",
            getTileUrl: WMSGetTileUrl,
            isPng: false,
            maxZoom: 17,
            minZoom: 6,
            name: "ArcGIS Server Layer",
            tileSize: new google.maps.Size(256, 256),
            credit: 'Image Credit: CT State Library, MAGIC'
        };


        var wmsOptions2 = {
            alt: "ArcGIS Server - Layer 2",
            getTileUrl: WMSGetTileUrl4,
            isPng: false,
            maxZoom: 17,
            minZoom: 6,
            name: "ArcGIS Server - Layer 2",
            tileSize: new google.maps.Size(256, 256),
            credit: 'Image Credit: MAGIC'
        };

        var wmsOptions3 = {
            alt: "Open Layers Map",
            getTileUrl: WMSGetTileUrl2,
            isPng: false,
            maxZoom: 17,
            minZoom: 6,
            name: "Open Layers Map",
            tileSize: new google.maps.Size(256, 256),
            credit: 'Image Credit: CT DEP, MAGIC'
        };


        //Creating the object to create the ImageMapType that will call the WMS Layer Options. 
        wmsMapTypeC = new google.maps.ImageMapType(wmsOptions2);
        wmsMapType = new google.maps.ImageMapType(wmsOptions);
        wmsMapTypeB = new google.maps.ImageMapType(wmsOptions3);

        //Layers to appear on Map B (the right hand side map).  The first string will give the map the map a name in the drop down and the second object calls the map type
        mapA.mapTypes.set('ArcGIS Server 1', wmsMapType);
        mapA.mapTypes.set('OpenLayers', wmsMapTypeB);
        mapA.mapTypes.set('ArcGIS Server 2', wmsMapTypeC);

        //Controling the Layers that appear in Map A.  You can set certain maps to appear in Map A or in Map B.  In this example they appear in both maps.
        mapA.setOptions({
            mapTypeControlOptions: {
                mapTypeIds: [
		  'ArcGIS Server 1',
		  'OpenLayers',
		  'ArcGIS Server 2',
		  google.maps.MapTypeId.HYBRID
		],
                style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
            }
        });

        //Controling the Layers that appear in Map B
     

    //Where the initial map type is set.  This can be adjusted as necessary.  The map name in ' ' indicates the default map viewed when the user 
    //visits the page
    mapA.setMapTypeId('ArcGIS Server 1');
    

    //Setting up the KML objects that can be toggled.  If the user would like to add a kml to an individual map they need to define the 
    //layer for that map using the appropriate function.  toggleLayer will work with Mapa and toggleLayer2 adds layers to mapB
    toggleLayer(county_layer);
    
    toggleLayer(tribal_lands);


    //Create the event listener to track the actions of one map and mimic on the other.  This shouldn't be altered unless you are adding a third map, and then you need
    //to do some more work

    
}

  //Where the info window for the selected cities is declared.  To adjust the size change the size elements.  The first value is the width and the second is the hieght.

  var infowindow = new google.maps.InfoWindow(
  {
      size: new google.maps.Size(350, 150)
  });

   //The code that reads in the WMS file.  To change the WMS layer the user would update the layers line.  As this is constructed now you need to have this code for each WMS layer.
  //Check with your Web Map Server to see what are the required components of the address.  You may need to add a couple of segements.  For example, the ArcServer WMS requires
  //a CRS value which is tacked on to the end of the url.  For an example visit http://www.gisdoctor.com/v3/arcserver_wms.html 
 
  function WMSGetTileUrl(tile, zoom) {
      var projection = window.mapA.getProjection();
      var zpow = Math.pow(2, zoom);
      var ul = new google.maps.Point(tile.x * 256.0 / zpow, (tile.y + 1) * 256.0 / zpow);
      var lr = new google.maps.Point((tile.x + 1) * 256.0 / zpow, (tile.y) * 256.0 / zpow);
      var ulw = projection.fromPointToLatLng(ul);
      var lrw = projection.fromPointToLatLng(lr);
      //The user will enter the address to the public WMS layer here.  The data must be in WGS84
      var baseURL = "http://sampleserver1.arcgisonline.com/arcgis/services/Specialty/ESRI_StatesCitiesRivers_USA/MapServer/WMSServer?&REQUEST=GetMap&SERVICE=WMS&VERSION=1.3&LAYERS="; //begining of the WMS URL ending with a "?" or a "&".
      var format = "image%2Fjpeg"; //type of image returned  or image/jpeg
      //The layer ID.  Can be found when using the layers properties tool in ArcMap
      var layers = "0";
      var srs = "EPSG:4326"; //projection to display. This is the projection of google map. Don't change unless you know what you are doing.
      var bbox = ulw.lat() + "," + ulw.lng() + "," + lrw.lat() + "," + lrw.lng();
      //Add the components of the URL together
      var url = baseURL + layers + "&Styles=default" + "&SRS=" + srs + "&BBOX=" + bbox + "&width=256" + "&height=256" + "&format=" + format + "&BGCOLOR=0xFFFFFF&TRANSPARENT=true" + "&reaspect=false" + "&CRS=EPSG:4326";
      return url;
  }

  function WMSGetTileUrl2(tile, zoom) {
      var projection = window.mapA.getProjection();
      var zpow = Math.pow(2, zoom);
      var ul = new google.maps.Point(tile.x * 256.0 / zpow, (tile.y + 1) * 256.0 / zpow);
      var lr = new google.maps.Point((tile.x + 1) * 256.0 / zpow, (tile.y) * 256.0 / zpow);
      var ulw = projection.fromPointToLatLng(ul);
      var lrw = projection.fromPointToLatLng(lr);
      //The user will enter the address to the public WMS layer here.  The data must be in WGS84
      var baseURL = "http://demo.cubewerx.com/cubewerx/cubeserv.cgi?";
      var version = "1.3.0";
      var request = "GetMap";
      var format = "image%2Fjpeg"; //type of image returned  or image/jpeg
      //The layer ID.  Can be found when using the layers properties tool in ArcMap or from the WMS settings 
      var layers = "Foundation.GTOPO30";
      //projection to display. This is the projection of google map. Don't change unless you know what you are doing.  
      //Different from other WMS servers that the projection information is called by crs, instead of srs
      var crs = "EPSG:4326";
      //With the 1.3.0 version the coordinates are read in LatLon, as opposed to LonLat in previous versions
      var bbox = ulw.lat() + "," + ulw.lng() + "," + lrw.lat() + "," + lrw.lng();
      var service = "WMS";
      //the size of the tile, must be 256x256
      var width = "256";
      var height = "256";
      //Some WMS come with named styles.  The user can set to default.
      var styles = "default";
      //Establish the baseURL.  Several elements, including &EXCEPTIONS=INIMAGE and &Service are unique to openLayers addresses.
      var url = baseURL + "Layers=" + layers + "&version=" + version + "&EXCEPTIONS=INIMAGE" + "&Service=" + service + "&request=" + request + "&Styles=" + styles + "&format=" + format + "&CRS=" + crs + "&BBOX=" + bbox + "&width=" + width + "&height=" + height;
      return url;
  }


  function WMSGetTileUrl4(tile, zoom) {
      var projection = window.mapA.getProjection();
      var zpow = Math.pow(2, zoom);
      var ul = new google.maps.Point(tile.x * 256.0 / zpow, (tile.y + 1) * 256.0 / zpow);
      var lr = new google.maps.Point((tile.x + 1) * 256.0 / zpow, (tile.y) * 256.0 / zpow);
      var ulw = projection.fromPointToLatLng(ul);
      var lrw = projection.fromPointToLatLng(lr);
      //The user will enter the address to the public WMS layer here.  The data must be in WGS84
      var baseURL = "http://sampleserver1.arcgisonline.com/arcgis/services/Specialty/ESRI_StateCityHighway_USA/MapServer/WMSServer?&REQUEST=GetMap&SERVICE=WMS&VERSION=1.3&LAYERS="; //begining of the WMS URL ending with a "?" or a "&".
      var format = "image/png"; //type of image returned  or image/jpeg
      //The layer ID.  Can be found when using the layers properties tool in ArcMap
      var layers = "0";
      var srs = "EPSG:4326"; //projection to display. This is the projection of google map. Don't change unless you know what you are doing.
      var bbox = ulw.lat() + "," + ulw.lng() + "," + lrw.lat() + "," + lrw.lng();
      //Add the components of the URL together
      var url = baseURL + layers + "&Styles=default" + "&SRS=" + srs + "&BBOX=" + bbox + "&width=256" + "&height=256" + "&format=" + format + 
         "&BGCOLOR=0xFFFFFF&TRANSPARENT=true" + "&reaspect=false" + "&CRS=EPSG:4326";
      return url;
  }

  /* 
  
  Map Function
 
  The following section includes the functions the provide the action on the map.  This section is standardized and will not need to be changed by the user to 
  create new maps
 
  */
  
//Establish the Geocoder function.  The user can change the zoom level of where the geocoder will go by adjusting the value for .setZoom.  The 
//function will return a location on both maps.
 
  function codeAddress() {
    var address = document.getElementById("address").value;
    if (geocoder) {
        geocoder.geocode({ 'address': address }, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                mapA.setZoom(15);
               
                mapA.setCenter(results[0].geometry.location);
               
                var marker = new google.maps.Marker({
                    map: mapA,
                    position: results[0].geometry.location
                });
//               
            } else {
                alert("Geocode was not successful for the following reason: " + status);
            }
        });
    }
  }
 
  //Toggle layers function.  Calls the individual layer as defined earlier.  This function will work for any number of defined kml layers

  function toggleLayer(layer) {
      if (layer.getMap()) {
          layer.setMap(null);
      } else {
          layer.setMap(mapA);

      }
  }


  //This section calls the functions that allows the user to click on a link in a table of contents and allows for the icon to open up an info window.  
  
  //As set up at this moment this tool will center over the icon, but not zoom to.


  // This function picks up the click and opens the corresponding info window - this stays the same.
  function myclick(i) {
      google.maps.event.trigger(gmarkers[i], "click");
  }

  // A function to create the marker and set up the event window function 
  function createMarker(latlng, name, html) {
      var contentString = html;
      var marker = new google.maps.Marker({
          position: latlng,
          setzoom: 12,
          map: mapA,
          zIndex: Math.round(latlng.lat() * -100000) << 5
      });

      google.maps.event.addListener(marker, 'click', function() {
          infowindow.setContent(contentString);
          infowindow.open(mapA, marker);
      });
      // save the info we need to use later for the side_bar
      gmarkers.push(marker);
      // add a line to the side_bar html
      side_bar_html += '<a href="javascript:myclick(' + (gmarkers.length - 1) + ')">' + name + '<\/a><br>';
  }

 
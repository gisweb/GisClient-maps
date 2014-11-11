var GisClientMap; //POI LO TOGLIAMO!!!!
var mycontrol,ismousedown;


//INITMAP PER FARCI QUALCOSA
$(function() {

var initMap = function(){
    var map=this.map;
    document.title = this.mapsetTitle;

    //SE HO SETTATO LA NAVIGAZIONE VELOCE????
    if(this.mapsetTiles){
        for(i=0;i<map.layers.length;i++){
            if(!map.layers[i].isBaseLayer && map.layers[i].visibility){
                map.layers[i].setVisibility(false);
                this.activeLayers.push(map.layers[i]);
            }
        }
        
        $(".dataLayersDiv").hide();
        this.mapsetTileLayer.setVisibility(true);
    }

    var markers = new OpenLayers.Layer.Markers("iolMarkers",{"displayInLayerSwitcher":true});
    map.addLayer(markers);

    var size = new OpenLayers.Size(21,25);
    var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
    var icon = new OpenLayers.Icon('http://dev.openlayers.org/releases/OpenLayers-2.13/img/marker-blue.png',size,offset);


    //var layerbox = new OpenLayers.Layer.Vector("LayerBox");    
    //map.addLayer(layerbox);


    //PROVA stili!!!

    //non so perchè non vanno i markers provo con i punti
    var style_green = {
        strokeColor: "#00FF00",
        strokeWidth: 3,
        strokeDashstyle: "dashdot",
        pointRadius: 6,
        pointerEvents: "visiblePainted",
        title: "this is a green line"
    };
    var pointList = [];

    //EVENTI SUL DATAGRID 
    var oTable = $('#domande_inviate_datagrid').dataTable();
    oTable.fnSettings().aoRowCreatedCallback.push( {
        "fn": function( nRow, aData, iDataIndex ){ 
            console.log("AGGIUNTA LA RIGA")
            console.log(aData)
            //da beccare quello giusto
            var x = parseFloat(aData[5]);
            var y = parseFloat(aData[6]);

            var point = new OpenLayers.LonLat(x,y).transform("EPSG:3003","EPSG:3857")

            //pointList.push(new OpenLayers.Geometry.Point(point.lat,point.lon))

            markers.addMarker(new OpenLayers.Marker(point,icon));
            //layerbox.addFeatures([new OpenLayers.Geometry.Point(point.lat,point.lon)]);


        }
    });




    //EVENTI SULLA SELEZIONE DELLA RIGA
    $('#domande_inviate_datagrid > tbody > tr').click(function() {
        var currentRow = oTable.fnGetPosition(this);
        console.log(currentRow);
        //ZOOM SU OGGETTO????
    });










    //VISUALIZZAZIONE DELLE COORDINATE
    var projection = this.mapOptions.displayProjection || this.mapOptions.projection;
    var v = projection.split(":");
    map.addControl(new OpenLayers.Control.MousePosition({
        element:document.getElementById("map-coordinates"),
        prefix: '<a target="_blank" ' + 'href="http://spatialreference.org/ref/epsg/' + v[1] + '/">' + projection + '</a> coordinate: '
    }));

}//END initMap

    OpenLayers.ImgPath = "/gisclient/template/resources/themes/openlayers/img/";
    GisClientMap = new OpenLayers.GisClient('/gisclient/services/gcmap.php?mapset=test','map',{
        useMapproxy:true,
        mapProxyBaseUrl:"/ows",
        mapOptions:{
            controls:[
                new OpenLayers.Control.Navigation(),
                new OpenLayers.Control.Attribution(),
                new OpenLayers.Control.LoadingPanel(),
                new OpenLayers.Control.PanZoomBar(),
                new OpenLayers.Control.ScaleLine(),
                new OpenLayers.Control.LayerSwitcher()
                /*
                new OpenLayers.Control.TouchNavigation({
                    dragPanOptions: {
                        enableKinetic: true
                    }
                }),
                //new OpenLayers.Control.PinchZoom(),
*/

            ]
            //scale:2000,
            //center:[8.92811, 44.41320]
        },
        callback:initMap
    })


});




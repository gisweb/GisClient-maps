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




    //EVENTI SUL DATAGRID 
    var oTable = $('#domande_inviate_datagrid').dataTable();
    oTable.fnSettings().aoRowCreatedCallback.push( {
        "fn": function( nRow, aData, iDataIndex ){ 
            console.log("AGGIUNTA LA RIGA")

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
                new OpenLayers.Control.ScaleLine()
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




	//INITMAP PER FARCI QUALCOSA
$(function() {
    var initMap = function(){
        var map=this.map;
        var ret = map.getLayersByName("osm");
        if(ret.length > 0) map.setBaseLayer(ret[0]);



    }//END initMap


	OpenLayers.ImgPath = "../resources/themes/openlayers/img/";
	new OpenLayers.Map.GisClient('/gisclient/services/gcmap.php' + window.location.search,'map',{
        pippo:'pippo', 
        mapOptions:{
            displayProjection:'EPSG:4326',
            controls:[
                new OpenLayers.Control.Navigation(),
                new OpenLayers.Control.Attribution(),
                new OpenLayers.Control.TouchNavigation({
                    dragPanOptions: {
                        enableKinetic: true
                    }
                })
/*
                new OpenLayers.Control.LayerTree({
                    emptyTitle:'Base vuota', 
                    div:OpenLayers.Util.getElement('layertree')
                }),
            new OpenLayers.Control.PanZoomBar()
*/
            ]
        },
        callback:initMap
    })

});



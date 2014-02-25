var GisClientMap;

//INITMAP PER FARCI QUALCOSA
$(function() {
    var initMap = function(){
        map=this.map;
        var ret = map.getLayersByName("osm");
        if(ret.length > 0) map.setBaseLayer(ret[0]);



        var pulsate = function(feature) {
            var point = feature.geometry.getCentroid(),
                bounds = feature.geometry.getBounds(),
                radius = Math.abs((bounds.right - bounds.left)/2),
                count = 0,
                grow = 'up';

            var resize = function(){
                if (count>16) {
                    clearInterval(window.resizeInterval);
                }
                var interval = radius * 0.03;
                var ratio = interval/radius;
                switch(count) {
                    case 4:
                    case 12:
                        grow = 'down'; break;
                    case 8:
                        grow = 'up'; break;
                }
                if (grow!=='up') {
                    ratio = - Math.abs(ratio);
                }
                feature.geometry.resize(1+ratio, point);
                vector.drawFeature(feature);
                count++;
            };
            window.resizeInterval = window.setInterval(resize, 50, point, radius);
        };

        var geolocate = new OpenLayers.Control.Geolocate({
            bind: false,
            geolocationOptions: {
                enableHighAccuracy: false,
                maximumAge: 0,
                timeout: 7000
            }
        });
        map.addControl(geolocate);
        var firstGeolocation = true;
        geolocate.events.register("locationupdated",geolocate,function(e) {
            vector.removeAllFeatures();
            var circle = new OpenLayers.Feature.Vector(
                OpenLayers.Geometry.Polygon.createRegularPolygon(
                    new OpenLayers.Geometry.Point(e.point.x, e.point.y),
                    e.position.coords.accuracy/2,
                    40,
                    0
                ),
                {},
                style
            );
            vector.addFeatures([
                new OpenLayers.Feature.Vector(
                    e.point,
                    {},
                    {
                        graphicName: 'cross',
                        strokeColor: '#f00',
                        strokeWidth: 2,
                        fillOpacity: 0,
                        pointRadius: 10
                    }
                ),
                circle
            ]);
            if (firstGeolocation) {
                map.zoomToExtent(vector.getDataExtent());
                pulsate(circle);
                firstGeolocation = false;
                this.bind = true;
            }
        });
        geolocate.events.register("locationfailed",this,function() {
            OpenLayers.Console.log('Posizione non trovata');
        });





        document.getElementById('locate').onclick = function() {
            vector.removeAllFeatures();
            geolocate.deactivate();
            geolocate.watch = false;
            firstGeolocation = true;
            geolocate.activate();
        };


        console.log("aggiungo la combo")
        //console.log(this.featureTypes)
        var optionList = {};
        var featureTypes = this.featureTypes;
        $.each(featureTypes, function (index) {
            if(typeof(optionList[featureTypes[index].group])=='undefined') optionList[featureTypes[index].group] = [];
            optionList[featureTypes[index].group].push({"title":featureTypes[index].title, "value":featureTypes[index].typeName})
        });

        function updateSearchCombo(optionList){
                 $('#searchCombo').empty();
                 $.each(optionList, function (index) {
                    console.log(index)
                    console.log(optionList[index])
                    var optgroup = $('<optgroup>');
                    optgroup.attr('label', index);
                     $.each(optionList[index], function (i) {
                        var option = $("<option></option>");
                        option.val(optionList[index][i].value);
                        option.text(optionList[index][i].title);
                        optgroup.append(option);
                     });
                     $("#searchCombo").append(optgroup);

                 });

        }

        updateSearchCombo(optionList)


        
    }//END initMap


	OpenLayers.ImgPath = "../resources/themes/openlayers/img/";
	GisClientMap = new OpenLayers.Map.GisClient('/gisclient/services/gcmap.php' + window.location.search,'map',{
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
                }),
                new OpenLayers.Control.LayerTree({
                    emptyTitle:'Base vuota', 
                    div:OpenLayers.Util.getElement('mypanel')
                })
                //new OpenLayers.Control.PanZoomBar()

            ]
        },
        callback:initMap
    })

});


    function zoomIn(){

        map.zoomIn()

    }
    function zoomOut(){

        map.zoomOut()

    }


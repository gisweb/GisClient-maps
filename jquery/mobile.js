var GisClientMap; //POI LO TOGLIAMO!!!!
var mycontrol,ismousedown;



//INITMAP PER FARCI QUALCOSA
$(function() {

var customCreateControlMarkup = function(control) {
    var button = document.createElement('a'),
        icon = document.createElement('span'),
        textSpan = document.createElement('span');
    //icon.className="myicon glyphicon-white ";
    if(control.tbarpos) button.className += control.tbarpos;
    if(control.iconclass) icon.className += control.iconclass;
    button.appendChild(icon);
    if (control.text) {
        textSpan.innerHTML = control.text;
    }
    button.appendChild(textSpan);
    return button;
};


var initMap = function(){
    var map=this.map;


    //setto osm come base... vedere perché non va da author
    var ret = map.getLayersByName("osm");
    if(ret.length > 0) map.setBaseLayer(ret[0]);


    var openPanel = function(width){
        var el = $("#map-overlay-panel");
        var w = width || 300;
        //var ell = document.getElementById("map-overlay-panel");
        //ell.style.width = "300px";

        //el.css({width:w+"px"});
        el.animate({width:w+"px"});
        el.addClass("panel-open");
        $("#resultpanel").addClass("smalltable")
    }

    var closePanel = function(width){
        var el = $("#map-overlay-panel");
        var w = width || 45;
        //var ell = document.getElementById("map-overlay-panel");
        //ell.style.width = "45px";

        //el.css({width:w+"px"});
        el.animate({width:w+"px"});
        el.removeClass("panel-open");
        $("#resultpanel").addClass("smalltable")
    }


    var togglePanel = function(w1,w2){

        var el = $("#map-overlay-panel");
        var ell = document.getElementById("map-overlay-panel")
        if(el.hasClass("panel-open")){
            w = w1||45;
            var ell = document.getElementById("map-overlay-panel");
            ell.style.width = "45px";

            //el.animate({width:w+"px"});
            //ell.style.width = "45px"
            //el.removeClass("panel-open");
            //$("#resultpanel").addClass("smalltable")


        }
        else{
            w = w2||300;
            el.animate({width:w+"px"});
            //ell.style.width = "300px"
            el.addClass("panel-open");
            //$("#resultpanel").removeClass("smalltable")
        }

    }


   var vectorEditor = new OpenLayers.Editor(map, {
        activeControls: ['Navigation', 'SnappingSettings', 'CADTools', 'TransformFeature', 'Separator', 'DeleteFeature', 'DragFeature', 'SelectFeature', 'Separator', 'DrawHole', 'ModifyFeature', 'Separator'],
        featureTypes: ['regular', 'polygon', 'path', 'point']
    });


    //******************** TOOLBARS STRUMENTI (IN ALTO A SX) *****************************************

    //
    var queryToolbar = new OpenLayers.GisClient.queryToolbar({
        createControlMarkup:customCreateControlMarkup,
        resultTarget:document.getElementById("resultpanel"),
        resultLayout:"TABLE",
        div:document.getElementById("map-toolbar-query"),
        autoActivate:false,
        saveState:true,
        eventListeners: {
            'startQueryMap': function() {$("#layertree").hide();$("#resultpanel").show();togglePanel()},
            'endQueryMap': function() {        //Aggiungo l'animazione (???? da spostare sulla pagina)
                $("#resultpanel .featureTypeTitle").on('click',function(){
                    $(this).children('.featureTypeData').slideToggle(200).next('.featureTypeData').slideUp(500);
                })}
            }

    });
    queryToolbar.defaultControl = queryToolbar.controls[0];
    map.addControl(queryToolbar);


    var measureToolbar = new OpenLayers.Control.Panel({
        createControlMarkup:customCreateControlMarkup,
        div:document.getElementById("map-toolbar-measure"),
        autoActivate:false,
        saveState:true
    })
    var controls = [
            new OpenLayers.Control.DynamicMeasure(OpenLayers.Handler.Path,{
                iconclass:"glyphicon-white glyphicon-resize-horizontal", 
                text:"Misura distanza", 
                title:"Misura distanza",
                eventListeners: {'activate': function(){map.currentControl.deactivate();map.currentControl=this}}
            }),
            new OpenLayers.Control.DynamicMeasure(OpenLayers.Handler.Polygon,{
                iconclass:"glyphicon-white glyphicon-retweet", 
                text:"Misura superficie", 
                title:"Misura superficie",
                eventListeners: {'activate': function(){map.currentControl.deactivate();map.currentControl=this}}
            })
        ]
    measureToolbar.addControls(controls)
    map.addControl(measureToolbar);
    //measureToolbar.activate();


    var redlineToolbar = new OpenLayers.Control.Panel({
        createControlMarkup:customCreateControlMarkup,
        div:document.getElementById("map-toolbar-redline"),
        autoActivate:false,
        saveState:true,
    })
    var redlineLayer = new OpenLayers.Layer.Vector();
    map.addLayer(redlineLayer);
    var controls = [
            new OpenLayers.Control.DrawFeature(
                redlineLayer, 
                OpenLayers.Handler.Path,
                {
                    handlerOptions:{freehand:true},
                    iconclass:"glyphicon-white glyphicon-pencil", 
                    text:"Testo penna", 
                    title:"Testo penna",
                    eventListeners: {'activate': function(){map.currentControl.deactivate();map.currentControl=this}}
                }
            ),
            new OpenLayers.Control.DrawFeature(
                redlineLayer, 
                OpenLayers.Handler.Path,
                {
                    handlerOptions:{freehand:false},
                    iconclass:"glyphicon-white glyphicon-tag", 
                    text:"Testo etichetta", 
                    title:"Testo etichetta",
                    eventListeners: {'activate': function(){map.currentControl.deactivate();map.currentControl=this}}
                }
            ),
        ]
    redlineToolbar.addControls(controls)
    map.addControl(redlineToolbar);
    //redlineToolbar.activate();



    var toolsToolbar = new OpenLayers.Control.Panel({
        createControlMarkup:customCreateControlMarkup,
        div:document.getElementById("map-toolbar-tools"),
        autoActivate:false,
        saveState:true,
    })
    toolsToolbar.addControls([
        new OpenLayers.Control.PIPESelect(
            OpenLayers.Handler.Click,
            {
                type: OpenLayers.Control.TYPE_TOGGLE, 
                clearOnDeactivate:false,
                serviceURL:'../../services/iren/findPipes.php',
                pipelayer: 'RATRACCIA.traccia_table',
                distance:50,
                highLight: true,
                iconclass:"glyphicon-white glyphicon-tint", 
                text:"Ricerca valvole", 
                title:"Ricerca valvole",
                eventListeners: {'activate': function(){map.currentControl.deactivate();map.currentControl=this}}
            }
        )]
    )
    map.addControls(toolsToolbar);
    //toolsToolbar.activate();




    //******************** TOOLBAR VERTICALE *****************************************

    var sideBar = new OpenLayers.Control.Panel({
        div:document.getElementById("map-sidebar"),
        createControlMarkup:customCreateControlMarkup
    });

    sideBar.addControls([
        //new OpenLayers.Control.ZoomIn({tbarpos:"first", iconclass:"glyphicon-white glyphicon-white glyphicon-plus", title:"Zoom avanti"}),

        new OpenLayers.Control.ZoomBox({tbarpos:"first", iconclass:"glyphicon-white glyphicon-zoom-in", title:"Zoom riquadro", eventListeners: {'activate': function(){map.currentControl && map.currentControl.deactivate();map.currentControl=this}}}),
        new OpenLayers.Control.ZoomOut({iconclass:"glyphicon-white glyphicon-zoom-out", title:"Zoom indietro"}),
        new OpenLayers.Control.DragPan({ iconclass:"glyphicon-white glyphicon-move", title:"Sposta", eventListeners: {'activate': function(){map.currentControl && map.currentControl.deactivate();map.currentControl=this}}}),
        new OpenLayers.Control.ZoomToMaxExtent({iconclass:"glyphicon-white glyphicon-globe", title:"Zoom estensione"}),
        new OpenLayers.Control.Geolocate({tbarpos:"last", iconclass:"glyphicon-white glyphicon-map-marker", title:"La mia posizione"}),



        btnSearch = new OpenLayers.Control.Button({
            type: OpenLayers.Control.TYPE_TOGGLE, 
            iconclass:"glyphicon-white  glyphicon-info-sign", 
            title:"Pannello di ricerca",
            tbarpos:"first",
            eventListeners: {
                'activate': function(){queryToolbar.activate();},
                'deactivate': function(){queryToolbar.deactivate();}
            }
        }),
        btnLayertree = new OpenLayers.Control.Button({
            type: OpenLayers.Control.TYPE_TOGGLE, 
            iconclass:"icon-layers", 
            title:"Pannello dei livelli",
            eventListeners: {
                'activate': function(){$("#resultpanel").hide();$("#layertree").show();openPanel();},
                'deactivate': function(){$("#layertree").hide();if(!btnResult.active) closePanel();}
            }
        }),
        btnResult = new OpenLayers.Control.Button({
            type: OpenLayers.Control.TYPE_TOGGLE, 
            iconclass:"glyphicon-white glyphicon-list-alt", 
            title:"Tabella dei risultati",
            tbarpos:"last",
            eventListeners: {
                'activate': function(){$("#layertree").hide();$("#resultpanel").show();openPanel();},
                'deactivate': function(){$("#resultpanel").hide();if(!btnLayertree.active) closePanel();}
            }
        }),

        new OpenLayers.Control.Button({tbarpos:"first",iconclass:"glyphicon-white glyphicon-resize-small", type: OpenLayers.Control.TYPE_TOGGLE, title:"Misure",

            eventListeners: {
                'activate': function(){measureToolbar.activate();},
                'deactivate': function(){measureToolbar.deactivate();}
                }

        }),


        new OpenLayers.Control.Button({iconclass:"glyphicon-white glyphicon-edit", type: OpenLayers.Control.TYPE_TOGGLE, title:"Editor vettoriale",

            eventListeners: {
                'activate': function(){vectorEditor.startEditMode();},
                'deactivate': function(){vectorEditor.stopEditMode();}
                }

        }),
        new OpenLayers.Control.Button({iconclass:"glyphicon-white glyphicon-pencil", type: OpenLayers.Control.TYPE_TOGGLE, title:"Redline",

            eventListeners: {
                'activate': function(){redlineToolbar.activate();},
                'deactivate': function(){redlineToolbar.deactivate();}
                }

        }),
        new OpenLayers.Control.Button({tbarpos:"last", iconclass:"glyphicon-white glyphicon-tint", type: OpenLayers.Control.TYPE_TOGGLE, title:"Tools aggiunti tipo ricerca valvole",

            eventListeners: {
                'activate': function(){toolsToolbar.activate();},
                'deactivate': function(){toolsToolbar.deactivate();}
                }

        }),

        btnPrint = new OpenLayers.Control.Button({
            tbarpos:"first", 
            type: OpenLayers.Control.TYPE_TOGGLE, 
            iconclass:"glyphicon-white glyphicon-print", 
            title:"Pannello di stampa",
            eventListeners: {
                'activate': function(){
                    if($.trim($('#printpanel').html()) == '') {
                        $("#printpanel").load('print_panel.html');
                    }
                    $('#printpanel').show();
                    openPanel();
                },
                'deactivate': function(){
                    $("#printpanel").hide();
                    closePanel();
                }
            }
        }),
        btnSettings = new OpenLayers.Control.Button({
            tbarpos:"last", 
            type: OpenLayers.Control.TYPE_TOGGLE, 
            iconclass:"glyphicon-white glyphicon-wrench", 
            title:"Settings",

        })

    ]);

    sideBar.defaultControl = sideBar.controls[0];
    map.addControl(sideBar);










    $('#sidebar-drag').on('click',function(){

        openPanel(1200);
        $("#resultpanel").removeClass("smalltable");

    })

   $('#sidebar-dragxx').draggable({
        handlexx:'#title',
        axis:'h',
        cursor:'col-resize',
        onDrag:function(e){
            var width = $( document ).width()-$(this).offset().left+30;
            console.log(width)
            //return false
            //$("#map-overlay-panel").css({"left":left+"px"})


        }
    });


    $('#sidebar-panel .panel-close').click(function(){
        closePanel()
    });



    //VISUALIZZAZIONE DELLE COORDINATE
    var projection = this.mapOptions.displayProjection || this.mapOptions.projection;
    var v = projection.split(":");
    map.addControl(new OpenLayers.Control.MousePosition({
        element:document.getElementById("map-coordinates"),
        prefix: '<a target="_blank" ' + 'href="http://spatialreference.org/ref/epsg/' + v[1] + '/">' + projection + '</a> coordinate: '
    }));


    //ELENCO DELLE SCALE
    var scale, zoomLevel, option;

    for(var i=this.mapOptions.minZoomLevel;i<this.mapOptions.maxZoomLevel;i++){
        scale = OpenLayers.Util.getScaleFromResolution (this.mapOptions.serverResolutions[i],this.mapOptions.units);
        option = $("<option></option>");
        option.val(i);
        option.text('Scala 1:'+ parseInt(scale));
        $('#map-select-scale').append(option);
    }
    $('#map-select-scale').change(function(){

        map.zoomTo(this.value);
        console.log(this.value);//?????????????????????????????????

    })









    //queryToolbar.activate();
    //queryToolbar.controls[0].activate();
    map.zoomToScale(2000)

        
    }//END initMap


	OpenLayers.ImgPath = "../resources/themes/openlayers/img/";
	GisClientMap = new OpenLayers.GisClient('/gisclient/services/gcmap.php' + window.location.search,'map',{
        pippo:'pippo', 
        mapOptions:{
            controls:[
                new OpenLayers.Control.Navigation(),
                new OpenLayers.Control.Attribution(),
                new OpenLayers.Control.LoadingPanel(),
                //new OpenLayers.Control.PanZoomBar(),
                /*
                new OpenLayers.Control.TouchNavigation({
                    dragPanOptions: {
                        enableKinetic: true
                    }
                }),*/
                //new OpenLayers.Control.PinchZoom(),
                new OpenLayers.Control.LayerTree({
                    emptyTitle:'Base vuota', 
                    div:OpenLayers.Util.getElement('layertree')
                })
            ]
        },
        callback:initMap
    })




});


var GisClientMap;

OpenLayers.Control.Panel.prototype.createControlMarkup = function(control) {
            var button = document.createElement('a'),
                icon = document.createElement('i'),
                textSpan = document.createElement('span');
            //icon.className="myicon icon-white ";
            if(control.tbarpos) button.className += control.tbarpos;
            if(control.iconclass) icon.className += control.iconclass;
            button.appendChild(icon);
            if (control.text) {
                textSpan.innerHTML = control.text;
            }
            button.appendChild(textSpan);
            return button;
        };



//INITMAP PER FARCI QUALCOSA
$(function() {


    function togglePanel(fileToLoad){


        if($(".leaflet-control-container").hasClass("open")){
            $(".leaflet-control-container").animate({
                width:'38px'
              });
            $(".leaflet-control-container").removeClass("open")
        }
        else{
            $(".leaflet-control-container").animate({
                width:'320px'
              });
            $(".leaflet-control-container").addClass("open");
            if(fileToLoad) {
                $( "#mypanel" ).load(fileToLoad);
            }
        }

    }



    function test0(){
      $("#toolbar_redline").hide();
      $("#toolbar_measure").hide();
      $("#toolbar_search").hide();
      $("#toolbar_nav").show();
    }
    function test1(){
      $("#toolbar_nav").hide();
      $("#toolbar_redline").hide();
      $("#toolbar_measure").hide();
      $("#toolbar_search").show();
    }
    function test2(){
      $("#toolbar_nav").hide();
      $("#toolbar_redline").hide();
      $("#toolbar_search").hide();
      $("#toolbar_measure").show();

    }
    function test3(){
      $("#toolbar_nav").hide();
      $("#toolbar_measure").hide();
      $("#toolbar_search").hide();
      $("#toolbar_redline").show();
    }




    var map;
    var initMap = function(){
        map=this.map;




    var resultLayerStyle = new OpenLayers.StyleMap({
        'default': {
            fill: false,
            fillColor: "#ff00FF",
            fillOpacity: 0.1,
            hoverFillColor: "white",
            hoverFillOpacity: 0.1,
            strokeColor: "yellow",
            strokeOpacity: 0.4,
            strokeWidth: 4,
            strokeLinecap: "round",
            strokeDashstyle: "solid",
            hoverStrokeColor: "red",
            hoverStrokeOpacity: 1,
            hoverStrokeWidth: 0.2,
            pointRadius: 6,
            hoverPointRadius: 1,
            hoverPointUnit: "%",
            pointerEvents: "visiblePainted",
            cursor: "inherit"
        },
        'select': {
            fill: true,
            fillColor: "blue",
            fillOpacity: 0.4,
            hoverFillColor: "white",
            hoverFillOpacity: 0.8,
            strokeColor: "yellow",
            strokeOpacity: 1,
            strokeWidth: 4,
            strokeLinecap: "round",
            strokeDashstyle: "solid",
            hoverStrokeColor: "red",
            hoverStrokeOpacity: 1,
            hoverStrokeWidth: 0.2,
            pointRadius: 6,
            hoverPointRadius: 1,
            hoverPointUnit: "%",
            pointerEvents: "visiblePainted",
            cursor: "pointer"
        },
        'temporary': {
            fill: true,
            fillColor: "EEA652",
            fillOpacity: 0.2,
            hoverFillColor: "white",
            hoverFillOpacity: 0.8,
            strokeColor: "#EEA652",
            strokeOpacity: 1,
            strokeLinecap: "round",
            strokeWidth: 4,
            strokeDashstyle: "solid",
            hoverStrokeColor: "red",
            hoverStrokeOpacity: 1,
            hoverStrokeWidth: 0.2,
            pointRadius: 6,
            hoverPointRadius: 1,
            hoverPointUnit: "%",
            pointerEvents: "visiblePainted",
            cursor: "pointer"
        }
    })


    //SCRIVE IL VALORE DELL'ATTRIBUTO: DA RIPRISTINARE IL RENDER COME NELLA 2 (LINK, IMMAGINE.....)
    var featureAttribute = function(type,value){

        return value

    }

    //SCRIVE LA TABELLA ...
    //VEDERE L'OPZIONE TABELLA VERTICALE O ORIZZONTALE... DA MIGLIORARE
    //VEDERE COSA FARE SE FEATURES.LENGHT==0
    var featureTypeResult = function(featureType){

        var featureTypeDiv = document.createElement("div");
        OpenLayers.Element.addClass(featureTypeDiv, "featureTypeTitle");

        var col, values, htmlTable, htmlHeaders = '', aCols = [];
        for (var i = 0; i < featureType.properties.length; i++) {
            col = featureType.properties[i];
            if(col.header && col.resultType!=4){
                htmlHeaders += '<th>' + col.header + '</th>';
                aCols.push(col.name);
            };
        };
        htmlTable = "<span class='featureTypeTitle'>"+featureType.title+"</span><table class='featureTypeData'><thead><tr>" + htmlHeaders + '</tr><tbody>';
        for (var j = 0; j < featureType.features.length; j++) {
            values = '';
            for (var i = 0; i < aCols.length; i++) {
                values += '<td>'+ featureAttribute('boh',featureType.features[j].attributes[aCols[i]]) +'</td>';
            }
            htmlTable +=  '<tr>'+values+'</tr>';        
        }

        htmlTable += '</tbody></table>';
        featureTypeDiv.innerHTML = htmlTable;
        return featureTypeDiv;

    }


    //AGGIORNA LA TABELLA DEI RISULTATI, VEDIAMO SE È MEGGLIO IN MANIERA SINCRONA O ASINCRONA
    var updateResultTable = function(e){
        var loadingControl = map.getControlsByClass('OpenLayers.Control.LoadingPanel')[0];
        var resultPanel = document.getElementById("resultpanel");

        if(e.type=='startMapQuery'){
            loadingControl.maximizeControl();
            resultPanel.innerHTML =  '';
        }
        else if(e.type=='endMapQuery'){
            //PER CARICARE I TUTTI RISULTATI DOPO LA QUERY 
            loadingControl.minimizeControl();
            //resultPanel.innerHTML =  'una funzione che crea elenco comleto';
            //Aggiungo l'animazione
            $("#resultpanel .featureTypeTitle").on('click',function(){
                $(this).css({backgroundImage: 'url(dark/arrowUp.png)'}).children('.featureTypeData').slideToggle(200).next('.featureTypeData').slideUp(500);
                $(this).siblings().css({backgroundImage: 'url(dark/arrowDown.png)'});

            })

        }
        else{
            //PER CARICARE I RISULTATI IN MODO SINCRONO MAN MANO CHE ARRIVANO 
            resultPanel.appendChild(featureTypeResult(e));
        }
    }



















        var resultLayer = new OpenLayers.Layer.Vector('Selezione',{displayInLayerSwitcher:false, styleMap: resultLayerStyle});
        resultLayer.id = 'gc_dataviewlayer';
        //non so se serve o li aggiungo tutti i risultati o nessuno.. da vedere forse è meglio gestire solo il maxfeatures
        
        map.addLayer(resultLayer);

        map.resultLayer = resultLayer


        //Setto i controlli
        var selectControl = new OpenLayers.Control.SelectFeature(resultLayer);
        var modifyControl = new OpenLayers.Control.ModifyFeature(resultLayer);
        var highlightControl = new OpenLayers.Control.SelectFeature(resultLayer,
            {
                hover: true,
                highlightOnly: true,
                renderIntent: "temporary"
            }
        );

        map.addControl(modifyControl);
        map.addControl(selectControl); 
        map.addControl(highlightControl);




   /* 
        this.selectControl = selectControl;
        this.highlightControl = highlightControl;
        this.modifyControl = modifyControl;
        
    */
  
    var wfsCache = {};
    var queryFilters = {};
    var layers=[];
    //for (var i = 0; i < this.featureTypes.length; i++) {

    //SETTARE A ES 10 IL NUOMERO MASSIMO DI LAYER INTERROGABILI. DA METTERE NEI SETTINGS
    for (var i = 0; i < 10; i++) {
        var layer =  map.getLayersByName(this.featureTypes[i].WMSLayerName)[0];
        layers.push(layer);
        if(typeof(wfsCache[layer.id])=='undefined') wfsCache[layer.id] = {featureTypes:[]};
        wfsCache[layer.id].featureTypes.push(this.featureTypes[i]);
    };

    var MapQueryControl = new OpenLayers.Control.MapQuery(
                OpenLayers.Handler.RegularPolygon,
                {
                    wfsCache:wfsCache,
                    layers:layers,                    
                    queryFilters:queryFilters,  
                    resultLayer:resultLayer, 
                    maxFeatures:100,   
                    maxVectorFeatures:500,       
                    handlerOptions: {
                        irregular: true
                    },
                    tbarpos:"first",
                    iconclass:"icon-info-sign", 
                    title:"Interroga la mappa",

                    type: OpenLayers.Control.TYPE_TOGGLE,
                    //type: OpenLayers.Control.TYPE_BUTTON,
                    eventListeners: {
                        'activate': function(){$("#toolbar_search").show();},
                        'deactivate': function(){$("#toolbar_search").hide();},
                        'startMapQuery':  updateResultTable,
                        'featuresLoaded': updateResultTable,//function(){updateResultTable(this)},
                        'endMapQuery': updateResultTable//function(){loadingControl.minimizeControl();}
                    }
                }
            )


//TOOLBARS*****************************************


    var vTbar = new OpenLayers.Control.Panel({
        div:document.getElementById("tbarControl")
        //saveState:true,
    });
    vTbar.addControls([

        //new OpenLayers.Control.ZoomIn({tbarpos:"first", iconclass:"icon-plus", title:"Zoom avanti"}),
        //new OpenLayers.Control.ZoomOut({iconclass:"icon-minus", title:"Zoom indietro"}),
        new OpenLayers.Control.ZoomBox({tbarpos:"first", iconclass:"icon-white icon-zoom-in", title:"Zoom riquadro", eventListeners: {'activate': function(){map.currentControl=this}}}),
        new OpenLayers.Control.DragPan({ iconclass:"icon-move", title:"Sposta", eventListeners: {'activate': function(){map.currentControl=this}}}),
        new OpenLayers.Control.ZoomToMaxExtent({ iconclass:"icon-globe", title:"Zoom estensione"}),
       // new OpenLayers.Control.Geolocate({tbarpos:"last", iconclass:"icon-measure-area", title:"La mia posizione"}),

        MapQueryControl,
        //new OpenLayers.Control.Button({iconclass:"icon-list-alt", trigger:togglePanel, title:"Layers: Open layers panel"}),
/*
        btnSearch = new OpenLayers.Control.Button({
            type: OpenLayers.Control.TYPE_TOGGLE, 
            iconclass:"icon-list-alt", 
            title:"Pannello di ricerca",
            eventListeners: {
                'activate': function(){$(".leaflet-control-container").animate({width:'320px'});btnLayertree.deactivate();$("#searchpanel").show()},
                'deactivate': function(){if(!btnLayertree.active) $(".leaflet-control-container").animate({width:'38px'});$("#searchpanel").hide()}
            }
        }),*/
        btnLayertree = new OpenLayers.Control.Button({
            type: OpenLayers.Control.TYPE_TOGGLE, 
            iconclass:"icon layers", 
            title:"Pannello dei livelli",
            eventListeners: {
                'activate': function(){$(".leaflet-control-container").animate({width:'320px'});},
                'deactivate': function(){$(".leaflet-control-container").animate({width:'38px'})}
            }
        }),
        //new OpenLayers.Control.ZoomBox({iconclass:"icon-forward", title:"Zoom box: Selecting it you can zoom on an area by clicking and dragging."}),
        //new OpenLayers.Control.DragPan({tbarpos:"last", iconclass:"icon-backward", title:"Zoom box: Selecting it you can zoom on an area by clicking and dragging."}),
        
/*        new OpenLayers.Control.DynamicMeasure(OpenLayers.Handler.Path,{
		iconclass:"icon-resize-horizontal", 
		title:"Misura line",   
            	type: OpenLayers.Control.TYPE_TOGGLE,                  
		eventListeners: {
                        'activate': function(){$("#toolbar_measure").show();},
                        'deactivate': function(){$("#toolbar_measure").hide();}
                }
	
	}),
        new OpenLayers.Control.DynamicMeasure(OpenLayers.Handler.Polygon,{iconclass:"icon-retweet",  title:"Misura area"}),
*/
    new OpenLayers.Control.Button({iconclass:"icon-resize-small", type: OpenLayers.Control.TYPE_TOGGLE, title:"Misure",

        eventListeners: {
                        'activate': function(){hTbar.activate();map.currentControl.deactivate()},
                        'deactivate': function(){hTbar.deactivate()}
                }

    }),


    new OpenLayers.Control.Button({iconclass:"icon-pencil", type: OpenLayers.Control.TYPE_TOGGLE, title:"Redline",

		eventListeners: {
                        'activate': function(){$("#toolbar_redline").show();},
                        'deactivate': function(){$("#toolbar_redline").hide();}
                }

	}),
        new OpenLayers.Control.Button({tbarpos:"last", iconclass:"icon-gift", type: OpenLayers.Control.TYPE_TOGGLE, title:"Tools aggiunti tipo ricerca valvole",

		eventListeners: {
                        'activate': function(){$("#toolbar_tool").show();},
                        'deactivate': function(){$("#toolbar_tool").hide();}
                }

	}),

        btnPrint = new OpenLayers.Control.Button({
            tbarpos:"first", 
            type: OpenLayers.Control.TYPE_TOGGLE, 
            iconclass:"icon-print", 
            title:"Pannello di stampa",
            eventListeners: {
                'activate': function(){$(".leaflet-control-container").animate({width:'320px'});$("#searchpanel").hide();btnSearch.deactivate();$("#layertree").hide()},
                'deactivate': function(){if(!btnSearch.active) $(".leaflet-control-container").animate({width:'38px'});$("#layertree").hide()}
            }
        }),
        btnSettings = new OpenLayers.Control.Button({
            tbarpos:"last", 
            type: OpenLayers.Control.TYPE_TOGGLE, 
            iconclass:"icon-wrench", 
            title:"Settings",
            eventListeners: {
                'activate': function(){$(".leaflet-control-container").animate({width:'320px'});$("#searchpanel").hide();btnSearch.deactivate();$("#layertree").hide()},
                'deactivate': function(){if(!btnSearch.active) $(".leaflet-control-container").animate({width:'38px'});$("#layertree").hide()}
            }
        })



    ]);

    vTbar.defaultControl = vTbar.controls[0];


    var hTbar = new OpenLayers.Control.Panel({
        div:document.getElementById("tbarControl2"),
        autoActivate:false,
        saveState:true
    });


    hTbar.addControls([

        btnMeasureLine = new OpenLayers.Control.DynamicMeasure(OpenLayers.Handler.Path,{iconclass:"myicon icon-measure-length", text:"Linea", title:"Misura line"}),
        new OpenLayers.Control.DynamicMeasure(OpenLayers.Handler.Polygon,{iconclass:"myicon icon-measure-area", text:"Area", title:"Misura area"})
        ]);

    hTbar.defaultControl = hTbar.controls[0];

    map.addControls([vTbar,hTbar]);




    //setto a manina perchè non va????

        var ret = map.getLayersByName("osm");
        if(ret.length > 0) map.setBaseLayer(ret[0]);



        var optionList = {};
        var featureTypes = this.featureTypes;
        $.each(featureTypes, function (index) {
            if(typeof(optionList[featureTypes[index].group])=='undefined') optionList[featureTypes[index].group] = [];
            optionList[featureTypes[index].group].push({"title":featureTypes[index].title, "value":featureTypes[index].typeName})
        });

        function updateSearchCombo(optionList){
                $('#searchCombo').empty();
                var option = $("<option></option>");
                option.val("active");
                option.text("Livelli attivi");
                $('#searchCombo').append(option);
                 $.each(optionList, function (index) {
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
                new OpenLayers.Control.LoadingPanel(),
                new OpenLayers.Control.TouchNavigation({
                    dragPanOptions: {
                        enableKinetic: true
                    }
                }),
                new OpenLayers.Control.LayerTree({
                    emptyTitle:'Base vuota', 
                    div:OpenLayers.Util.getElement('layertree')
                })
                //new OpenLayers.Control.ResultPanel({"div":document.getElementById("resultpanel")})
                //new OpenLayers.Control.PanZoomBar()

            ]
        },
        callback:initMap
    })




});


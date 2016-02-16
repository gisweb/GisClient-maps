var GisClientMap; //POI LO TOGLIAMO!!!!
var mycontrol,ismousedown;


//INITMAP PER FARCI QUALCOSA
$(function() {


  var initDialog = function(_, container){
    var elencoVie = [];
    var elencoCivici = [];


    $('select[name="comune"]').select2({
      allowClear: true,
      placeholder: '---'
    }).on("change", function(e) { 
      $.ajax({
        'url':"resources/elencoVie",
        'type':'GET',
        'data':{"comune":$(this).val()},
        'dataType':'JSON',
        'success':function(data, textStatus, jqXHR){
          elencoVie = data.results;
          $('input[name="via"]').select2('data', elencoVie);
          $('input[name="via"]').select2('val', null);
          $('input[name="civico"]').select2('val', null);
          //$("#civico_geometry").val('');
        }
      });
    });


    $('input[name="via"]').select2({
          placeholder: '---',
          allowClear: true,
          minimumInputLength: 2,
          width:'off',      
          query: function (query){
            var data = {results: []};
            var re = RegExp(query.term, 'i');
            $.each(elencoVie, function(){
              if (re.test(this.text)){
                data.results.push({id: this.text, text: this.text, coords: this.coord, idvia:this.id});
              }
            });
            query.callback(data);
        },
        //PER INSERIRE U N VALORE NON IN ELENCO (COMBO EDITABILE)
        createSearchChoice:function(term, data) {
          if ($(data).filter(function() {return this.text.localeCompare(term)===0;}).length===0) {
            return {id:term, text:term};
          } 
        },
        initSelection : function (element, callback) {
          var data ={id: element.val(), text: element.val(), coords:'' } ;
          callback(data);
        }
    }).on("change", function(e){
        console.log(e)
      //$("#civico_nomevia").val(e.added.text);
      $.ajax({
        'url':"resources/elencoCivici",
        'type':'GET',
        'data':{"via":e.added.idvia},
        'dataType':'JSON',
        'success':function(data, textStatus, jqXHR){
          elencoCivici = data.results;
          $('input[name="civico"]').select2('data', elencoCivici);
          $('input[name="civico"]').select2('val', null);
          //$("#civico_geometry").val('');
        }
      });
    });
    
    $('input[name="civico"]').select2({
          placeholder: '---',
          allowClear: true,
          minimumInputLength: 0,
          width:'off',      
          query: function (query){
            var data = {results: []};
            var re = RegExp('^' + query.term, 'i');
            $.each(elencoCivici, function(){
              if (re.test(this.text)){
                data.results.push({id: this.text, text: this.text, x: this.x, y: this.y});
              }
            });
            query.callback(data);
        },
        //PER INSERIRE U N VALORE NON IN ELENCO (COMBO EDITABILE)
        createSearchChoice:function(term, data) {
          if ($(data).filter(function() {return this.text.localeCompare(term)===0;}).length===0) {
            return {id:term, text:term};
          } 
        },
        initSelection : function (element, callback) {
          var data ={id: element.val(), text: element.val(), x:'', y:'' } ;
          callback(data);
        }
    }).on("change", function(e){
        console.log(e.added)
        $('input[name="coordx"]').val(Math.round(e.added.x));
        $('input[name="coordy"]').val(Math.round(e.added.y));
    });


 
  }
  

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

    var editMode = $('input[name="coordx"]').length;
    if(editMode==0) $('#center-button').hide();



    var btnPrint = new OpenLayers.Control.PrintMap({
            tbarpos:"first", 
            //type: OpenLayers.Control.TYPE_TOGGLE, 
            formId: 'printpanel',
            exclusiveGroup: 'sidebar',
            iconclass:"glyphicon-white glyphicon-print", 
            title:"Pannello di stampa",
            maxScale:50000,
            editMode: editMode,
            serviceUrl:'/gisclient/services/print.php',
            eventListeners: {
                updatebox: function(e){
                    var bounds = this.printBox.geometry.getBounds();
                    var center = bounds.getCenterLonLat().clone().transform("EPSG:3857","EPSG:3003");
                    $('input[name="scale"]').val(Math.round(this.printBoxScale));
                    $('input[name="coordx"]').val(Math.round(center.lon));
                    $('input[name="coordy"]').val(Math.round(center.lat));
                    $('input[name="boxw"]').val(Math.round(bounds.getWidth()));
                    $('input[name="boxh"]').val(Math.round(bounds.getHeight()));
                }

            }


        });


    $('select[name="page_layout"]').change(function() {
        btnPrint.pageLayout = $(this).val();
        btnPrint.updatePrintBox();
    });
    $('select[name="page_format"]').change(function() {
        btnPrint.pageFormat = $(this).val();
        btnPrint.updatePrintBox();
    });
    $('select[name="page_legend"]').change(function() {
        btnPrint.pageLegend = $(this).val();
    });
    $('#printpanel').on('click', 'button[role="print"]', function(event) {
        event.preventDefault();
        btnPrint.doPrint();
    });


    $('input[name="scale"]').spinner({
      step: 100,
      numberFormat: "n",
      change: function( event, ui ) {
        btnPrint.printBoxScale = $(this).val();
        btnPrint.updatePrintBox();
      },
      spin: function( event, ui ) {
        btnPrint.printBoxScale = $(this).val();
        btnPrint.updatePrintBox();
      }
    });

    $('#center-button').on('click',function(){
        var x = Math.round(parseFloat($('input[name="coordx"]').attr('value')));
        var y = Math.round(parseFloat($('input[name="coordy"]').attr('value')));
        if(x && y) btnPrint.movePrintBox(new OpenLayers.LonLat(x,y).transform("EPSG:3003","EPSG:3857"));
    })

    btnPrint.pageLayout = $('[name="page_layout"]').attr('value');
    btnPrint.pageFormat = $('[name="page_format"]').attr('value');
    btnPrint.pageLegend = $('[name="page_legend"]').attr('value');

    //ricarico i dati salvati
    var x = Math.round(parseFloat($('[name="coordx"]').attr('value')));
    var y = Math.round(parseFloat($('[name="coordy"]').attr('value')));
    btnPrint.printBoxScale = Math.round(parseFloat($('[name="scale"]').attr('value')));
    if(x && y) btnPrint.centerBox = new OpenLayers.LonLat(x,y).transform("EPSG:3003","EPSG:3857");

    map.addControl(btnPrint);
    btnPrint.activate();

    //VISUALIZZAZIONE DELLE COORDINATE
    var projection = this.mapOptions.displayProjection || this.mapOptions.projection;
    var v = projection.split(":");
    map.addControl(new OpenLayers.Control.MousePosition({
        element:document.getElementById("map-coordinates"),
        prefix: '<a target="_blank" ' + 'href="http://spatialreference.org/ref/epsg/' + v[1] + '/">' + projection + '</a> coordinate: '
    }));

}//END initMap

    initDialog();
    OpenLayers.ImgPath = "http://testgrg.gisclient.net/gisclient/template/resources/themes/openlayers/img/";
    GisClientMap = new OpenLayers.GisClient('http://testgrg.gisclient.net/gisclient/services/gcmap.php?callback=_&mapset=test','map',{
        useMapproxy:true,
        mapProxyBaseUrl:"http://testgrg.gisclient.net/ows",
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
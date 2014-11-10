var GisClientMap; //POI LO TOGLIAMO!!!!
var mycontrol,ismousedown;


//INITMAP PER FARCI QUALCOSA
$(function() {


  var initDialog = function(_, container){
    var elencoVie = [];
    var elencoCivici = [];


    $("#comune").select2({
      allowClear: true,
      placeholder: '---'
    }).on("change", function(e) { 
      $("#via").val(e.added.text);
      $.ajax({
        'url':"resources/elencoVie",
        'type':'GET',
        'data':{"comune":$(this).val()},
        'dataType':'JSON',
        'success':function(data, textStatus, jqXHR){
          elencoVie = data.results;
          $('#via').select2('data', elencoVie);
          $('#via').select2('val', null);
          //$("#civico_geometry").val('');
        }
      });
    });


    $('#via').select2({
          placeholder: '---',
          allowClear: true,
          minimumInputLength: 2,
          width:'off',      
          query: function (query){
            var data = {results: []};
            var re = RegExp(query.term, 'i');
            $.each(elencoVie, function(){
              if (re.test(this.text)){
                data.results.push({id: this.id, text: this.text, coords: this.coord});
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
      //$("#civico_nomevia").val(e.added.text);
      $.ajax({
        'url':"resources/elencoCivici",
        'type':'GET',
        'data':{"via":$(this).val()},
        'dataType':'JSON',
        'success':function(data, textStatus, jqXHR){
          elencoCivici = data.results;
          $('#civico').select2('data', elencoCivici);
          $('#civico').select2('val', null);
          //$("#civico_geometry").val('');
        }
      });
    });
    
    $('#civico').select2({
          placeholder: '---',
          allowClear: true,
          minimumInputLength: 0,
          width:'off',      
          query: function (query){
            var data = {results: []};
            var re = RegExp('^' + query.term, 'i');
            $.each(elencoCivici, function(){
              if (re.test(this.text)){
                data.results.push({id: this.id, text: this.text, x: this.x, y: this.y});
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
        $("#civico_geometry").val(e.added.coords);
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



    var btnPrint = new OpenLayers.Control.PrintMap({
            tbarpos:"first", 
            //type: OpenLayers.Control.TYPE_TOGGLE, 
            formId: 'printpanel',
            exclusiveGroup: 'sidebar',
            iconclass:"glyphicon-white glyphicon-print", 
            title:"Pannello di stampa",
            scale:50000,
            pageLayout:'vertical',
            pageFormat:'A3',
            serviceUrl:'/gisclient/services/print.php',
            eventListeners: {
                updatebox: function(e){
                    $('#printpanel input[name="scale"]').val(Math.round(this.printBoxScale));
                }

            }


        });

    $('#printpanel input[name="scale_mode"]').change(function() {
        $('#printpanel input[name="scale_mode"]:checked').val();
        btnPrint.drawPrintBox();
    });

    $('#printpanel input[name="direction"]').change(function() {
        btnPrint.pageLayout = $('#printpanel input[name="direction"]:checked').val();
        btnPrint.updatePrintBox();
    });
    $('#printpanel select[name="formato"]').change(function() {
        btnPrint.pageFormat = $(this).val();
        btnPrint.updatePrintBox();
    });

    $('#printpanel').on('click', 'button[role="print"]', function(event) {
        event.preventDefault();
        btnPrint.doPrint();
    });

    $('#printpanel input[name="scale"]').spinner({
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


    OpenLayers.ImgPath = "../resources/themes/openlayers/img/";
    GisClientMap = new OpenLayers.GisClient('/gisclient/services/gcmap.php' + window.location.search,'map',{
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
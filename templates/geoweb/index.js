var sidebarPanel = {
  closeTimeout: null,
  isOpened: false,
  /* settato a true per permettere l'apertura automatica del pannello */
  //handleEvent: true,
  smallTableSize: 300,
  init: function(selector) {
    var self = this;
    if (typeof(clientConfig.RESULT_SMALLTABLE_SIZE) != 'undefined')
      this.smallTableSize = clientConfig.RESULT_SMALLTABLE_SIZE<$(document).width() ? clientConfig.RESULT_SMALLTABLE_SIZE : $(document).width();
    this.selector = selector;
    this.$element = $(selector);
    $('.panel-close', this.$element).click(function(){
      GisClientMap.map.getControlsBy('id', 'button-layertree')[0].deactivate();
      GisClientMap.map.getControlsBy('id', 'button-resultpanel')[0].deactivate();
      self.close();
    });
    $('.panel-expand', this.$element).click(function(){
      self.expand();
    });
    $('.panel-collapse', this.$element).click(function(){
      self.collapse();
    });
    $('.panel-clearresults').hide();
  },
  show: function(panelId) {
    var panels = $('div.panel-content', this.$element).children('div').toArray();
    for (var i = 0; i < panels.length; i++) {
      if (panels[i].id === panelId)
        $('#'+panels[i].id, this.$element).show();
      else {
        $('#'+panels[i].id, this.$element).hide();
        var ctrlBtn = GisClientMap.map.getControlsBy('sidebar_panel', panels[i].id);
        for (var j= 0; j < ctrlBtn.length; j++) {
          ctrlBtn[j].deactivate();
          if(typeof(ctrlBtn[j].gc_control) != 'undefined')
            GisClientMap.map.getControlsBy('gc_id', ctrlBtn[j].gc_control)[0].deactivate();
        }
      }
    }
    this.open();
  },
  hide: function(panelId) {
    var self = this;
    $('#'+panelId, this).hide();
    this.closeTimeout = setTimeout(function() {
      self.close();
    }, 100);
  },
  open: function() {
    if(this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
    var el = $("#map-overlay-panel");
    var w = this.smallTableSize;
    el.animate({width:w+"px"});
    el.addClass("panel-open");
    if(w == this.smallTableSize)
      $("#resultpanel").addClass("smalltable");
    $('div.panel-header', this.$element).show();
    $('#map-overlay-panel').css('right', '25px');
    this.isOpened = true;
  },
  close: function() {
    var el = $("#map-overlay-panel");
    el.animate({width:"45px"});
    el.removeClass("panel-open");
    $("#resultpanel").addClass("smalltable");
    $('div.panel-header', this.$element).hide();
    $('#map-overlay-panel').css('right', '0px');
    this.isOpened = false;
  },
  expand: function() {
    var el = $('#map-overlay-panel');
    var width = ($(document).width() / 4) * 3;
    el.animate({width: width + 'px'}, {
      complete: function() {
        $('#resultpanel').find('.featureTypeData').first().slideDown(200);
      }
    });
    $('#resultpanel').removeClass('smalltable');
    $('.panel-expand', this.$element).hide();
    $('.panel-collapse', this.$element).show();
  },
  collapse: function() {
    var el = $('#map-overlay-panel');
    el.animate({width: this.smallTableSize + 'px'});
    $('#resultpanel').addClass('smalltable');
    $('.panel-expand', this.$element).show();
    $('.panel-collapse', this.$element).hide();
  }
};

function createSideToolbar(innerMap) {
  sideBar = new OpenLayers.GisClient.Toolbar({
    div:document.getElementById("map-sidebar"),
    createControlMarkup:customCreateControlMarkup
  });

  var defaultControl = new OpenLayers.Control.DragPan({
    id: "move",
    iconclass:"glyphicon-white glyphicon-move",
    title:"Sposta",
    map: innerMap,
    eventListeners: {
      'activate': function(){
        innerMap.currentControl && innerMap.currentControl.deactivate();
        innerMap.currentControl=this;
      }
    }
  });
  innerMap.defaultControl = defaultControl;
  var geolocateControl = new OpenLayers.Control.Geolocate({
    id: "geolocate",
    tbarpos:"last",
    iconclass:"glyphicon-white glyphicon-map-marker",
    title:"La mia posizione",
    watch:false,
    bind:false,
    geolocationOptions: {
      enableHighAccuracy: true, // required to turn on gps requests!
      maximumAge: 3000,
      timeout: 50000
    },
    eventListeners: {
      'activate': function(){
        this.title="Rilevamento posizione in corso";
      }
    }
  });
  geolocateControl.events.register('locationfailed', this, function() {
    alert('Posizione GPS non acquisita');
    innerMap.getControlsByClass("OpenLayers.Control.Geolocate")[0].deactivate();
  });
  geolocateControl.events.register('locationuncapable', this, function() {
    alert('Acquisizione della posizione GPS non supportata dal browser');
    innerMap.getControlsByClass("OpenLayers.Control.Geolocate")[0].deactivate();
  });
  geolocateControl.events.register('locationupdated', this, function(event) {
    var point = event.point;
    var lonLat = new OpenLayers.LonLat(point.x, point.y);
    if(!innerMap.isValidLonLat(lonLat)) return alert('Posizione '+lonLat.lon+' '+lonLat.lat+' non valida');
    if(!innerMap.maxExtent.containsLonLat(lonLat)) return alert('Posizione '+lonLat.lon+' '+lonLat.lat+' fuori extent');
    innerMap.setCenter(lonLat);
    innerMap.zoomToScale(1000, true);
  });
  sideBar.addControls([
    new OpenLayers.Control.ZoomBox({
      id: "zoomin",
      tbarpos:"first",
      iconclass:"glyphicon-white glyphicon-zoom-in",
      title:"Zoom riquadro",
      eventListeners: {
        'activate': function(){
          innerMap.currentControl && innerMap.currentControl.deactivate();
          innerMap.currentControl=this;
        }
      }
    }),
    new OpenLayers.Control.ZoomOut({
      id: "zoomout",
      iconclass:"glyphicon-white glyphicon-zoom-out",
      title:"Zoom indietro"
    }),
    defaultControl,
    new OpenLayers.Control.Button({
      id: "zoomext",
      trigger: function() {
        if (innerMap)
          innerMap.zoomToExtent(innerMap.maxExtent);
      },
      iconclass:"glyphicon-white glyphicon-globe",
      title:"Zoom estensione"
    }),
    new OpenLayers.Control.Button({
      id: "pointer",
      iconclass:"glyphicon-white glyphicon-flag",
      title:"Vai a coordinata",
      trigger : function(){
        if (sidebarPanel.handleEvent || typeof(sidebarPanel.handleEvent) === 'undefined') {
          var ctrl = this.map.getControlsBy('gc_id', 'control-goto')[0];
          if (ctrl.active) {
            if(ctrl.deactivate())
              this.deactivate();
          } else {
            if(ctrl.activate())
              this.activate();
          }
          if (typeof(sidebarPanel.handleEvent) !== 'undefined')
            sidebarPanel.handleEvent = false;
        }
      }
    }),
    geolocateControl
  ]);
  initGotoDestinationPanel(innerMap);
  sideBar.defaultControl = defaultControl;
  innerMap.addControl(sideBar);
}

function manageResize() {
  var onResize = function() {
    if($(window).width() < 1000) $('#map-coordinates').hide();
    var panelContentHeight = $(window).height() - $('div.panel-header').height() - $('#map-footer').height() - 35;
    $('#sidebar-panel div.panel-content').height(panelContentHeight);
  }
  $(window).resize(onResize);
  onResize.call();
}

function initMap() {
  // **** Map configuration Parameters
  // **** TODO: in config file
  this.map.Z_INDEX_BASE['Popup'] = 1500;
  this.map.Z_INDEX_BASE['Control'] = 1550;
  this.map.fractionalZoom = false;

  document.title = this.mapsetTitle;
  var serviceURL = this.baseUrl + "services/";
  var rootPath = '../../';
  sidebarPanel.init('#sidebar-panel');
  if(ConditionBuilder) {
    ConditionBuilder.baseUrl = this.baseUrl;
    ConditionBuilder.resourcesPath = rootPath + 'resources/';
  }

  createSideToolbar(this.map);
  var projection = this.mapOptions.displayProjection || this.mapOptions.projection;
  this.map.addControl(
    new OpenLayers.Control.MousePosition({
      element:document.getElementById("map-coordinates"),
      prefix: '<a target="_blank" ' + 'href="http://spatialreference.org/ref/epsg/' + projection.split(":")[1] + '/">' + projection + '</a> coordinate: '
    })
  );
  setZoomAndScales(this)
  manageLoginLogout();
  manageResize();
  manageMapsets();
  createGCControls(this.map);
  if(generateHints != undefined)
    generateHints();
  centerMapset();
  applicationReady.resolve();
}

$.when(configLoaded).then(startGui);

function startGui() {
$(document).ready(function() {
  GisClientMap = new OpenLayers.GisClient(GisClientBaseUrl + 'services/gcmap.php' + window.location.search,'map',{
    useMapproxy:true,
    mapProxyBaseUrl:clientConfig.MAPPROXY_URL,
    baseUrl: GisClientBaseUrl,
    rootPath: '../../',
    mapOptions:{
      controls:[
        new OpenLayers.Control.Navigation(),
        new OpenLayers.Control.Attribution(),
        new OpenLayers.Control.LoadingPanel(),
        new OpenLayers.Control.PanZoomBar(),
        new OpenLayers.Control.ScaleLine(),
        new OpenLayers.Control.LayerTree({
          gc_id: 'control-layertree',
          emptyTitle:'',
          div:OpenLayers.Util.getElement('layertree-tree')
        }),
        createLayerLegend()
      ]
    },
    callback:initMap
  });
})
}

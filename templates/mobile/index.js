var sidebarPanel = {
  closeTimeout: null,
  isOpened: false,
  closedWidth: 45,
  smallTableSize: 300,
  init: function(selector) {
    var self = this;
    this.selector = selector;
    this.$element = $(selector);
    this.$parentElement = this.$element.parent();
    this.closedWidth = parseInt(this.$parentElement.first().css('width'),10);
    if (typeof(clientConfig.RESULT_SMALLTABLE_SIZE) != 'undefined')
      this.smallTableSize = clientConfig.RESULT_SMALLTABLE_SIZE<$(document).width() ? clientConfig.RESULT_SMALLTABLE_SIZE : $(document).width();

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
  getCSSWidth: function () {
    var self = this;
    var el = this.$parentElement.first();
    el.removeAttr('style');
    var resizeTimeout = setTimeout(function() {
      self.closedWidth = parseInt(el.css('width'),10);
      if (el.hasClass('panel-open')) {
        var wr = self.closedWidth - 20;
        el.css('right', wr+'px');
        el.width($('#resultpanel').hasClass('smalltable') ? self.smallTableSize : (($(document).width() / 4) * 3));
      }
    }, 100);
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
    var el = this.$parentElement.first();
    var w = this.smallTableSize;
    var wr = this.closedWidth - 20;
    el.width(w);
    el.addClass("panel-open");
    $("#resultpanel").addClass("smalltable");
    $('div.panel-header', this.$element).show();
    $('#map-overlay-panel').css('right', wr+'px');
    this.isOpened = true;
  },
  close: function() {
    var el = this.$parentElement.first();
    el.removeAttr('style');
    el.removeClass("panel-open");
    $("#resultpanel").addClass("smalltable");
    $('div.panel-header', this.$element).hide();

    this.isOpened = false;
  },
  expand: function() {
    var el = this.$parentElement.first();
    var w = ($(document).width() / 4) * 3;
    el.width(w);
    $('#resultpanel').find('.featureTypeData').first().slideDown(200);
    $('#resultpanel').removeClass('smalltable');
    $('.panel-expand', this.$element).hide();
    $('.panel-collapse', this.$element).show();
  },
  collapse: function() {
    var el = this.$parentElement.first();
    el.width(this.smallTableSize);
    $('#resultpanel').addClass('smalltable');
    $('.panel-expand', this.$element).show();
    $('.panel-collapse', this.$element).hide();
  }
};

function fastNavigate(chk, self) {
  if(chk.checked){
    $(".dataLayersDiv").hide();
    $("div.fast-navigate").show();
    self.activeLayers = [];
    for(var i=0;i<self.map.layers.length;i++){
      if(!self.map.layers[i].isBaseLayer && self.map.layers[i].visibility){
        self.map.layers[i].setVisibility(false);
        self.activeLayers.push(self.map.layers[i]);
      }
    }
    self.mapsetTileLayer.setVisibility(true);
  } else {
    $(".dataLayersDiv").show();
    $("div.fast-navigate").hide();
    self.mapsetTileLayer.setVisibility(false);
    for(var i=0; i<self.activeLayers.length;i++)
      self.activeLayers[i].setVisibility(true);
    $("#checkbox_fastNavigate").checkboxradio("refresh");
  }
}

function createSideToolbar(innerMap) {
  sideBar = new OpenLayers.GisClient.Toolbar({
    div:document.getElementById("map-sidebar"),
    createControlMarkup:customCreateControlMarkup
  });
  var defaultControl = new OpenLayers.Control.DragPan({
    id: "move",
    iconclass:"glyphicon-white glyphicon-move",
    title:"Sposta",
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
        var self=this;
        self.panel_div.innerHTML +='<span class="floating-message">Rilevamento posizione in corso</span>';
      }
    }
  });
  geolocateControl.events.register('locationfailed', this, function() {
    alert('Posizione GPS non acquisita');
    $('.floating-message').remove();
    innerMap.getControlsByClass("OpenLayers.Control.Geolocate")[0].deactivate();
  });
  geolocateControl.events.register('locationuncapable', this, function() {
    alert('Acquisizione della posizione GPS non supportata dal browser');
    $('.floating-message').remove();
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
          innerMap.getControlsByClass("OpenLayers.Control.TouchNavigation")[0].dragPan.deactivate();
          innerMap.currentControl=this
        },
        'deactivate': function(){
          innerMap.getControlsByClass("OpenLayers.Control.TouchNavigation")[0].dragPan.activate();}
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
    geolocateControl
  ]);
  sideBar.defaultControl = defaultControl;
  innerMap.addControl(sideBar);
}

function manageResize() {
  var onResize = function() {
    if($(window).width() < 1000) $('#map-coordinates').hide();
    var panelContentHeight = $(window).height() - $('div.panel-header').height() - $('#map-footer').height() - 35;
    $('#sidebar-panel div.panel-content').height(panelContentHeight);
    sidebarPanel.getCSSWidth();
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
  OpenLayers.Handler.Feature.prototype.clickTolerance = 20;
  document.title = this.mapsetTitle;
  var serviceURL = this.baseUrl + "services/";
  var rootPath = '../../';
  sidebarPanel.init('#sidebar-panel');
  if(this.mapsetTiles){
    for(i=0;i<this.map.layers.length;i++){
      if(!this.map.layers[i].isBaseLayer && this.map.layers[i].visibility){
        this.map.layers[i].setVisibility(false);
        this.activeLayers.push(this.map.layers[i]);
      }
    }
    $(".dataLayersDiv").hide();
    this.mapsetTileLayer.setVisibility(true);
    var chk = $("#checkbox_fastNavigate");
    $(".dataLbl").html('<input type="checkbox" name="checkbox_fastNavigate" id="checkbox_fastNavigate" class="custom" data-mini="true"><label for="checkbox_fastNavigate">Attiva navigazione veloce</label>');
    chk.checkboxradio();
    chk.prop( "checked", true ).checkboxradio( "refresh" );
    $(".dataLbl").append($("<div class='fast-navigate'>STAI NAVIGANDO SULLA MAPPA IMPOSTATA SUI LIVELLI VISIBILI IN AVVIO.<BR />DISATTIVA LA NAVIGAZIONE VELOCE PER TORNARE ALL'ALBERO DEI LIVELLI</div>"))
    var self = this;
    chk.change(function() { fastNavigate(this, self);});
  }
  if(ConditionBuilder) {
    ConditionBuilder.baseUrl = this.baseUrl;
    ConditionBuilder.resourcesPath = rootPath + 'resources/';
  }
  var GCLayers = createGCMapLayers(this.map);
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
}

$.when(configLoaded, wrapperConfigLoaded).then($(document).ready(function() {
  GisClientMap = new OpenLayers.GisClient(GisClientBaseUrl + 'services/gcmap.php' + window.location.search,'map',{
    useMapproxy:true,
    mapProxyBaseUrl:clientConfig.MAPPROXY_URL,
    baseUrl: GisClientBaseUrl,
    rootPath: '../../',
    mapOptions:{
      controls:[
        new OpenLayers.Control.Attribution(),
        new OpenLayers.Control.LoadingPanel(),
        new OpenLayers.Control.ScaleLine(),
        new OpenLayers.Control.TouchNavigation({
          dragPanOptions: {
            enableKinetic: true
          }
        }),
        new OpenLayers.Control.LayerTree({
          emptyTitle:'',
          div:OpenLayers.Util.getElement('layertree-tree')
        }),
        createLayerLegend()
      ]
    },
    callback:initMap
  });
  initAdvancedButtons();
}));

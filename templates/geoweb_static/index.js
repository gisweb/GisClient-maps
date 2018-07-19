var GisClientMap;

window.GCComponents = {};

window.GCComponents["Functions"] = {};

window.GCComponents["InitFunctions"] = {};

window.GCComponents["SideToolbar.Buttons"] = {
    buttons: [],
    addButton: function(id, title, icon, buttonFunction, customProperties) {
        var b = {
            id: id,
            title: title,
            iconName: icon,
            buttonFunction: buttonFunction
        };
        if (typeof(customProperties) == 'object' && customProperties !== null) {
            b.customProperties = customProperties;
        }
        this.buttons.push(b)
        return b;
    }
};

window.GCComponents["Controls"] = {
    controls: [],
    addControl: function(controlName, createFunction) {
        if (typeof(createFunction) !== "function")
            return null;
        var b = {
            controlName: controlName,
            createFunction: createFunction
        };
        this.controls.push(b);
        return b;
    }
};

window.GCComponents["Layers"] = {
    layers: [],
    addLayer: function(layerName, options, events) {
        var b = {
            layerName: layerName,
            options: options,
            events: events
        };
        this.layers.push(b);
        return b;
    }
};

createGCToolbarButtons = function() {
    var ext = window.GCComponents["SideToolbar.Buttons"];
    var result = [];
    ext.buttons.forEach(function(b) {
        var olb = new OpenLayers.Control.Button({
            id: b.id,
            title: b.title,
            iconclass: b.iconName,
            trigger: b.buttonFunction
         });
         if (typeof(b.customProperties) == 'object' && b.customProperties !== null) {
             $.each (b.customProperties, function(propName, propValue) {
                 olb[propName] = propValue;
             });
             if (result.length > 0 && typeof(olb.button_group) != 'undefined') {
                 var lastIdx = result.length -1;
                 if (result[lastIdx].button_group !== olb.button_group) {
                     if(typeof(olb.tbarpos) == 'undefined')
                         olb.tbarpos = 'first';
                     if(typeof(result[lastIdx].tbarpos) == 'undefined')
                        result[lastIdx].tbarpos = 'last';
                     else if (result[lastIdx].tbarpos == 'first')
                        result[lastIdx].tbarpos = 'alone';
                }
            }
        }
        result.push(olb);
    });
    if (result.length > 0 ) {
        if(typeof(result[result.length -1].tbarpos) == 'undefined')
            result[result.length -1].tbarpos = 'last';
        else if (result[result.length -1].tbarpos == 'first')
            result[result.length -1].tbarpos = 'alone';
    }
    return result;
}

createGCMapControls = function(map, commonProperties) {
    var ext = window.GCComponents["Controls"];
    var result = {};
    ext.controls.forEach(function(b) {
        var controlName = b.controlName;
        var olc = b.createFunction(map);
        if (typeof(commonProperties) == 'object' && commonProperties !== null) {
            $.each (b.customProperties, function(propName, propValue) {
                olc[propName] = propValue;
            });
        }
        result[controlName] = olc;
        map.addControl(result[controlName]);
    });
    return result;
}

createGCMapLayers = function(map) {
    var ext = window.GCComponents["Layers"];
    var result = [];
    ext.layers.forEach(function(b) {
        var oll = new OpenLayers.Layer.Vector(b.layerName, b.options);
        oll.events.on(b.events);
        result.push(oll);
        map.addLayer(oll);
    });
    return result;
}

var sidebarPanel = {
    closeTimeout: null,
    isOpened: false,
    // **** Avoid ghost chicks from JQuery/Openlayers conflicts in mobile browsers
    handleEvent: false,
    smallTableSize: 300,

    init: function(selector) {
        var self = this;

        if (typeof(RESULT_SMALLTABLE_SIZE) != 'undefined') {
            self.smallTableSize = RESULT_SMALLTABLE_SIZE<$(document).width()?RESULT_SMALLTABLE_SIZE:$(document).width();
        }
        self.selector = selector;
        self.$element = $(selector);

        $('.panel-close', self.$element).click(function(){
            GisClientMap.map.getControlsBy('id', 'button-layertree')[0].deactivate();
            GisClientMap.map.getControlsBy('id', 'button-resultpanel')[0].deactivate();
            self.close();
        });
        $('.panel-expand', self.$element).click(function(){
            self.expand();
        });
        $('.panel-collapse', self.$element).click(function(){
            self.collapse();
        });

        $('.panel-clearresults').hide();

        // **** Avoid ghost chicks from JQuery/Openlayers conflicts in mobile browsers
        $("#map-sidebar").unbind('mouseup').mouseup(function(e){
            self.handleEvent = true;
            return false;
        });
    },

    show: function(panelId) {
        var self = this;
        var panels = $('div.panel-content', self.$element).children('div').toArray();
        for (var i = 0; i < panels.length; i++) {
            if (panels[i].id === panelId) {
                $('#'+panels[i].id, self.$element).show();
            }
            else {
                $('#'+panels[i].id, self.$element).hide();
                var ctrlBtn = GisClientMap.map.getControlsBy('sidebar_panel', panels[i].id);
                for (var j= 0; j < ctrlBtn.length; j++) {
                    ctrlBtn[j].deactivate();
                    if(typeof(ctrlBtn[j].gc_control) != 'undefined') {
                        GisClientMap.map.getControlsBy('gc_id', ctrlBtn[j].gc_control)[0].deactivate();
                    }
                }
            }

        }

        self.open();
    },

    hide: function(panelId) {
        var self = this;

        $('#'+panelId, self).hide();

        self.closeTimeout = setTimeout(function() {
            self.close();
        }, 100);
    },

    open: function() {
        if(this.closeTimeout) {
            clearTimeout(this.closeTimeout);
            this.closeTimeout = null;
        }

        var el = $("#map-overlay-panel");
        //var w = width || 300;
        var w = this.smallTableSize;
        //var ell = document.getElementById("map-overlay-panel");
        //ell.style.width = "300px";

        //el.css({width:w+"px"});
        el.animate({width:w+"px"});
        el.addClass("panel-open");
        if(w == this.smallTableSize) {
            $("#resultpanel").addClass("smalltable");
        }
        $('div.panel-header', this.$element).show();
        $('#map-overlay-panel').css('right', '25px');

        this.isOpened = true;
    },

    close: function() {
        var el = $("#map-overlay-panel");
        //var w = width || 45;
        var w = 45;
        //var ell = document.getElementById("map-overlay-panel");
        //ell.style.width = "45px";

        //el.css({width:w+"px"});
        el.animate({width:w+"px"});
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

var customCreateControlMarkup = function(control) {
    var button = document.createElement('a'),
        icon = document.createElement('span'),
        textSpan = document.createElement('span');
    //icon.className="myicon glyphicon-whitLIKEe ";
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

var initMap = function(){
    var map=this.map;

    // **** Map configuration Parameters
    // **** TODO: in config file
    map.Z_INDEX_BASE['Popup'] = 1500;
    map.Z_INDEX_BASE['Control'] = 1550;
    map.fractionalZoom = false;

    var self = this;

    document.title = this.mapsetTitle;

    var serviceURL = self.baseUrl + "services/";
    var rootPath = '../../';

    sidebarPanel.init('#sidebar-panel');

    //SE HO SETTATO LA NAVIGAZIONE VELOCE????
    if (typeof window.GCComponents.InitFunctions.setFastNavigate === "function")
        window.GCComponents.InitFunctions.setFastNavigate(this.map);

    if(ConditionBuilder) {
        ConditionBuilder.baseUrl = self.baseUrl;
        ConditionBuilder.resourcesPath = rootPath + 'resources/';
    }
    var GCLayers = createGCMapLayers(this.map);
    var GCButtons = createGCToolbarButtons();
    var GCControls = createGCMapControls(this.map, null);

    // **** Remove if some base controls (first group) are turned into Components
    if(typeof(GCButtons[0].tbarpos) == 'undefined')
      GCButtons[0].tbarpos = 'first';

    if (typeof(window.GCComponents.InitFunctions.setQueryToolbar) != 'undefined'){
        window.GCComponents.InitFunctions.setQueryToolbar(this.map);
    }
    else {
        $('#map-fast-search select').hide();
        $('#map-fast-search a.searchButton').hide();
    }

    //******************** TOOLBAR VERTICALE *****************************************

    var sideBar = new OpenLayers.GisClient.Toolbar({
        div:document.getElementById("map-sidebar"),
        createControlMarkup:customCreateControlMarkup
    });

    var defaultControl = new OpenLayers.Control.DragPan({iconclass:"glyphicon-white glyphicon-move", title:"Sposta", eventListeners: {'activate': function(){
    map.currentControl && map.currentControl.deactivate();map.currentControl=this}}});
    map.defaultControl = defaultControl;

    var geolocateControl = new OpenLayers.Control.Geolocate({
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
                self.title="Rilevamento posizione in corso";
            }
        }
    });
    geolocateControl.events.register('locationfailed', self, function() {
        alert('Posizione GPS non acquisita');
        map.getControlsByClass("OpenLayers.Control.Geolocate")[0].deactivate();
    });
    geolocateControl.events.register('locationuncapable', self, function() {
        alert('Acquisizione della posizione GPS non supportata dal browser');
        map.getControlsByClass("OpenLayers.Control.Geolocate")[0].deactivate();
    });
    geolocateControl.events.register('locationupdated', self, function(event) {
        var point = event.point;
        //alert('Found position X:' + point.x + ', Y:' + point.this.redlineLayer,y);
        var lonLat = new OpenLayers.LonLat(point.x, point.y);
        if(!map.isValidLonLat(lonLat)) return alert('Posizione '+lonLat.lon+' '+lonLat.lat+' non valida');
        if(!map.maxExtent.containsLonLat(lonLat)) return alert('Posizione '+lonLat.lon+' '+lonLat.lat+' fuori extent');
        map.setCenter(lonLat);
        map.zoomToScale(1000, true);
    });


    sideBar.addControls([
        //new OpenLayers.Control.ZoomIn({tbarpos:"first", iconclass:"glyphicon-white glyphicon-white glyphicon-plus", title:"Zoom avanti"}),

        new OpenLayers.Control.ZoomBox({tbarpos:"first", iconclass:"glyphicon-white glyphicon-zoom-in", title:"Zoom riquadro", eventListeners: {'activate': function(){map.currentControl && map.currentControl.deactivate();map.currentControl=this}}}),
        new OpenLayers.Control.ZoomOut({iconclass:"glyphicon-white glyphicon-zoom-out", title:"Zoom indietro"}),
        defaultControl,
        new OpenLayers.Control.Button({
            trigger: function() {
                if (this.map) {
                    this.map.zoomToExtent(this.map.maxExtent);
                }
            },
            iconclass:"glyphicon-white glyphicon-globe",
            title:"Zoom estensione"
        }),
        geolocateControl

    ].concat(GCButtons));

    sideBar.defaultControl = sideBar.controls[2];
    map.addControl(sideBar);

    //VISUALIZZAZIONE DELLE COORDINATE
    var projection = this.mapOptions.displayProjection || this.mapOptions.projection;
    var v = projection.split(":");
    map.addControl(new OpenLayers.Control.MousePosition({
        element:document.getElementById("map-coordinates"),
        prefix: '<a target="_blank" ' + 'href="http://spatialreference.org/ref/epsg/' + v[1] + '/">' + projection + '</a> coordinate: '
    }));

    //ELENCO DELLE SCALE
    var scale, zoomLevel = 0, option;

    //lo zoomLevel non parte da minZoomLevel ma sempre da 0, quindi lo zoomLevel 0 è sempre = al minZoomLevel
    for(var i=0;i<this.mapOptions.resolutions.length;i++){
        scale = OpenLayers.Util.getScaleFromResolution (this.mapOptions.resolutions[i],this.mapOptions.units);
        option = $("<option></option>");
        option.val(zoomLevel);
        zoomLevel += 1;
        scale = scale<1001?Math.round(scale/10)*10:Math.round(scale/1000)*1000;
        option.text('Scala 1:'+ scale);
        $('#map-select-scale').append(option);
    }
    $('#map-select-scale').val(map.getZoom());
    $('#map-select-scale').change(function(){
        map.zoomTo(this.value);
    });
    map.events.register('zoomend', null, function(){
      $('#map-select-scale').val(map.getZoom());
      window.GCComponents["Controls"].controls.forEach(function(b) {
        var ctrl = map.getControlsBy('gc_id', b.controlName)[0];
        if(ctrl.zoomEnd != undefined)
          ctrl.zoomEnd(map.getZoom());
      });
    });
    $('#mapset-title').html(GisClientMap.title);

    if(!GisClientMap.logged_username) {
        $('#mapset-login').html("<a action='login' href='#'>Accedi</a>");

        $('#LoginWindow #LoginButton').on('click',function(e){
            e.preventDefault();

            $.ajax({
                url: self.baseUrl + 'login.php',
                type: 'POST',
                dataType: 'json',
                data: {
                    username: $('#LoginWindow input[name="username"]').val(),
                    password: md5($('#LoginWindow input[name="password"]').val())
                },
                success: function(response) {
                    if(response && typeof(response) == 'object' && response.result == 'ok') {
                        window.location.reload();
                    } else {
                        alert('Username e/o password errati');
                    }
                },
                failure: function() {
                    alert('Errore di sistema');
                }
            });
        });
        $('#LoginWindow .close').on('click',function(e){
            e.preventDefault();
            $('#LoginWindow input[name="username"]').val("");
            $('#LoginWindow input[name="password"]').val("");
        });

    } else {
        $('#mapset-login').html(GisClientMap.logged_username+', <a href="'+self.baseUrl+'logout.php'+location.search+'" action="logout">Logout</a>');
    }

    $('#mapset-login a[action="login"]').on('click',function(event){
        event.preventDefault();
        $('#LoginWindow').modal('show');
    });

    var onResize = function() {
        if($(window).width() < 1000) $('#map-coordinates').hide();
        var panelContentHeight = $(window).height() - $('div.panel-header').height() - $('#map-footer').height() - 35;
        $('#sidebar-panel div.panel-content').height(panelContentHeight);
    }
    $(window).resize(onResize);
    onResize.call();

    var len = GisClientMap.mapsets.length, i, mapset,
        options = [], option;

    for(i = 0; i < len; i++) {
        mapset = GisClientMap.mapsets[i];

        option = '<option value="'+mapset.mapset_name+'"';
        if(mapset.mapset_name == GisClientMap.mapsetName) option += ' selected ';
        option += '>'+mapset.mapset_title+'</option>';

        options.push(option);
    }
    $('#mapset-switcher select').html(options);
    $('#mapset-switcher select').change(function() {
        var mapset = $(this).val();
        if(mapset == GisClientMap.mapsetName) return;

        var currentUrl = window.location.href;
        var newUrl = currentUrl.replace('mapset='+GisClientMap.mapsetName, 'mapset='+mapset);

        window.location.href = newUrl;
    });
    if(generateHints != undefined)
      generateHints();


}//END initMap


    var layerLegend = new OpenLayers.Control.LayerLegend({
        div: OpenLayers.Util.getElement('layerlegend'),
        autoLoad: false
    });
    $('a[href="#layerlegend"]').click(function() {
        if(!layerLegend.loaded) {
            layerLegend.load();
        }
    });

    OpenLayers.ImgPath = "../../resources/themes/openlayers/img/";
    var GisClientBaseUrl = GISCLIENT_URL + "/"
    GisClientMap = new OpenLayers.GisClient(GisClientBaseUrl + 'services/gcmap.php' + window.location.search,'map',{
        useMapproxy:true,
        mapProxyBaseUrl:MAPPROXY_URL,
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
                layerLegend
            ]
        },
        callback:initMap
    })

});


OpenLayers.GisClient.Toolbar = OpenLayers.Class(OpenLayers.Control.Panel, {
    CLASS_NAME: "OpenLayers.GisClient.Toolbar",

    activateControl: function(control) {
        var len = this.controls.length, i;

        if(control.exclusiveGroup) {
            for(i = 0; i < len; i++) {
                if(this.controls[i] != control &&
                    this.controls[i].exclusiveGroup == control.exclusiveGroup) {
                    this.controls[i].deactivate();
                }
            }
        }

        OpenLayers.Control.Panel.prototype.activateControl.apply(this, [control]);
    }
});

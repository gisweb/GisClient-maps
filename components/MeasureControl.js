// **** Measure toolbar control
window.GCComponents["Controls"].addControl('control-measure', function(map){
    return new  OpenLayers.Control.Panel({
        gc_id: 'control-measure',
        createControlMarkup:customCreateControlMarkup,
        div:document.getElementById("map-toolbar-measure"),
        autoActivate:false,
        saveState:true
    })
});

// **** Toolbar button
window.GCComponents["SideToolbar.Buttons"].addButton (
    'button-measure',
    'Misure',
    'glyphicon-white glyphicon-resize-small',
    function() {
        var ctrl = this.map.getControlsBy('gc_id', 'control-measure')[0];
        
        if (ctrl.controls.length == 0) {
            var isGeodesicMeasure = (ctrl.map.projection == 'EPSG:3857' || ctrl.map.projection == 'EPSG:4326')?true:false;
            var controls = [
                    new OpenLayers.Control.DynamicMeasure(OpenLayers.Handler.Path,{
                        iconclass:"glyphicon-white glyphicon-resize-horizontal",
                        text:"Misura distanza",
                        title:"Misura distanza",
                        geodesic:isGeodesicMeasure,
                        eventListeners: {
                            'activate': function() {
                                this.map.currentControl.deactivate();
                                this.map.currentControl=this;
                            }
                        }
                    }),
                    new OpenLayers.Control.DynamicMeasure(OpenLayers.Handler.Polygon,{
                        iconclass:"glyphicon-white glyphicon-retweet",
                        text:"Misura superficie",
                        title:"Misura superficie",
                        geodesic:isGeodesicMeasure,
                        eventListeners: {
                            'activate': function() {
                                this.map.currentControl.deactivate();
                                this.map.currentControl=this;
                            }
                        }
                    })
                ];
            ctrl.addControls(controls);
        }

        if (sidebarPanel.handleEvent || typeof(sidebarPanel.handleEvent) === 'undefined')
        {
            if (ctrl.active) {
                ctrl.deactivate();
                this.deactivate();
            }
            else
            {
                ctrl.activate();
                this.activate();
            }
            if (typeof(sidebarPanel.handleEvent) !== 'undefined')
                sidebarPanel.handleEvent = false;
        }
    },
    {button_group: 'tools'}
);

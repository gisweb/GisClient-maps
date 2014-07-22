OpenLayers.GisClient.OverviewMap = OpenLayers.Class(OpenLayers.Control.OverviewMap, {


    initialize: function(options) {
        //OpenLayers.Control.OverviewMap.prototype.initialize.apply(this, [options]);
        this.layers = [];
        this.handlers = {};
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        this.displayClass = 'gcOverviewMap';
    },
    
    show: function(e) {
        this.element.style.display = '';
        this.showToggle(false);
        if (e != null) {
            OpenLayers.Event.stop(e);                                            
        }
    },
    
    hide: function(e) {
        this.element.style.display = 'none';
        this.showToggle(true);
        if (e != null) {
            OpenLayers.Event.stop(e);                                            
        }
    },
    
    updateOverview: function() {
/*         var mapRes = this.map.getResolution();
        var targetRes = this.ovmap.getResolution();
        var resRatio = targetRes / mapRes;
        if(resRatio > this.maxRatio) {
            // zoom in overview map
            targetRes = this.minRatio * mapRes;            
        } else if(resRatio <= this.minRatio) {
            // zoom out overview map
            targetRes = this.maxRatio * mapRes;
        }
        var center;
        if (this.ovmap.getProjection() != this.map.getProjection()) {
            center = this.map.center.clone();
            center.transform(this.map.getProjectionObject(),
                this.ovmap.getProjectionObject() );
        } else {
            center = this.map.center;
        } */

        this.updateRectToMap();
    },
    
    createMap: function() {
        // create the overview map

        var options = OpenLayers.Util.extend(
                        {controls: [], maxResolution: 'auto', theme:null,
                         fallThrough: false}, this.mapOptions);
        var layers = [],
            len = this.layers.length, layer, i;
        
        var emptyBaseLayer = new OpenLayers.Layer.Image('EMPTY_BASE_LAYER_OV',OpenLayers.ImgPath +'blank.gif', this.map.maxExtent, new OpenLayers.Size(1,1),{
            maxResolution:this.map.resolutions[0]*6,
            numZoomLevels:this.map.resolutions.length+3, 
            displayInLayerSwitcher:true, 
            isBaseLayer:true
        });
        layers.push(emptyBaseLayer);
        
        for(i = 0; i < len; i++) {
            layer = this.layers[i];
            
            layers.push(layer); //if momentaneo...
        }   

        options.projection = this.map.projection;
        this.ovmap = new OpenLayers.Map(this.mapDiv, options);
        this.ovmap.viewPortDiv.appendChild(this.extentRectangle);
        
        // prevent ovmap from being destroyed when the page unloads, because
        // the OverviewMap control has to do this (and does it).
        OpenLayers.Event.stopObserving(window, 'unload', this.ovmap.unloadDestroy);

        this.ovmap.addLayers(layers);
        this.ovmap.zoomToMaxExtent();
        // check extent rectangle border width
        this.wComp = parseInt(OpenLayers.Element.getStyle(this.extentRectangle,
                                               'border-left-width')) +
                     parseInt(OpenLayers.Element.getStyle(this.extentRectangle,
                                               'border-right-width'));
        this.wComp = (this.wComp) ? this.wComp : 2;
        this.hComp = parseInt(OpenLayers.Element.getStyle(this.extentRectangle,
                                               'border-top-width')) +
                     parseInt(OpenLayers.Element.getStyle(this.extentRectangle,
                                               'border-bottom-width'));
        this.hComp = (this.hComp) ? this.hComp : 2;

        this.handlers.drag = new OpenLayers.Handler.Drag(
            this, {move: this.rectDrag, done: this.updateMapToRect},
            {map: this.ovmap}
        );
        this.handlers.click = new OpenLayers.Handler.Click(
            this, {
                "click": this.mapDivClick
            },{
                "single": true, "double": false,
                "stopSingle": true, "stopDouble": true,
                "pixelTolerance": 1,
                map: this.ovmap
            }
        );
        this.handlers.click.activate();
        
        this.rectEvents = new OpenLayers.Events(this, this.extentRectangle,
                                                null, true);
        this.rectEvents.register("mouseover", this, function(e) {
            if(!this.handlers.drag.active && !this.map.dragging) {
                this.handlers.drag.activate();
            }
        });
        this.rectEvents.register("mouseout", this, function(e) {
            if(!this.handlers.drag.dragging) {
                this.handlers.drag.deactivate();
            }
        });

        if (this.ovmap.getProjection() != this.map.getProjection()) {
            var sourceUnits = this.map.getProjectionObject().getUnits() ||
                this.map.units || this.map.baseLayer.units;
            var targetUnits = this.ovmap.getProjectionObject().getUnits() ||
                this.ovmap.units || this.ovmap.baseLayer.units;
            this.resolutionFactor = sourceUnits && targetUnits ?
                OpenLayers.INCHES_PER_UNIT[sourceUnits] /
                OpenLayers.INCHES_PER_UNIT[targetUnits] : 1;
        }
    },
    
    draw: function() {
        OpenLayers.Control.prototype.draw.apply(this, arguments);
        if (this.layers.length === 0) {
            if (this.map.baseLayer) {
                var layer = this.map.baseLayer.clone();
                this.layers = [layer];
            } else {
                this.map.events.register("changebaselayer", this, this.baseLayerDraw);
                return this.div;
            }
        }

        // create overview map DOM elements
        this.element = document.createElement('div');
        this.element.className = this.displayClass + 'Element';
        this.element.style.display = 'none';

        this.mapDiv = document.createElement('div');
        this.mapDiv.style.width = this.size.w + 'px';
        this.mapDiv.style.height = this.size.h + 'px';
        this.mapDiv.style.position = 'relative';
        this.mapDiv.style.overflow = 'hidden';
        this.mapDiv.id = OpenLayers.Util.createUniqueID('overviewMap');
        
        this.extentRectangle = document.createElement('div');
        this.extentRectangle.style.position = 'absolute';
        this.extentRectangle.style.zIndex = 1000;  //HACK
        this.extentRectangle.className = this.displayClass+'ExtentRectangle';

        this.element.appendChild(this.mapDiv);
        
        var lockExtent = document.createElement('a');
        lockExtent.href = '#';
        lockExtent.innerHTML = 'Lock Extent';
        
        var maxExtent = document.createElement('a');
        maxExtent.href = '#';
        maxExtent.innerHTML = 'Max Extent';
        
        var separator = document.createElement('span');
        separator.innerHTML = ' | ';
        
        var linksElement = document.createElement('div');
        linksElement.appendChild(lockExtent);
        linksElement.appendChild(separator);
        linksElement.appendChild(maxExtent);
        
        this.element.appendChild(linksElement);

        this.div.appendChild(this.element);
        
        var me = this;
        lockExtent.addEventListener('click', function(event) {
            event.stopPropagation();
            
            me.ovmap.zoomToExtent(me.map.getExtent());
            me.updateRectToMap();
        });
        maxExtent.addEventListener('click', function(event) {
            event.stopPropagation();
            
            me.ovmap.zoomToMaxExtent();
            me.updateRectToMap();
        });

        // Optionally add min/max buttons if the control will go in the
        // map viewport.
        this.div.className += " " + this.displayClass + 'Container';
        
        if(this.map.getExtent()) {
            this.update();
        }
        
        this.map.events.on({
            buttonclick: this.onButtonClick,
            moveend: this.update,
            scope: this
        });
        
        if (this.maximized) {
            this.maximizeControl();
        }
        return this.div;
    },

    CLASS_NAME: "OpenLayers.GisClient.OverviewMap"
});

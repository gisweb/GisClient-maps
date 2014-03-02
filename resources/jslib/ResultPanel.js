OpenLayers.Control.ResultPanel = OpenLayers.Class(OpenLayers.Control, {

    initialize: function(options) {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
    },

    destroy: function() {
        //clear out layers info and unregister their events
        this.clearLayersArray("base");
        this.clearLayersArray("data");
        this.map.events.un({
            buttonclick: this.onButtonClick,
            addlayer: this.redraw,
            changelayer: this.checkState,
            removelayer: this.redraw,
            changebaselayer: this.checkState,
            scope: this
        });
        this.events.unregister("buttonclick", this, this.onButtonClick);

        OpenLayers.Control.prototype.destroy.apply(this, arguments);
    },

    draw: function() {
        OpenLayers.Control.prototype.draw.apply(this);

        this.loadHeaders();

        return this.div;
    },

    /**
     * Method: onButtonClick
     *
     * Parameters:
     * evt - {Event}
     */
    onButtonClick: function(evt) {
        var button = evt.buttonElement;
        if (button === this.minimizeDiv) {
            this.minimizeControl();
        } else if (button === this.maximizeDiv) {
            this.maximizeControl();
        } else if (button._layerSwitcher === this.id) {
            if (button["for"]) {
                button = document.getElementById(button["for"]);
            }
            if (!button.disabled) {
                if (button.type == "radio") {
                    button.checked = true;
                    this.map.setBaseLayer(this.map.getLayer(button._layer));
                } else {
                    button.checked = !button.checked;
                    this.updateMap();
                }
            }
        }
    },

    /**
     * Method: clearLayersArray
     * User specifies either "base" or "data". we then clear all the
     *     corresponding listeners, the div, and reinitialize a new array.
     *
     * Parameters:
     * layersType - {String}
     */
    clearLayersArray: function(layersType) {
        this[layersType + "LayersDiv"].innerHTML = "";
        this[layersType + "Layers"] = [];
    },


    /**
     * Method: checkRedraw
     * Checks if the layer state has changed since the last redraw() call.
     *
     * Returns:
     * {Boolean} The layer state changed since the last redraw() call.
     */
    checkRedraw: function() {


        //BOH NON SERVE
        return true;
    },
	

    /**
     * Method: redraw
     * Goes through and takes the current state of the Map and rebuilds the
     *     control to display that state. Groups base layers into a
     *     radio-button group and lists each data layer with a checkbox.
     *
     * Returns:
     * {DOMElement} A reference to the DIV DOMElement containing the control
     */
    redraw: function(mySelection) {
        //if the state hasn't changed since last redraw, no need
        // to do anything. Just return the existing div.
        if (!this.checkRedraw()) {
            return this.div;
        }

		
		console.log('ricarico il pannello dei risultati');
        console.log(mySelection.wfsCache)

/*

        var featureGrid = this.getFeatureGrid(e.featureType);
        var cols = jQuery(featureGrid).datagrid('getColumnFields');
        var aData = [];
        for (var i = 0; i < e.features.length; i++) {
            row = {};
            for (var j = 0; j < cols.length; j++) {
                row[cols[j]] = e.features[i].attributes[cols[j]];
            };
            aData.push(row)
        };

        jQuery(featureGrid).datagrid('loadData', aData);

        //leggo il risultato e costruisco la stringa json per il datagrid
*/

        return this.div;
    },


    getFeatureGrid: function(featureType){
        var id = 'grid_' + featureType.typeName;
        var myDatagrid = OpenLayers.Util.getElement(id);
        if(!myDatagrid){
            myDatagrid = document.createElement("table");
            myDatagrid.id = id;
            OpenLayers.Element.addClass(myDatagrid, "easyui-datagrid");
            this.div.appendChild(myDatagrid);
            this.div.appendChild(document.createElement("br")); //??????????????????? margin

        }
        //ADD COLUMNS
        var col, aColumns = [];
        for (var i = 0; i < featureType.properties.length; i++) {
            col = featureType.properties[i];
            if(col.header && col.resultType!=4) aColumns.push({field:col.name, title:col.header, width:100});
        };

        var cardview = $.extend({}, $.fn.datagrid.defaults.view, {
            renderRow: function(target, fields, frozen, rowIndex, rowData){
                var cc = [];
                cc.push('<td colspan=' + fields.length + ' style="padding:10px 5px;border:0;">');
                if (!frozen){

                    cc.push('<div style="float:left;margin-left:20px;">');
                    for(var i=0; i<fields.length; i++){
                        var copts = $(target).datagrid('getColumnOption', fields[i]);
                        cc.push('<p><span class="c-label">' + copts.title + ':</span> ' + rowData[fields[i]] + '</p>');
                    }
                    cc.push('</div>');
                }
                cc.push('</td>');
                return cc.join('');
            }
        });

        var options = {
            height:200, 
            top:5, 
            collapsible:true,
            title:featureType.title,
            singleSelect:true, 
            stripped:true, 
            fitColumns:true, 
            columns:[aColumns],
            data:[]
        };

        if(featureType.typeName.indexOf('ARGINE')>0){
            options.view = cardview;
            options.showHeader = false;
        }
        jQuery(myDatagrid).datagrid(options);

        return myDatagrid;
    },


    updateMap: function() {



    },

    /**
     * Method: maximizeControl
     * Set up the labels and divs for the control
     *
     * Parameters:
     * e - {Event}
     */
    maximizeControl: function(e) {

        // set the div's width and height to empty values, so
        // the div dimensions can be controlled by CSS
        this.div.style.width = "";
        this.div.style.height = "";

        this.showControls(false);

        if (e != null) {
            OpenLayers.Event.stop(e);
        }
    },

    /**
     * Method: minimizeControl
     * Hide all the contents of the control, shrink the size,
     *     add the maximize icon
     *
     * Parameters:
     * e - {Event}
     */
    minimizeControl: function(e) {

        // to minimize the control we set its div's width
        // and height to 0px, we cannot just set "display"
        // to "none" because it would hide the maximize
        // div
        this.div.style.width = "0px";
        this.div.style.height = "0px";

        this.showControls(true);

        if (e != null) {
            OpenLayers.Event.stop(e);
        }
    },

    /**
     * Method: showControls
     * Hide/Show all LayerSwitcher controls depending on whether we are
     *     minimized or not
     *
     * Parameters:
     * minimize - {Boolean}
     */
    showControls: function(minimize) {

        this.maximizeDiv.style.display = minimize ? "" : "none";
        this.minimizeDiv.style.display = minimize ? "none" : "";

        this.layersDiv.style.display = minimize ? "none" : "";
    },

    /**
     * Method: loadContents
     * Set up the labels and divs for the control
     */

    loadContents: function() {



    },


    loadHeaders: function() {


        this.layersDiv = document.createElement("div");
        this.layersDiv.id = this.id + "_layersDiv";
        this.layersDiv.innerHTML="PROVA";
        OpenLayers.Element.addClass(this.layersDiv, "layersDiv");
        this.div.appendChild(this.layersDiv);


return;    


    this.layersDiv = document.createElement("div");
        this.layersDiv.id = this.id + "_layersDiv";
        OpenLayers.Element.addClass(this.layersDiv, "layersDiv");
        // layers list div
        this.layersDiv = document.createElement("div");
        this.layersDiv.id = this.id + "_layersDiv";
        OpenLayers.Element.addClass(this.layersDiv, "layersDiv");

        this.baseLbl = document.createElement("div");
        this.baseLbl.innerHTML = OpenLayers.i18n("Base Layer");
        OpenLayers.Element.addClass(this.baseLbl, "baseLbl");

        this.baseLayersDiv = document.createElement("div");
        OpenLayers.Element.addClass(this.baseLayersDiv, "baseLayersDiv");

        this.dataLbl = document.createElement("div");
        this.dataLbl.innerHTML = OpenLayers.i18n("Overlays");
        OpenLayers.Element.addClass(this.dataLbl, "dataLbl");

        this.dataLayersDiv = document.createElement("div");
        OpenLayers.Element.addClass(this.dataLayersDiv, "dataLayersDiv");
		
		this.dataTree = document.createElement("ul");
        OpenLayers.Element.addClass(this.dataTree, "easyui-tree");	
		this.dataLayersDiv.appendChild(this.dataTree);

        if (this.ascending) {
            this.layersDiv.appendChild(this.baseLbl);
            this.layersDiv.appendChild(this.baseLayersDiv);
            this.layersDiv.appendChild(this.dataLbl);
            this.layersDiv.appendChild(this.dataLayersDiv);
        } else {
            this.layersDiv.appendChild(this.dataLbl);
            this.layersDiv.appendChild(this.dataLayersDiv);
            this.layersDiv.appendChild(this.baseLbl);
            this.layersDiv.appendChild(this.baseLayersDiv);
        }


		
		
		
        this.div.appendChild(this.layersDiv);

        // maximize button div
        var img = OpenLayers.Util.getImageLocation('layer-switcher-maximize.png');
        this.maximizeDiv = OpenLayers.Util.createAlphaImageDiv(
                                    "OpenLayers_Control_MaximizeDiv",
                                    null,
                                    null,
                                    img,
                                    "absolute");
        OpenLayers.Element.addClass(this.maximizeDiv, "maximizeDiv olButton");
        this.maximizeDiv.style.display = "none";

        this.div.appendChild(this.maximizeDiv);

        // minimize button div
        var img = OpenLayers.Util.getImageLocation('layer-switcher-minimize.png');
        this.minimizeDiv = OpenLayers.Util.createAlphaImageDiv(
                                    "OpenLayers_Control_MinimizeDiv",
                                    null,
                                    null,
                                    img,
                                    "absolute");
        OpenLayers.Element.addClass(this.minimizeDiv, "minimizeDiv olButton");
        this.minimizeDiv.style.display = "none";

        this.div.appendChild(this.minimizeDiv);
    },

    CLASS_NAME: "OpenLayers.Control.ResultPanel"
});

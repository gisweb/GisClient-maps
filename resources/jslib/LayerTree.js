
OpenLayers.Control.LayerTree = OpenLayers.Class(OpenLayers.Control.LayerSwitcher, {


    emptyTitle:'',

    baselayerData: [],
    overlayData:[],

    initialize: function(options) {
        OpenLayers.Control.LayerSwitcher.prototype.initialize.apply(this, arguments);
    },

    destroy: function() {
        this.map.events.unregister("zoomend", this, this.updadeNodeStatus);
        OpenLayers.Control.LayerSwitcher.prototype.destroy.apply(this, arguments);
    },

    setMap: function(map) {
        OpenLayers.Control.LayerSwitcher.prototype.setMap.apply(this, arguments);
        this.map.events.register("zoomend", this, this.updadeNodeStatus);

        //this.map.events.register('preaddlayer', this, this.addLayer);
        for (var i = 0; i < this.map.layers.length; i++) {
            var layer = this.map.layers[i];
            layer.events.register('loadstart', {layer:layer,control:this}, this.startLoading);
            layer.events.register('loadend', {layer:layer,control:this}, this.endLoading);
            if(layer.displayInLayerSwitcher) this.initTreeData(layer);
        }

    },

    draw: function() {

        OpenLayers.Control.LayerSwitcher.prototype.draw.apply(this);
        this.updadeNodeStatus();

        this.errorDiv = document.createElement("div");
        this.errorDiv.id = this.id + "_errorDiv";
        this.div.appendChild(this.errorDiv);
    },

    addLayer: function(evt) {
        if (evt.layer) {
            evt.layer.events.register('loadstart', this, this.startLoading);
            evt.layer.events.register('loadend', this, this.endLoading);
        }
    },

    startLoading: function() {
        var node = this.control.getNode(this.layer);
        if(node) jQuery(node.target).find('.tree-icon').addClass('icon-mini-loading');
    },

    endLoading: function() {
        var self = this.control;
        var layer = this.layer;
        var node = self.getNode(layer);
        if(node){
            jQuery(node.target).find('.tree-icon').removeClass('icon-mini-loading');
            if(jQuery(layer.div).find('.olImageLoadError').length>0)

                jQuery(node.target).find('.tree-icon')
                    .removeClass('overlay')
                    .addClass('tree-dnd-no')
                    .bind('click', {control:self, title:layer.title, url:jQuery(layer.div).find('.olImageLoadError').attr('src')}, self.getErrors);
            else

                jQuery(node.target).find('.tree-icon')
                .removeClass('tree-dnd-no')
                .addClass('overlay')
                .unbind('click');
        }
    },


    getNode: function(layer){

        var layerTree = layer.isBaseLayer? this.baselayerTree :this.overlayTree;
        return jQuery(layerTree).tree('find',layer.id);

    },


    getErrors: function(evt) {

        var options ={
            width:500,
            height:200,
            modal:true,
            title:'Errore: ' + evt.data.title
        };
        if(evt.data.url)
            options.href = evt.data.url
        else
            options.content = 'I layer contengono degli errori, verificare i singoli leyer....';

        jQuery(evt.data.control.errorDiv).dialog(options)

    },


    redraw: function(e) {
        //if the state hasn't changed since last redraw, no need
        // to do anything. Just return the existing div.
        
        //console.log('redraw')


        if (!this.checkRedraw()) {
            return this.div;
        }


        if(!this.baseTree) this.createBaseTree();       
        if(!this.overlayTree) this.createOverlayTree();


        // Save state -- for checking layer if the map state changed.
        // We save this before redrawing, because in the process of redrawing
        // we will trigger more visibility changes, and we want to not redraw
        // and enter an infinite loop.
        var len = this.map.layers.length;
        var node,layer;
        var self = this;

        this.layerStates = new Array(len);
        for (var i=0; i <len; i++) {
            layer = this.map.layers[i];
            this.layerStates[i] = {
                'name': layer.name,
                'visibility': layer.visibility,
                'inRange': layer.inRange,
                'id': layer.id
            };
        }



//??????CHE ME NE FACCIO
        var containsOverlays = false;
        var containsBaseLayers = false;
        containsBaseLayers = true;
        containsOverlays = true;




        // if no overlays, dont display the overlay label
        this.dataLbl.style.display = (containsOverlays) ? "" : "none";

        // if no baselayers, dont display the baselayer label
        this.baseLbl.style.display = (containsBaseLayers) ? "" : "none";


        return this.div;
    },

    updadeNodeStatus: function(){
 
        for (var i = 0; i < this.map.layers.length; i++) {
            this.checkNodeState(this.map.layers[i])
        };   

    },


    updateLayerVisibility: function(layer, checked){

        if(!this.overlayTree) return;

        var node = jQuery(this.overlayTree).tree('find',layer.id);
        var childs = jQuery(this.overlayTree).tree('getChildren',node.target);
        if(childs.length > 0){
            var layers = [];
            var tileLayer = layer.map.getLayersByName(layer.name + '_tiles') && layer.map.getLayersByName(layer.name + '_tiles')[0];
            jQuery.each(childs ,function(_,child){
                if(child.checked) layers.push(child.attributes.layerParam)
            });

            //controllo qui se devo accendere i figli oppure il tile-layer mapproxy 
            if(tileLayer && layers.length==childs.length){
                layer.setVisibility(false);
                tileLayer.setVisibility(true);
            }
            else{
                if(tileLayer) tileLayer.setVisibility(false);
                if(layer.params["LAYERS"] != layers && layers.length > 0) layer.mergeNewParams({layers:layers});
                layer.setVisibility(layers.length > 0);
            } 
        }
        else{
            layer.setVisibility(checked)
        }

    },


    checkNodeState: function(layer){
        var self = this;
        var inRange;
        var node = self.overlayTree.tree('find',layer.id);

        if(node){
            inRange = layer.inRange;
            self.changeNodeState(node,inRange);
            jQuery.each(self.overlayTree.tree('getChildren',(node.target)),function(index,childNode){
                inRange = layer.nodes && layer.nodes[index] && self.isChildNodeinRange(layer.nodes[index]);
                self.changeNodeState(childNode,inRange);
            })
/*  NON DISABILITO MAI IL NODO DEL TEMA 
            parentNode = self.overlayTree.tree('getParent',(node.target));
            if(parentNode) {
                inRange = jQuery(parentNode.target).next().find(".tree-checkbox").length > jQuery(parentNode.target).next().find(".tree-check-disabled").length
                self.changeNodeState(parentNode, inRange);
            }
*/
        }
    },


    isChildNodeinRange: function(node){
        var scale = this.map.getScale();
        var inRange = ( (!node.maxScale || node.maxScale >= scale) && (!node.minScale || node.minScale >= scale) );
        return inRange;
    },


    changeNodeState: function(node, inRange){
        iconSpan = jQuery(node.target).find(".tree-checkbox");
        titleSpan = jQuery(node.target).find(".tree-title");
        if(inRange && iconSpan.hasClass("tree-check-disabled")){
            iconSpan.removeClass("tree-check-disabled");
            titleSpan.removeClass("tree-title-disabled");
        } 
        if(!inRange && !iconSpan.hasClass("tree-check-disabled")){
            iconSpan.addClass("tree-check-disabled");
            titleSpan.addClass("tree-title-disabled");
        }
    },



    createBaseTree: function(){

        var self = this;

        //clear out previous layers
        this.clearLayersArray("base");

        //SE HO IL TITOLO DEL BASELAYER VUOTO AGGIUNGO IL TITOLO AL NODO DELL'ALBERO E SPSOSTO IL NODO IN ROOT 
        //ALTRIMENTI ELIMINO IL NODO DALL'ALBERO (BASE VUOTA NASCOSTO)
        if(this.emptyTitle == '')
            this.baselayerData = this.baselayerData.slice(1);
        else{
            this.baselayerData[0] = this.baselayerData[0].children[0];
            this.baselayerData[0].text = this.emptyTitle;
        }


        var ulbaseElem = document.createElement("ul");
        OpenLayers.Element.addClass(ulbaseElem, "easyui-tree");
        this.baseLayersDiv.appendChild(ulbaseElem);
        var radioName = self.id + "_radio";

        this.baseTree = jQuery(ulbaseElem).tree({  
            animate:true,
            lines:true,
            data: self.baselayerData,
            formatter:function(node){            
                if(node.children)
                    return node.text;
                else{
                    var val = node.attributes.layer.name; 
                    var id = node.attributes.layer.id;                    
                    var checked = (node.attributes.layer.name == self.map.config.baseLayerName || node.attributes.layer.name == 'EMPTY_BASE_LAYER')?"checked='checked'":"";
                    return '<input type="radio" '+ checked +' id="'+ id +'" name="' + radioName + '">' + node.text;
                }
            },
            onBeforeSelect: function(){
                return false
            },
            onClick: function(node){
                var numChildren = self.baseTree.tree('getChildren',(node.target)).length;
                if(numChildren > 0)
                    self.baseTree.tree('toggle',node.target);
                else if(node.checked)
                    self.baseTree.tree('uncheck',node.target);
                else
                    self.baseTree.tree('check',node.target);
            },

        }); 

        jQuery('input:radio[name="' + radioName+ '"]').change(function(){
            self.map.setBaseLayer(self.map.getLayer(this.id));
        });

    },



    createOverlayTree: function(){

        var self = this;

        //clear out previous layers
        this.clearLayersArray("data");


        //SE UN TEMA HA UN LIVELLO UNICO ALL'INTERNO USO IL TEMA UNICO COME ROOT (SPOSTO IN ROOT)
        for (var i = 0; i < this.overlayData.length; i++) {
            thNode = this.overlayData[i];
            if(thNode.children.length == 1 && thNode.children[0].text == thNode.text) this.overlayData[i] = thNode.children[0];
        };
        

        var uldataElem = document.createElement("ul");
        OpenLayers.Element.addClass(uldataElem, "easyui-tree");
        this.dataLayersDiv.appendChild(uldataElem);             

        this.overlayTree = jQuery(uldataElem).tree({
            checkbox:true,
            animate:true,
            lines:true,
            data: self.overlayData,
            onBeforeCheck:function(node, checked){

                var iconSpan = jQuery(node.target).find(".tree-checkbox");
                if(iconSpan.hasClass("tree-check-disabled"))  return false
            },

            onBeforeSelect: function(node){
                if(!(node.attributes && node.attributes.featureTypes)) return false
            },

            onCheck:function(node, checked){

                if(node.attributes && node.attributes.layer){
                    layer = node.attributes.layer;
                    self.updateLayerVisibility(layer, checked);
                }
                else{
                    jQuery.each(self.overlayTree.tree('getChildren',(node.target)),function(index,childNode){
                        layer = childNode.attributes.layer;
                        self.updateLayerVisibility(layer, checked);
                    })
                }

            },
            onDblClick: function(node){



            },

            onClick: function(node){
                var numChildren = self.overlayTree.tree('getChildren',(node.target)).length;
                if(numChildren > 0)
                    self.overlayTree.tree('toggle',node.target);
                else if(node.checked)
                    self.overlayTree.tree('uncheck',node.target);
                else
                    self.overlayTree.tree('check',node.target);

            },

            formatter:function(node){
                    if(node.queryable)
                        return '<span class="tree-file"></span>' + node.text;
                    else
                        return node.text;
            },

            onLoadSuccess: function(node, data){


            }

        });






    },

    getFetureTypes: function(WMSLayerName){
        var result = []; 
        for (var i = 0; i < this.map.config.featureTypes.length; i++) {
            if(this.map.config.featureTypes[i].WMSLayerName == WMSLayerName) result.push(this.map.config.featureTypes[i]);
        };
        return result
    },


    getThemeNode: function(nodes,text){
        var node;
        for (var i = 0; i < nodes.length; i++) { if (nodes[i].text == text) node = nodes[i]; }; 
        if(!node){
            node =  {id:OpenLayers.Util.createUniqueID("base_theme_"), text:text, state:'closed', children:[]};
            nodes.push(node);
        } 
        return node;
    },


    //build baselayerData and overlayData
    initTreeData: function(oLayer){
        var oLayer,thNode,chNode,leafNode,leaf_leafNode,layerParam;

        var layerTree = oLayer.isBaseLayer? this.baselayerData  :this.overlayData;
        var fTypes = [];
        thNode = this.getThemeNode(layerTree,oLayer.theme);
        chNode = {id:oLayer.id, text:oLayer.title, state:'closed', iconCls:oLayer.isBaseLayer?"overlay-param":"overlay", attributes:{layer:oLayer}};
        if(!oLayer.isBaseLayer && oLayer.theme != oLayer.title) chNode.checked = oLayer.visibility;
        if(oLayer.theme != oLayer.title) fTypes = this.getFetureTypes(oLayer.name); //NO SINGOLO TEMA

        //SE IL LAYER PREVEDE LO SPLIT DEI SINGOLI MAPLAYER LI AGGIUNGO E ASSOCIO LA CORRISPONDENTE FEATURETYPE SE PRESENTE 
        if(typeof(oLayer.nodes)!='undefined') {
            chNode.children = [];
            for (var j = 0; j < oLayer.nodes.length; j++) {
                layerParam = oLayer.nodes[j].layer;


                leafNode = {id:oLayer.id + "_" + j, text:oLayer.nodes[j].title, iconCls:"overlay-param", attributes:{layer:oLayer, layerParam:layerParam}}
                if(typeof(oLayer.nodes[j].visibility)) leafNode.checked = oLayer.nodes[j].visibility;
                if(oLayer.theme == oLayer.title) fTypes = this.getFetureTypes(layerParam);  //SINGOLO TEMA
                if((fTypes.length > 0 && oLayer.theme == oLayer.title) || (fTypes.length > 0 && fTypes[0].typeName == layerParam)){
                    leafNode.queryable = true;
                    leafNode.iconCls = "queryable";
                    leafNode.attributes.featureTypes = fTypes;
                }
                if(oLayer.nodes[j].nodes){ //3 livelli su tema unico
                    leafNode.iconCls = "overlay";
                    leafNode.children = [];
                    for (var k = 0; k < oLayer.nodes[j].nodes.length; k++) {
                        leaf_leafNode = {id:oLayer.id + "_" + j + "_" + k, text:oLayer.nodes[j].nodes[k].title, iconCls:"overlay-param", attributes:{layer:oLayer, layerParam:oLayer.nodes[j].nodes[k].layer}}
                        leafNode.children.push(leaf_leafNode);
                    }
                }
                chNode.children.push(leafNode);
            };                          
        }

        //LAYER COME GRUPPO DI MAPLAYER
        else{
            if(fTypes.length > 0){
                chNode.queryable = true;
                chNode.iconCls = "overlay";
                chNode.attributes.featureTypes = fTypes;
            }
        }
        
        if(!chNode.children) {
            chNode.state = 'open';
        }

        thNode.children.push(chNode);    

    },

    CLASS_NAME: "OpenLayers.Control.LayerTree"
});

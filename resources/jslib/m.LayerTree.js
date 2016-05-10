
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

        var layerTree = layer.isBaseLayer? this.baseTree :this.overlayTree;
        return jQuery(layerTree).collapsibletree('find',layer.id);

    },


    getErrors: function(evt) {
        $('#ErrorWindow div[data-role="content"]').empty();
        $('#ErrorWindow div[data-role="loading"]').show();
        $('#ErrorWindow').modal('show');
        
        if(evt.data.url) {
            $.ajax({
                url: evt.data.url,
                success: function(response, success, req) {
                    var errorText = 'Impossibile leggere l\'errore';
                    
                    if(req && req.responseXML) {
                        var format = new OpenLayers.Format.OGCExceptionReport(),
                            ogcException;

                        try {
                            ogcException = format.read(req.responseXML);
                            if(!ogcException || !ogcException.exceptionReport || 
                                !ogcException.exceptionReport.exceptions || 
                                !ogcException.exceptionReport.exceptions.length) throw 'Parse error';
                            
                            var errorText = ogcException.exceptionReport.exceptions[0].text;
                            if(text) {
                                $('#ErrorWindow div[data-role="loading"]').hide();
                                return $('#ErrorWindow div[data-role="content"]').html(text);
                            }
                        } catch(e) {
                            console.log('xml parse exception', e);
                        }
                    } else if(req && req.responseText) {
                        errorText = req.responseText;
                    }
                    $('#ErrorWindow div[data-role="loading"]').hide();
                    $('#ErrorWindow div[data-role="content"]').html(errorText);
                },
                error: function(req) {
                    $('#ErrorWindow div[data-role="loading"]').hide();
                    $('#ErrorWindow div[data-role="content"]').html(req.statusText);
                }
            });
        } else {
            $('#ErrorWindow div[data-role="content"]').html('I layer contengono degli errori, verificare i singoli leyer....');
        }

    },


    redraw: function(e) {
        //if the state hasn't changed since last redraw, no need
        // to do anything. Just return the existing div.
        
        var azz = $(this.div).css("width");
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

        //this.baseLbl.innerHTML = '<div id="checkOverlays">Livelli di base</div>';
        //$("<div>jahdkajhdlfk</div>").insertBefore($(this.dataLbl))

        //this.dataLbl.innerHTML = '<div ><span class="tree-hit tree-collapsed"> </span><input type="radio" name="chkOverlays"><span>Attiva navigazione veloce</span></div>';
        //this.dataLbl.innerHTML += '<div ><span class="tree-hit tree-collapsed"> </span><input type="radio" name="chkOverlays"><span>Disattiva navigazione veloce</span></div>';

        // if no overlays, dont display the overlay label
        this.dataLbl.style.display = (containsOverlays) ? "" : "none";

        // if no baselayers, dont display the baselayer label
        this.baseLbl.style.display = (containsBaseLayers) ? "" : "none";

        var $ovelaysDiv = jQuery(this.dataLayersDiv);

        //$ovelaysDiv.prop("disabled",true);
        //$ovelaysDiv.hide();


        //return this.div;
    },

    updadeNodeStatus: function(){
 
        for (var i = 0; i < this.map.layers.length; i++) {
            this.checkNodeState(this.map.layers[i])
        };   

    },


    updateLayerVisibility: function(layer, checked){

        if(!this.overlayTree) return;

        var node = jQuery(this.overlayTree).collapsibletree('find',layer.id);
        var childs = jQuery(this.overlayTree).collapsibletree('getChildren',node);
        if(childs.length > 0){
            var layers = [];
            var childs_ext = [];
            var tileLayer = layer.map.getLayersByName(layer.name + '_tiles') && layer.map.getLayersByName(layer.name + '_tiles')[0];
            jQuery.each(childs ,function(_,child){
                if (child.attributes.layerParam){
                    if(child.checked){
                        layers.push(child.attributes.layerParam);
                    }
                }
                else {
                    if (child.attributes.layer) childs_ext.push(child);
                }
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
                
                for (var i = 0, tot_l = childs_ext.length; i < tot_l; i++) {
                    childs_ext[i].attributes.layer.setVisibility(childs_ext[i].checked);
                }                    
            } 
        }
        else{
            layer.setVisibility(checked)
        }

    },


    checkNodeState: function(layer){
        var self = this;
        var inRange;
        var node = self.overlayTree.collapsibletree('find',layer.id);
        var skipIndex = 0;
        
        if(node){
            inRange = layer.inRange;
            self.changeNodeState(node,inRange);
            jQuery.each(self.overlayTree.collapsibletree('getChildren',(node)),function(index,childNode){
                if (layer.nodes && layer.nodes[index-skipIndex]){
                    if (layer.nodes[index-skipIndex].title != childNode.text){
                        skipIndex++;
                        return;
                    }    
                    inRange = self.isChildNodeinRange(layer.nodes[index-skipIndex]);
                    self.changeNodeState(childNode,inRange);
                }
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
        var inRange = ( (!node.maxScale || node.maxScale <= scale) && (!node.minScale || node.minScale >= scale) );
        return inRange;
    },


    changeNodeState: function(node, inRange){
        if (inRange) {
            $('#checkbox_' + node.id).checkboxradio("enable");
        }
        else {
            $('#checkbox_' + node.id).checkboxradio("disable");
        }
            
        /*
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
        */
    },


    toggleBaseLayerEnabled: function (obj, enable) {
        
        if (enable) {
            $(this.baseLayersDiv).show();
            $(this.baseTree).find('input[type="radio"][name="' + obj.id + "_radio" + '"]').checkboxradio( "enable" );            
            $(this.baseTree).find("[data-role='collapsible']").collapsible( "enable" );           
            $(this.baseTree).find('.collapsibletree-node').removeClass("ui-state-disabled");
        }
        else {
            $(this.baseTree).find('input[type="radio"][name="' + obj.id + "_radio" + '"]').prop( "checked", false ).checkboxradio( "refresh" );
            $(this.baseTree).find('input[type="radio"][name="' + obj.id + "_radio" + '"]').checkboxradio( "disable" );            
            $(this.baseTree).find("[data-role='collapsible']").collapsible( "disable" );
            $(this.baseTree).find("[data-role='collapsible']").collapsible( "collapse" );
            $(this.baseTree).find('.collapsibletree-node').addClass("ui-state-disabled");
            $(this.baseLayersDiv).hide();
            obj.map.setBaseLayer(obj.map.getLayersByName('EMPTY_BASE_LAYER')[0]);
        }
            
    },

    createBaseTree: function(){

        var self = this;

        //clear out previous layers
        this.clearLayersArray("base");

        //SE HO IL TITOLO DEL BASELAYER VUOTO AGGIUNGO IL TITOLO AL NODO DELL'ALBERO E SPSOSTO IL NODO IN ROOT 
        //ALTRIMENTI ELIMINO IL NODO DALL'ALBERO (BASE VUOTA NASCOSTO)
        if(this.emptyTitle == '') {

            //this.baseLbl.innerText = ' Usa sfondo cartografico';
            //this.baseLbl.appendChild(chkEnableBaseLayers);
            $(this.baseLbl).html('<input type="checkbox" name="checkbox_enableBaseLayers" id="checkbox_enableBaseLayers" class="custom" data-mini="true"><label for="checkbox_enableBaseLayers">Attiva sfondo cartografico</label>');
            $("#checkbox_enableBaseLayers").checkboxradio();                     
            $("#checkbox_enableBaseLayers").change(function(){
                self.toggleBaseLayerEnabled(self, this.checked);
                $("#checkbox_enableBaseLayers").checkboxradio("refresh");
            });
            
            this.baselayerData = this.baselayerData.slice(1);
        } else {
            //this.baselayerData[0] = this.baselayerData[0].children[0];
            this.baselayerData[0].text = this.emptyTitle;
        }

        //var ulbaseElem = document.createElement("ul");
        //OpenLayers.Element.addClass(ulbaseElem, "easyui-tree");
        //this.baseLayersDiv.appendChild(ulbaseElem);
        var radioName = self.id + "_radio";
        
        this.baseTree = jQuery(this.baseLayersDiv).collapsibletree({
            data: self.baselayerData,
            nodeTextTag:'h3',
            collapsed: true,
            formatter: function (node) {
                if(node.children)
                    return node.text;
                else{
                    var id = node.id;                    
                    var checked = (node.attributes.layer.name == self.map.config.baseLayerName || node.attributes.layer.name == 'EMPTY_BASE_LAYER')?"checked='checked'":"";
                    return '<input type="radio" '+ checked +' id="radio_'+ id +'" name="' + radioName + '" data-mini="true"><label for="radio_' + node.id + '">' + node.text + '</label>';
                }
            },
        });

        $(this.baseTree).find("[data-role='controlgroup']").controlgroup();
        $(this.baseTree).find("[data-role='controlgroup']").controlgroup('option', 'data-mini', 'true');
        $('.ui-controlgroup-controls').css("width", "100%");
        $(this.baseTree).find('.collapsibletree-node').css("white-space", "normal");
        $(this.baseTree).find('[type="radio"]').checkboxradio();
        $(this.baseTree).find('[type="radio"]').checkboxradio("refresh");

        $(this.baseTree).find('.collapsibletree-leaf').click(function(event){

            var chkID = 'radio_' + event.currentTarget.id;
            
            if ($('#' + chkID).checkboxradio( "option", "disabled" )) {
                return false;
            }
            
            if ($('#' + chkID).prop('checked')){
                return false;
            }

            //$('input[type="radio"][name="' + self.id + "_radio" + '"][checked').removeAttr("checked");
            $('#' + chkID).prop( "checked", true );
            $('input[type="radio"][name="' + self.id + "_radio" + '"]').checkboxradio( "refresh" );
            $('input[type="radio"][name="' + self.id + "_radio" + '"]').checkboxradio( "enable" );
            
            self.map.setBaseLayer(self.map.getLayer(event.currentTarget.id));
            
            event.stopPropagation();
        });
        
 
        if(this.emptyTitle == '')
          this.toggleBaseLayerEnabled(self, false);

/*
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
        
      if(this.emptyTitle == '')
          this.toggleBaseLayerEnabled(self, false);
*/
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
        
        //var divDataElem = document.createElement("div");
        //OpenLayers.Element.addClass(uldataElem, "easyui-tree");
        //this.dataLayersDiv.appendChild(divDataElem);       
        
        this.overlayTree = jQuery(this.dataLayersDiv).collapsibletree({
            data: self.overlayData,
            nodeTextTag:'h5',
            collapsed: true,
            formatter: function (node) {
                var chkdCode = '';
                var partialCheckCode = '';
                if(node.checked) {
                    chkdCode = ' checked="checked"';
                }
                else if (node.children){
                    var childNum = node.children.length;
                    var childChecked = 0;
                    for (var j=0; j<childNum; j++) {
                        if (node.children[j].checked) childChecked++;
                    }
                    
                    if (childChecked == childNum) {
                        chkdCode = ' checked="checked"';
                    }
                    else if (childChecked > 0){
                        partialCheckCode = '" class="ui-checkbox-partial';
                    }
                }
                var html = '<input type="checkbox" name="checkbox_' + node.id + '" id="checkbox_' + node.id + '" class="custom layertree-chk"' + chkdCode + ' data-mini="true"><label for="checkbox_' + node.id + partialCheckCode + '">' + node.text + '</label>';
                return html;
            }
        });
        
        $(this.overlayTree).find('[type="checkbox"]').checkboxradio();
        
        jQuery('.layertree-chk').on("toggle", function(event, checked) {
            
            $('#' + event.target.id).prop( "checked", checked ).checkboxradio( "refresh" );
            
            var node = jQuery(self.overlayTree).collapsibletree("find", event.target.id.replace(/^checkbox_/, ''));
            node.checked = checked;
            
            if(node.attributes && node.attributes.layer){
                var layer = node.attributes.layer;
                self.updateLayerVisibility(layer, checked);
            }

            if (node.children) {
                for (var i=0; i<node.children.length; i++) {
                    $('#checkbox_' + node.children[i].id).trigger("toggle", [ checked ]);
                }
            }
            
            if (node.parentID) {
                var nodeParent = self.overlayTree.collapsibletree("find", node.parentID);
                var children = self.overlayTree.collapsibletree('getChildren',nodeParent);
                var childNum = children.length;
                var childChecked = 0;
                for (var j=0; j<childNum; j++) {
                    if (children[j].checked) childChecked++;
                }
                if (childChecked == 0) {
                    $('label[for="checkbox_' + node.parentID + '"]').removeClass("ui-checkbox-partial");
                    $('#checkbox_' + node.parentID).prop( "checked", false ).checkboxradio( "refresh" );
                }
                else if (childChecked == childNum) {
                    $('label[for="checkbox_' + node.parentID + '"]').removeClass("ui-checkbox-partial");
                    $('#checkbox_' + node.parentID).prop( "checked", true ).checkboxradio( "refresh" );
                }
                else {
                    $('#checkbox_' + node.parentID).prop( "checked", false ).checkboxradio( "refresh" );
                    $('label[for="checkbox_' + node.parentID + '"]').addClass("ui-checkbox-partial");
                }
                    
                    
            }

            
            return false;
        }),
        
        $(this.overlayTree).find('[type="checkbox"]').checkboxradio("refresh");
        
        $(this.overlayTree).find('.collapsibletree-leaf').click(function(event){

            var chkID = 'checkbox_' + event.currentTarget.id;
            
            if ($('#' + chkID).checkboxradio( "option", "disabled" )) {
                return false;
            }
            
            var chkdValue = !$('#' + chkID).prop('checked');
            
            $('#' + event.currentTarget.id + ' [type="checkbox"]').trigger("toggle", [ chkdValue ]);
            
            event.stopPropagation();
        });
        
        
        $(this.overlayTree).find('.collapsibletree-node').click(function(event){
            
            var chkID = 'checkbox_' + event.currentTarget.id;
            
            if ($('#' + chkID).checkboxradio( "option", "disabled" )) {
                return false;
            }
            
            var chkdValue = !$('#' + chkID).prop('checked');
                       
            $('#' + event.currentTarget.id + ' [type="checkbox"]').trigger("toggle", [ chkdValue ]);
            
            event.stopPropagation();
        });
        
        
/*
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
                    return node.text;
                    /*
                    if(node.queryable)
                        return '<span class="tree-file"></span>' + node.text;
                    else
                        return node.text;
                    */
/*            },

            onLoadSuccess: function(node, data){


            }

        });

*/


    },

    getFetureTypes: function(WMSLayerName){
        var result = []; 
        for (var i = 0; i < this.map.config.featureTypes.length; i++) {
            if(this.map.config.featureTypes[i].WMSLayerName == WMSLayerName) result.push(this.map.config.featureTypes[i]);
        };
        return result
    },

    /*
    getThemeNode: function(nodes,text){
        var node;
        for (var i = 0; i < nodes.length; i++) { if (nodes[i].text == text) node = nodes[i]; }; 
        if(!node){
            node =  {id:OpenLayers.Util.createUniqueID("base_theme_"), text:text, state:'closed', children:[]};
            nodes.push(node);
        } 
        return node;
    },
    */

    getThemeNode: function(nodes,rootPath){
        var resNode = null;
        var lvNodes = null;
        var pathComponents = [];
        if (rootPath){
            pathComponents = rootPath.split("/");
        }
            
        for (var j = 0, tot_j = pathComponents.length; j < tot_j; j++)
        {
            var text = pathComponents[j];
            if (resNode){
                lvNodes = resNode.children;
                resNode = null;
            }
            else
            {
                lvNodes = nodes;
            }
            for (var i = 0, tot_i = lvNodes.length; i < tot_i; i++) { 
                if (lvNodes[i].text == text) {
                    resNode = lvNodes[i];
                    break;
                } 
            } 
            if(!resNode){
                resNode =  {id:OpenLayers.Util.createUniqueID("base_theme_"), text:text, state:'closed', children:[]};
                lvNodes.push(resNode);
            }
        }
        if (resNode)
            return resNode.children;
        else
            return nodes;
    },
    
    sortNode: function(nodeA,nodeB){
        var valueA, valueB;
        if (nodeA.attributes.order)
            valueA = nodeA.attributes.order;
        else if (nodeA.attributes.layer.order)
            valueA = nodeA.attributes.layer.order;
        else
            valueA = nodeA.text;

        if (nodeB.attributes.order)
            valueB = nodeB.attributes.order;
        else if (nodeB.attributes.layer.order)
            valueB = nodeB.attributes.layer.order;
        else
            valueB = nodeB.text;

        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
     },

    //build baselayerData and overlayData
    initTreeData: function(oLayer){
        var oLayer,thNode,chNode,leafNode,leaf_leafNode,layerParam, layerOrder;

        var layerTree = oLayer.isBaseLayer? this.baselayerData  :this.overlayData;
        var rootPath = oLayer.hasOwnProperty('rootPath') ? oLayer.rootPath : oLayer.theme;
        var fTypes = [];

        chNode = {id:oLayer.id, text:oLayer.title, state:'closed', iconCls:oLayer.isBaseLayer?"overlay-param":"overlay", attributes:{layer:oLayer}};
        if(!oLayer.isBaseLayer && oLayer.theme != oLayer.title) chNode.checked = oLayer.visibility;
        if(oLayer.theme != oLayer.title) fTypes = this.getFetureTypes(oLayer.name); //NO SINGOLO TEMA

        //SE IL LAYER PREVEDE LO SPLIT DEI SINGOLI MAPLAYER LI AGGIUNGO E ASSOCIO LA CORRISPONDENTE FEATURETYPE SE PRESENTE 
        if(typeof(oLayer.nodes)!='undefined') {
            chNode.children = [];
            for (var j = 0; j < oLayer.nodes.length; j++) {
                layerParam = oLayer.nodes[j].layer;
                layerOrder = oLayer.nodes[j].order;

                leafNode = {id:oLayer.id + "_" + j, text:oLayer.nodes[j].title, iconCls:"overlay-param", attributes:{layer:oLayer, layerParam:layerParam, order:layerOrder}}
                if(typeof(oLayer.nodes[j].visibility)) leafNode.checked = oLayer.nodes[j].visibility;
                if(oLayer.theme == oLayer.title) fTypes = this.getFetureTypes(layerParam);  //SINGOLO TEMA
                if((fTypes.length > 0 && oLayer.theme == oLayer.title) || (fTypes.length > 0 && fTypes[0].typeName == layerParam)){
                    leafNode.queryable = true;
                    //leafNode.iconCls = "queryable";
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

        thNode = this.getThemeNode(layerTree, rootPath);
        var idxNode = 0;
        var tot_i = thNode.length;
        while ( idxNode < tot_i) { 
            if (thNode[idxNode].text == chNode.text) {
                if (typeof(thNode[idxNode].attributes) == 'undefined' ){
                    chNode.children = chNode.children.concat(thNode[idxNode].children);
                    chNode.children.sort(this.sortNode);
                    thNode[idxNode] = chNode;
                }
                break;
            } 
            idxNode++;
        } 
        
        if (idxNode == tot_i)
            thNode.push(chNode);
        
        if(rootPath){
            thNode.sort(this.sortNode);
        }    
    },

    CLASS_NAME: "OpenLayers.Control.LayerTree"
});

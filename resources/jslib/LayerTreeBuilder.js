Ext.namespace("GeoExt.ux.tree");

GeoExt.ux.tree.LayerTreeBuilder = Ext.extend(Ext.tree.TreePanel, {

    /* begin i18n */
    /** api: config[title] ``String`` i18n */
    title: "Layers",

    /** api: config[otherLayersText] ``String`` i18n */
    otherLayersText: "Other layers",

    /** api: config[baseLayersText] ``String`` i18n */
    baseLayersText: "Base layers",
    /* end i18n */

    /** api: config[wmsLegendNodes]
     * ``Boolean``
     * Defaults to true.  Whether WMS layer nodes should have child legend
     * nodes or not.
     */
    wmsLegendNodes: true,

    /** api: config[vectorLegendNodes]
     * ``Boolean``
     * Defaults to true.  Whether vector layer nodes should have child legend
     * nodes or not.
     */
    vectorLegendNodes: true,

    /** api: config[checkableGroupNodes]
     * ``Boolean``
     * Defaults to true.  Whether LayerContainer and TreeNode nodes used as
     * group directories should be checkable or not.
     */
    checkableGroupNodes: true,

    /** api: config[layerStore]
     *  ``GeoExt.data.LayerStore``
     *  The layer store containing layers to be displayed in the tree.
     *  If not provided it will be taken from the MapPanel.
     */
    layerStore: null,

    plugins: [{ptype: "gx_treenodecomponent"},new GeoExt.plugins.TreeNodeAutoDisable()],

    loader: {
        applyLoader: false,
        uiProviders: {"custom_ui": Ext.extend(
            GeoExt.tree.LayerNodeUI,
            new GeoExt.tree.TreeNodeUIEventMixin()
        )}
    },

    root: {
        nodeType: "async",
        children: []
    },

    // ABP: make sure tree is populated
    onAfterRender : function(self){
        // ABP: what if the store was already populated but the tree is empty?
        if(! this.root.childNodes.length && this.layerStore.getRange() ){
            this.onLayerAdded(this.layerStore, this.layerStore.getRange(), 0);
        }
    },

    initComponent: function(){
        GeoExt.ux.tree.LayerTreeBuilder.superclass.initComponent.call(this);
		
		//console.log(this.layerStore);
		
        if(!this.layerStore) {
            this.layerStore = GeoExt.MapPanel.guess().layers;
			//console.log( this.layerStore);
        }

        this.layerStore.on({
            "add": this.onLayerAdded,
            "remove": this.onLayerRemoved,
            scope: this
        });

        this.layerStore.treeBuilder = this;

        // ABP: add event handler
        this.on('afterrender', this.onAfterRender);
    },


    onLayerRemoved: function(store, records, index){
        //todo: remove empty groups
    },

    onLayerAdded: function(store, records, index) {
        // first, validate all 'group' options
        Ext.each(records, function(record, index) {
            var layer = record.getLayer();
				
			//console.log(layer.map);
			
            if(layer.displayInLayerSwitcher === false) {
                if(layer.group && layer.options && layer.options.group) {
                    delete layer.group;
                    delete layer.options.group;
                }
                return;
            } else if(layer.options && layer.options.group === undefined) {
                layer.options.group = (layer.isBaseLayer)
                    ? this.baseLayersText : this.otherLayersText;
            }
        }, this);

        // then, create the nodes according to the records
        Ext.each(records, function(record, index) {
            var layer = record.getLayer();

            if(layer.displayInLayerSwitcher === false) {
                return;
            }

            var group = layer.options.group.split('/');
            var groupString = layer.options.group;

            // if layer has no GROUP
            if (groupString === "") {
                var layerNode = {
                    nodeType: "gx_layer",
                    layer: layer.name,
                    layerStore: this.layerStore,
                    isLeaf: true,
                    allowDrag: false,
                    checked: layer.visibility
                };
                this.getRootNode().appendChild(layerNode);
            } else {
                this.addGroupNodes(
                    group, this.getRootNode(), groupString, record
                );
            }
        }, this);
    },

    addGroupNodes: function(groups, parentNode, groupString, layerRecord){
        var group = groups.shift();
        var childNode = this.getNodeByText(parentNode, group);
        var layer = layerRecord.getLayer();

        // if the childNode doesn't exist, we need to create and append it
        if (!childNode) {
            // if that's the last element of the groups array, we need a
            // 'LayerContainer'
            if (groups.length == 0) {
                var createNode;

                // default 'baseLayers' and 'otherLayers' groups don't have
                // checkboxes
                if (group == this.baseLayersText ||
                    group == this.otherLayersText)
                {
                    createNode = function(attr) {
                        return GeoExt.tree.LayerLoader.prototype.createNode.call(this, attr);
                    }
                }
                // WMS and Vector layers can have legend nodes if according
                // property is enabled
                else if (layer instanceof OpenLayers.Layer.WMS
                    && this.wmsLegendNodes)
                {
                    createNode = function(attr) {
                        var layerRecord = this.store.getByLayer(attr.layer);
                        var layer = layerRecord.getLayer();
                        attr.component = {
                          xtype: "gx_wmslegend",
                          layerRecord: layerRecord,
                          showTitle: false,
						  useScaleParameter: false,
						  
                          hidden: !layer.visibility,
                          cls: "gx-layertreebuilder-legend"
                        };
                        if (this.store.treeBuilder.checkableGroupNodes &&
                            !layer.isBaseLayer) {
                            Ext.apply(attr, {
                                listeners: {
                                    checkchange: this.store.treeBuilder.checkChange
                                }
                            });							
							
                        }
                        return GeoExt.tree.LayerLoader.prototype.createNode.call(this, attr);
                    }
                } else if (layer instanceof OpenLayers.Layer.Vector
                    && this.vectorLegendNodes)
                {
                    createNode = function(attr) {
                        var layerRecord = this.store.getByLayer(attr.layer);
                        var layer = layerRecord.getLayer();
                        attr.component = {
                          xtype: "gx_vectorlegend",
                          layerRecord: layerRecord,
                          showTitle: false,
                          hidden: !layer.visibility,
                          cls: "gx-layertreebuilder-legend"
                        };
                        if (this.store.treeBuilder.checkableGroupNodes &&
                            !layer.isBaseLayer) {
                            Ext.apply(attr, {
                                listeners: {
                                    checkchange: this.store.treeBuilder.checkChange
                                }
                            });
                        }
                        return GeoExt.tree.LayerLoader.prototype.createNode.call(this, attr);
                    }
                } else {
                    createNode = function(attr) {
                        if (this.store.treeBuilder.checkableGroupNodes &&
                            !layer.isBaseLayer) {
                            Ext.apply(attr, {
                                listeners: {
                                    checkchange: this.store.treeBuilder.checkChange
                                }
                            });
                        }
                        return GeoExt.tree.LayerLoader.prototype.createNode.call(this, attr);
                    }
                }

                childNode = {
                    text: group,
                    layerStore: this.layerStore,
                    allowDrag: false,
                    nodeType: 'gx_layercontainer',
                    leaf: false,
                    listeners: {
                      insert: this.onLayerContainerNodeInsert,
                      append: this.onLayerContainerNodeAppend,
                      scope: this
                    },
                    loader: {
                        filter: function(record) {
                            return record.getLayer().options.group == groupString;
                        },
                        baseAttrs: {
                            uiProvider: "custom_ui"
                        },
                        createNode: createNode
                    }
                };
            } else {
                // else, create and append a simple node...
                childNode = {
                    text: group,
                    leaf: false,
                    listeners: {
                      append: this.onTreeNodeAppend,
                      scope: this
                    },
                    allowDrag: false,
                    nodeType: "node"
                };
            }

            // apply checkbox if option is set
            if (this.checkableGroupNodes && group != this.baseLayersText &&
                group != this.otherLayersText && (!layer || !layer.isBaseLayer))
            {
                Ext.apply(childNode, {checked: false});
                Ext.apply(childNode.listeners, {
                    'checkchange' : function(node, checked) {
                        // If a parent node is unchecked, uncheck all
                        // the children
                        if (node.getUI().isChecked()) {
                            node.expand();
                            node.eachChild(function(child){
                               child.ui.toggleCheck(true);
                            });
                        }
                        if (!node.getUI().isChecked())
                        {
                            node.expand();
                            node.eachChild(function(child) {
                                child.ui.toggleCheck(false);
                            });
                        }
                    }
                });
            }

            parentNode.appendChild(childNode);

            childNode = this.getNodeByText(parentNode, group);
        }

        // if node contains any child or grand-child with a visible layer,
        // expand it
        if (layer && layer.visibility) {
            childNode.expand();
        }

        if (groups.length != 0){
            this.addGroupNodes(groups, childNode, groupString, layerRecord);
        }
    },

    getNodeByText: function(node, text){
        for(var i=0; i<node.childNodes.length; i++)
        {
            if(node.childNodes[i]['text'] == text)
            {
                return node.childNodes[i];
            }
        }
        return false;
    },

    checkChange: function(node, checked) {
        // Map of all the node ids not yet visited by updateNodeCheckbox
        var unvisitedNodeIds = {};
        var tree = node.getOwnerTree();

        //
        // This function updates the node checkbox according to the status of
        // the descendants. It must be called on a node checkbox nodes only.
        //
        // It is called recursively and returns a boolean:
        // - If the node has no children checkboxes, the status of the checkbox
        //   is returned
        // - Otherwise, it returns true if all the children witch checkbox are
        //   checked or false in the other case.
        //
        // As a side effect, it will update the checkbox state of the node, and
        //  remove visited node ids from the unvisitedNodeIds variable, to
        //  prevent visiting nodes multiple times.

        tree.setNodeChecked=  function(nodeOrId, checked, fireEvent) {
            var node = (nodeOrId instanceof Ext.data.Node) ?
            nodeOrId : this.getNodeById(nodeOrId);

            if (!node || typeof(node.attributes.checked) != "boolean") {
                return;
            }

            if (checked === undefined) {
                checked = !node.attributes.checked;
            }

            // update model
            node.attributes.checked = checked;

            // sync ui
            if (node.ui && node.ui.checkbox) {
                node.ui.checkbox.checked = checked;
            }

            // fire event if required
            if (fireEvent || (fireEvent === undefined))  {
                node.fireEvent('checkchange', node, checked);
            }
        }

        function updateNodeCheckbox(node) {
            if (typeof(node.attributes.checked) != "boolean") {
                throw new Error(arguments.callee.name +
                                " should only be called on checkbox nodes");
            }

            var checkboxChildren = [];
            node.eachChild(function(child) {
                if (typeof(child.attributes.checked) == "boolean")
                    checkboxChildren.push(child);
            }, this);

            // If this node has no children with checkbox, its checked state
            // will be returned.
            if (checkboxChildren.length == 0) {
                return node.attributes.checked;
            }

            var allChecked = true;
            Ext.each(checkboxChildren, function(child) {
                    if (!updateNodeCheckbox(child)) {
                        allChecked = false;
                        return false;
                    }
                }, this);

            tree.setNodeChecked(node, allChecked, false);
            delete unvisitedNodeIds[node.id];

            return allChecked;
        }

        var checkboxNodes = [];

        tree.getRootNode().cascade(function(node) {
                if (typeof(node.attributes.checked) == "boolean") {
                    checkboxNodes.push(node);
                    unvisitedNodeIds[node.id] = true;
                }
            }, this);

        // taking node from the tree order (using shift) should be more
        // efficient
        var node;
        while (node = checkboxNodes.shift()) {
            if (unvisitedNodeIds[node.id])
                updateNodeCheckbox(node);
        }
    },

    onLayerContainerNodeInsert: function(tree, parentNode, childNode, refNode) {
        this.validateLayerContainerStatus(parentNode);
    },

    onLayerContainerNodeAppend: function(tree, parentNode, childNode, index) {
        this.validateLayerContainerStatus(parentNode);
    },

    validateLayerContainerStatus: function(node) {
        var show;
        Ext.each(node.childNodes, function(childNode, index) {
            show = true;

            visibility = childNode.layer.visibility;
            if (!childNode.layer.visibility) {
                show = false;
                return false;
            }
        });

        // check the checkbox (if any)
        var checkbox = node.getUI().checkbox;
        if (checkbox) {
            checkbox.checked = (show) ? true : false;
        }

        // expand this node and all its parents
        show && node.ensureVisible();

        node.parentNode && this.validateTreeNodeStatus(node.parentNode);
    },

    onTreeNodeAppend: function(tree, parentNode, childNode, index) {
        this.validateTreeNodeStatus(parentNode);
    },

    validateTreeNodeStatus: function(node) {
        var show;

        if (!this.checkableGroupNodes || node.isRoot) {
            return;
        }

        Ext.each(node.childNodes, function(childNode, index) {
            show = true;
            var checkbox = childNode.getUI().checkbox;
            if (checkbox && !checkbox.checked) {
                show = false;
                return false;
            }
        });

        var checkbox = node.getUI().checkbox;
        if (checkbox) {
            checkbox.checked = (show) ? true : false;
        }

        node.parentNode && this.validateTreeNodeStatus(node.parentNode);
    }

});

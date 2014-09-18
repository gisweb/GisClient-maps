/**
 * Copyright (c) 2008-2009 The Open Source Geospatial Foundation
 *
 * Published under the BSD license.
 * See http://svn.geoext.org/core/trunk/geoext/license.txt for the full text
 * of the license.
 */

Ext.namespace("GeoExt.plugins");

/** api: (define)
 *  module = GeoExt.plugins
 *  class = TreeNodeAutoDisable
 */

/** api: constructor
 *  A plugin to create tree nodes that will be automatically enabled /
 *  disabled as its associated layer comes in or out of range. Can be
 *  plugged into any ``Ext.tree.TreePanel`` and will be applied to all
 *  nodes that have a ``layer`` atribute with an ``OpenLayers.Layer``
 *  (or any subclasses) instance assigned to it.
 *
 *  If a node is configured with a ``autoDisable:false`` attribute, it will never
 *  be disabled in response to the layer. Layers with ``isBaseLayer:true`` or
 *  ``alwaysInRange:true`` will never be out of range and the tree node will
 *  also never be auto-disabled.
 */

/** api: example
 *  Sample code to create a tree with auto-disabled nodes:
 *
 *  .. code-block:: javascript
 *
 *      var tree = new Ext.tree.TreePanel({
 *          plugins: [new GeoExt.plugins.TreeNodeAutoDisable()],
 *              rootVisible:false,
 *              root: {
 *              nodeType: "node",
 *              children:[
 *                  //these layer tree nodes will never auto-disable
 *                  {
 *                      nodeType:"gx_baselayercontainer"
 *                  },
 *                  //these layer tree nodes will auto-disable based on layer's inRange value
 *                  {
 *                      nodeType:"gx_layer",
 *                      text:"WMS layer with sublayers"
 *                      layer:wms_layer
 *                      loader:{param:"LAYER"}
 *                  },
 *                  //this layer tree node will not be auto-disabled 
 *                  {
 *                      nodeType:"gx_layer",
 *                      autoDisable:false,
 *                      layer:wms_layer
 *                  }
 *              ]
 *          }
 *      });
 *
 */

GeoExt.plugins.TreeNodeAutoDisable = Ext.extend(Ext.util.Observable, {

    /** private: method[constructor]
     *  :param config: ``Object``
     */
    constructor: function(config) {
        Ext.apply(this.initialConfig, Ext.apply({}, config));
        Ext.apply(this, config);

        GeoExt.plugins.TreeNodeAutoDisable.superclass.constructor.apply(this, arguments);
    },
    /** private: method[init]
     *  :param tree: ``Ext.tree.TreePanel`` The tree.
     */
    init: function(tree) {
        
        tree.on({
            "insert": this.onAddNode,
            "append": this.onAddNode,
			"rendernode": this.onRenderNode,
            scope: this
        });
    },
    /** private: method[onAddNode]
     *  :param tree: ``Ext.tree.TreePanel``
     *  :param pnode: ``Ext.tree.TreeNode``
     *  :param node: ``Ext.tree.TreeNode``
     *  :param ref: ``Ext.tree.TreeNode`` or ``integer``
     */
    onAddNode: function(tree,pnode,node,ref) {
        var uiClass = node.attributes.uiProvider || node.defaultUI || Ext.tree.TreeNodeUI;
		node.attributes.uiProvider = Ext.extend(uiClass,new GeoExt.tree.TreeNodeUIEventMixin());
		node.ui = new node.attributes.uiProvider(node);
	},
	onRenderNode: function(node){
		var attr = node.attributes;
		var layer = node.layer;
		if (layer && layer instanceof OpenLayers.Layer) {
			//don't even attach a moveend listener for nodes which won't auto disable
			if (!(attr.autoDisable === false || layer.isBaseLayer || layer.alwaysInRange)) {
				//attach event listener
				layer.map.events.register("moveend", node, function(){
					var bleck='blah';
					this.layer.inRange ? this.enable() : this.disable();
				});
				//start nodes enabled/disabled appropiately
				(layer.inRange || layer.calculateInRange()) ? node.enable() : node.disable();
			}
		}
	},
    /** private: method[destroy]
     */
    destroy: function() {
        tree.un("insert", this.onAddNode, this);
        tree.un("append", this.onAddNode, this);
		tree.un("rendernode",this.onRenderNode, this);
    }
});

/** api: ptype = gx_treenodeautodisable */
Ext.preg && Ext.preg("gx_treenodeautodisable", GeoExt.plugins.TreeNodeAutoDisable);
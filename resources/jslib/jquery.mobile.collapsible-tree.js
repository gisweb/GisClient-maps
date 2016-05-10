/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

(function ($, undefined) {
    $.widget("mobile.collapsibletree", $.mobile.widget, {
        options: {
            version: "1.0.0",
            title:'',
            data: [],
            collapsed: false,
            nodeTextTag:'h4',
            leafTextTag: 'a',
            leafClass: 'ui-btn ui-corner-all',
            // **** Functions
            formatter: function(nodeItem){
			//var opts = this.options;
			return nodeItem.text;
            }
        },
        idCounter: 0,
        nodes: {},
        
        _create: function () {
            var self = this,
                o = this.options,
                theme = $.mobile.getInheritedTheme(".ui-active-page");

            self.internalID = new Date().getTime();           
            if (self.element.length > 0) {
                self._makeHtml();
                /*
                for (var i = 0; i < self.element.length; i++) {
                    $(self.element[i]).find('div[data-role=collapsible]').collapsible({
                        collapsed: o.collapsed
                    });
                }
                */
            }
        },
        
        _makeHtml: function () {
            var self = this,
               o = this.options,
               theme = $.mobile.getInheritedTheme(".ui-active-page");
            var html = "";
            if (o.title)
                html += "<" + o.nodeTextTag + ">" + o.title + "</" + o.nodeTextTag + ">";
            for (var i=0; i<o.data.length; i++)
                html += self._makeNodeHtml(o.data[i], null);
            if (html.length > 0) {
                for (var i = 0; i < self.element.length; i++) {
                    $(self.element[i]).empty();
                    $(self.element[i]).html(html);
                    $(self.element[i]).find('div[data-role=collapsible]').collapsible({
                        collapsed: o.collapsed
                    });
                }
            }
        },
        
        _makeNodeHtml: function (node, parent_id) {
            var childrenNum;
            try {
                childrenNum = node.children.length;
            }
            catch (err) {
                childrenNum = 0;
            }
            var self = this,
            o = this.options;
            var html = '';
            var itemID = self._getNodeID(node);
            
            if (childrenNum > 0) {
                // **** Create container (Collapsible)
                html += "<div data-role=\"collapsible\">";
                if (o.nodeTextTag) html += "<" + o.nodeTextTag + ">";
                html += '<div id="' + itemID +'" class="collapsibletree-node">';
                // **** TODO: Insert formatter!!!
                if (o.formatter){
                    html += o.formatter(node)
                } else {
                    html += node.text;
                }
                html += "</div>";
                if (o.nodeTextTag) html += "</" + o.nodeTextTag + ">";
                html += "<div class=\"ui-field-contain\"><fieldset data-role=\"controlgroup\">";
                for (var i=0; i < childrenNum; i++)
                    html += self._makeNodeHtml(node.children[i], itemID);
                html += "</fieldset></div></div>";
            }
            else {
                html += '<div id="' +  itemID +'" class="collapsibletree-leaf">';
                if (o.leafTextTag) html += "<" + o.leafTextTag + " class=\"" + o.leafClass + "\">";
                if (o.formatter){
                    html += o.formatter(node)
                } else {
                    html += node.text;
                }
                if (o.leafTextTag) html += "</" + o.leafTextTag + ">";
                html += "</div>";
            }
            
            self.nodes[itemID] = node;
            if (parent_id)
                self.nodes[itemID].parentID = parent_id;
            
            return html;
        },
        
        _getNodeID: function (node) {
            var self = this;
            if (node.id)
                return node.id;
            else
                return self.idCounter++;
        },
              
        reload: function (data) {
            var self = this,
               o = this.options;
            o.data = data;
            if (self.element.length > 0) {
                self._makeHtml();
            }
        },

        find: function (id) {
            var self = this;
            var returnNode = self.nodes[id]; 
            if (returnNode) {
                var target;
                if (self.element.length > 1) {
                    target = [];
                    for (var i = 0; i < self.element.length; i++) {
                        target.push($(self.element[i]).find(id));
                    }
                }
                else {
                    target = $(self.element[0]).find(id);
                }
                returnNode['target'] = target;
                return returnNode;
            }
            else{
                return null;
            }
        },
        
        getChildren: function (node) {
            var self = this;
            var returnNodes = [];
            if (self.nodes[node.id].children) {
                var children = self.nodes[node.id].children;
                for (var i=0; i< children.length; i++) {
                    var tmpNode = self.find(children[i].id);
                    returnNodes.push(tmpNode);                   
                }
            }
            return returnNodes;
        }
       
    });
})(jQuery);



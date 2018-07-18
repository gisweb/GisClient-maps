var sideBar;
var currentGroupPos;
window.GCComponents = {};

window.GCComponents["Functions"] = {};

window.GCComponents["InitFunctions"] = {};

window.GCComponents["SideToolbar.Buttons"] = {
  addButton: function(id, title, icon, buttonFunction, customProperties) {
    var olb = new OpenLayers.Control.Button({
      id: id,
      title: title,
      iconclass: icon,
      trigger: buttonFunction
    });
    if (typeof(customProperties) == 'object' && customProperties !== null) {
      $.each (customProperties, function(propName, propValue) {
        olb[propName] = propValue;
      });
    }
    olb["button_group"] = (currentGroupPos[1] != undefined) ? currentGroupPos[1] : olb["button_group"];
    olb["position"] = parseInt((currentGroupPos[0] != undefined) ? currentGroupPos[0] : sideBar.auxIndex++);
    sideBar.addControls([olb]);
  }
};

window.GCComponents["Controls"] = {
  addControl: function(controlName, createFunction) {
    if (typeof(createFunction) !== "function")
      return null;
    var olc = createFunction(GisClientMap.map);
    GisClientMap.map.addControl(olc);
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

function initGotoDestinationPanel(innermap) {
  var olc = new OpenLayers.GisClient.gotoDestinationPanel({
    gc_id: 'control-goto',
    createControlMarkup:customCreateControlMarkup,
    div: document.getElementById("map-toolbar-goto"),
    divOpts: document.getElementById("map-toolbar-goto-insert"),
    autoActivate:false
  });
  innermap.addControl(olc);
}

OpenLayers.GisClient.Toolbar = OpenLayers.Class(OpenLayers.Control.Panel, {
  CLASS_NAME: "OpenLayers.GisClient.Toolbar",
  auxIndex: 0,
  tmpControls: new Array(),
  startControl: new Array(),
  activateControl: function(control) {
    var len = this.controls.length, i;
    if(control.exclusiveGroup) {
      for(i = 0; i < len; i++) {
        if(this.controls[i] != control && this.controls[i].exclusiveGroup == control.exclusiveGroup)
          this.controls[i].deactivate();
      }
    }
    OpenLayers.Control.Panel.prototype.activateControl.apply(this, [control]);
  },
  addControl: function(control) {
    control.button_group = (control.button_group != undefined) ? control.button_group : "default"
    var ctrl = this.getGroupControl(control.button_group);
    if(ctrl == undefined)
      this.tmpControls.push({group: control.button_group, controls: [control]});
    else
      ctrl.controls.push(control);
    if (typeof(clientConfig.DEFAULT_CONTROL) != 'undefined')
      this.manageStartControl(control);
  },
  manageStartControl: function(control) {
    if(clientConfig.DEFAULT_CONTROL.includes(control.id)) {
      this.startControl.push(control);
    }
  },
  addControls: function(controls) {
    var self = this;
    controls.forEach(function(current) {
      self.addControl(current);
    });
  },
  getGroupControl: function(name) {
    for(var curr=0; curr < this.tmpControls.length; curr++) {
      if(this.tmpControls[curr].group == name)
        return this.tmpControls[curr];
    }
    return undefined;
  },
  finalize: function() {
    var self = this;
    this.tmpControls.sort(sortGroupByName);
    for (var currentIndex = 0; currentIndex < this.tmpControls.length; currentIndex++) {
      var currentGroup = sortAndManageGroup(this.tmpControls[currentIndex]);
      OpenLayers.Control.Panel.prototype.addControls.apply(self, [this.tmpControls[currentIndex].controls]);
    }
    if(this.startControl.length > 0) {
      for(var index = 0; index < this.startControl.length; index++)
        this.activateControl(this.startControl[index]);
    } else {
      this.activateControl(this.defaultControl);
    }
    $.each(window.GCComponents["InitFunctions"] , function( key, value ) {
        value(GisClientMap.map);
    });
  },
});

function sortAndManageGroup(currentGroup) {
  currentGroup.controls.sort(sortButtonsByPosition);
  var currLng = currentGroup.controls.length;
  if (currLng == 1 )
    currentGroup.controls[currLng -1].tbarpos = "alone";
  else {
    for(var i = 0; i< currLng; i++) {
      if(i == 0)
        currentGroup.controls[i].tbarpos = "first";
      else if(i == currLng-1)
        currentGroup.controls[i].tbarpos = "last";
      else
        currentGroup.controls[i].tbarpos = undefined;
    }
  }
  return currentGroup;
}

function sortGroupByName(a,b) {
 if(a.group == "default")
   return -1;
 if(b.group == "default")
   return 1;
 return a.group.localeCompare(b.group);
}

function sortButtonsByPosition(a, b) {
  //nel nostro algoritmo comanda position
  return a.position == b.position ? 0 : (a.position > b.position ? 1 : -1);
}

createGCControls = function(innerMap) {
  var arr = clientConfig.CLIENT_COMPONENTS;
  if(arr != undefined && arr.length > 0)
    includeComponents(arr);
  else
    sideBar.finalize();
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

function includeComponents(arr) {
  var cont = 0;
  var includedFileNames = [];
  arr.forEach(function(current, index) {
    var cmpPosGrp = current.split(":");
    if($.inArray(cmpPosGrp[0], includedFileNames) == -1) {
      includedFileNames.push(cmpPosGrp[0]);
      $.ajax({
        async : false,
        url: "../../components/"+cmpPosGrp[0]+".js",
        beforeSend: function() {
          currentGroupPos = [cmpPosGrp[1] , cmpPosGrp[2]];
        }
      }).done(function( data, textStatus, jqxhr) {
        cont = checkSidebarFinalization(arr, cont);
      }).fail(function( jqxhr, settings, exception ) {
        window.alert("Inclusione componente file: " + cmpPosGrp[0] + ".js - " + exception);
        cont = checkSidebarFinalization(arr, cont);
      });
    } else {
      window.alert("File " + cmpPosGrp[0] + ".js precedentemente incluso.");
      cont = checkSidebarFinalization(arr, cont);
    }
  });
}

function checkSidebarFinalization(arr, cont) {
  currentGroupPos = undefined;
  cont +=1
  if(arr.length == cont)
    sideBar.finalize();
  return cont;
}

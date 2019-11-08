// **** Layer Tree Functions
window.GCComponents.Functions.fastNavigate = function(chk, self) {
    var ctrlTree = self.map.getControlsBy('gc_id', 'control-layertree')[0];
    if($(chk).is(':checked')){
        ctrlTree.showDataLayers = false;
        $("div.fast-navigate").show();
        self.activeLayers = [];
        for(var i=0;i<self.map.layers.length;i++){
        if(!self.map.layers[i].isBaseLayer && self.map.layers[i].visibility){
            self.map.layers[i].setVisibility(false);
            self.activeLayers.push(self.map.layers[i]);
        }
    }
    self.mapsetTileLayer.setVisibility(true);
    } else {
        ctrlTree.showDataLayers = true;
        $("div.fast-navigate").hide();
        self.mapsetTileLayer.setVisibility(false);
        for(var i=0; i<self.activeLayers.length;i++)
            self.activeLayers[i].setVisibility(true);
  }
  if ($.mobile)
      $("#checkbox_fastNavigate").checkboxradio("refresh");
}

window.GCComponents.InitFunctions.setFastNavigate = function(map) {
    if(GisClientMap.mapsetTiles){
        var ctrlTree = map.getControlsBy('gc_id', 'control-layertree')[0];
        for(i=0;i<map.layers.length;i++){
            if(!map.layers[i].isBaseLayer && map.layers[i].visibility){
                map.layers[i].setVisibility(false);
                GisClientMap.activeLayers.push(map.layers[i]);
            }
        }
        ctrlTree.showDataLayers = false;
        GisClientMap.mapsetTileLayer.setVisibility(true);
        if ($.mobile) {
            $(".dataLbl").html('<input type="checkbox" name="checkbox_fastNavigate" id="checkbox_fastNavigate" class="custom" data-mini="true"><label for="checkbox_fastNavigate">Attiva navigazione veloce</label>');
            var chk = $("#checkbox_fastNavigate");
            chk.checkboxradio();
            chk.prop( "checked", true ).checkboxradio( "refresh" );
            $(".dataLbl").append($("<div class='fast-navigate'>STAI NAVIGANDO SULLA MAPPA IMPOSTATA SUI LIVELLI VISIBILI IN AVVIO.<BR />DISATTIVA LA NAVIGAZIONE VELOCE PER TORNARE ALL'ALBERO DEI LIVELLI</div>"));
            chk.change(function() { window.GCComponents.Functions.fastNavigate(this, GisClientMap);});
        }
        else {
            var chk = $("<input class='fast-navigate' type='checkbox'>");
            $(".baseLbl :checkbox").addClass('fast-navigate');
            $(".dataLbl").html(" Naviga veloce sulla mappa").append(chk);
            $(".dataLbl").append($("<div class='fast-navigate'>STAI NAVIGANDO SULLA MAPPA IMPOSTATA SUI LIVELLI VISIBILI IN AVVIO.<BR />DISATTIVA LA NAVIGAZIONE VELOCE PER TORNARE ALL'ALBERO DEI LIVELLI</div>"))
            chk.attr("checked",true);
            chk.on("click",function() { window.GCComponents.Functions.fastNavigate(this, GisClientMap);});
        }
    }
}

// **** Layer Tree panel button
window.GCComponents["SideToolbar.Buttons"].addButton (
    'button-layertree',
    'Pannello dei livelli',
    'icon-layers',
    function() {
        if (sidebarPanel.handleEvent || typeof(sidebarPanel.handleEvent) === 'undefined')
        {
            if (this.active) {
                this.deactivate();
                sidebarPanel.hide('layertree');
            }
            else
            {
                this.activate();
                sidebarPanel.show('layertree');
            }
            if (typeof(sidebarPanel.handleEvent) !== 'undefined')
                sidebarPanel.handleEvent = false;
        }
    },
    {button_group: 'data', sidebar_panel: 'layertree'}
);

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
OpenLayers.GisClient.reportToolbar = OpenLayers.Class(OpenLayers.Control.Panel,{
    
    // **** baseUrl - Gisclient service URL
    baseUrl : '/gisclient',
    reportsCache:[],
    reportsNum : 0,
    filterButtonHander: null,
    logged_username: null,
    rowsPerPage: 0,
    selectedReport: 0,
    selectedCols: [],
    currentPage: 0,
    totalRows: 0,
    dataLoading: false,
    loadingControl: undefined,
    
    
    initialize: function(options) {
        OpenLayers.Control.Panel.prototype.initialize.apply(this, [options]);
        var self = this;
        
        var controls = [
            new OpenLayers.Control.Button({
                //type: OpenLayers.Control.TYPE_TOGGLE, 
                iconclass:"glyphicon-white glyphicon-list-alt", 
                title:"Visualizza Report",
                text:"Mostra Report",
                trigger: function() {self.displayReportHandler()}
            })
        ];
        
        if(typeof(this.filterButtonHander) == 'function') {
            controls.push(new OpenLayers.Control.Button({
                //type: OpenLayers.Control.TYPE_TOGGLE, 
                iconclass:"glyphicon-white glyphicon-search", 
                title:"Filtra Report",
                text:"Filtra Report",
                trigger:this.filterButtonHander
            }));
        }

        this.addControls(controls);
    },
    
    fillReportCache: function(){
        var params = {
            action: 'list',
            mapset: GisClientMap.mapsetName
        };
        
        var request = OpenLayers.Request.POST({
            url: this.baseUrl + 'services/report.php',
            data: OpenLayers.Util.getParameterString(params),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            callback: function(response) {
                var self = this;
                if(!response || typeof(response) != 'object' || !response.status || response.status != 200) {
                    return alert('Errore di sistema');
                }

                if (!response.responseText) {
                    return alert('Nessun report disponibile, errore non previsto');
                }

                var responseObj = JSON.parse(response.responseText);

                if (!responseObj.result || responseObj.result != 'ok') {
                    var errMessage = 'Errore in creazione della lista dei reports per questo mapset';
                    if (responseObj.error)
                        errMessage += ' - Dettagli: ' + responseObj.error;
                    return alert (errMessage);
                }

                
                self.reportsNum = responseObj.reportDefs.length;
                for (var i = 0; i < self.reportsNum; i++) {
                    self.reportsCache.push(responseObj.reportDefs[i]);
                }
                
                self.logged_username = responseObj.logged_username;
                
                //self.addReportsCombo();
            },
            scope: this
        });
    },
 
    //crea una option per select
    getOption: function(text,value){
        option = document.createElement("option");
        option.text=text;
        option.value=value;
        return option;
    },
    
    addReportsCombo: function(){
        if(Object.keys(this.reportsCache).length == 0){
            var span = document.createElement("div");
            OpenLayers.Element.addClass(span, "olControlReportMapSelect");
            span.innerHTML = "Nessun report interrogabile";
            this.reportsCombo = span;
            return;
        }
        
        var rpList = document.createElement("select");
        var group, option;
        rpList.add(this.getOption("SELEZIONA REPORT",0));
        for (idx in this.reportsCache) {
            if (this.reportsCache[idx].group != group) {
                group = this.reportsCache[idx].group;
                option = document.createElement("optgroup");
                option.label="Tema: " + group;
                rpList.add(option);
            }
            option = this.getOption(this.reportsCache[idx].title,this.reportsCache[idx].reportID);
            rpList.add(option);  
        } 
        
        var self=this;
        rpList.onchange = function(e){self.selectedReport = e.target.value};//VEDERE SE VA SENZA JQUERY
        OpenLayers.Element.addClass(rpList, "olControlReportMapSelect");
        this.reportsCombo = rpList;
    },
    
    draw:function(){
        
        if(!this.loadingControl) {
            var query = this.map.getControlsByClass('OpenLayers.Control.LoadingPanel');
            if(query.length) this.loadingControl = query[0];
        }

        this.fillReportCache();
        OpenLayers.Control.Panel.prototype.draw.apply(this);
        return this.div
    },

    redraw: function() {
        OpenLayers.Control.Panel.prototype.redraw.apply(this);
        this.addReportsCombo();
        if (this.active) {
            //for(var i=0;i<this.map.layers.length;i++) if(this.wfsCache[this.map.layers[i].id]) this.updateFeatureCombo(this.map.layers[i]);
            if (this.outsideViewport){
                this.div.appendChild(this.reportsCombo);
                this.div.style.height="60px";
            }
            else
                this.map.div.appendChild(this.reportsCombo);
        }
        else{
            this.div.style.height="0px";  
        }

    },
    
    getReportDef: function (reportID) {
        var reportsCount = this.reportsCache.length;
        if (!reportsCount)
            return null;
        
        for (var i = 0; i < reportsCount; i++) {
            if (this.reportsCache[i].reportID == reportID) {
                return this.reportsCache[i];
            }
        }
        
        return null;
    },
    
    displayReportHandler: function(reportFilter){
        var self = this;
        if (this.selectedReport > 0){
            this.selectedCols = [];
            this.currentPage = 0;
            this.totalRows = 0;
            var reportData = {
                reportID: this.selectedReport,
                reportDef: this.getReportDef(self.selectedReport)
            };
            
            if (reportFilter) reportData.filter = reportFilter;
            
            this.events.triggerEvent('initreport', reportData);            
        }
        
    },
    
    getReportData: function (reportID, pageNum, filter) {
        var limitRows = this.rowsPerPage > 0 ? this.rowsPerPage : null;
        
        this.dataLoading = true;

        var params = {
            action: 'query',
            mapset: GisClientMap.mapsetName,
            report_id: reportID,
            rows: limitRows,
            page: pageNum
        };
        
        if (filter) {
            if (filter.query) params.query = filter.query;
            if (filter.values) params.values = JSON.stringify(filter.values);
        }
        
        var request = OpenLayers.Request.POST({
            url: this.baseUrl + 'services/report.php',
            data: OpenLayers.Util.getParameterString(params),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            callback: function(response) {
                var self = this;

                if(!response || typeof(response) != 'object' || !response.status || response.status != 200) {
                    return alert('Errore di sistema');
                }

                if (!response.responseText) {
                    return alert('Nessun report disponibile, errore non previsto');
                }

                var responseObj = JSON.parse(response.responseText);

                if (!responseObj.result || responseObj.result != 'ok') {
                    var errMessage = 'Errore in creazione del report richiesto';
                    if (responseObj.error)
                        errMessage += ' - Dettagli: ' + responseObj.error;
                    return alert (errMessage);
                }

                self.totalRows = responseObj.total;
                self.events.triggerEvent('insertrows', responseObj.data);
                
                self.dataLoading = false;
            },
            scope: this
        });
    },
    
    exportReport: function(reportID, format, filter) {
        var params = {
            action: format,
            mapset: GisClientMap.mapsetName,
            report_id: reportID
        };
        
        if (filter) {
            if (filter.query) params.query = filter.query;
            if (filter.values) params.values = JSON.stringify(filter.values);
        }
        
        if(this.loadingControl) this.loadingControl.maximizeControl();
        
        var request = OpenLayers.Request.POST({
            url: this.baseUrl + 'services/report.php',
            data: OpenLayers.Util.getParameterString(params),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            callback: function(response) {
                var self = this;
                var fmt = format;
                
                if(self.loadingControl) self.loadingControl.minimizeControl();
                
                if(!response || typeof(response) != 'object' || !response.status || response.status != 200) {
                    return alert('Errore di sistema');
                }

                if (!response.responseText) {
                    return alert('Nessun report disponibile, errore non previsto');
                }

                var responseObj = JSON.parse(response.responseText);

                if (!responseObj.result || responseObj.result != 'ok') {
                    var errMessage = 'Errore in esportazione del report richiesto';
                    if (responseObj.error)
                        errMessage += ' - Dettagli: ' + responseObj.error;
                    return alert (errMessage);
                }

                if (fmt == 'xls') {
                    window.location.assign(responseObj.file);
                }
                else {
                    var win = window.open(responseObj.file, '_blank');
                    win.focus();
                }
                
            },
            scope: this
        });
    },
    
    CLASS_NAME: "OpenLayers.GisClient.reportToolbar"

});

OpenLayers.Protocol.HTTP.prototype.create = function(features, options) {
        options = OpenLayers.Util.applyDefaults(options, this.options);

        var resp = new OpenLayers.Protocol.Response({
            reqFeatures: features,
            requestType: "create"
        });

		var params = options.params;
		params.features = this.format.write(features)

        resp.priv = OpenLayers.Request.POST({
            url: options.url,
            callback: this.createCallback(this.handleCreate, resp, options),	
            headers: options.headers,
			data:OpenLayers.Util.getParameterString(options.params),
			headers: {"Content-Type": "application/x-www-form-urlencoded"}
        });
        return resp;
    };
	
 OpenLayers.Strategy.Save.prototype.save = function(features) {
        if(!features) {
            features = this.layer.features;
        }
        this.events.triggerEvent("start", {features:features});
		
		
		//Possiamo evitare la riproiezione
		
		/*
        var remote = this.layer.projection;
        var local = this.layer.map.getProjectionObject();
        if(!local.equals(remote)) {
            var len = features.length;
            var clones = new Array(len);
            var orig, clone;
            for(var i=0; i<len; ++i) {
                orig = features[i];
                clone = orig.clone();
                clone.fid = orig.fid;
                clone.state = orig.state;
                if(orig.url) {
                    clone.url = orig.url;
                }
                clone._original = orig;
                clone.geometry.transform(local, remote);
                clones[i] = clone;
            }
            features = clones;
        }
		*/	

		var commitOptions = {callback: this.onCommit,scope: this};
		//TODO VEDERE I TIPI .....
		if(this.create) commitOptions["create"] = this.create;
		if(this.update) commitOptions["update"] = this.update;
		if(this["delete"]) commitOptions["delete"] = this["delete"];
        this.layer.protocol.commit(features,commitOptions);
    };
	
	OpenLayers.Protocol.WFS.v1.prototype.read = function(options) {
        OpenLayers.Protocol.prototype.read.apply(this, arguments);
        options = OpenLayers.Util.extend({}, options);
        OpenLayers.Util.applyDefaults(options, this.options || {});
        var response = new OpenLayers.Protocol.Response({requestType: "read"});
        
        
		//console.log(options)
		var data = OpenLayers.Format.XML.prototype.write.apply(
            this.format, [this.format.writeNode("wfs:GetFeature", options)]
        );

		//console.log(data)
		var params = {
            WERVICE: "WFS",
            REQUEST: "GetFeature",
            VERSION: "1.0.0"
        };
		
        response.priv = OpenLayers.Request.POST({
            url: options.url,
			
            callback: this.createCallback(this.handleRead, response, options),
			data:OpenLayers.Util.getParameterString(options),
			headers: {"Content-Type": "application/x-www-form-urlencoded"}
		});

        return response;
    }
	
	//Parse querystring
	function getParameterByName(name)
		{
		  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
		  var regexS = "[\\?&]" + name + "=([^&#]*)";
		  var regex = new RegExp(regexS);
		  var results = regex.exec(window.location.search);
		  if(results == null)
			return "";
		  else
			return decodeURIComponent(results[1].replace(/\+/g, " "));
		}

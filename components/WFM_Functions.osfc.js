//*********************************************************************************************************
//**** Functions for GEOweb - WFM integration
//**** OSFC integration functions
var OSFCData = {
    action: 'writeOnOFSC'
};

window.GCComponents.Functions.postMessageHandler = function (event) {
    // **** TODO: validate source
    var postData = event.data;
    if (postData.action == 'centerMap') {
        window.GCComponents.Functions.centerMap(postData.x, postData.y, postData.srid, postData.zoom);
    }
}

// **** PostMessage
window.addEventListener('message', window.GCComponents.Functions.postMessageHandler, false);

window.GCComponents.Functions.sendToWFM = function(wfmItems) {
    if (wfmItems.x && wfmItems.y && wfmItems.srid) {
        if (wfmItems.srid !== WFM_SRID)
            return;
        OSFCData.coordx = wfmItems.x;
        OSFCData.coordy = wfmItems.y;
    }
    else {
        if (wfmItems.wfm_outitem) {
            for (var field in wfmItems) {
                if (field !== 'wfm_outitem') {
                    var fieldVal = (typeof(wfmItems[field]) === 'undefined')?null:wfmItems[field];
                    OSFCData[field] = fieldVal;
                }
            }
        }
    }
    parent.postMessage(OSFCData,'*');
}

window.GCComponents.Functions.resetWFMData = function(){
    OSFCData = {
        action: 'writeOnOFSC'
    };

}

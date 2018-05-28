var configLoaded = $.Deferred();
var clientConfig = {
 GISCLIENT_URL : '/gisclient3',
 URL_CLIENT_CONFIG : "/gisclient3/services/clientConfig.php",
 MAPPROXY_URL : '/',
 POPUP_TIMEOUT : 2000,
 // **** Numero massimo di oggetti per layer in interrogazione
 MAX_LAYER_FEATURES : 100,
 // **** Numero massimo totale di oggetti in interrogazione
 MAX_QUERY_FEATURES : 500,
 // **** Templates di stampa
 PRINT_TEMPLATE_HTML : null,
 PRINT_TEMPLATE_PDF : null,
 // **** Dimensioni della Reference Map (in pixel)
 OVERVIEW_MAP_W : 360,
 OVERVIEW_MAP_H : 180,
 // **** Chiave per caricamento suggerimenti
 CLIENT_COMPONENTS : ["StreetViewControl:1:alone", "LayerTreeButton:2:data", "QueryControl:1:data",
                      "PrintControl:1:print", "ReferenceMapControl:2:print"],
};
$.get(clientConfig.URL_CLIENT_CONFIG, function(returnedData){
  Object.assign(clientConfig, JSON.parse(returnedData));
  configLoaded.resolve();
});

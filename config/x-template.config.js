var wrapperConfigLoaded = $.Deferred();
var MAX_LAYER_FEATURES;
var MAX_QUERY_FEATURES;
var PRINT_TEMPLATE_HTML;
var PRINT_TEMPLATE_PDF;
var DEFAULT_CONTROL;
$.when(configLoaded).then(function() {
  MAX_LAYER_FEATURES = clientConfig.MAX_LAYER_FEATURES;
  MAX_QUERY_FEATURES = clientConfig.MAX_QUERY_FEATURES;
  PRINT_TEMPLATE_HTML = clientConfig.PRINT_TEMPLATE_HTML;
  PRINT_TEMPLATE_PDF = clientConfig.PRINT_TEMPLATE_PDF;
  wrapperConfigLoaded.resolve();
});

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */




var GISCLIENT_URL = '/gisclient';
if (window.location.hostname.indexOf('rapallo')!=-1){
    GISCLIENT_URL = '/gisclient3';
}


var MAPPROXY_URL = 'http://172.16.5.72/';
var POPUP_TIMEOUT = 2000;

// **** Numero massimo di oggetti per layer in interrogazione
var MAX_LAYER_FEATURES = 100;
// **** Numero massimo totale di oggetti in interrogazione
var MAX_QUERY_FEATURES = 500;


PRINT_TEMPLATE_HTML = '';
PRINT_TEMPLATE_PDF = '';



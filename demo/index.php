<?php
require_once('../../gisclient-3.1/config/config.php');
require_once (ADMIN_PATH."lib/functions.php");
require_once (ROOT_PATH.'public/services/include/gcMap.class.php');
if(!isset($_REQUEST["mapset"])) die('Manca il nome del mapset');
$objMapset = new gcMap($_REQUEST["mapset"]);
?>
<html>
    <head>
        <title><?php echo $objMapset->mapOptions["title"]?></title>
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
		<script type="text/javascript" src="../resources/jslib/ext-3.4.0/adapter/ext/ext-base.js" ></script>
		<script type="text/javascript" src="../resources/jslib/ext-3.4.0/ext-all.js" ></script>
		<link type="text/css" rel="stylesheet" href="../resources/jslib/ext-3.4.0/resources/css/ext-all.css" />
	   <!--
		<script type="text/javascript" src="../resources/jslib/ext-3.3.1/adapter/ext/ext-base-debug.js" ></script>
        <script type="text/javascript" src="../resources/jslib/ext-3.3.1/ext-all-debug.js" ></script>
		-->

		
		<script type="text/javascript" src="../resources/jslib/openlayers/OpenLayers.js" ></script>
		<script type="text/javascript" src="../resources/jslib/gcOloverride.js"></script>
		<!--<script src="../resources/jslib/proj4js-compressed.js" type="text/javascript"></script>-->

		
		<script type="text/javascript" src="../resources/jslib/geoext/GeoExt.js"></script>
		<script type="text/javascript" src="../resources/jslib/TreeNodeAutoDisable.js"></script>
		<script type="text/javascript" src="../resources/jslib/LayerTreeBuilder.js"></script>
		
		<link type="text/css"  rel="stylesheet" href="../resources/css/gcGeoext.css" />	
		<link type="text/css" rel="stylesheet" href="../resources/css/LayerTreeBuilder.css" />		

		<!--CARICA LA LISTA DEI PROVIDERS ESTERNI CON LE CHIAVI CORRETTE-->
		<?php echo $objMapset->getMapProviders()?>

		<!-- SCRIPT GISCLIENT -->
		<!--<script type="text/javascript">Ext.namespace("GisClient");</script>-->
		
		<script src="../resources/jslib/gcMapPanel.js" type="text/javascript"></script>
		<script src="../resources/jslib/gcTreePanel.js" type="text/javascript"></script>
		<script src="../resources/jslib/gcSLDSelect.js" type="text/javascript"></script>
		<script src="../resources/jslib/gcZoomToolbar.js" type="text/javascript"></script>	

		<!-- PLUGINS GISCLIENT -->		
		<script src="../resources/jslib/plugins/gcLoadingMessage.js" type="text/javascript"></script>
		<script src="../resources/jslib/plugins/gcNavigation.js" type="text/javascript"></script>
		<script src="../resources/jslib/plugins/gcMeasure.js" type="text/javascript"></script>
		<script src="../resources/jslib/plugins/gcCoordinates.js" type="text/javascript"></script>
		<script src="../resources/jslib/plugins/gcMapQuery.js" type="text/javascript"></script>
		<script src="../resources/jslib/plugins/gcFeaturePopup.js" type="text/javascript"></script>

		
<script type="text/javascript">
<!--CARICA L'ELENCO DEI LAYER DEFINITI PER IL MAPSET-->

<?php echo $objMapset->OLMap();?>

Ext.BLANK_IMAGE_URL = "../resources/images/blank.gif";
Ext.MessageBox.buttonText = {ok : "OK", cancel : "Annulla", yes : "Si",no : "No"};

Ext.onReady(function() {
	Ext.QuickTips.init();
	var mapset = GisClient.mapset[0];
	//SE VOGLIO AGGIUNGERE LAYER PRESI DA UN ALTRO MAPSET
	//mapset.map.layers.push(new OpenLayers.Layer.Vector("mylayer"));mapset.map.layers.push(GisClient.mapset[1].map.layers);	
	//var layerSezioni = aggiungiLayerSezioni(mapset);
	
	var options={
		
		title: "",
		plugins: [{ptype:"gc_loading"},{ptype:"gc_navigation"},{ptype:"gc_measure"},{ptype:"gc_coordinates",coordPrecision: 6},{ptype:"gc_mapquery"},{ptype: 'gc_featurepopup'}],
		controls: [new OpenLayers.Control.ScaleLine({bottomInUnits:false})]
	}
	Ext.apply(mapset,options);
	var mapPanel = new GisClient.MapPanel(mapset);

	if (!mapPanel) return;
	//printExtent.addPage();

	var zoomToolbar = new GisClient.ZoomToolbar({
		mapPanel:mapPanel,
		dbschema:'public',
		url:'/gisclient/services/sitiset/zoomto.php',
		data:[['geolocator','Indirizzo Google'],['strada_provinciale','Strada provinciale'],['stradario','Stradario'],['particella','Particella'],['empty','Comune']]
	});


	
	TreeMenu(mapPanel);

	new Ext.Viewport({
        layout: "fit",
        hideBorders: false,
        items: {
            layout: "border",
			deferredRender: true, // Needed for Bing layers
            items: [
                mapPanel
			],
			bbar: zoomToolbar
        }
    });
	
	
	if(window.parent) {
		window.parent.mapPanel = mapPanel;
	}
	
});

</script>

</head>
    <body>
    </body>
</html>
var SITE = "";
var SITE_ID = "";
var CLIENT_ID = '';
  var _paq = _paq || [];
  $(document).ready(function() {
    var u="//"+SITE+"/piwik/";
    _paq.push(['setTrackerUrl', u+'piwik.php']);
    _paq.push(['setSiteId', SITE_ID]);
    _paq.push(['setUserId',]);
    _paq.push(['trackPageView']);
    _paq.push(['enableLinkTracking']);
    var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
    g.type='text/javascript'; g.async=true; g.defer=true; g.src=u+'piwik.js'; s.parentNode.insertBefore(g,s);
  });

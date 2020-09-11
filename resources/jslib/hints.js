/**
Script che provvede al caricamento/gestione dei suggerimenti da parte dell'utente
**/
function generateHints() {
  //chiamata ajax per lista file suggerimento
  $.post(GisClientMap.baseUrl + "/services/listHints.php", { app: clientConfig.HINTS_KEY},
    function(returnedData){
      if($.trim(returnedData)) {
        $("#hintsDivContent").append(returnedData);
        var show = false;
        $("#hintsDivContent > div").each(function() {
          if(localStorage.getItem(clientConfig.HINTS_KEY+"."+this.id)) {
            $(this).css("display", "none");
          } else {
            show = true;
          }
        });
        $("#hintsDivContent > div > :checkbox").on("click", checkHintCheckbox);
        if(show) {
          $("#hintsButton").css("display", "none");
          $("#hintsDiv").removeClass("hide");
          setTimeout(function(){ closeHints(); }, 10000);
        }
      }
      $("#mapset-hints").css("display", "none");

  }).fail(function( jqxhr, settings, exception ) {
    window.alert("Inclusione componente HINTS :" + +exception);
    $("#mapset-hints").css("display", "none");
  });

  $("#mapset-hints").on("click", function() {
    $('#mapset-hints').css("display", "none");
    $("#hintsDiv").show();
  });
  $("#hintsButton").on("click", function() {
    closeHints();
  });
}

function checkBoxManagement(arg) {
  if(localStorage.getItem(clientConfig.HINTS_KEY+"."+arg))
    localStorage.removeItem(clientConfig.HINTS_KEY+"."+arg);
  else
    localStorage.setItem(clientConfig.HINTS_KEY+"."+arg, arg);
}

function closeHints() {
 $('#mapset-hints').css("display", "");
 $("#hintsButton").css("display", "");
 $("#hintsDiv").hide();
}

function checkHintCheckbox() {
  var num = $("#hintsDivContent > div > :checkbox").length;
  var numChk = $("#hintsDivContent > div > :checkbox:checked").length;
  if(num == numChk) {
    closeHints();
    $('#mapset-hints').css("display", "none");
  }
}

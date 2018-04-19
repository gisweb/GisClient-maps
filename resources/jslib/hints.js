/**
Script che provvede al caricamento/gestione dei suggerimenti da parte dell'utente
**/
$(document).ready(function() {
  if (typeof(HINTS_KEY) == 'undefined')
    var HINTS_KEY = null;
  //chiamata ajax per lista file suggerimento
  $.post(GisClientMap.baseUrl + "/services/listHints.php", { app: HINTS_KEY},
    function(returnedData){
      if($.trim(returnedData)) {
        $("#hintsDivContent").append(returnedData);
        var show = false;
        $("#hintsDivContent > div").each(function() {
          if(localStorage.getItem(HINTS_KEY+"."+this.id)) {
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
      $("#mapset-question").css("display", "none");

  });
  

  
  $("#mapset-question").on("click", function() {
    $('#mapset-question').css("display", "none");
    $("#hintsDiv").show();
  });
  $("#hintsButton").on("click", function() {
    closeHints();
  });
});

function checkBoxManagement(arg) {
  if(localStorage.getItem(HINTS_KEY+"."+arg))
    localStorage.removeItem(HINTS_KEY+"."+arg);
  else
    localStorage.setItem(HINTS_KEY+"."+arg, arg);
}

function closeHints() {
 $('#mapset-question').css("display", "");
 $("#hintsButton").css("display", "");
 $("#hintsDiv").hide();
}

function checkHintCheckbox() {
  var num = $("#hintsDivContent > div > :checkbox").length;
  var numChk = $("#hintsDivContent > div > :checkbox:checked").length;
  if(num == numChk) {
    closeHints();
    $('#mapset-question').css("display", "none");
  }
}

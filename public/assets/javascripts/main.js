var form = document.querySelector("#form");
var submitBtn = document.querySelector("#submit");
var x = "ahas";
function sendData()
{
  console.log("inside SendData");
  var FD = new FormData(form);
  $.ajax({
    url: "/api/upload",
    method: "POST",
    data: FD,
    processData: false,
    contentType: false,
    success: function(result){x = result;alert(result.message);},
    error: function(result){x = result;alert(result.responseJSON.message);}
  });

}

submit.addEventListener("click",function(event) {
  console.log("Button clicked");
  sendData();
});

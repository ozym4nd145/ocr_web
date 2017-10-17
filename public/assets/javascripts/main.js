var form = document.querySelector("#submit_form");
var submitBtn = document.querySelector("#submit");
var x = "ahas";
function sendData()
{
  var FD = new FormData(form);
  $.ajax({
    url: "/api/upload",
    method: "POST",
    data: FD,
    processData: false,
    contentType: false,
    success: success_msg,
    error: error_msg,
    xhr: function() {
      var xhr = new window.XMLHttpRequest();
      xhr.upload.addEventListener("progress",function(event){
        if(event.lengthComputable){
          var percentComplete = parseInt((event.loaded/event.total)*100);
          $('#upload-bar').text(percentComplete+'%');
          $('#upload-bar').css('width',percentComplete+'%');
        }
      },false);
      return xhr;
    }
  });
}

function success_msg(result)
{
  var message = result.message;
  x = result;
  $('#msg-success').fadeIn();
  $('#msg-success').text(message);
  $('#submit').prop('disabled',false);
  $('#upload-bar').fadeOut();

}

function error_msg(result)
{
  var message = result.responseJSON.message;
  x = result;
  $('#msg-error').fadeIn();
  $('#msg-error').text(message);
  $('#submit').prop('disabled',false);
  $('#upload-bar').fadeOut();

}


function start_state(){
  $('#upload-bar').fadeOut();
  $('#msg-success').fadeOut();
  $('#msg-error').fadeOut();
  $('#submit').prop('disabled',false);
}

$('#submit').click(function() {
  console.log("clicked");
  start_state();
  $('#upload-bar').css({'display':'','width':'0'});
  $('#submit').prop('disabled',true);
  sendData();
});

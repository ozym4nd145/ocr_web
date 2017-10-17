const AWS = require('aws-sdk');
const SES = new AWS.SES({
  accessKeyID: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_KEY,
  region: 'us-east-1',
  endpoint: new AWS.Endpoint('https://email.us-east-1.amazonaws.com')
});

function sendMail(email,link,callback){
  const params = {
    Destination : {
      ToAddresses: [email]
    },
    Message: {
      Body: {
        Html: {
          Data: "Hey!<br/><br/>Your file has been processed!<br/>You can find it <a href=\""+link+"\">here</a><br/>"+
                "Thanks for using our service.<br/><br/>Regards,<br/>ozym4nd145",
        },
      },
      Subject: {
        Data: "WebOCR: File Ready"
      }
    },
    //Source: "WebOCR \<webocr@ozym4nd145.me\>",
    Source: "Suyash \<ozym4nd145@outlook.com\>",
  };
  SES.sendEmail(params,function(err,data){
    if(err){
      return callback(err);
      /*
      setTimeout(function(){
        sendMail(email,link,cb);
      },300);
      */
    }
    else {
      console.log("Email sent to: %s",email);
      return callback();
    }
  });
}

module.exports = {
  sendMail: sendMail,
};

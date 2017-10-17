'use strict';
const nodemailer = require('nodemailer');

let smtpConfig = {
  host: "smtp.sendgrid.net",
  port: 465,
  secure: true,
  auth:{
    user: process.env.SENDGRID_USER,
    pass: process.env.SENDGRID_PASS,
  }
}

let transporter = nodemailer.createTransport(smtpConfig);

function sendMail(email,link,callback){
  let email_params = {
    from: 'web_ocr@ozym4nd145.me',
    to: email,
    subject: "WebOCR: File Ready",
    html: "Hey!<br/><br/>Your file has been processed!<br/>You can find it <a href=\""+link+"\">here</a><br/>"+
                "Thanks for using our service.<br/><br/>Regards,<br/>ozym4nd145",
  };
  transporter.sendMail(email_params,function(err,info){
    if (err){
      console.log(err);
      callback(err);
    }
    else {
      console.log('Message sent: ' + info.response);
      callback();
    }
  });
}

module.exports = {
  sendMail: sendMail,
};

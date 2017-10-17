const express = require('express');
const router = express.Router();
const multer = require('multer');
const async = require('async');
const cmd = require('node-cmd');
const AWS = require('aws-sdk');
const fs = require('fs');
const fileMailer = require('../mailers/fileMailer');
const processQueue = async.queue(processPDF,1);
const path = require('path');

const userDB = JSON.parse(fs.readFileSync(path.resolve(__dirname,'../db/users.json'), 'utf8'));

var storage = multer.diskStorage({
  destination: 'uploads/',
});
var upload = multer({storage: storage,limits:{fileSize:104857600}, fileFilter: pdfFilter});

function pdfFilter (req, file, cb){
  var type = file.mimetype;
  var typeArray = type.split("/");
 
  if (typeArray[1] == "pdf") {
    cb(null, true);
  }else {
    cb(new Error('Unacceptable file type'));
  } 
 
}

function processPDF(file,callback)
{
  console.log("--------------Processing: "+file.path+" ---------");
  var base_cmd="ocrmypdf -l "+file.language+" --force-ocr --tesseract-oem 1 --deskew --output-type pdf ";
  console.log(base_cmd);
  var command = base_cmd+file.path+" "+file.path;
  cmd.get(command,function(err,data,stderr){
  //cmd.get('sleep 1 && echo '+file.path,function(err,data,stderr){
    if(err){
      console.log("err: "+err);
    }
    console.log("output: "+data); 
    callback(file);
  });
}

function postProcessing(file)
{
  console.log("will upload new file to AWS: "+file.originalname);
  uploadFile(file,function(err,link){
    if(err){
      console.log(err);
    }
    else{
      fileMailer.sendMail(file.email,link,function(err){if(err){console.log("ERROR MAIL: "+err);}});
    }
  });
}

function uploadFile(file,cb)
{
  AWS.config.update({
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
    region: "ap-south-1",
    endpoint: new AWS.Endpoint('https://s3.ap-south-1.amazonaws.com'),
  });
  let s3Bucket = new AWS.S3();
  let stream = fs.createReadStream(file.path);
  let key_path = "web_ocr/" + Date.now()+"/"+file.originalname;
  let s3Data = {
    ACL: "public-read",
    Bucket: 'ozym4nd145',
    Key: key_path,
    Body: stream,
    ContentType: file.mimetype
  };
  console.log(s3Data);
  s3Bucket.upload(s3Data,function(err,resp) {
    console.log(resp);
    let link = "https://s3.ap-south-1.amazonaws.com/ozym4nd145/"+key_path;
    console.log(link);
    if(err) {
      console.log("Error: "+err);
      cb("Error in uploading: "+file.originalname,null);
    } 
    else{
      cb(null,link);
    }
    fs.unlink(file.path,(err) => {if (err) throw err;});
  });
}

function verifyUser(username, password)
{
  //return true;
  if(username in userDB && userDB[username]==password)
    return true;
  return false;
}

router.post('/', upload.any(),function(req, res) {
  console.log(req.body);
  let filesArray = req.files;
  let username = req.body.username;
  let password = req.body.password;
  let email = req.body.email.toLowerCase();
  let languages = [];
  if("hin" in req.body)
    languages.push("hin");
  if("eng" in req.body)
    languages.push("eng");
  if("equ" in req.body)
    languages.push("equ");
  if (languages.length == 0)
    return error(res, 400, "Select atleast one language");
  let language = languages.join("+");

  if (!email.match(/^[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/)) {
    console.log('Error: Invalid email entered - %s',email);
    return error(res, 400, "Please enter a valid Email Address");
  }
  if(!username || !password){
    return error(res,401,"LoginID or Password is empty");
  }
  if(verifyUser(username,password))
  {
    async.each(filesArray,function(file,callback){
        console.log("Processing: "+file.originalname);
        let job = {
          originalname: file.originalname,
          path: file.path,
          mimetype: file.mimetype,
          email: email,
          language: language
        }
        processQueue.push(job,postProcessing);
        callback();
      },function(err){
        if(err){
          console.log('Error occurred in each');
        }
        else {
          console.log('Jobs added to queue');
        }
        return res.json({message:"Jobs added to queue"});
      }
    );
  }
  else
  {
    return error(res,401,"Username or Password Incorrect");
  }
});

function error(res,statusCode,msg){
  res.status(statusCode).json({
    error: true,
    message: msg,
  });
}

module.exports = router;

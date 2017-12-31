const express = require('express');
const router = express.Router();
const multer = require('multer');
const async = require('async');
const cmd = require('node-cmd');
const AWS = require('aws-sdk');
const fs = require('fs');
const fileMailer = require('../mailers/fileMailer');
const processQueue = async.queue(processCommand,1);
const path = require('path');

const userDB = JSON.parse(fs.readFileSync(path.resolve(__dirname,'../db/users.json'), 'utf8'));
const destinationPath = path.resolve(__dirname,'../uploads/');
var storage = multer.diskStorage({
  destination: destinationPath,
});
var upload = multer({storage: storage,limits:{fileSize:404857600}, fileFilter: pdfFilter});

function pdfFilter (req, file, cb){
  var type = file.mimetype;
  var typeArray = type.split("/");
 
  let supportedTypes = ["pdf","png","jpeg","tiff"];
  if (supportedTypes.indexOf(typeArray[1]) > -1) {
    cb(null, true);
  }else {
    cb(new Error('Unacceptable file type'));
  } 
 
}

function processCommand(file,callback)
{
  console.log("--------------Executing: "+file.command+" ---------");
  cmd.get(file.command,function(err,data,stderr){
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
      fileMailer.sendMail(file.email,file.originalname,link,function(err){if(err){console.log("ERROR MAIL: "+err);}});
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
  s3Bucket.upload(s3Data,function(err,resp) {
    let link = "https://s3.ap-south-1.amazonaws.com/ozym4nd145/"+key_path;
    console.log(link);
    if(err) {
      console.log("Error: "+err);
      cb("Error in uploading: "+file.originalname,null);
    } 
    else{
      cb(null,link);
    }
    fs.unlink(file.path,(err) => {if (err) console.log(err);});
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
  let base_cmd="ocrmypdf -l "+language+" --force-ocr --clean --tesseract-oem 1 --deskew --output-type pdf ";

  if (filesArray.length == 0)
    return error(res, 400, "Upload atleast one file");

  if (!email.match(/^[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/)) {
    console.log('Error: Invalid email entered - %s',email);
    return error(res, 400, "Please enter a valid Email Address");
  }
  if(!username || !password){
    return error(res,401,"LoginID or Password is empty");
  }
  if(verifyUser(username,password))
  {
    let action = null;
    for(var i=0;i<filesArray.length;i++)
    {
      var isPDF = (filesArray[i].mimetype.split('/')[1]=="pdf");
      if(isPDF){
        if(action==null) { action="pdf"; }
        else if(action != "pdf") { action="invalid"; break;}
      }
      else{
        if(action==null) { action="image"; }
        else if(action != "image") { action="invalid"; break;}
      }
    }

    //Single file uploaded or all files are pdfs
    if(action=="pdf")
    {
      async.each(filesArray,function(file,callback){
          console.log("Processing: "+file.originalname);
          var run_cmd = base_cmd+file.path+" "+file.path;
          let job = {
            originalname: file.originalname,
            path: file.path,
            command: run_cmd,
            mimetype: file.mimetype,
            email: email,
            language: language
          };
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
    else if(action == "image")
    {
      filesArray.sort(function(a,b){var x=a.originalname; let y=b.originalname;return ((x < y) ? -1 : ((x > y) ? 1 : 0));});
      let paths = [];
      for(var i=0;i<filesArray.length;i++){
        paths.push(filesArray[i].path);
      }
      let files = paths.join(' ');
      let output_pdf = Date.now()+'.pdf';
      let output_path = path.resolve(destinationPath,output_pdf);
      let pdf_make_command = "img2pdf "+files+" -o "+output_path+" && rm "+files;
      let run_cmd = pdf_make_command +" && "+base_cmd+output_path+" "+output_path;
      //let run_cmd = pdf_make_command;
      let job = {
        originalname: output_pdf,
        path: output_path,
        command: run_cmd,
        mimetype: 'application/pdf',
        email: email,
        language: language
      }
      processQueue.push(job,postProcessing);
      return res.json({message:"Job added to queue"});
    }
    else
    {
      return error(res,401,"Please send pdf and image files separately");
    }
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

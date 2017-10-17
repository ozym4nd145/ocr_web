const express = require('express');
const router = express.Router();
const multer = require('multer');
const async = require('async');
const cmd = require('node-cmd');

const processQueue = async.queue(processPDF,2);

var storage = multer.diskStorage({
  destination: 'uploads/',
  filename: function(req,file,cb) {
    cb(null,file.originalname+'-'+Date.now())
  }
});
var upload = multer({storage: storage,limits:{fileSize:104857600}, fileFilter: pdfFilter});

function pdfFilter (req, file, cb){
  var type = file.mimetype;
  var typeArray = type.split("/");
  console.log(typeArray);
  cb(null, true);
  /*
  if (typeArray[1] == "pdf") {
    cb(null, true);
  }else {
    cb(new Error('Unacceptable file type'));
  } 
  */
}

function processPDF(file,callback)
{
  console.log("--------------Processing: "+file.path+" ---------");
  var base_cmd="ocrmypdf -l hin+eng+equ --force-ocr --tesseract-oem 1 --deskew --output-type pdf ";
  var command = base_cmd+file.path+" "+file.path;
  cmd.get('sleep 2 && echo '+file.path,function(err,data,stderr){
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

}


router.post('/', upload.any(),function(req, res) {
  console.log(req.body);
  console.log(req.files);
  var filesArray = req.files;
  async.each(filesArray,function(file,callback){
      console.log("Processing: "+file.originalname);
      processQueue.push(file,postProcessing);
      callback();
    },function(err){
      if(err){
        console.log('Error occurred in each');
      }
      else {
        console.log('finished processing');
      }
      res.redirect('/');
    }
  );
});

module.exports = router;

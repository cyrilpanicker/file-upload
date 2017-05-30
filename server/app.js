var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');
var mongo = require('mongodb');
var grid = require('gridfs-stream');
var multerGfsStorage = require('multer-gridfs-storage');

var fileLocation = 'http://localhost:8000/file/';
var timeStampedFileName = '';

var db = new mongo.Db('photum', new mongo.Server("127.0.0.1", 27017));
db.open(function (error,db) {
    if (error){
        console.log('db-connection-error');
        return;
    }
    var gfs = grid(db, mongo);
    var upload = multer({
        storage:multerGfsStorage({
            gfs:gfs,
            filename:function(request,file,callback){
                callback(null,timeStampedFileName);
            },    
            metadata:function(request,file,callback){
                callback(null,{
                    originalFileName:file.originalname,
                    fileLink:fileLocation+encodeURIComponent(timeStampedFileName)
                });
            }
        }),
        fileFilter:function(request,file,callback){
            timeStampedFileName = getTimeStampedFileName(file.originalname);
            callback(null,true);
        }
    });
    var app = express();
    app.use(bodyParser.json());
    app.use(express.static('./client/dist'));
    app.put('/files',upload.array('files'),function(request,response){
        response.send(request.files.map(function(file){
            return file.grid;
        }));
    });
    app.get('/file/:fileName',function(request,response){
        var gfsStream = gfs.createReadStream({filename:request.params.fileName});
        gfsStream.pipe(response);
    });
    app.get('/files',function(request,response){
        db.collection('fs.files').find().toArray(function(error,files){
            if(error){
                response.sendStatus(500).send({error:'db-error'});
            }else{
                response.send(files);
            }
        });
    });
    var ipaddress = '127.0.0.1';
    var port = 8000;
    app.listen(port, ipaddress, function() {
        console.log('listening at : http://'+ipaddress+':'+port);
    });
});

function getTimeStampedFileName(fileName){
    var fileExtension = '';
    var splitFileName = fileName.split('.');
    if(splitFileName.length>1){
        fileExtension = '.'+splitFileName.pop();
    }
    var resultFileName = '';
    if(!fileExtension){
        resultFileName = fileName;
    }else{
        resultFileName = fileName.replace(new RegExp(fileExtension+'$'),'');
    }
    resultFileName = resultFileName + '_' + new Date().getTime() + fileExtension;
    return resultFileName;
}
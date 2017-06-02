var express = require('express');
var http = require('http');
var socket_io = require('socket.io');
var bodyParser = require('body-parser');
var multer = require('multer');
var mongo = require('mongodb');
var grid = require('gridfs-stream');
var multerGfsStorage = require('multer-gridfs-storage');
var progress = require('progress-stream');

var fileLocation = '';
if(process.env.NODE_ENV === 'production'){
    fileLocation = 'http://94.177.203.221:8000/file/';
}else{
    fileLocation = 'http://localhost:8000/file/';
}
var timeStampedFileName = '';
var ipaddress = '0.0.0.0';
var port = 8000;
var connectedSockets = {};

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
    }).array('files');
    var app = express();
    var server = http.createServer(app);
    var sockets = socket_io(server);
    sockets.on('connection',function(socket){
        var id = socket.id;
        socket.emit('id',id);
        connectedSockets[id] = socket;
        socket.on('disconnect',function(){
            delete connectedSockets[id];
        });
    });
    server.listen(port, ipaddress, function() {
        console.log('listening at : http://'+ipaddress+':'+port);
    });
    app.use(bodyParser.json());
    app.use(express.static('./client/dist'));
    app.put('/files',function(request,response){
        var socketId = request.headers['socket-id'];
        var progressStream = progress({
            length:parseInt(request.headers['content-length']),
            time:100
        });
        request.pipe(progressStream);
        progressStream.headers = request.headers;
        if(socketId){
            var socket = connectedSockets[socketId];
            if(!socket){
                console.log('socket misplaced');
            }else{
                progressStream.on('progress',function(progress){
                    socket.emit('progress',{
                        eta:progress.eta,
                        percent:parseFloat(progress.percentage.toFixed(2))
                    });
                });
            }
        }
        upload(progressStream,response,function(error){
            if(error){
                response.status(500).send({error:error});
            }else{
                response.send(progressStream.files.map(function(file){
                    return file.grid;
                }));
            }
        });
    });
    app.get('/file/:fileName',function(request,response){
        var gfsStream = gfs.createReadStream({filename:request.params.fileName});
        gfsStream.pipe(response);
    });
    app.get('/files',function(request,response){
        db.collection('fs.files').find().toArray(function(error,files){
            if(error){
                response.status(500).send({error:'db-error'});
            }else{
                response.send(files);
            }
        });
    });
    app.delete('/file/:fileName',function(request,response){
        db.collection('fs.files').remove({filename:request.params.fileName},function(error){
            if(error){
                response.status(500).send({error:'db-error'});
            }else{
                response.sendStatus(200);
            }
        });
    });
    app.delete('/files',function(request,response){
        db.collection('fs.files').remove({},function(error){
            if(error){
                response.status(500).send({error:'db-error'});
            }else{
                response.sendStatus(200);
            }
        });
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
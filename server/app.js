var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');
var mongo = require('mongodb');
var Grid = require('gridfs-stream');
var multerConfig = require('./multer-config');

var db = new mongo.Db('photum', new mongo.Server("127.0.0.1", 27017));
db.open(function (error) {
    if (error){
        console.log('db-connection-error');
    }
    var gfs = Grid(db, mongo);
    var upload = multer({storage:multerConfig.fileStorage});
    var app = express();
    app.use(bodyParser.json());
    app.use(express.static('./client/dist'));
    app.put('/files',upload.array('files'),function(request,response){
        response.send(request.files.map(function(file){
            return file.grid;
        }));
    });
    app.get('/file/:fileName',function(request,response){
        console.log(request.params.fileName);
        var gfsStream = gfs.createReadStream({filename:request.params.fileName});
        gfsStream.pipe(response);
        // response.send(request.params.fileName);
    });
    var ipaddress = '127.0.0.1';
    var port = 8000;
    app.listen(port, ipaddress, function() {
        console.log('listening at : http://'+ipaddress+':'+port);
    });
});
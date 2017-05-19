var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');

var upload = multer({dest:'uploads/'});
var app = express();

app.use(bodyParser.json());
app.use(express.static('./client/dist'));

app.put('/file',upload.array('test'),function(request,response){
    response.send(
        request.files.map(function(file){
            return {
                fileName:file.filename,
                originalFileName:file.originalname
            };
        })
    );
});

var ipaddress = '127.0.0.1';
var port = 8000;
app.listen(port, ipaddress, function() {
    console.log('listening at : http://'+ipaddress+':'+port);
});
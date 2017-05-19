var express = require('express');
var bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.json());

app.use(express.static('./client/dist'));

app.post('/test',(request,response) => {
    response.send(request);
});

var ipaddress = '127.0.0.1';
var port = 8000;
app.listen(port, ipaddress, function() {
    console.log('listening at : http://'+ipaddress+':'+port);
});
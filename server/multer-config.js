var multerGridfsStorage = require('multer-gridfs-storage');

exports.fileStorage = multerGridfsStorage({
    url: 'mongodb://localhost:27017/photum',
    metadata:function(request,file,callback){
        callback(null,{originalFileName:file.originalname});
    },
    filename:function(request,file,callback){
        var fileExtension = '';
        var splitFileName = file.originalname.split('.');
        if(splitFileName.length>1){
            fileExtension = '.'+splitFileName.pop();
        }
        var resultFileName = '';
        if(!fileExtension){
            resultFileName = file.originalname;
        }else{
            resultFileName = file.originalname.replace(new RegExp(fileExtension+'$'),'');
        }
        resultFileName = resultFileName + '_' + new Date().getTime() + fileExtension;
        callback(null,resultFileName);
    }
});
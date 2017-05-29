import Vue from 'vue';
import axios from 'axios';

var components = {};

components['file-upload'] = {
    props:['label','multiple','url'],
    methods:{
        upload:function(){
            var data = new FormData();
            var files = this.$refs['fileInput'].files;
            var config = {
                onUploadProgress : function(progressEvent){
                    var percentCompleted = Math.round(progressEvent.loaded*100/progressEvent.total);
                    console.log(percentCompleted);
                }
            };
            for(var i=0;i<files.length;i++){
                data.append('files',files[i]);
            }
            axios.put(this.url,data,config).then(
                function(response){
                    console.log(response.data);
                },function(error){
                    console.log(error);
                }
            );
        }
    },
    template:`
        <form onsubmit="return false;">
            <label for="file">{{label}}</label>
            <input ref="fileInput" id="file" :multiple="multiple" type="file" />
            <button @click="upload">Upload</button>
        </form>
    `
};

var app = new Vue({
    components:components,
    template:`
        <file-upload
            label="file"
            :multiple="true"
            url="files"
        ></file-upload>
    `,
    data:{}
});

app.$mount('#app');
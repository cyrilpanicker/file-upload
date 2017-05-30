import Vue from 'vue';
import axios from 'axios';

var components = {};

components['file-upload'] = {
    props:['label','multiple','url'],
    methods:{
        upload:function(){
            var data = new FormData();
            var inputRef = this.$refs['fileInput'];
            var files = inputRef.files;
            var config = {
                onUploadProgress : function(progressEvent){
                    var percentCompleted = Math.round(progressEvent.loaded*100/progressEvent.total);
                    console.log(percentCompleted);
                }
            };
            var self = this;
            for(var i=0;i<files.length;i++){
                data.append('files',files[i]);
            }
            axios.put(this.url,data,config).then(
                function(response){
                    inputRef.value = null;
                    self.$emit('upload');
                },function(error){
                    console.log(error);
                    self.$emit('upload');
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

components['file-list'] = {
    props:['list'],
    template:`
        <ul>
            <li v-for="file in list">
                <a :href="file.metadata.fileLink" target="_blank">{{file.metadata.originalFileName}}</a>
            </li>
        </ul>
    `
};

var app = new Vue({
    components:components,
    data:{
        fileList:[]
    },
    methods:{
        getFiles:function(){
            var self = this;
            axios.get('files').then(
                function(response){
                    self.fileList = response.data;
                    console.log(response.data);
                },function(error){
                    console.log(error);
                }
            );
        }
    },
    template:`
        <div class="app">
            <file-upload @upload="getFiles" label="" :multiple="true" url="files"></file-upload>
            <file-list :list="fileList"></file-list>
        </div>
    `
});

app.$mount('#app');
app.getFiles();
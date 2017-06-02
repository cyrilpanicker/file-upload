import Vue from 'vue';
import axios from 'axios';
import socketsClient from 'socket.io-client';

var components = {};

components['file-upload'] = {
    props:['label','multiple','url','show-remove-all'],
    data:function(){
        return {
            inputElement:null,
            uploadDisabled:true
        };
    },
    methods:{
        upload:function(){
            var self = this;
            self.$emit('uploadStart');
            var data = new FormData();
            var files = this.inputElement.files;
            for(var i=0;i<files.length;i++){
                data.append('files',files[i]);
            }
            axios.put(this.url,data).then(
                function(response){
                    self.inputElement.value = null;
                    self.uploadDisabled = true;
                    self.$emit('uploadEnd');
                },function(error){
                    console.log(error);
                    self.$emit('uploadEnd');
                }
            );
        },
        fileSelect:function(event){
            if(!event.target.files.length){
                this.uploadDisabled = true;
            }else{
                this.uploadDisabled = false;
            }
        }
    },
    mounted:function(){
        this.inputElement = this.$refs['fileInput'];
    },
    template:`
        <form onsubmit="return false;">
            <label for="file">{{label}}</label>
            <input ref="fileInput" @change="fileSelect" id="file" :multiple="multiple" type="file" />
            <button @click="upload" :disabled="uploadDisabled">Upload</button>
            <button v-show="showRemoveAll" @click="$emit('removeAll')">Remove All</button>
        </form>
    `
};

components['file-list'] = {
    props:['list','loading','uploading','eta','percent-completed'],
    template:`
        <div>
            <div class="uploading" v-show="uploading">
                uploading.............................ETA:{{eta}}s, Completed:{{percentCompleted}}%
            </div>
            <div class="loading" v-show="loading">
                refreshing.........................................................................
            </div>
            <ul class="file-list">
                <li v-for="file in list">
                    <a :href="file.metadata.fileLink" target="_blank">{{file.metadata.originalFileName}}</a>
                    <a class="remove" @click.prevent="$emit('remove',file.filename)" href="">\u2718</a>
                </li>
            </ul>
        </div>
    `
};

var app = new Vue({
    components:components,
    data:{
        fileList:[],
        loading:true,
        uploading:false,
        uploadedPercent:0,
        eta:null
    },
    methods:{
        getFiles:function(){
            var self = this;
            self.loading = true;
            axios.get('files').then(
                function(response){
                    self.fileList = response.data;
                    self.loading = false;
                },function(error){
                    console.log(error);
                    self.loading = false;
                }
            );
        },
        uploadStart:function(){
            this.uploading = true;
        },
        uploadEnd:function(){
            this.uploading = false;
            this.getFiles();
        },
        remove:function(fileName){
            var self = this;
            self.loading = true;
            axios.delete('file/'+fileName).then(
                function(){
                    self.getFiles();
                },function(error){
                    console.log(error);
                }
            );
        },
        removeAll:function(){
            var self = this;
            self.loading = true;
            axios.delete('files').then(
                function(){
                    self.getFiles();
                },function(error){
                    console.log(error);
                }
            );
        }
    },
    template:`
        <div class="app">

            <file-upload @uploadStart="uploadStart" @uploadEnd="uploadEnd" @removeAll="removeAll"
                :show-remove-all="fileList.length" label="" :multiple="true" url="files"
            ></file-upload>

            <file-list @remove="remove" :eta="eta" :percent-completed="uploadedPercent" :uploading="uploading" :loading="loading" :list="fileList"
            ></file-list>

        </div>
    `
});

app.$mount('#app');
app.getFiles();
var socket = null;
if(process.env.NODE_ENV === 'production'){
    socket = socketsClient('http://94.177.203.221:8000');
}else{
    socket = socketsClient('http://localhost:8000');
}
socket.on('id',function(id){
    axios.defaults.headers.common['socket-id'] = id;
});
socket.on('progress',function(progress){
    console.log(progress);
    app.eta = progress.eta;
    app.uploadedPercent = progress.percent;
});
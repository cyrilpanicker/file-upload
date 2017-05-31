import Vue from 'vue';
import axios from 'axios';

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
            var config = {
                onUploadProgress : function(progressEvent){
                    // var percentCompleted = Math.round(progressEvent.loaded*100/progressEvent.total);
                    // self.$emit('uploadProgress',percentCompleted);
                }
            };
            for(var i=0;i<files.length;i++){
                data.append('files',files[i]);
            }
            axios.put(this.url,data,config).then(
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
    props:['list','loading','uploading'],
    template:`
        <div>
            <ul v-show="!loading && !uploading">
                <li v-for="file in list">
                    <a :href="file.metadata.fileLink" target="_blank">{{file.metadata.originalFileName}}</a>
                    <a class="remove" @click.prevent="$emit('remove',file.filename)" href="">\u2718</a>
                </li>
            </ul>
            <div class="loading" v-show="loading">
                loading...........................................................................
            </div>
            <div class="uploading" v-show="uploading">
                uploading.........................................................................
            </div>
        </div>
    `
};

var app = new Vue({
    components:components,
    data:{
        fileList:[],
        loading:true,
        uploading:false
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

            <file-list @remove="remove" :uploading="uploading" :loading="loading" :list="fileList"
            ></file-list>

        </div>
    `
});

app.$mount('#app');
app.getFiles();
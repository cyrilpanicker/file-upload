import Vue from 'vue';

var app = new Vue({
    template:`<div>{{text}}</div>`,
    data:{
        text:'cyril'
    }
});

app.$mount('#app');
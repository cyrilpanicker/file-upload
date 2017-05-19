var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry:{
        'app':'./client/src/app',
        'libs':'./client/src/libs'
    },
    output:{
        path: __dirname + '/client/dist',
        filename:'[name].js'
    },
    resolve:{
        extensions:['.js'],
        alias:{
            'vue':'vue/dist/vue.esm.js'
        }
    },
    plugins:[
        new HtmlWebpackPlugin({
            title:'Demo',
            template:'./client/src/assets/index.html'
        }),
        new webpack.optimize.CommonsChunkPlugin({
            name:['app','libs']
        })
    ]
};
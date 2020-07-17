const path = require('path')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin')

module.exports = {
    entry: './src/index.js',
    plugins: [
        new UglifyJSPlugin({
            sourceMap: true
        }),
        new VueLoaderPlugin()
    ],
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['env']
                    }
                }
            },
            {
                test: /\.vue$/,
                exclude: /node_modules/,
                loader: 'vue-loader'
            },
            {
                test: /\.css$/,
                use: [
                  'vue-style-loader',
                  'css-loader'
                ]
            }
        ]
    },
    output: {
        filename: 'vue-mergeable-table.js',
        path: path.resolve(__dirname, 'dist'),
        library: 'VueMergeableTable',
        libraryTarget: 'umd'
    }
}
// webpack.config.js
const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const webpack = require('webpack');
module.exports = () => {
    return {
        mode: "production" ,
        devServer: {
            historyApiFallback: true
        },
        //entry: {'vfuse-core' : "./src/components/index.js"},
        entry: "./src/index.js",
        output: {
            //publicPath: "/static/frontend/",
            //path: path.resolve(__dirname, "build"),
            filename: "vfuse-bundle.js",
            library: 'VFuse',
            //libraryExport: 'default',
            libraryTarget: 'umd',
            umdNamedDefine: true,
            /*library: {
                name: 'VFuse',
                //type: 'umd',
                export: 'default',
                //umdNamedDefine: true
            },*/
            //globalObject: 'this',
            globalObject: `(typeof self !== 'undefined' ? self : this)`
        },
        node:{
            global: true,
            __filename: false,
            __dirname: false,
        },
        target: 'web',
        resolve: {
            extensions: [".js", ".jsx", ".json", ".ts", ".tsx"],// other stuff
            fallback: {
                "process": false,
                "perf_hooks" : false,
                "dgram" : false,
                "tty" : false,
                "dns": false,
                "child_process" : false,
                "tls" : false,
                "net": false,
                "os" : require.resolve('os-browserify'),
                "timers": false,
                "fs" : false,
                "stream": require.resolve("stream-browserify"),
                "zlib": require.resolve("browserify-zlib"),
                "http": require.resolve("stream-http"),
                "crypto": require.resolve("crypto-browserify"),
                "https": require.resolve("https-browserify"),
                "worker_threads" : "empty"
            }
        },
        module: {
            rules: [
                {
                    test: /\.(txt|service|py)(\?v=\d+\.\d+\.\d+)?$/,
                    use: [
                        {
                            loader: 'file-loader',
                            options: {
                                name: '[name].[ext]',
                                outputPath: 'assets/'
                            }
                        }
                    ]
                },
                {
                    test: /\.jpe?g|png$/,
                    exclude: /node_modules/,
                    use: ["url-loader", "file-loader"]
                },
                {
                    test: /\.(js|json)$/,
                    exclude: /node_modules/,
                    loader: "babel-loader"
                }
            ]
        },
        plugins: [
            new webpack.ProvidePlugin({
                process: 'process/browser',
            }),
            new webpack.ProvidePlugin({
                Buffer: ['buffer', 'Buffer'],
            }),
        ],
        optimization: {
            //runtimeChunk: 'single',
            minimize: true,
            minimizer: [new TerserPlugin({
                terserOptions: {
                    format: {
                        comments: false,
                    },
                },
                extractComments: false,
            })],
        }
    }
};
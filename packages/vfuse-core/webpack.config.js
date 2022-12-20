// webpack.config.js
const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
module.exports = () => {
    return {
        mode: "production" ,
        devServer: {
            historyApiFallback: true
        },
        entry: "./",
        output: {
            publicPath: "/static/frontend/",
            path: path.resolve(__dirname, "build"),
            filename: "bundle.js"
        },
        target: 'node',
        resolve: {
            extensions: [".js", ".jsx", ".json", ".ts", ".tsx"],// other stuff
            fallback: {
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
        ],
        optimization: {
            minimize: true,
            minimizer: [new TerserPlugin({
                terserOptions: {
                    format: {
                        comments: false,
                    },
                },
                extractComments: false,
            })],
        },
    }
};

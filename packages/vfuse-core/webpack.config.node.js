// webpack.config.js
const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
module.exports = () => {
    return {
        mode: "production" ,
        entry: "./src/index.js",
        output: {
            //path: path.resolve(__dirname, "build"),
            filename: "vfuse-node-bundle.js",
            library: 'VFuse',
            //libraryExport: 'default',
            libraryTarget: 'umd',
            //globalObject: 'this',
        },
        //externalsPresets: { node: true }, // in order to ignore built-in modules like path, fs, etc.
        //externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
        //externals: [/node_modules/, 'bufferutil', 'leveldown'],
        /*externals: {
            //'pouchdb':"require('pouchdb')",
            'pouchdb':"pouchdb",
            'leveldown':"leveldown"
        },*/
        target: 'node',
        node: {
            global: true,
            __dirname: true,
            __filename: true
        },
        resolve: {
            extensions: [".js", ".jsx", ".json", ".ts", ".tsx"],
        },
        module: {
            rules: [
                {
                    test: /\.(txt|service|py|node)(\?v=\d+\.\d+\.\d+)?$/,
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
        /*plugins: [
            new webpack.ExternalsPlugin('commonjs2', [
                'leveldown'
            ]),
        ],*/
    }
};

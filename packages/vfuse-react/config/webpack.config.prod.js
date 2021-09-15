const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: path.join(__dirname, "src", "index.js"),
    output: {
        path: path.resolve(__dirname, "dist"),
    },
    module: {
        rules: [
            {
                test: /\.?js$/,
                exclude: /node_modules/,
                use: ["babel-loader", "remove-hashbag-loader"]
            },
        ]
    },
    resolveLoader: {
        alias: {
            'remove-hashbag-loader': path.join(__dirname, './loaders/remove-hashbag-loader')
        }
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.join(__dirname, "src", "index.html"),
        }),
    ],
}

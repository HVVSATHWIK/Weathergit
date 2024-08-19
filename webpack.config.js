const path = require('path');
const webpack = require('webpack');
require('dotenv').config();

module.exports = {
    mode: 'development',
    entry: './open.js', // Entry point of your application
    output: {
        filename: 'bundle.js', // Output file name
        path: path.resolve(__dirname, 'open'), // Output directory
    },
    devServer: {
        contentBase: path.join(__dirname, 'open'),
        hot: true,
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                REACT_APP_WEATHER_API_KEY: JSON.stringify(process.env.REACT_APP_WEATHER_API_KEY),
                REACT_APP_GENAI_API_KEY: JSON.stringify(process.env.REACT_APP_GENAI_API_KEY),
            },
        }),
    ],
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: 'babel-loader', // Add babel-loader for ES6 support
            },
        ],
    },
};

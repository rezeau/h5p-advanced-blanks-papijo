/* eslint-disable no-undef */

const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

var nodeEnv = process.env.NODE_ENV || 'development';
var isDev = (nodeEnv !== 'production');

var config = {
  entry: {
    dist: './src/entries/dist.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.resolve(__dirname, 'src'),
        loader: 'babel-loader'
      },
      {
        test: /\.css$/,
        include: path.resolve(__dirname, 'src'),
        use: ['style-loader', 'css-loader', 'postcss-loader']
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.ractive.html$/,
        use: {
          loader: 'html-loader',
          options: {
            minimize: false
          }
        }
      }
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".ractive.html"]
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'node_modules/ractive/ractive.min.js', to: '.' } // Copy directly into the root of "dist"
      ]
    })
  ]
};

if (isDev) {
  config.devtool = 'inline-source-map';
}

module.exports = config;

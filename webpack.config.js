/* eslint-env node */
const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const productionBuild = process.env.npm_lifecycle_script !== 'webpack-dev-server';

module.exports = {
  entry: {
    turbo: './js/index.js',
    map: './js/map.js',
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].[chunkhash].js',
    sourceMapFilename: '[name].[chunkhash].map',
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        use: 'html-loader'
      }, {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          use: 'css-loader',
          fallback: 'style-loader'
        })
      }, {
        test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
        loader: 'url-loader',
        options: {
          limit: 10000
        }
      },
      {
        test: require.resolve('codemirror/lib/codemirror.js'),
        use: 'exports-loader?window.CodeMirror'
      },
    ]
  },
  plugins: [
    new CleanWebpackPlugin(['./dist']),
    new ExtractTextPlugin({
      filename: '[name].[contenthash].css',
    }),
    new HtmlWebpackPlugin({
      template: './index.html',
      chunks: ['turbo'],
      inject: 'head',
    }),
    new HtmlWebpackPlugin({
      filename: 'map.html',
      template: './map.html',
      chunks: ['map'],
      inject: 'head',
    }),
  ],
  devtool: productionBuild ? undefined : 'eval-source-map',
};

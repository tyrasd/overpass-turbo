/* eslint-env node */
const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin')

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
          limit: 4000
        }
      },
      {
        test: require.resolve('codemirror/lib/codemirror.js'),
        use: 'exports-loader?window.CodeMirror'
      },
    ]
  },
  plugins: [
    new CleanWebpackPlugin([
      path.resolve(__dirname, 'build'),
    ]),
    new ExtractTextPlugin({
      filename: '[name].[contenthash].css',
    }),
    new FaviconsWebpackPlugin({
      logo: './turbo.png',
      prefix: 'turbo-[hash]-',
      icons: {
        android: false,
        appleIcon: false,
        appleStartup: false,
        coast: false,
        favicons: true,
        firefox: false,
        opengraph: false,
        twitter: false,
        yandex: false,
        windows: false,
      }
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

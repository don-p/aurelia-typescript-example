/// <reference path="./node_modules/@types/node/index.d.ts" />
/**
 * To learn more about how to use Easy Webpack
 * Take a look at the README here: https://github.com/easy-webpack/core
 **/
import { generateConfig, get, stripMetadata, EasyWebpackConfig } from '@easy-webpack/core';
import * as path from 'path';

import * as envProd from '@easy-webpack/config-env-production';
import * as envDev from '@easy-webpack/config-env-development';
import * as aurelia from '@easy-webpack/config-aurelia';
import * as typescript from '@easy-webpack/config-typescript';
import * as regenerator from '@easy-webpack/config-global-regenerator';

import * as html from '@easy-webpack/config-html';
import * as css from '@easy-webpack/config-css';
import * as fontAndImages from '@easy-webpack/config-fonts-and-images';
import * as globalBluebird from '@easy-webpack/config-global-bluebird';
import * as globalJquery from '@easy-webpack/config-global-jquery';
import * as generateIndexHtml from '@easy-webpack/config-generate-index-html';
import * as commonChunksOptimize from '@easy-webpack/config-common-chunks-simple';
import * as copyFiles from '@easy-webpack/config-copy-files';
import * as uglify from '@easy-webpack/config-uglify';
import * as generateCoverage from '@easy-webpack/config-test-coverage-istanbul';

const ENV: 'development' | 'production' | 'qa' = process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase() || (process.env.NODE_ENV = 'development');
console.log('========== BUILDING FOR ENV - ' +  process.env.NODE_ENV + ' ==========');
const webpack = require('webpack');

//Determine if running locally in webpack-dev-server.
let args = JSON.parse(process.env.npm_config_argv);
let argv = Object.keys(args.cooked).map(function(key) {
 return args.cooked[key]}
);
const LOCAL: true | false = argv.indexOf('webpack-dev-server') >= 0?true:false;
const STATIC_SERVER = argv.indexOf('STATIC') >= 0?true:false;

console.log('===== LOCAL ?: ' + LOCAL + ' =====');
console.log('===== STATIC_SERVER ?: ' + STATIC_SERVER + ' =====');

// basic configuration:
const title = 'GridCommand';
const baseUrl = '/';
const rootDir = path.resolve();
const srcDir = path.resolve('src');
const outDir = path.resolve('dist');

const ExtractTextPlugin = require('extract-text-webpack-plugin');
const ExtractCustomCSS = new ExtractTextPlugin('style.[chunkhash].css');

const ProvidePlugin = require('webpack/lib/ProvidePlugin')
const ContextReplacementPlugin = require('webpack/lib/ContextReplacementPlugin')

const coreBundles = {
  bootstrap: [
    'aurelia-bootstrapper-webpack',
    'aurelia-polyfills',
    'aurelia-pal',
    'aurelia-pal-browser',
    'bluebird'
  ],
  // these will be included in the 'aurelia' bundle (except for the above bootstrap packages)
  aurelia: [
    'aurelia-bootstrapper-webpack',
    'aurelia-binding',
    'aurelia-dependency-injection',
    'aurelia-event-aggregator',
    'aurelia-framework',
    'aurelia-history',
    'aurelia-history-browser',
    'aurelia-loader',
    'aurelia-loader-webpack',
    'aurelia-logging',
    'aurelia-logging-console',
    'aurelia-metadata',
    'aurelia-pal',
    'aurelia-pal-browser',
    'aurelia-path',
    'aurelia-polyfills',
    'aurelia-route-recognizer',
    'aurelia-router',
    'aurelia-task-queue',
    'aurelia-templating',
    'aurelia-templating-binding',
    'aurelia-templating-router',
    'aurelia-templating-resources'
  ]
}

/**
 * Main Webpack Configuration
 */

// Use CSS source mapping only for DEV/QA.
let sourcemap = ENV === 'production'?'':'?sourceMap';
// Websocket secure or non-secure protocol?
let wsProtocol = ENV === 'development' ? 'ws':'wss';
// The base/common config.
let config = generateConfig(
  {
    entry: {
      'app': ['./src/main' /* this is filled by the aurelia-webpack-plugin */],
      'aurelia-bootstrap': coreBundles.bootstrap,
      'aurelia': coreBundles.aurelia.filter(pkg => coreBundles.bootstrap.indexOf(pkg) === -1)
    },
    // Proxy config for the webpack devServer to use our special API proxying scheme.
    devServer: {
      proxy: {
        '/blgws/*': {
            target: 'wss://scig-dev.bluelinegrid.com',
            pathRewrite: {'^/blgws' : ''},
            secure: true,
            changeOrigin: true,
            ws: true,
            logLevel: 'debug'
        },
        '/blgapi/**': {
          target: 'https://scig-dev.bluelinegrid.com',
          pathRewrite: {'^/blgapi' : ''},
          secure: true,
          changeOrigin: true,
          logLevel: 'info'
        }
      },
      hot: false
    },    
    output: {
      path: outDir,
    },
    module: {
      rules: [
        {
          test: /main.ts$/,
          loader: 'string-replace-loader',
          query: {
            search: '%RUNTIME_ENVIRONMENT%',
            replace: ENV,
            flags: 'ig'
          }
        },
        {
          test: /wsService.ts$/,
          loader: 'string-replace-loader',
          query: {
            search: "'%LOCAL_ENVIRONMENT%'",
            replace: LOCAL,
            flags: 'ig'
          }
        },
        // Stylus loader.
        {
          test: /\.styl$/, loader: ExtractTextPlugin.extract(['css-loader'+sourcemap, 'stylus-loader?resolve url'])
        },
        // SASS loader.
        {
          test: /\.(scss|css)$/i, exclude: [srcDir+'/libs/'], loader: ExtractCustomCSS.extract(['css-loader'+sourcemap,'sass-loader'+sourcemap])
        },
        {
          test: /favicon.ico$/,
          exclude: /node_modules/,
          loader:'file-loader?name=[name].[hash].[ext]&context=.'
        }      
      ]
    },
    plugins: [
      new webpack.LoaderOptionsPlugin({
        test: /\.styl$/,
        stylus: {
          // You can have multiple stylus configs with other names and use them 
          // with `stylus-loader?config=otherConfig`. 
          default: {
            use: [require('nib')()],
          }
        },
      }),
      ExtractCustomCSS,
      new ContextReplacementPlugin(/moment[\/\\]locale$/, /en|fr/),
      new ProvidePlugin({
        $: "jquery",
        jQuery: "jquery",
        'window.jQuery': 'jquery',
        'window.Tether': 'tether',
        Tether: 'tether'
      })
    ],    
    resolve: {
        alias: {
            // Force all modules to use the same jquery version.
            'jquery': path.join(__dirname, 'node_modules/jquery/src/jquery'),
            'stompjs': path.join(__dirname, 'node_modules/stompjs/lib/stomp.js')
        }
    }
   },

  /**
   * Don't be afraid, you can put bits of standard Webpack configuration here
   * (or at the end, after the last parameter, so it won't get overwritten by the presets)
   * Because that's all easy-webpack configs are - snippets of premade, maintained configuration parts!
   * 
   * For Webpack docs, see: https://webpack.js.org/configuration/
   */
  // Use JS source mapping only for DEV/QA.
  ENV === 'qa' || ENV === 'development' ? 
    envDev(ENV !== 'qa' ? {} : {devtool: 'inline-source-map'}) :
    envProd({}),

  aurelia({root: rootDir, src: srcDir, title: title, baseUrl: baseUrl}),
  typescript(ENV !== 'qa' ? {} : { options: { doTypeCheck: false, sourceMap: false, inlineSourceMap: true, inlineSources: true } }),
  html(),
  // css({ filename: 'styles.css', allChunks: true, sourceMap: false }),
  fontAndImages(),
  globalBluebird(),
  globalJquery(),
  // Transpile to ES5-compatible JS output.  (Remove if not supporting IE11.)
  regenerator(),

  generateIndexHtml({minify: ENV === 'production'/*, overrideOptions:{favicon: 'favicon.ico'}*/}),

  commonChunksOptimize({appChunkName: 'app', firstChunk: 'aurelia-bootstrap'}),
  copyFiles({patterns: 
    [
      {context: './src/config', from: '**/**.json', to: 'config'},
      {context: './src/locales', from: '**/**.json', to: 'locales'},
      {context: './src/sounds', from: '**/**.*', to: 'sounds'},
      {from: './favicon.ico', to: 'favicon.ico' }
    ]
  }),
/* ENV === 'test' */
/*generateCoverage({ options: { esModules: true } })*/

  ENV === 'production' ?
    uglify({debug: false, mangle: { except: ['cb', '__webpack_require__'] }}) : {}
);
config.metadata.static = STATIC_SERVER;
console.error("config meta: " + config.metadata.static);
module.exports = stripMetadata(config);

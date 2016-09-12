"use strict";

/**
 * To learn more about how to use Easy Webpack
 * Take a look at the README here: https://github.com/easy-webpack/core
 **/
const easyWebpack = require('@easy-webpack/core');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const generateConfig = easyWebpack.default;
const get = easyWebpack.get;
const path = require('path');
const ENV = process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase() || 'development';
let config;

// basic configuration:
const title = 'Grid Command V2';
const baseUrl = '/';
const rootDir = path.resolve();
const srcDir = path.resolve('src');
const outDir = path.resolve('dist');

const coreBundles = {
  bootstrap: [
    'aurelia-bootstrapper-webpack',
    'aurelia-polyfills',
    'aurelia-pal',
    'aurelia-pal-browser',
    'regenerator-runtime',
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

// multiple extract instances for CSS
const ExtractCustomCSS = new ExtractTextPlugin('style.[chunkhash].css');
const ExtractVendorCSS = new ExtractTextPlugin('vendor.[chunkhash].css');
const cssLoaders = ENV === 'development'?
    [// Application custom SASS/CSS.
      { 
        test: /\.(scss|css)$/i, 
        // loader: new ExtractTextPlugin('assets/[path]/[name].[ext]').extract(['file?name=assets/[path]/[name].[ext]']),
        // loader: "file?name=assets/[path]/[name].[ext]!css",
        loader: ExtractCustomCSS.extract(['css?sourceMap!sass']), 
        include: [
           path.resolve(__dirname, rootDir+"/styles"),
           path.resolve(__dirname, srcDir+"/lib")
        ]  
      },
      // Vendor/library SASS/CSS.
      { 
        test: /\.(scss|css)$/i, loader: ExtractVendorCSS.extract(['css','sass']),
        exclude: [
           path.resolve(__dirname, rootDir+"/styles"),
           path.resolve(__dirname, srcDir+"/lib")
        ]  
      },
    ]:[];

const baseConfig = {
  entry: {
    'app': [/* this is filled by the aurelia-webpack-plugin */],
    'aurelia-bootstrap': coreBundles.bootstrap,
    'aurelia': coreBundles.aurelia.filter(pkg => coreBundles.bootstrap.indexOf(pkg) === -1)
  },
  devtool: "source-map",
  output: {
    path: outDir,
  },
  plugins: [
    ExtractCustomCSS,
    ExtractVendorCSS
  ],
  module: {
      loaders: cssLoaders
    // loaders: [
    //   // Application cusom SASS/CSS..
    //   { test: /\.(scss|css)$/i, loader: ExtractCustomCSS.extract(['css?sourceMap!sass']), 
    //     include: [
    //        path.resolve(__dirname, rootDir+"/styles"),
    //        path.resolve(__dirname, srcDir+"/lib")
    //     ]  
    //   },
    //   // Vendor/library SASS/CSS.
    //   { test: /\.(scss|css)$/i, loader: ExtractVendorCSS.extract(['css','sass']),
    //     exclude: [
    //        path.resolve(__dirname, rootDir+"/styles"),
    //        path.resolve(__dirname, srcDir+"/lib")
    //     ]  
    //   },
    // ]
  }
}

// advanced configuration:
switch (ENV) {
  case 'production':
    config = generateConfig(
      baseConfig,

      require('@easy-webpack/config-env-production')
        ({compress: true}),
        
      require('@easy-webpack/config-aurelia')
        ({root: rootDir, src: srcDir, title: title, baseUrl: baseUrl}),

      require('@easy-webpack/config-typescript')(),
      require('@easy-webpack/config-html')(),

      require('@easy-webpack/config-css')
        ({ filename: 'styles.css', allChunks: true, sourceMap: false }),

      require('@easy-webpack/config-fonts-and-images')(),
      require('@easy-webpack/config-global-bluebird')(),
      require('@easy-webpack/config-global-jquery')(),
      require('@easy-webpack/config-global-regenerator')(),
      require('@easy-webpack/config-generate-index-html')
        ({minify: true}),

      require('@easy-webpack/config-common-chunks-simple')
        ({appChunkName: 'app', firstChunk: 'aurelia-bootstrap'}),

      require('@easy-webpack/config-copy-files')
        ({patterns: [{ from: 'favicon.ico', to: 'favicon.ico' }]}),

      require('@easy-webpack/config-uglify')
        ({debug: false})
    );
    break;
  
  case 'test':
    config = generateConfig(
      baseConfig,

      require('@easy-webpack/config-env-development')
        ({devtool: 'inline-source-map'}),

      require('@easy-webpack/config-aurelia')
        ({root: rootDir, src: srcDir, title: title, baseUrl: baseUrl}),

      require('@easy-webpack/config-typescript')
        ({ options: { doTypeCheck: false, compilerOptions: { sourceMap: false, inlineSourceMap: true } }}),

      require('@easy-webpack/config-html')(),

      require('@easy-webpack/config-css')
        ({ filename: 'styles.css', allChunks: true, sourceMap: false }),

      require('@easy-webpack/config-fonts-and-images')(),
      require('@easy-webpack/config-global-bluebird')(),
      require('@easy-webpack/config-global-jquery')(),
      require('@easy-webpack/config-global-regenerator')(),
      require('@easy-webpack/config-generate-index-html')(),

      require('@easy-webpack/config-test-coverage-istanbul')()
    );
    break;
  
  default:
  case 'development':
    process.env.NODE_ENV = 'development';
    config = generateConfig(
      baseConfig,

      require('@easy-webpack/config-env-development')(),

      require('@easy-webpack/config-aurelia')
        ({root: rootDir, src: srcDir, title: title, baseUrl: baseUrl}),

      require('@easy-webpack/config-typescript')(),
      require('@easy-webpack/config-html')(),

      require('@easy-webpack/config-fonts-and-images')(),
      require('@easy-webpack/config-global-bluebird')(),
      require('@easy-webpack/config-global-jquery')(),
      require('@easy-webpack/config-global-regenerator')(),
      require('@easy-webpack/config-generate-index-html')
        ({minify: false}),

      // Copy other resource files to dist directory. (icons, i18n translation files, etc.)
      require('@easy-webpack/config-json')(),
      require('@easy-webpack/config-copy-files')
        ({patterns: [
          {context: './src/locales', from: '**/**.json', to: 'locales'},
          {from: 'favicon.ico', to: 'favicon.ico' }
          ]}),

      require('@easy-webpack/config-common-chunks-simple')
        ({appChunkName: 'app', firstChunk: 'aurelia-bootstrap'})
    );
    break;
}

module.exports = config;

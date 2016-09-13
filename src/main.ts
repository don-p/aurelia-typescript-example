import {Aurelia} from 'aurelia-framework';
// we want font-awesome to load as soon as possible to show the fa-spinner
 // Vendor CSS libs:
import 'font-awesome/scss/font-awesome.scss';
import 'perfect-scrollbar/dist/css/perfect-scrollbar.css';
// Application CSS + Bootstrap:
import '../styles/style.scss';


import 'bootstrap-sass/assets/javascripts/bootstrap.js';
// Framework modules:
import {bootstrap} from 'aurelia-bootstrapper-webpack';
import * as config from './config/authConfig';
import {I18N} from 'aurelia-i18n';
import LngDetector from 'i18next-browser-languagedetector/dist/es/index.js';
import Backend from 'i18next-xhr-backend';
import 'intl';

// comment out if you don't want a Promise polyfill (remove also from webpack.config.js)
import * as Bluebird from 'bluebird';
Bluebird.config({ warnings: false });
/*
bootstrap(aurelia => {
    if (!global.Intl) {
        console.log('Intl not present')
        require.ensure([
            'intl',
            'intl/locale-data/jsonp/en.js'
        ], function (require) {
            require('intl');
            require('intl/locale-data/jsonp/en.js');
//            boot(aurelia);
        });
    } else {
//        boot(aurelia);
    }
});
*/

export async function configure(aurelia: Aurelia) {

  // Language detector options.
  var options = {
    // order and from where user language should be detected
    order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],

    // keys or params to lookup language from
    lookupQuerystring: 'lng',
    lookupCookie: 'i18next',
    lookupLocalStorage: 'i18nextLng',

    // cache user language on
    caches: ['localStorage', 'cookie'],

    // optional expire and domain for set cookie
    cookieMinutes: 10,
    cookieDomain: 'myDomain',

    // optional htmlTag with lang attribute, the default is:
    htmlTag: document.documentElement
  };

  // Optional Intl polyfill.
  if (!window['Intl']) {
    console.log('Intl not present');
    aurelia.use.plugin('intl');
  }



  aurelia.use
    .standardConfiguration()
    .developmentLogging()
    .plugin('aurelia-auth', (baseConfig)=>{
      baseConfig.configure(config.default);
    })
//       .plugin('aurelia-i18n')

//    ;
//   .plugin('aurelia-validation')
    // .plugin('aurelia-validatejs')
    
    .plugin('aurelia-i18n', (instance) => {
        // Import i18n resources.

        // // register backend plugin
        instance.i18next.use(Backend);
        instance.i18next.use(LngDetector).init({detection: options});
        var lang = 'en';
        var detected = instance.i18next.services.languageDetector.detectors.navigator.lookup()[1];
        if(detected && detected != null) {
          lang = detected;
        }
        // adapt options to your needs (see http://i18next.com/docs/options/)
        // make sure to return the promise of the setup method, in order to guarantee proper loading
        const pr = instance.setup({
          backend: {                                  // <-- configure backend settings
            loadPath: '/locales/{{lng}}/{{ns}}.json', // <-- XHR settings for where to get the files from
          },
          //   resources: {
          //   en: {
          //     translation: {
          //       "key": "hello world"
          //     }
          //   }
          // },
          lng : lang,
          attributes : ['t','i18n'],
          fallbackLng : 'en',
          debug : false
        });
        return pr;
      })
      .plugin('aurelia-ui-virtualization')
      ;

  // Uncomment the line below to enable animation.
  // aurelia.use.plugin('aurelia-animator-css');
  // if the css animator is enabled, add swap-order="after" to all router-view elements

  // Anyone wanting to use HTMLImports to load views, will need to install the following plugin.
  // aurelia.use.plugin('aurelia-html-import-template-loader')

  await aurelia.start();
  aurelia.setRoot('app');

  // if you would like your website to work offline (Service Worker), 
  // install and enable the @easy-webpack/config-offline package in webpack.config.js and uncomment the following code:
  /*
  const offline = await System.import('offline-plugin/runtime');
  offline.install();
  */
}

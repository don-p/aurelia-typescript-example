import {Aurelia} from 'aurelia-framework';
import {bootstrap} from 'aurelia-bootstrapper-webpack';
// import {I18N} from 'aurelia-i18n';

export function configure(aurelia: Aurelia) {
  aurelia.use
    .standardConfiguration()
    .developmentLogging()
 //   .plugin('aurelia-validation')
    // .plugin('aurelia-validatejs')
/*    .plugin('aurelia-i18n', (instance) => {
        // Import i18n resources.

        // // register backend plugin
        // instance.i18next.use(Backend);

        // adapt options to your needs (see http://i18next.com/docs/options/)
        // make sure to return the promise of the setup method, in order to guarantee proper loading
        return instance.setup({
          // backend: {                                  // <-- configure backend settings
          //   loadPath: '/locales/{{lng}}/{{ns}}.json', // <-- XHR settings for where to get the files from
          // },
          // resources: ,
            resources: {
            en: {
              translation: {
                "key": "hello world"
              }
            }
          },
          lng : 'de',
          attributes : ['t','i18n'],
          fallbackLng : 'en',
          debug : false
        });
      })*/;

  //Uncomment the line below to enable animation.
  // aurelia.use.plugin('aurelia-animator-css');
  //if the css animator is enabled, add swap-order="after" to all router-view elements

  //Anyone wanting to use HTMLImports to load views, will need to install the following plugin.
  // aurelia.use.plugin('aurelia-html-import-template-loader')

  // const rootElement = document.body;
  // rootElement.setAttribute('aurelia-app', '');

  aurelia.start().then(() => aurelia.setRoot());
  // aurelia.setRoot('app', rootElement);
  // if you would like your website to work offline (Service Worker), 
  // install and enable the @easy-webpack/config-offline package in webpack.config.js and uncomment the following code:
  /*
  const offline = await System.import('offline-plugin/runtime');
  offline.install();
  */




};

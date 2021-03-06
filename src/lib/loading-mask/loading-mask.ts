import {customElement, Parent, noView, bindable, observable, inject, BindingEngine, LogManager} from 'aurelia-framework';
import $ from 'jquery';
import {I18N} from 'aurelia-i18n';
import {Container} from 'aurelia-dependency-injection';
import {Logger} from 'aurelia-logging';
import './loading-mask.css';

@customElement('loading')
@noView()
@inject(Element, Parent.of(Loading), LogManager) // Inject the instance of this element and its parent
export class Loading {
  // @bindable('messageKey')

  dimScreen:string;
	dialog:Object;
	loadingTitle:JQuery;
	title:string;
	loadingMask: JQuery;
	i18n: I18N;
  bindingEngine: BindingEngine;
	element: Element;
  context: Object;
  @bindable promise: string;
 	@bindable messageKey: string;
 // Set up an observable binding to watch the promise changing state.
  @observable({changeHandler: 'promiseChanged'}) promiseFromContext: Promise<Response>;

   logger: Logger;


  constructor(element, parent) {
    // access root container
    let container = Container.instance;
    // resolve by name
    this.i18n = container.get(I18N);

    this.bindingEngine = container.get(BindingEngine);

    this.element = element;
    this.dimScreen = undefined;
    this.dialog = undefined;
    this.loadingTitle = undefined;
    this.title = undefined;
    // this._createLoadingMask();
    
    this.logger = LogManager.getLogger(this.constructor.name);
  }

  bind(bindingContext: Object, overrideContext: Object) {
    this.logger.debug("LoadingMask | bind()");
    this.context = bindingContext;
    let subscription = this.bindingEngine.propertyObserver(this.context, this.promise)
      .subscribe((newValue, oldValue) => this.contextPromiseChanged(newValue));

  }

  attached() {
    this.logger.debug("LoadingMask | attached()");
    this._createLoadingMask();
    // this.attachPromise();
    // this._createLoadingMask();
  }

  attachPromise() {
    // Get the dynamically-specified promise from the parent context.
    this.promiseFromContext = this.context[this.promise];
    var me = this;
    this.promiseFromContext.then(data => {
      me.hide();
     }, error => {
      me.hide();
     }
    )

    this.promiseChanged(this.promiseFromContext);
  }

  promiseChanged(promise:any) {
    this.logger.debug("LoadingMask | promiseChanged()");
    if(promise && promise !== null) {
      if(promise.isPending()) {
        this.show();
      } else {
        this.hide();
      }
    }
  }

  contextPromiseChanged(promise:Promise<Response>) {
    this.logger.debug("LoadingMask | promiseContextChanged()");

    this.attachPromise();
  }

  _createLoadingMask() {
    // We need a unique ID for each mask instance.
    let maskId = new Date().getTime();

    if(!!(this.messageKey) && this.messageKey.length > 0) {
      this.title = this.i18n.tr(this.messageKey);
    }
    this.dimScreen = '<div ref="loadingMask" id="loadingMask-' + maskId + '" class="spinner">'
    if(!!(this.messageKey) && this.messageKey.length > 0) {
      this.dimScreen += '<div id="loadingTitle" class="loadingTitle">' + this.title +'</div>';
    }    
    this.dimScreen += '<div class="mask"></div></div>';
    // this.loadingMask = $.parseHTML(this.dimScreen);
    // $(elementSelector).append(this.loadingMask);
    // $('#' + this.element.parentElement.id).append(this.dimScreen);
    $('#' + this.element.id).parent().append(this.dimScreen);
    this.loadingMask = $('#loadingMask-' + maskId);
    this.loadingTitle = $('#loadingTitle').css({
      color: '#ffffff',
      opacity: 1,
      fontSize: '2.5em'
      //fontFamily: 'Roboto'
    });
  }

  show() {
    this.loadingMask.show();
  }

  hide() {
    this.loadingMask.hide();
  }
}

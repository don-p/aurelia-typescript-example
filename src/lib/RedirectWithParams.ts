import {inject, computedFrom, LogManager} from 'aurelia-framework';
import {Router, RouterConfiguration, NavigationInstruction, Next, Redirect} from 'aurelia-router';

@inject(Router)
export class RedirectWithParams {

  shouldContinueProcessing: boolean;
  url: string;
  options: any;
  params: any;
  router: Router;

  constructor(url: string, params:  any = {}, options: any = {}) {
    this.url = url;
    this.options = Object.assign({ trigger: true, replace: true }, options);
    this.params = params;
    this.shouldContinueProcessing = false;
  }

  /**
  * Called by the activation system to set the child router.
  *
  * @param router The router.
  */
  setRouter(router: Router): void {
    this.router = router;
  }

  /**
  * Called by the navigation pipeline to navigate.
  *
  * @param appRouter The router to be redirected.
  */
  navigate(appRouter: Router): void {
    let navigatingRouter = this.options.useAppRouter ? appRouter : (this.router || appRouter);
    navigatingRouter.navigateToRoute(this.url, this.params, this.options);
  }
}
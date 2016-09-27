import {DialogController} from 'aurelia-dialog';

export class Prompt {
  static inject = [DialogController];

  controller: DialogController;
  message: string;
  title: string;

  constructor(controller) {
    this.controller = controller;
    this.title = null;
    this.message = null;

    controller.settings.lock = false;
  }

  activate(model) {
    this.title = model.question;
    this.message = model.message;
  }
}
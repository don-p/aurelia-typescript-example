import {computedFrom, Container, inject} from 'aurelia-framework';
import {I18N} from 'aurelia-i18n';
import {NotificationAckResource} from './notificationAckResource';
import {Session} from '../services/session';
import * as moment from 'moment';

@inject(Session, I18N)
export class TaskResource {
  
  title: string;
  description: string;
  attachmentCount: Number;
  attachments: Array<any>;
  taskId: string;
  caseId: string;
  taskStatus: any;
  statusId: string;
  assignee: any;
  assigneeId: string;
  roleId: string;
  dueDate: Date;
  createDate: Date;
  lastChangeDate: Date;
  commentsCount: number;
  changesCount: number;
  files: Array<any>;
  comments: Array<any>;

  static dateFormat: string = Container.instance.get(I18N).tr('alerts.notifications.dateFormat');

  constructor(task?:any) {
      if(task && task !== null) {
        Object.assign(this, task);
        // Flatten model for compatibility with REST API interface.
        this.assigneeId = this.assignee.member.memberId;
        this.roleId = this.assignee.assigneeRole.roleId;
        this.statusId = this.taskStatus.statusId;
      } else {
        this.title = '';
        this.taskId = null;
      }

  }

  get formattedDueDate(): string {
    return !!(this.dueDate)?
      (moment as any).default(this.dueDate).format(TaskResource.dateFormat):'';
  }

  get formattedCreateDate(): string {
    // let moment1 = Container.instance.get(Moment);
    return (moment as any).default(this.createDate).format(TaskResource.dateFormat);
  }

  get formattedLastChangeDate(): string {
    // let moment1 = Container.instance.get(Moment);
    return (moment as any).default(this.lastChangeDate).format(TaskResource.dateFormat);
  }

  get assigneeFullName() {
    let i18n = Container.instance.get(I18N);
    return i18n.tr('global.memberFullName', {firstName: this.assignee.member.physicalPersonProfile.firstName, lastName: this.assignee.member.physicalPersonProfile.lastName});
  }

  // get assigneeId() {
  //   return this.assignee.member.memberId;
  // }

  // get roleId() {
  //   return this.assignee.assigneeRole.roleId;
  // }

/*
  get statusName(): string {
    if(!!(this.acks) && this.acks.length === 1) {
      return this.acks[0].ackStatusName;
    } else if(!!(this.acks)) {
      let session:any = Container.instance.get(Session);
      let memberId = session.auth.member.memberId;
      let ack = this.acks.find(function(ackItem) {
        return memberId === ackItem.ackParty.memberId;
      });
      return ack.ackStatusName;
    }
    return null;
  }

*/

}





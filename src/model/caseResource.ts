import {computedFrom, Container, inject} from 'aurelia-framework';
import {I18N} from 'aurelia-i18n';
import {NotificationAckResource} from './notificationAckResource';
import {Session} from '../services/session';
import * as moment from 'moment';

@inject(Session, I18N)
export class CaseResource {
  
  title: string;
  description: string;
  externalReference: string;
  attachmentCount: Number;
  attachments: Array<any>;
  caseId: string;
  type: any;
  typeId: string;
  status: any;
  priority: string;
  assigneeReference: any;
  dueDate: Date;
  lastExportDate: Date;
  tasks: Array<any>;

  static dateFormat: string = Container.instance.get(I18N).tr('alerts.notifications.dateFormat');

  constructor(_case?:any) {
      if(_case && _case !== null) {
        Object.assign(this, _case);
        /*
        this.isConnected = member.isConnected;
        this.entitlementRole = member.entitlementRole;
        this.memberId = member.memberId;
        this.physicalPersonProfile = member.physicalPersonProfile;
        this.connectId = member.connectId;
        this.connectStatus = member.connectStatus;
        this.statusComment = member.statusComment;
        */
      } else {
        this.title = '';
        this.caseId = null;
      }

  }

  get formattedDueDate(): string {
    // let moment1 = Container.instance.get(Moment);
    if(this.dueDate == null) {
      return '';
    }
    return (moment as any).default(this.dueDate).format(CaseResource.dateFormat);
  }

  get assigneeFullName() {
    let i18n = Container.instance.get(I18N);
    return i18n.tr('global.memberFullName', {firstName: this.assigneeReference.physicalPersonProfile.firstName, lastName: this.assigneeReference.physicalPersonProfile.lastName});
  }

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





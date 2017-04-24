import {computedFrom, Container, inject} from 'aurelia-framework';
import {I18N} from 'aurelia-i18n';
import {NotificationAckResource} from './notificationAckResource';
import {Session} from '../services/session';
import * as moment from 'moment';

@inject(Session, I18N)
export class NotificationResource {
  
  message: string;
  attachmentCount: Number;
  attachments: Array<any>;
  notificationId: string;
  connectId: string;
  connectStatus: string;
  notificationCategory: any;
  notificationStatus: any;
  senderReference: any;
  receiverReference: any;
  sentDate: Date;
  acks: Array<NotificationAckResource>;

  static dateFormat: string = Container.instance.get(I18N).tr('alerts.notifications.dateFormat');

  constructor(notification?:any) {
      if(notification && notification !== null) {
        Object.assign(this, notification);
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
        this.message = '';
        this.notificationId = '';
      }

  }

  // get attachmentCount(): Number {
  //   return this.attachments.length;
  // }

  get readCount(): Number {
    return !!(this.notificationStatus.ackStatusSummary.READ)?this.notificationStatus.ackStatusSummary.READ:0;
  }

  get unreadCount(): Number {
    let unread = !!(this.notificationStatus.ackStatusSummary.UNREAD)?this.notificationStatus.ackStatusSummary.UNREAD:0;;
    let proc = !!(this.notificationStatus.ackStatusSummary.PROCESSING)?this.notificationStatus.ackStatusSummary.PROCESSING:0;;
    let sched = !!(this.notificationStatus.ackStatusSummary.SCHEDULED)?this.notificationStatus.ackStatusSummary.SCHEDULED:0;;
    return unread + proc + sched;
  }

  get acceptedCount(): Number {
    return !!(this.notificationStatus.ackStatusSummary.ACCEPTED)?this.notificationStatus.ackStatusSummary.ACCEPTED:0;
  }

  get declinedCount(): Number {
    return !!(this.notificationStatus.ackStatusSummary.DECLINED)?this.notificationStatus.ackStatusSummary.DECLINED:0;
  }

  get repliedCount(): Number {
    return !!(this.notificationStatus.ackStatusSummary.REPLY_MESSAGE)?this.notificationStatus.ackStatusSummary.REPLY_MESSAGE:0;
  }

  get formattedSentDate(): string {
    // let moment1 = Container.instance.get(Moment);
    return (moment as any).default(this.sentDate).format(NotificationResource.dateFormat);
  }

  get categoryAndMessage(): string {
    
    return this.notificationCategory.categoryName + ': ' + this.message;
  }

  get senderFullName() {
    let i18n = Container.instance.get(I18N);
    return i18n.tr('global.memberFullName', {firstName: this.senderReference.physicalPersonProfile.firstName, lastName: this.senderReference.physicalPersonProfile.lastName});
  }

  get recipientFullName() {
    let i18n = Container.instance.get(I18N);
    let recRef = this.receiverReference;
    if(recRef.receiverType === "COMMUNITY") {
      return recRef.communityReceiver.communityName;
    } else {
      return i18n.tr('global.memberFullName', {firstName: recRef.memberReceiver.physicalPersonProfile.firstName, lastName: recRef.memberReceiver.physicalPersonProfile.lastName});
    }
  }

  get ackStatus(): string {
    // Return status based on ack status
    if(!!(this.acks) && this.acks.length === 1) {
      return this.acks[0].ackStatus;
    } else if(!!(this.acks)) {
      let session:any = Container.instance.get(Session);
      let memberId = session.auth.member.memberId;
      let ack = this.acks.find(function(ackItem) {
        return memberId === ackItem.ackParty.memberId;
      });
      return ack.ackStatus;
    } else {
    // Return status based on notification status
      let statusArray = Object.keys(this.notificationStatus.ackStatusSummary);
      if(statusArray.length === 1) {
        return statusArray[0];
      }
    }
    return null;
  }

  get ackStatusName(): string {
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

  get ackStatusDate(): string {
    if(!!(this.acks) && this.acks.length === 1) {
      return this.acks[0].formattedAckDate;
    } else if(!!(this.acks)) {
      let session:any = Container.instance.get(Session);
      let memberId = session.auth.member.memberId;
      let ack = this.acks.find(function(ackItem) {
        return memberId === ackItem.ackParty.memberId;
      });
      return ack.formattedAckDate;
    }
    return null;
  }

  get notAttachmentCount() {
    if(!!(this.attachments)) {
      return this.attachments.length;
    } else {
      return this.attachmentCount;
    }
  }
  
  // get hasCoordinatorRole(): boolean {
  //       return this.entitlementRole === 'COORDINATOR';
  // }

  // get hasMemberRole(): boolean {
  //       return this.entitlementRole === 'MEMBER';
  // }

}





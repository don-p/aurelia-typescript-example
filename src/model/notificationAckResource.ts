import {computedFrom, Container, inject} from 'aurelia-framework';
import {I18N} from 'aurelia-i18n';
import * as moment from 'moment';

@inject(I18N)
export class NotificationAckResource {
  
  message: string;
  ackAttachmentIds: Array<any>;
  attachmentCount: Number;
  notificationId: string;
  ackParty: any;
  acknowledgementDate: Date;
  ackStatus: string;
  notificationCategory: any;
  notificationStatus: any;
  senderReference: any;
  receiverReference: any;
  sentDate: Date;
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
        this.ackAttachmentIds = null;
      }

  }

  // get attachmentCount(): Number {
  //   return this.ackAttachmentIds.length;
  // }

  get recipientName(): string {
    let i18n = Container.instance.get(I18N);
    if(this.ackParty.memberEntityType === 'PHYSICAL_PERSON') {
      return i18n.tr('global.memberFullName', {firstName: this.ackParty.physicalPersonProfile.firstName, lastName: this.ackParty.physicalPersonProfile.lastName});     
    } else {
      return this.ackParty.communityName;
    }
  }

  get organizationName(): string {
    if(this.ackParty.memberEntityType === 'PHYSICAL_PERSON') {
      return this.ackParty.physicalPersonProfile.organization.organizationName;     
    } else {
      return '';
    }
  }

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

  get formattedAckDate(): string {
    // let moment1 = Container.instance.get(Moment);
    return (moment as any).default(this.acknowledgementDate).format(NotificationAckResource.dateFormat);
  }

  get categoryAndMessage(): string {
    
    return this.notificationCategory.categoryName + ': ' + this.message;
  }

  get ackStatusName(): string {
    let i18n = Container.instance.get(I18N);
    return i18n.tr('alerts.notifications.ackStatus.' + this.ackStatus);
  }

  get senderFullName() {
    let i18n = Container.instance.get(I18N);
    return i18n.tr('global.memberFullName', {firstName: this.senderReference.physicalPersonProfile.firstName, lastName: this.senderReference.physicalPersonProfile.lastName});
  }
  // get hasCoordinatorRole(): boolean {
  //       return this.entitlementRole === 'COORDINATOR';
  // }

  // get hasMemberRole(): boolean {
  //       return this.entitlementRole === 'MEMBER';
  // }

}





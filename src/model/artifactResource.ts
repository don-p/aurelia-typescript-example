import {computedFrom, Container, inject} from 'aurelia-framework';
import {I18N} from 'aurelia-i18n';
import {NotificationAckResource} from './notificationAckResource';
import {Session} from '../services/session';
import {MemberResource} from './memberResource';
import * as moment from 'moment';

@inject(Session, I18N)
export class ArtifactResource {
  
  artifactId: string;
  artifactType: string;
  createdBy: MemberResource;
  createDate: Date;
  commentBody: string;
  payload: any;

  static dateFormat: string = Container.instance.get(I18N).tr('alerts.notifications.dateFormat');

  constructor(artifact?:any) {
      if(artifact && artifact !== null) {
        Object.assign(this, artifact);
      } else {
        this.artifactId = null;
      }

  }

  get formattedCreateDate(): string {
    // let moment1 = Container.instance.get(Moment);
    return (moment as any).default(this.createDate).format(ArtifactResource.dateFormat);
  }

  get icon() {
    if(this.artifactType === 'COMMENT') {
      return 'ico-bubble-lines';
    } else if(this.artifactType === 'PAYLOAD'){
      if(this.payload.payloadDataType.indexOf('image') === 0) {
        return 'ico-image';
      } else if(this.payload.payloadDataType.indexOf('video') === 0) {
        return 'ico-video-camera3';
      } else if(this.payload.payloadDataType.indexOf('audio') === 0) {
        return 'ico-tape';
      } else {
        return 'ico-file-empty';
      }
    }
  }

  get creatorFullName() {
    let i18n = Container.instance.get(I18N);
    return i18n.tr('global.memberFullName', {firstName: this.createdBy.physicalPersonProfile.firstName, lastName: this.createdBy.physicalPersonProfile.lastName});
  }

}





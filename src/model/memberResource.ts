import {computedFrom, inject} from 'aurelia-framework';
import {I18N} from 'aurelia-i18n';
import {Container} from 'aurelia-dependency-injection';

/**
 *  Generic controller for model-mutating dialogs. 
 * */
@inject(I18N)
export class MemberResource {
  physicalPersonProfile: any;
  entitlementRole: string;
  isConnected: boolean;
  memberId: string;
  connectId: string;
  connectStatus: string;
  statusComment: string;
  
  
  constructor(member?:any) {
    
    if(member && member !== null) {
      this.isConnected = member.isConnected;
      this.entitlementRole = member.entitlementRole;
      this.memberId = member.memberId;
      this.physicalPersonProfile = member.physicalPersonProfile;
      this.connectId = member.connectId;
      this.connectStatus = member.connectStatus;
      this.statusComment = member.statusComment;
    } else {
      this.isConnected = false;
      this.memberId = '';
      this.entitlementRole = '';
    }
  }

  get fullName() {
    let i18n = Container.instance.get(I18N);
    return i18n.tr('global.memberFullName', {firstName: this.physicalPersonProfile.firstName, lastName: this.physicalPersonProfile.lastName});
  }
  get hasCoordinatorRole(): boolean {
        return this.entitlementRole === 'COORDINATOR';
  }

  get hasMemberRole(): boolean {
        return this.entitlementRole === 'MEMBER';
  }

}





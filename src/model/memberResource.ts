import {computedFrom} from 'aurelia-framework';

/**
 *  Generic controller for model-mutating dialogs. 
 * */
export class MemberResource {
  
  physicalPersonProfile: any;
  entitlementRole: string;
  isConnected: boolean;
  memberId: string;
  
  constructor(member?:any) {
      if(member && member !== null) {
        this.isConnected = member.isConnected;
        this.entitlementRole = member.entitlementRole;
        this.memberId = member.memberId;
        this.physicalPersonProfile = member.physicalPersonProfile;

      } else {
        this.isConnected = false;
        this.memberId = '';
        this.entitlementRole = '';
      }
  }

  get hasCoordinatorRole(): boolean {
        return this.entitlementRole === 'COORDINATOR';
  }

  get hasMemberRole(): boolean {
        return this.entitlementRole === 'MEMBER';
  }

}





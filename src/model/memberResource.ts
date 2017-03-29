import {computedFrom} from 'aurelia-framework';

/**
 *  Generic controller for model-mutating dialogs. 
 * */
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

  get hasCoordinatorRole(): boolean {
        return this.entitlementRole === 'COORDINATOR';
  }

  get hasMemberRole(): boolean {
        return this.entitlementRole === 'MEMBER';
  }

}





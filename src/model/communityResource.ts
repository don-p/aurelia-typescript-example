import {computedFrom} from 'aurelia-framework';

/**
 *  Generic controller for model-mutating dialogs. 
 * */
export class CommunityResource {
  _name: string;
  _description: string;
  communityType: string;
  communityId: string;
  _memberCount: number;
  
  constructor(community?:any) {
      if(community && community !== null) {
        this._name = community.communityName;
        this._description = community.communityDescription;
        this.communityType = community.communityType;
        this.communityId = community.communityId;
        this._memberCount = community.memberCount;
      } else {
        this._name = '';
        this._description = '';
        this.communityType = '';
      }
  }

  @computedFrom('_name')
  get communityName() {
    return typeof this._name === 'string'?this._name.trim():'';
  }
  set communityName(value) {
    this._name = typeof value === 'string'?value.trim():'';
  }

  @computedFrom('_description')
  get communityDescription() {
    return typeof this._description === 'string'?this._description.trim():'';
  }
  set communityDescription(value) {
    this._description = typeof value === 'string'?value.trim():'';
  }

  @computedFrom('_memberCount')
  get memberCount() {
    return this._memberCount;
  }
  set memberCount(value) {
    this._memberCount = value;
  }
}





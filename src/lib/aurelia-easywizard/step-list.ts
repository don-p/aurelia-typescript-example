export class LinkData {
  next:any;
  prev:any;
  constructor(prev) {
    this.prev = prev;
  }
  isFirst() {
    return this.prev == undefined;
  }
  isLast() {
    return this.next == undefined;
  }
}
export class StepList {
  first:any;
  last:any;
  list:WeakSet<any>;
  linkData:WeakMap<any, any>;

  constructor() {
    this.list = new WeakSet();
    this.linkData = new WeakMap();
  }
  add(data) {
    let lastLinkData;
    let prev = this.last || this.first;
    if (prev) {
      lastLinkData = this.linkData.get(prev);
    }  
    if(!this.first) {
      this.first = data;
    }
    if (lastLinkData) {
      lastLinkData.next = data;
    }
    this.last = data;
    this.list.add(this.last);
    this.linkData.set(this.last,  new LinkData(prev));
  }
  prev(data) {
    let linkData = this.linkData.get(data);
    if (linkData) {
      return linkData.prev;
    }
  }
  next(data) {
    let linkData = this.linkData.get(data);
    if (linkData) {
      return linkData.next;
    }
  }
}

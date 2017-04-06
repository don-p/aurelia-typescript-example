import * as moment from 'moment';

export class MathMinValueConverter {

  toView(value, minValue) {
    return Math.min(value, minValue);
  }
}

export class MathMaxValueConverter {

  toView(value, minValue) {
    return Math.max(value, minValue);
  }
}

export class DateFormatValueConverter {

  toView(value, format) {
   return !!(value)?moment(value).format(format):value;
  }
}
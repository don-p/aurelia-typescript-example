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
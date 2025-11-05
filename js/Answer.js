function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class Answer {
  constructor(jsonObj) {
    _defineProperty(this, "id", void 0);

    _defineProperty(this, "title", "");

    _defineProperty(this, "appliesTo", "");

    _defineProperty(this, "superSelect", "");

    if (arguments.length) {
      for (const key of Object.keys(jsonObj)) {
        this[key] = jsonObj[key];
      }
    } else {
      this.id = createUID();
    }
  }

  getId() {
    return this.id;
  }

  getTitle() {
    return this.title;
  }

  setTitle(newText) {
    this.title = newText;
  }

  getAppliesTo() {
    return this.appliesTo;
  }

  getValue() {
    return this.value;
  }

  getsuperSelect() {
    return this.superSet;
  }

  toJSON() {
    var jsonObj = {};

    for (const key of Object.keys(this)) {
      jsonObj[key] = this[key];
    }

    return jsonObj;
  }

}
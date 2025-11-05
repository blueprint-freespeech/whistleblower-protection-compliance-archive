function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class QuestionSpec {
  constructor(jsonObj) {
    _defineProperty(this, "id", void 0);

    _defineProperty(this, "caps", []);

    _defineProperty(this, "weight", 1.0);

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

  getWeight() {
    return this.weight;
  }

  setWeight(newWeight) {
    this.weight = newWeight;
  }

  getCaps() {
    return this.caps;
  }

  setCaps(newCaps) {
    return this.caps = newCaps;
  }

  addCap(cap) {
    this.caps.push(cap);
  }

  removeCap(cap) {
    const index = this.caps.indexOf(cap);

    if (index >= 0) {
      this.caps.splice(index, 1);
    }
  }

  clearsAllCaps() {
    this.caps = [];
  }

  toJSON() {
    var jsonObj = {};

    for (const key of Object.keys(this)) {
      jsonObj[key] = this[key];
    }

    return jsonObj;
  }

}
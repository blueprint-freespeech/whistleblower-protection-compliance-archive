function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class Cap {
  constructor(jsonObj) {
    _defineProperty(this, "id", "");

    _defineProperty(this, "text", "");

    _defineProperty(this, "desc", "");

    _defineProperty(this, "or", []);

    _defineProperty(this, "and", []);

    _defineProperty(this, "type", "");

    _defineProperty(this, "cap", 0.0);

    if (arguments.length) {
      for (const key of Object.keys(jsonObj)) {
        this[key] = jsonObj[key];
      }
    }
  }

  isActive(survey) {
    //Check cap applies to survey
    if (Array.isArray(this.appliesTo) && this.appliesTo.contains(survey.id) == false) {
      return false;
    } else if (this.appliesTo != survey.id) {
      return false;
    }

    for (const andCond of this.and) {
      const surveyVal = survey.getAnswer(andCond.id);

      if (this.checkCondition(surveyVal, andCond) == false) {
        return false;
      }
    } //If we get here than all ands conditions (if they exist) are true
    //Check if we have any or conditions


    if (this.or.length == 0) {
      return true;
    }

    for (const orCond of this.or) {
      const surveyVal = survey.getAnswer(orCond.id);

      if (this.checkCondition(surveyVal, orCond) == true) {
        return true;
      }
    } //None of the or conditions were True, return false;


    return false;
  }

  checkCondition(surveyVal, cond) {
    switch (this.getConditionTest(cond)) {
      case "eq":
        if (surveyVal == cond.eq) {
          return true;
        } else {
          return false;
        }

        break;

      case "lt":
        if (surveyVal < cond.lt) {
          return true;
        } else {
          return false;
        }

        break;

      case "lte":
        if (surveyVal <= cond.lte) {
          return true;
        } else {
          return false;
        }

        break;

      case "gt":
        if (surveyVal == cond.gt) {
          return true;
        } else {
          return false;
        }

        break;

      case "gte":
        if (surveyVal == cond.gte) {
          return true;
        } else {
          return false;
        }

        break;

      default:
        throw "Unknown Cap test";
        return false;
        break;
    }
  }

  getConditionTest(cond) {
    if (cond.hasOwnProperty("eq")) {
      return "eq";
    } else if (cond.hasOwnProperty("lt")) {
      return "lt";
    } else if (cond.hasOwnProperty("lte")) {
      return "lte";
    } else if (cond.hasOwnProperty("gt")) {
      return "gt";
    } else if (cond.hasOwnProperty("gte")) {
      return "gte";
    }
  }

  getType() {
    return this.type;
  }

  setType(typeStr) {
    this.type = typeStr;
  }

  getOrConditions() {
    return this.or;
  }

  setOrConditions(conditions) {
    this.or = condition;
  }

  getAndConditions() {
    return this.and;
  }

  setAndConditions(conditions) {
    this.and = condition;
  }

  getCap() {
    return this.cap;
  }

  setCap(cap) {
    this.cap = cap;
  }

  toJSON() {
    var jsonObj = {};

    for (const key of Object.keys(this)) {
      jsonObj[key] = this[key];
    }

    return jsonObj;
  }

}
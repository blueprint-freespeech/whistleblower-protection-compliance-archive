function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class Survey {
  constructor(jsonObj) {
    _defineProperty(this, "max", 0.0);

    _defineProperty(this, "id", void 0);

    _defineProperty(this, "showAsPercent", false);

    _defineProperty(this, "grade", false);

    _defineProperty(this, "grading", []);

    _defineProperty(this, "questions", []);

    _defineProperty(this, "questionsIdx", {});

    _defineProperty(this, "values", {});

    _defineProperty(this, "activeCaps", []);

    _defineProperty(this, "runningTotal", 0.0);

    _defineProperty(this, "title", void 0);

    _defineProperty(this, "conditionals", []);

    if (arguments.length) {
      this.max = jsonObj.max;
      this.id = jsonObj.id;
      this.showAsPercent = jsonObj.showAsPercent;
      this.grade = jsonObj.grade;
      this.grading = jsonObj.grading;
      this.title = jsonObj.title;

      if (jsonObj.conditionals) {
        this.conditionals = jsonObj.conditionals;
      } //load sections

      /**for (const questionSpecObj of jsonObj.questions) {
          const questionSpec = new QuestionSpec(questionSpecObj);
          this.questions.push(questionSpec);
          if(this.questionsIdx.hasOwnProperty(questionSpec.getId())){
              throw "Non-unique question Spec " + questionSpec.getId();
          }
          this.questionsIdx[questionSpec.getId()] = questionSpec;
      }*/

    } else {
      this.id = createUID();
    }
  }

  getValues() {
    return this.values;
  }

  setValues(updatedValues) {
    this.values = updatedValues;
  }

  setActiveCaps(caps) {
    this.activeCaps = caps;
  }

  setMax(newVal) {
    this.max = newVal;
  }

  getId() {
    return this.id;
  }

  getTitle() {
    return this.title;
  }

  setTitle(newTitle) {
    this.title = newTitle;
  }

  getValue(field) {
    return this[field];
  }

  setValue(field, value) {
    this[field] = value;
  }

  iterateOverKeys(callback) {
    for (const key of Object.keys(this)) {
      callback(key);
    }
  }

  update(id, value) {
    this.values[id] = value;
  }

  getAnswer(id) {
    if (this.values.hasOwnProperty(id)) {
      return this.values[id];
    } else {
      return 0;
    }
  }

  calculateSectionMax(surveyIdx, section, currentMax) {
    const sectionQs = section.getQuestionIds().concat(section.getAnswerIds());
    var dynamicMax = currentMax;

    for (const conditional of this.conditionals) {
      if (sectionQs.includes(conditional.qid)) {
        if (conditional.eq === surveyIdx[conditional.surveyId].getAnswer(conditional.qid)) {
          dynamicMax = dynamicMax + conditional.maxAdjust;
        }
      }
    }

    return dynamicMax;
  }

  calculateSectionTotal(section) {
    var total = 0.0;
    const sectionQs = section.getQuestionIds().concat(section.getAnswerIds());

    for (const key of sectionQs) {
      if (this.values.hasOwnProperty(key)) {
        total = total + this.values[key];
      }
    }

    return total;
  }

  calculateTotal() {
    var total = 0.0;

    for (const key of Object.keys(this.values)) {
      total = total + this.values[key];
    }

    this.runningTotal = total;
    return total;
  }

  calculateMax(surveyIdx) {
    var dynamicMax = this.max;

    for (const conditional of this.conditionals) {
      if (conditional.eq === surveyIdx[conditional.surveyId].getAnswer(conditional.qid)) {
        dynamicMax = dynamicMax + conditional.maxAdjust;
      }
    }

    return dynamicMax;
  }

  getScore(max) {
    var total = this.calculateTotal();
    var cappedTotal = total;

    for (const surveyCap of this.activeCaps) {
      if (surveyCap.getType() == "percent") {
        if (surveyCap.getCap() < cappedTotal / max * 100) {
          cappedTotal = max * (surveyCap.getCap() / 100);
        }
      } else {
        throw "Unknown Cap type";
      }
    }

    if (this.showAsPercent) {
      return Math.round(cappedTotal / max * 100);
    } else {
      return cappedTotal;
    }
  }

  getGrade(max) {
    var score = this.getScore(max);

    if (!this.showAsPercent) {
      score = score / max * 100;
    }

    for (const grade of this.grading) {
      var passed = false;

      for (const test of Object.keys(grade)) {
        var cont = false;

        switch (test) {
          case "grade":
          case "gradeText":
          case "gradeColour":
            cont = true;
            break;

          case "gt":
            if (score > grade[test]) {
              cont = true;
            }

            break;

          case "gte":
            if (score >= grade[test]) {
              cont = true;
            }

            break;

          case "lt":
            if (score < grade[test]) {
              cont = true;
            }

            break;

          case "lte":
            if (score <= grade[test]) {
              cont = true;
            }

            break;

          case "eq":
            if (score == grade[test]) {
              cont = true;
            }

            break;

          default:
            break;
          // code block
        }

        if (cont) {
          passed = true;
        } else {
          passed = false;
          break;
        }
      }

      if (passed) {
        return grade;
      }
    }
  }

  toJSON() {
    var jsonObj = {};

    for (const key of Object.keys(this)) {
      jsonObj[key] = this[key];
    }

    return jsonObj;
  }

}
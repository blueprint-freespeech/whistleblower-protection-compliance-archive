function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class Section {
  constructor(jsonObj) {
    _defineProperty(this, "max", 0.0);

    _defineProperty(this, "id", void 0);

    _defineProperty(this, "title", "");

    _defineProperty(this, "furtherInfo", void 0);

    _defineProperty(this, "weight", 0.0);

    _defineProperty(this, "caps", []);

    _defineProperty(this, "questions", []);

    _defineProperty(this, "questionsIdx", {});

    _defineProperty(this, "conditionalQs", []);

    _defineProperty(this, "conditionalQsIdx", []);

    if (arguments.length) {
      for (const key of Object.keys(jsonObj)) {
        if (key === "questions") {
          //load questions
          for (const questionObj of jsonObj.questions) {
            const question = new Question(questionObj);
            this.questions.push(question);

            if (this.questionsIdx.hasOwnProperty(question.getId())) {
              throw "Non-unique question ID " + question.getId();
            }

            this.questionsIdx[question.getId()] = question;
          }
        } else if (key === "conditionalQs") {
          for (const questionObj of jsonObj.conditionalQs) {
            const question = new Question(questionObj);
            this.conditionalQs.push(question);

            if (this.questionsIdx.hasOwnProperty(question.getId())) {
              throw "Non-unique conditional question ID " + question.getId();
            }

            this.conditionalQsIdx[question.getId()] = question;
          }
        } else {
          this[key] = jsonObj[key];
        }
      }
    } else {
      this.id = createUID();
    }
  }

  getActiveCaps(survey) {
    var activeCaps = [];

    for (const questionObj of this.questions) {
      for (const activeCap of questionObj.getActiveCaps(survey)) {
        activeCaps.push(activeCap);
      }
    } //TODO Section level caps


    return activeCaps;
  }

  getQuestionIds() {
    return Object.keys(this.questionsIdx).concat(Object.keys(this.conditionalQsIdx));
  }

  calculateMax(surveyMax) {
    for (const questionObj of this.questions) {
      questionObj.calculateMax(surveyMax);
    }
  }

  getAnswerIds() {
    var answerIds = [];

    for (const question of this.questions) {
      answerIds = answerIds.concat(question.getAnswerIds());
    }

    for (const question of this.conditionalQs) {
      answerIds = answerIds.concat(question.getAnswerIds());
    }

    return answerIds;
  }

  getFurtherInfo() {
    return this.furtherInfo;
  }

  setFurtherInfo(newFurtherInfo) {
    this.furtherInfo = newFurtherInfo;
  }

  getMax() {
    return this.max;
  }

  setMax(newMax) {
    this.max = newMax;
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
      if (key === "questionsIdx") {} else {
        jsonObj[key] = this[key];
      }
    }

    return jsonObj;
  }

}
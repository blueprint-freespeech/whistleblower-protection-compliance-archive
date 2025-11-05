function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class Question {
  constructor(jsonObj) {
    _defineProperty(this, "id", void 0);

    _defineProperty(this, "caps", []);

    _defineProperty(this, "text", "");

    _defineProperty(this, "furtherInfo", void 0);

    _defineProperty(this, "answers", []);

    _defineProperty(this, "answersIdx", {});

    _defineProperty(this, "weight", 1.0);

    _defineProperty(this, "appliesTo", "");

    _defineProperty(this, "type", "");

    if (arguments.length) {
      for (const key of Object.keys(jsonObj)) {
        if (key === "answers") {
          for (const answerObj of jsonObj.answers) {
            const answer = new Answer(answerObj);

            if (answer.appliesTo === "") {
              answer.appliesTo = this.appliesTo;
            }

            this.answers.push(answer);

            if (this.answersIdx.hasOwnProperty(answer.getId())) {
              throw "Non-unique answer ID " + answer.getId();
            }

            this.answersIdx[answer.getId()] = answer;
          }
        } else if (key === "caps") {
          for (const capObj of jsonObj.caps) {
            const cap = new Cap(capObj);
            this.caps.push(cap);
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

    for (const cap of this.caps) {
      if (cap.isActive(survey)) {
        activeCaps.push(cap);
      }
    }

    return activeCaps;
  }

  calculateMax(surveyMap) {
    //TODO Handle weighting
    if (this.type == "multiselect" || this.type == "conditionalmultiselect") {
      for (const answer of this.answers) {
        if (Array.isArray(answer.getAppliesTo())) {
          for (const sid of answer.getAppliesTo()) {
            if (answer.getValue() >= 0) {
              //Exclude negative marks - since the max would be not selecting them
              surveyMap[sid] += answer.getValue();
            }
          }
        } else {
          if (answer.getValue() >= 0) {
            //Exclude negative marks - since the max would be not selecting them
            surveyMap[answer.getAppliesTo()] += answer.getValue();
          }
        }
      }
    } else if (this.type == "select" || this.type == "conditionalselect") {
      var tempSurveys = {};

      for (const answer of this.answers) {
        if (Array.isArray(answer.getAppliesTo())) {
          for (const sid of answer.getAppliesTo()) {
            if (tempSurveys.hasOwnProperty(sid)) {
              if (answer.getValue() > tempSurveys[sid]) {
                tempSurveys[sid] = answer.getValue();
              }
            } else {
              tempSurveys[sid] = answer.getValue();
            }
          }
        } else {
          if (tempSurveys.hasOwnProperty(answer.getAppliesTo())) {
            if (answer.getValue() > tempSurveys[answer.getAppliesTo()]) {
              tempSurveys[answer.getAppliesTo()] = answer.getValue();
            }
          } else {
            tempSurveys[answer.getAppliesTo()] = answer.getValue();
          }
        }
      }

      for (const key of Object.keys(tempSurveys)) {
        surveyMap[key] += tempSurveys[key];
      }
    }
  }

  getAnswerIds() {
    return Object.keys(this.answersIdx);
  }

  getId() {
    return this.id;
  }

  getText() {
    return this.text;
  }

  setText(newText) {
    this.text = newText;
  }

  getWeight() {
    return this.weight;
  }

  setWeight(newWeight) {
    this.weight = newWeight;
  }

  getFurtherInfo() {
    return this.furtherInfo;
  }

  setFurtherInfo(newFurtherInfo) {
    this.furtherInfo = newFurtherInfo;
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

  getAnswers() {
    return this.answers;
  }

  setAnswers(newAnswers) {
    return this.answers = newAnswers;
  }

  addAnswer(newAnswer) {
    this.answers.push(newAnswer);
  }

  removeAnswer(answer) {
    const index = this.answers.indexOf(answer);

    if (index >= 0) {
      this.answers.splice(index, 1);
    }
  }

  clearsAllAnswers() {
    this.answers = [];
  }

  toJSON() {
    var jsonObj = {};

    for (const key of Object.keys(this)) {
      jsonObj[key] = this[key];
    }

    return jsonObj;
  }

}
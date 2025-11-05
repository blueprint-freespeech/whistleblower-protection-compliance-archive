var json;
const SURVEY_VERSION = "2020-06-V1";
var surveys = [];
var surveyIdx = {};
var sections = [];
var radioChecked = {};
var localStorageAvailable = false;
var lStorage = window.localStorage;

function lsTest() {
  var test = 'test';

  try {
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

var inReload = false;

function saveProgress() {
  if (inReload || !localStorageAvailable) {
    return;
  }

  for (const survey of surveys) {
    lStorage.setItem(survey.getId(), JSON.stringify(survey.getValues()));
  }

  lStorage.setItem("opt-Checked", JSON.stringify(radioChecked));
}

function getSaveFile() {
  var saveFile = {};
  saveFile.date = new Date().toJSON();
  saveFile.surveys = {};
  saveFile.version = SURVEY_VERSION;

  for (const survey of surveys) {
    saveFile.surveys[survey.getId()] = survey.getValues();
  }

  saveFile.optChecked = radioChecked;

  if (localStorageAvailable && lStorage.getItem("lastSection")) {
    saveFile.lastSection = lStorage.getItem("lastSection");
  }

  return saveFile;
}

function checkForSavedProgress() {
  if (!localStorageAvailable) {
    return false;
  }

  var isPopulated = true;

  for (const survey of surveys) {
    if (!lStorage.getItem(survey.getId())) {
      isPopulated = false;
    }
  }

  if (!lStorage.getItem("opt-Checked")) {
    isPopulated = false;
  }

  return isPopulated;
}

function printResults() {
  window.print();
}

function downloadMediaTemplate() {
  var a = document.createElement("a");
  a.href = document.getElementById("pressRelease").value;
  a.setAttribute("download", "PressReleaseTemplate.pdf");
  a.click();
}

function getPdf() {
  var sections = document.querySelectorAll(".fade-in");

  for (var i = 0; i < sections.length; i++) {
    sections[i].classList.remove("fade-in");
  }

  var element = document.getElementById('pdfcontainer');
  var opt = {
    margin: 0.25,
    filename: 'ComplianceToolResult.pdf',
    image: {
      type: 'jpeg',
      quality: 1.0
    },
    jsPDF: {
      unit: 'in',
      format: 'a4',
      orientation: 'portrait'
    }
  }; //html2pdf(element);

  var ret = html2pdf().set(opt).from(element).save(); //console.log(ret);

  /**var ret = html2pdf().set(opt).from(element).save().thenExternal(function(promise){
      var grades = document.querySelectorAll(".grade");
      for(var i=0;i<grades.length;i++){
          grades[i].style.color="white";
          grades[i].style.color="transparent";
      }
  
  });**/
}

function updateCurrentSection(sectionId) {
  if (localStorageAvailable) {
    lStorage.setItem("lastSection", sectionId);
  }
}

function resumeSurvey() {
  if (lStorage.getItem("lastSection")) {
    if (lStorage.getItem("lastSection") == "finish") {//reload finish screen
    } else {
      const sec = document.getElementById(lStorage.getItem("lastSection"));

      if (sec.classList.contains("questionDiv")) {
        moveToSection(sec.parentNode.parentNode.id, "welcomeDiv");
        moveToQuestion(sec.id, sec.parentNode.childNodes[0].id);
      } else {
        moveToSection(sec.id, "welcomeDiv");
      }
    }
  }
}

function showAbout() {
  document.getElementById("modalDialogAbout").style.display = "block";
}

function showAboutScoring() {
  document.getElementById("modalDialogScoring").style.display = "block";
}

function showAcks() {
  document.getElementById("modalDialogAck").style.display = "block";
}

function showClear() {
  document.getElementById("modalDialogClear").style.display = "block";
}

function showPrivacy() {
  document.getElementById("modalDialogPrivacy").style.display = "block";
}

function saveToFile() {
  const saveFile = JSON.stringify(getSaveFile());
  document.getElementById("saveFile").value = saveFile;
  document.getElementById("saveFileName").value = "blueprint_compliance_tool_" + new Date().toDateString().replace(/ /g, "_") + ".json";
  document.getElementById("modalDialogSave").style.display = "block";
  document.getElementById("saveFile").select();
}

function selectFile() {
  if (document.getElementById("loadFileButton").innerText == "Load Contents") {
    loadSavedFile();
  } else {
    document.getElementById("loadfileinput").click();
  }
}

function fileContentsChanged() {
  document.getElementById("loadFileButton").innerText = "Load Contents";
}

function loadSavedFile(contents) {
  if (typeof contents == 'undefined') {
    contents = document.getElementById("loadFile").value;
  }

  if (localStorageAvailable) {
    try {
      var loadObj = JSON.parse(contents);

      if (loadObj.hasOwnProperty("lastSection")) {
        lStorage.setItem("lastSection", loadObj.lastSection);
      } else {
        throw "Missing Last Section Parameter";
      }

      if (loadObj.hasOwnProperty("surveys")) {
        for (const survey of surveys) {
          if (loadObj.surveys.hasOwnProperty(survey.getId())) {
            lStorage.setItem(survey.getId(), JSON.stringify(loadObj.surveys[survey.getId()]));
          } else {
            throw "Missing Survey: " + survey.getId();
          }
        }
      } else {
        throw "Missing Last Surveys Field";
      }

      if (loadObj.hasOwnProperty("optChecked")) {
        lStorage.setItem("opt-Checked", JSON.stringify(loadObj.optChecked));
      } else {
        throw "Missing optChecked";
      }

      loadStored();
      document.getElementById("resumeButton").style.display = "inline-block";
    } catch (err) {
      alert("Error opening file:" + err);
    } finally {
      closeModal();
    }
  } else {
    inReload = true;

    try {
      var loadObj = JSON.parse(contents);

      if (loadObj.hasOwnProperty("optChecked")) {
        radioChecked = loadObj.optChecked;
      } else {
        throw "Missing optChecked";
      }

      for (const survey of surveys) {
        if (!loadObj.surveys.hasOwnProperty(survey.getId())) {
          throw "Missing Survey Data in LocalStorage " + survey.getId();
        } else {
          console.log("Loading Survey:" + loadObj.surveys[survey.getId()]);
          survey.setValues(loadObj.surveys[survey.getId()]);
          var surveyVals = loadObj.surveys[survey.getId()];

          for (const key of Object.keys(surveyVals)) {
            const elem = document.getElementById(key);
            const radios = document.getElementsByName("opt-" + key);

            if (radios.length > 0) {
              for (const radio of radios) {
                if (radio.value == String(surveyVals[key]) && radio.id == radioChecked[key]) {
                  radio.checked = true;
                  var event = new Event('change');
                  radio.dispatchEvent(event);
                }
              }
            } else {
              if (elem.surveyVal == String(surveyVals[key])) {
                elem.click();
              }
            }
          }
        }
      }

      document.getElementById("resumeButton").style.display = "inline-block";
    } catch (err) {
      alert("Error opening file:" + err);
    } finally {
      inReload = false;
      closeModal();
    }
  }
}

function checkFile() {
  const fileElem = document.getElementById("loadfileinput");

  if (fileElem.files.length == 0) {
    return;
  }

  var file = fileElem.files[0];
  var reader = new FileReader();
  reader.addEventListener('load', function (e) {
    console.log(e);
    loadSavedFile(e.target.result);
  });
  reader.addEventListener('error', function () {
    alert("Error reading file. Please try again");
  }); // read as text file

  reader.readAsText(file);
}

function doSave() {
  var blob = new Blob([document.getElementById("saveFile").value], {
    type: "application/json;charset=utf-8"
  });
  saveAs(blob, document.getElementById("saveFileName").value);
  closeModal();
}

function loadFromFile() {
  document.getElementById("loadFile").value = "";
  document.getElementById("loadFileButton").innerText = "Open File";
  document.getElementById("modalDialogLoad").style.display = "block";
}

const complianceToolPublicKey = `-----BEGIN PGP PUBLIC KEY BLOCK-----

mQGNBF8S4f8BDADFU6A45PstANzHKopa2YpcoYawZbiVhwBvZ56BFroCaXYN8Bdn
Suou6RmYDw4/5QznWK6WYkiumR+Pi+iLM3WgXtS7+aptWfEYNIwH65z9idK9Z4eG
cxq3mdFkhjufAzavBF2sqWdTTyXWSh79hIrWEb7WnRf8jJLTrZwCA9lM/9Z9+dNS
dZtkRscHJJDG5vGTWYBkSk3ge1CyegD5XDE0/xFnm0PITJ3hFWuTIytGrIr6iWLu
AhZ0pdUtqNQO6jmCO2gpqoEe/4pOm2+Lsj/x9LtF1hSGQx1V+qmnTEOKy94Gc4yR
LYkh9mfbmEySAEfPrqnnQPFRSfcBbhOVuj9tBW4UYzpYQ5HEmaqrTww+4N/AZmvJ
PYFgR1W0gsICTrQ0yz3DFkmPuSdxbKsjfEsSimLgGVqEYkSHLhWSbprwmaquu5eX
UhuZQpDkrFb2HsloX0MNty7xutRz0FEenjbKhZQOWhag7I3NP/pUn4gHE4X6U2fo
eqkAcHI1I7M3200AEQEAAbRGQmx1ZXByaW50IGZvciBGcmVlIFNwZWVjaCA8Y29t
cGxpYW5jZXNjb3JlQGJsdWVwcmludGZvcmZyZWVzcGVlY2gubmV0PokB1AQTAQgA
PhYhBLZcixmZt4EaiqKOBdsY9+dW0t5YBQJfEuH/AhsDBQkDwmcABQsJCAcCBhUK
CQgLAgQWAgMBAh4BAheAAAoJENsY9+dW0t5YaA8MAJZdtLKODZhBAD+WHUsHn5fU
HjHZqfsFX8WgJXVZ4Km61FbQslonf82fvyZODYDY4N7mFSZaUPQ5DCmNUUru1U2+
G85qd7H9n8bVcwZhXGSAQAVSTnQD7y8nb/CHL9JD/C2LUUh+Dm6B4CkIq0OCSFZo
ACCemdNfiK0blLno/V2+as+RL3H8NAEZ6b2KvaR+a22HMh27LsNQDAq/R28jVVxs
4PVUuTkqp+qJ3+REVEXrr/CxlN5XIuQw9FLSpA0CtkLsikn88Rxjt0tUqgNUNMye
xgWlkskFS3UdKYz+Uv97pyh7/rPlTp3Lf/3lmg6BEJsKjNm+s7z6MBFKtPlB7wPs
387BLHB6bhU4Z3jFleIzZvsaBIyXqWMo/i50EFLoa6OxNtzKbeXKpotRWQ13sGkC
pl9+3GXStsr1/fWPPnevePviiMxytvhL0Kzv39oZomsvFYmUQ4TjUb3pGIaIQ8K5
Neo5nh3vg5SqhTQkOd/kFWInxIzyd2p5CcNh6GqmaLkBjQRfEuH/AQwAqcDnoT/E
6O1rb28DlpyHXVs9AkDbn6TrL20B4BwTOdXgHg7PbWfR40nIb0sBSjiafvRZ+Q4L
81EVfO57eX73i8xomYu5LIPuMjgUPExOxOEP7pPRCBrWbDSW1KephwD0bQg2U19l
ji7q5zEVANxbmLx59fKNKV9bnW6mLHoeMCZDal+fFpHTj5WIkU11dPUHU4T+61CK
T213XeWOXm1VrLOhNBZ0KUGtXnApKETa67B8snYoED64nfiZJv8hRy0A0iv6gdOs
+2I4vavKUElojeJiiHb9D3fRowvAfeBlllv5HVWrhIDj2bz+hmKESDF3cytc/JhS
VVeXHkLpWA0ZkfMRPSE3WtNBGAWxDT/IB8Sve/JVZiW3v30gZW5O1xguBLkpXtks
Rc9LJRBCOQgVVgqAFOCqnHMyf4QL5yjTd5rrI8/yI0pYfSv1tfZ+n9jCHD4UFQfo
cWGdeRFE84kcInDihi9/Iy6WeZ/OK4eVKjVc+ufRYWs3RuVc8Kwe8KBPABEBAAGJ
AbwEGAEIACYWIQS2XIsZmbeBGoqijgXbGPfnVtLeWAUCXxLh/wIbDAUJA8JnAAAK
CRDbGPfnVtLeWLXIC/9GqwO0JoNB53nmChN8YDyGJgxZ6+KMLKgtOdebTMFM8URS
mse1jZg1ze4mgMAW9o2GLs0405p88R2zuoJYObVHkNoIKXPyfFqQ2Mh/CT7sk0AJ
6ba3upASoBoRcVuufJ/W7Hs+sFOC7Ou66XCBeDQ0LDIp9NjDdxLrFdWvXG131qTX
hajl+c1jd5fwtwQ0iJkWmioh/8Srmwt9ZNZ/tJNK/+uZV32jwaIl6I8rhCm7KlHu
BXkhwY7ohthAcNN7pb5HibNfsXJuttdvVoHem7g3Cx8PKe1FFaGMN9oqZv2Kyv5Z
p94OX6sRp85kbI99P38pLTekUd5gxlGztN97cYHvfXkz0PTnZitwylRjoPpBvqQr
5XVl6fxBpMgv8Aj+Cy1oo8N1rQV3yqDScxVfcFQi7XGq4h1KgH2FRnFxC5g1oDqC
1NI72gc5AjeTtBaChB0qTgYG0W8O1fbWTVU1X/1jG414ZFEoOhh9p6UzAKklmtnj
z7Qi8J46gzxpmsDYsFU=
=t04K
-----END PGP PUBLIC KEY BLOCK-----`;

function encryptAndShow() {
  const saveFile = JSON.stringify(getSaveFile()); //const msg = openpgp.message.fromText(saveFile);
  //const publicKeys = openpgp.key.readArmored(complianceToolPublicKey).keys;

  const openpgp = window.openpgp;

  (async () => {
    const {
      data: encrypted
    } = await openpgp.encrypt({
      message: openpgp.message.fromText(saveFile),
      // input as Message object
      publicKeys: (await openpgp.key.readArmored(complianceToolPublicKey)).keys // for encryption

    });
    showUpload(encrypted);
    console.log(encrypted); // '-----BEGIN PGP MESSAGE ... END PGP MESSAGE-----'
  })();
}

function showAlert(title, message) {
  const genericDialog = document.getElementById("modalDialogGeneric");
  document.getElementById("genericModalTitle").innerText = title;
  document.getElementById("genericModalMsg").innerText = message;
  genericDialog.style.display = "block";
}

function showUpload(encData) {
  var array = new Uint8Array(4);
  window.crypto.getRandomValues(array);
  document.getElementById("randomID").value = toHexString(array);
  document.getElementById("encryptedUpload").value = encData;
  document.getElementById("modalDialogUpload").style.display = "block";
}

function toHexString(byteArray) {
  return Array.from(byteArray, function (byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
}

function resetUploadForm() {
  document.getElementById("uploadButton").disabled = false;
  document.getElementById("cancelUpload").disabled = false;
  document.getElementById("loaderDiv").classList.remove("loader");
}

var currentTimeout = null;

function upload() {
  const formElem = document.getElementById("uploadForm");
  document.getElementById("uploadButton").disabled = true;
  document.getElementById("cancelUpload").disabled = true;
  document.getElementById("loaderDiv").className = "loader";
  currentTimeout = window.setTimeout(function () {
    resetUploadForm();
    closeModal();
    showAlert("Error Uploading Data", "Your data could not be uploaded. Please email <a href='mailto:compliancescore@blueprintforfreespeech.net'>compliancescore@blueprintforfreespeech.net</a>");
  }, 10000);
  var formData = new FormData(formElem);
  var xmlHttp = new XMLHttpRequest();

  xmlHttp.onreadystatechange = function () {
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
      if (currentTimeout != null) {
        window.clearTimeout(currentTimeout);
        currentTimeout = null;
      }

      resetUploadForm();
      closeModal();
      showAlert("Upload Successful", "Thank you!\nYour upload has been successfully sent.");
    } else if (xmlHttp.readyState == 4 && xmlHttp.status != 200) {
      if (currentTimeout != null) {
        window.clearTimeout(currentTimeout);
        currentTimeout = null;
      }

      resetUploadForm();
      closeModal();
      showAlert("Error Uploading Data", "Your data could not be uploaded. Please email <a href='mailto:compliancescore@blueprintforfreespeech.net'>compliancescore@blueprintforfreespeech.net</a>");
    }
  };

  xmlHttp.open("POST", "https://tool.blueprintforfreespeech.net/submit.php"); //formElem.getAttribute("action")

  xmlHttp.send(formData);
}

function loadStored() {
  inReload = true;
  radioChecked = JSON.parse(lStorage.getItem("opt-Checked"));

  for (const survey of surveys) {
    if (!lStorage.getItem(survey.getId())) {
      throw "Missing Survey Data in LocalStorage " + survey.getId();
    } else {
      console.log("Loading Survey:" + lStorage.getItem(survey.getId()));
      survey.setValues(JSON.parse(lStorage.getItem(survey.getId())));
      var surveyVals = JSON.parse(lStorage.getItem(survey.getId()));

      for (const key of Object.keys(surveyVals)) {
        const elem = document.getElementById(key);
        const radios = document.getElementsByName("opt-" + key);

        if (radios.length > 0) {
          for (const radio of radios) {
            if (radio.value == String(surveyVals[key]) && radio.id == radioChecked[key]) {
              radio.checked = true;
              var event = new Event('change');
              radio.dispatchEvent(event);
            }
          }
        } else {
          if (elem.surveyVal == String(surveyVals[key])) {
            elem.click();
          }
        }
      }
    }
  }

  document.getElementById("resumeButton").style.display = "inline-block";
  inReload = false;
}

function discardStored() {
  if (localStorageAvailable) {
    lStorage.clear();
  }
}

function closeModal() {
  for (const elem of document.getElementsByClassName("modal")) {
    elem.style.display = "none";
  }
}

function showDropDown(ev) {
  document.getElementById("menuDropdown").classList.toggle("show");
  ev.stopPropagation();
}

function reload() {
  if (lsTest() === true) {
    localStorageAvailable = true;
  } else {
    localStorageAvailable = false;
    showAlert("Local Storage Error", "Local storage is not available. You can continue to use the tool but your progress will not be saved as you go along. You can still save and load surveys to and from files.");
  } // Close the dropdown menu if the user clicks outside of it


  window.onclick = function (event) {
    if (!event.target.matches('.dropbtn')) {
      var dropdowns = document.getElementsByClassName("dropdown-content");
      var i;

      for (i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];

        if (openDropdown.classList.contains('show')) {
          openDropdown.classList.remove('show');
        }
      }
    }
  };

  surveys = [];
  surveyIdx = {};
  sections = [];
  surveyIds = [];
  console.log("Load survey");

  for (const survey of json.surveys) {
    const surveyObj = new Survey(survey);
    surveys.push(surveyObj);
    surveyIdx[surveyObj.getId()] = surveyObj;
    surveyIds.push(surveyObj.getId());
  }

  console.log("Load sections");

  for (const section of json.sections) {
    const sectionObj = new Section(section);
    sections.push(sectionObj);
  }

  console.log("Verify");
  verify();
  console.log("Calculate Max");
  calculateSurveyMax();
  console.log("Render");
  renderSections("container");
  console.log("Checking Local Storage");

  if (checkForSavedProgress()) {
    document.getElementById("modalDialog").style.display = "block";
  }
}

function verify() {
  var unique = {};
  console.log("Starting Verify");

  for (const section of sections) {
    const qIds = section.getQuestionIds();

    for (const qid of qIds) {
      if (unique.hasOwnProperty(qid)) {
        throw "Non Unique ID:" + qid;
      }

      unique[qid] = "";
    }

    const aIds = section.getAnswerIds();

    for (const aid of aIds) {
      if (unique.hasOwnProperty(aid)) {
        throw "Non Unique ID:" + aid;
      }

      unique[aid] = "";
    }
  }

  console.log("Finished Verify");
  unique = null;
}

function calculateSurveyMax() {
  var surveyMax = {};

  for (const survey of surveys) {
    surveyMax[survey.getId()] = 0.0;
  }

  for (const section of sections) {
    section.calculateMax(surveyMax);
  }

  for (const key of Object.keys(surveyMax)) {
    surveyIdx[key].setMax(surveyMax[key]);
  }
}

function scrollToSection(sectionId) {
  document.getElementById(sectionId).scrollIntoView({
    behavior: "smooth"
  });
}

function finishAndCalculate() {
  for (const survey of surveys) {
    const surveyContainer = document.createElement("div");
    surveyContainer.className = "surveyContainer";
    surveyContainer.id = survey.id + "container";
    surveyContainer.style.breakAfter = "page";
    const surveyRes = document.createElement("div");
    surveyRes.className = "surveyResult";
    surveyRes.id = survey.id;
    const titleBarDiv = document.createElement("div");
    titleBarDiv.className = "titlebar";
    const titleDiv = document.createElement("div");
    titleDiv.className = "title";
    titleDiv.id = survey.id + "title";
    titleDiv.innerText = survey.title;
    titleBarDiv.appendChild(titleDiv);
    surveyRes.appendChild(titleBarDiv);
    const containerDiv = document.createElement("div");
    containerDiv.className = "rescontainer";
    const descDiv = document.createElement("div");
    descDiv.className = "surveydesc";
    descDiv.id = survey.id + "desc";
    descDiv.innerText = "Some text";
    const scoresDiv = document.createElement("div");
    scoresDiv.className = "scores";
    scoresDiv.id = survey.id + "scores";
    var surveyMax = survey.calculateMax(surveyIdx);
    var surveyScore = survey.calculateTotal();
    var surveyCaps = [];
    const sectionScoresDiv = document.createElement("div");
    sectionScoresDiv.className = "sectionScoresContainer";
    const sectionScoresTitle = document.createElement("div");
    sectionScoresTitle.className = "sectionScoresTitle";
    sectionScoresTitle.innerText = "Section Scores (Uncapped)";
    sectionScoresDiv.appendChild(sectionScoresTitle);

    for (var i = 0; i < sections.length; i++) {
      var tempSurveyMax = {};

      for (const surveyTemp of surveys) {
        tempSurveyMax[surveyTemp.getId()] = 0.0;
      }

      const section = sections[i];
      section.calculateMax(tempSurveyMax);
      const sectionTotal = survey.calculateSectionTotal(section);
      var currentSectionMax = tempSurveyMax[survey.getId()];
      currentSectionMax = survey.calculateSectionMax(surveyIdx, section, currentSectionMax);

      if (currentSectionMax > 0) {
        const sectionScoreDiv = document.createElement("div");
        sectionScoreDiv.className = "sectionScoreContainer";
        const sectionScoreTitle = document.createElement("div");
        sectionScoreTitle.className = "sectionScoreTitle";
        sectionScoreTitle.innerText = section.getTitle();
        sectionScoreTitle.addEventListener('click', event => {
          scrollToSection(section.getId());
        });
        sectionScoreDiv.appendChild(sectionScoreTitle);
        const sectionScoreBarContainer = document.createElement("div");
        sectionScoreBarContainer.className = "sectionScoreBarContainer";
        const sectionScoreBarContainerInner = document.createElement("div");
        sectionScoreBarContainerInner.className = "sectionScoreBarContainerInner";
        sectionScoreBarContainer.appendChild(sectionScoreBarContainerInner);
        const sectionScoreBar = document.createElement("div");
        sectionScoreBar.className = "sectionScoreBar";

        if (sectionTotal == 0) {
          sectionScoreBar.style.width = "0%";
        } else {
          sectionScoreBar.style.width = sectionTotal / currentSectionMax * 100 + "%";
        }

        const sectionScoreBarText = document.createElement("div");
        sectionScoreBarText.className = "sectionScoreBarText";
        sectionScoreBarText.innerText = sectionTotal + "/" + currentSectionMax + " (" + Math.round(sectionTotal / currentSectionMax * 100) + "%)";
        sectionScoreBarContainerInner.appendChild(sectionScoreBar);
        sectionScoreBarContainerInner.appendChild(sectionScoreBarText);
        sectionScoreDiv.appendChild(sectionScoreBarContainer);
        sectionScoresDiv.appendChild(sectionScoreDiv);
      }

      const tempSurveyCaps = section.getActiveCaps(survey);

      for (const surveyCap of tempSurveyCaps) {
        surveyCaps.push(surveyCap);
      }
    }

    survey.setActiveCaps(surveyCaps);

    if (survey.grade) {
      const gradeBlockDiv = document.createElement("div");
      gradeBlockDiv.className = "gradeblock";
      const grade = survey.getGrade(surveyMax);
      gradeBlockDiv.style.backgroundColor = grade.gradeColour;
      const gradeDiv = document.createElement("div");
      gradeDiv.className = "grade";
      gradeDiv.id = survey.id + "grade";
      gradeDiv.innerText = grade.grade;
      descDiv.innerText = grade.gradeText;
      gradeBlockDiv.append(gradeDiv);
      scoresDiv.appendChild(gradeBlockDiv);
    }

    const scoreDiv = document.createElement("div");
    scoreDiv.className = "score";
    scoreDiv.id = survey.id + "score";
    scoreDiv.innerText = survey.getScore(surveyMax) + "%";
    scoresDiv.appendChild(scoreDiv);
    containerDiv.appendChild(scoresDiv);
    containerDiv.appendChild(descDiv);
    surveyRes.appendChild(containerDiv);

    if (surveyCaps.length > 0) {
      const detailsDiv = document.createElement("div");
      detailsDiv.className = "resultdetails";
      detailsDiv.id = survey.id + "details";
      detailsDiv.innerText = "The overall score has been capped because the law fails the following critical tests:";

      for (const aCap of surveyCaps) {
        const capDiv = document.createElement("div");
        capDiv.className = "activecap";
        capDiv.id = survey.id + aCap.id;
        const capTitleDiv = document.createElement("div");
        capTitleDiv.className = "activecaptitle";
        capTitleDiv.innerText = aCap.text;
        capDiv.appendChild(capTitleDiv);
        const capDescDiv = document.createElement("div");
        capDescDiv.className = "activecapdesc";
        var capString = " (Capped at " + aCap.getCap();

        if (aCap.getType() == "percent") {
          capString = capString + "%)";
        } else {
          capString = capString + ")";
        }

        capString = capString + " See highlighted answers labelled {" + aCap.id + "}";
        capDescDiv.innerText = aCap.desc + capString;
        capDiv.appendChild(capDescDiv);
        detailsDiv.appendChild(capDiv);
      }

      descDiv.appendChild(detailsDiv);
    }

    descDiv.appendChild(sectionScoresDiv);
    surveyContainer.appendChild(surveyRes);
    document.getElementById("surveyResults").appendChild(surveyContainer);

    for (const cap of surveyCaps) {
      for (const cond of cap.getOrConditions()) {
        var qId = cond.id;

        if (cond.hasOwnProperty("highlight")) {
          qId = cond.highlight;
        }

        document.getElementById("div" + qId).classList.add("caphighlight");
        document.getElementById("div" + qId).querySelector(".answerdetails").innerText += " {" + cap.id + "}";
      }

      for (const cond of cap.getAndConditions()) {
        var qId = cond.id;

        if (cond.hasOwnProperty("highlight")) {
          qId = cond.highlight;
        }

        document.getElementById("div" + qId).classList.add("caphighlight");
        document.getElementById("div" + qId).querySelector(".answerdetails").innerText += " {" + cap.id + "}";
      }
    }
  }

  const keyBar = document.createElement("div");
  keyBar.className = "sectionBar";
  const keyTitle = document.createElement("div");
  keyTitle.className = "keytitle";
  keyTitle.innerText = "Results Key";
  keyBar.appendChild(keyTitle);
  const keyDetailsDiv = document.createElement("div");
  keyDetailsDiv.className = "keydetails";
  keyDetailsDiv.innerText = "After each answer is ";
  const keyDetailsi = document.createElement("i");
  keyDetailsi.innerText = "[survey_name] (question_score) {caps}";
  keyDetailsDiv.appendChild(keyDetailsi);
  const keyDetailsDiv1 = document.createElement("div"); //keyDetailsDiv1.className = "keydetails";

  var keyDetailsUL = document.createElement("ul");
  var keyDetailsLI = document.createElement("li");
  keyDetailsLI.innerText = "survey_name";
  var keyDetailsUL1 = document.createElement("ul");

  for (const survey of surveys) {
    var keyDetailsLI1 = document.createElement("li");
    keyDetailsLI1.innerText = survey.id + " = " + survey.title;
    keyDetailsUL1.appendChild(keyDetailsLI1);
  }

  keyDetailsLI.appendChild(keyDetailsUL1);
  keyDetailsUL.appendChild(keyDetailsLI);
  var keyDetailsLI = document.createElement("li");
  keyDetailsLI.innerText = "question_score";
  var keyDetailsUL1 = document.createElement("ul");
  var keyDetailsLI1 = document.createElement("li");
  keyDetailsLI1.innerText = "The value the answer contributes to the total score. The value could be negative.";
  keyDetailsUL1.appendChild(keyDetailsLI1);
  keyDetailsLI.appendChild(keyDetailsUL1);
  keyDetailsUL.appendChild(keyDetailsLI);
  var keyDetailsLI = document.createElement("li");
  keyDetailsLI.innerText = "caps";
  var keyDetailsUL1 = document.createElement("ul");
  var keyDetailsLI1 = document.createElement("li");
  keyDetailsLI1.innerText = "The ID of any caps on the overall result that have been triggered.";
  keyDetailsUL1.appendChild(keyDetailsLI1);
  keyDetailsLI.appendChild(keyDetailsUL1);
  keyDetailsUL.appendChild(keyDetailsLI);
  keyDetailsDiv1.appendChild(keyDetailsUL);
  document.getElementById("surveyKey").appendChild(keyBar);
  document.getElementById("surveyKey").appendChild(keyDetailsDiv);
  keyDetailsDiv.appendChild(keyDetailsDiv1);
  document.getElementById("surveyKey").classList.remove("hidden");
  document.getElementById("surveyKeyContainer").classList.remove("hidden");
  document.getElementById("surveyResults").classList.remove("hidden");
  document.getElementById("finishDiv").classList.add("hidden");
  hideAll(document.querySelectorAll(".sectionTitle"));
  hideAll(document.querySelectorAll(".questionBar"));
  hideAll(document.querySelectorAll(".nextDiv"));
  disableAll(document.querySelectorAll("input[type='checkbox']"));
  disableAll(document.querySelectorAll("input[type='radio']"));
  hideAll(document.querySelectorAll(".nextDiv"));
  showAll(document.querySelectorAll(".questionDiv"));
  showAll(document.querySelectorAll(".sectionDiv"));
  showAll(document.querySelectorAll(".answerdetails"));
  showAll(document.querySelectorAll(".feedbackSection"));
  breakAfterAll(document.querySelectorAll(".questionDiv"));
  showAll(document.querySelectorAll(".feedbackDiv"));
  document.getElementById("welcomeDiv").classList.add("hidden");
  document.getElementById("finishDiv").classList.add("hidden");
  var scrollNode = document.scrollingElement ? document.scrollingElement : document.body;
  scrollNode.scrollTo(0, 0);
}

function hideAll(elems) {
  for (var i = 0; i < elems.length; i++) {
    elems[i].classList.add("hidden");
  }
}

function showAll(elems) {
  for (var i = 0; i < elems.length; i++) {
    elems[i].classList.remove("hidden");
  }
}

function breakAfterAll(elems) {
  for (var i = 0; i < elems.length; i++) {
    elems[i].style.breakAfter = "page";
  }
}

function disableAll(elems) {
  for (var i = 0; i < elems.length; i++) {
    elems[i].disabled = true;
  }
}

function createNextButton(currentId, nextId, text) {
  const nextButton = document.createElement("button");
  nextButton.className = "nextButton";
  nextButton.innerText = text;
  nextButton.addEventListener('click', event => {
    nextSection(currentId, nextId);
  });
  return nextButton;
}

function nextSection(currentId, nextId) {
  updateCurrentSection(nextId);
  document.getElementById(currentId).classList.add("hidden");
  document.getElementById(nextId).classList.remove("hidden");
  document.getElementById(nextId).classList.add("fade-in");
}

function createNextDiv(currentId, nextId, text, prevId, prevtext) {
  const nextDiv = document.createElement("div");
  nextDiv.className = "nextDiv";

  if (prevId != null) {
    nextDiv.appendChild(createNextButton(currentId, prevId, prevtext));
  }

  nextDiv.appendChild(createNextButton(currentId, nextId, text));
  return nextDiv;
}

function moveToSection(target, source) {
  updateCurrentSection(target);
  document.getElementById(source).classList.add("hidden");
  document.getElementById(target).classList.remove("hidden");
  document.getElementById(target).classList.add("fade-in");
}

function moveToQuestion(target, source) {
  updateCurrentSection(target);
  document.getElementById(source).classList.add("hidden");
  document.getElementById(target).classList.remove("hidden");
  document.getElementById(target).classList.add("fade-in");
}

var questionIdx = 0;

function renderQuestionBar(currentId, questions) {
  const questionBar = document.createElement("div");
  questionBar.className = "questionBar"; //const questionBarSpan = document.createElement("span");
  //questionBarSpan.className = "questionBarTitle";
  //questionBarSpan.innerText="Questions in Section:"
  //questionBar.appendChild(questionBarSpan);

  for (var i = 0; i < questions.length; i++) {
    const question = questions[i];

    if (question.id == currentId) {
      const questionLink = document.createElement("div");
      questionLink.className = "questionLinkSelected";
      questionLink.innerText = "Q" + (questionIdx + i + 1) + "";
      questionBar.appendChild(questionLink);
    } else {
      const questionLink = document.createElement("div");
      questionLink.className = "questionLink";
      const questionLinkA = document.createElement("a");
      questionLinkA.className = "questionLinkA";
      questionLinkA.href = "#";
      questionLinkA.innerText = "Q" + (questionIdx + i + 1) + "";
      questionLink.addEventListener('click', event => {
        moveToQuestion(question.id, currentId);
      });
      questionLink.appendChild(questionLinkA);
      questionBar.appendChild(questionLink);
    }
  }

  return questionBar;
}

function renderSectionHeader(currentId, sections) {
  const sectionBar = document.createElement("div");
  sectionBar.className = "sectionBar";

  for (var i = 0; i < sections.length; i++) {
    const section = sections[i];

    if (section.id == currentId) {
      const sectionTitle = document.createElement("div");
      sectionTitle.className = "sectionTitleSelected";
      sectionTitle.innerText = section.title;
      sectionBar.appendChild(sectionTitle);
    } else {
      const sectionTitle = document.createElement("div");
      sectionTitle.className = "sectionTitle";
      const sectionLink = document.createElement("a");
      sectionLink.className = "sectionLink";
      sectionLink.href = "#";
      sectionLink.innerText = section.shorttitle;
      sectionTitle.addEventListener('click', event => {
        moveToSection(section.id, currentId);
      });
      sectionTitle.appendChild(sectionLink);
      sectionBar.appendChild(sectionTitle);
    }
  }

  return sectionBar;
}

function renderSections(parent) {
  const sectionsDiv = document.createElement("div");
  sectionsDiv.className = "sectionsDiv";
  sectionsDiv.id = "sectionsDiv";
  const welcomeDiv = document.createElement("div");
  welcomeDiv.className = "sectionDiv welcomeDiv";
  welcomeDiv.id = "welcomeDiv";
  const welcomeText = document.createElement("div");
  welcomeText.className = "welcomeText";
  welcomeText.innerHTML = "<p>Our compliance tool is designed to evaluate national laws or legislative proposals in three ways:  <ol><li>Their compliance with Directive (EU) 2019/1937 on the protection of persons who report breaches of Union law (the EU Whistleblowing Directive) </li><li>Their conformity with international standards and recommendations that go above and beyond what is required by the Directive</li><li>Whether they constitute an adequate response to issues raised by the COVID-19 pandemic</li></ol></p>";
  welcomeText.innerHTML += "<p>We have published a report to accompany this tool, Getting Whistleblower Protection Right: A Practical Guide to Transposing the EU Directive, which you can download from the menu.</p>";
  welcomeText.innerHTML += "<p>The tool is split into six groups of questions. Once complete, results will be given for each of the three different criteria listed above. You have the option of sharing these results with us at Blueprint for Free Speech.</p>";
  welcomeText.innerHTML += "<p>For a detailed explanation of how our scoring works, you can look at our <a href='https://www.blueprintforfreespeech.net/en/compliance-checker-example' target='_blank'>worked example.</a></p>";
  welcomeText.innerHTML += "<p>Some of the questions are detailed and you do not have to complete the whole survey at one sitting. There is a Save to File option in the menu that will allow you to save your progress. </p>";
  welcomeText.innerHTML += "<p>Even if you leave the survey without saving and come back to it later, you should be able to continue from where you left off. This will not work if you are viewing the survey in Private Browsing or Incognito mode, or if you clear your browser cache. For more information about how this works, select About in the menu. You can also complete this survey offline by downloading the Offline Tool, which works in exactly the same way. </p><br>";
  welcomeDiv.appendChild(welcomeText);
  welcomeDiv.appendChild(document.createElement("br"));
  welcomeDiv.appendChild(createNextButton("welcomeDiv", sections[0].id, "Start"));
  const resumeButton = document.createElement("button");
  resumeButton.innerText = "Resume";
  resumeButton.className = "resumeButton";
  resumeButton.id = "resumeButton";
  resumeButton.addEventListener("click", event => {
    resumeSurvey();
  });
  welcomeDiv.appendChild(resumeButton);
  sectionsDiv.appendChild(welcomeDiv);
  const finishDiv = document.createElement("div");
  finishDiv.className = "sectionDiv finishDiv hidden";
  finishDiv.id = "finishDiv";
  finishDiv.appendChild(createNextButton("finishDiv", sections[sections.length - 1].id, "Back"));
  const finishButton = document.createElement("button");
  finishButton.className = "finishButton";
  finishButton.innerText = "Finish & Calculate";
  finishButton.addEventListener('click', event => {
    finishAndCalculate();
  });
  finishDiv.appendChild(finishButton);
  sectionsDiv.appendChild(welcomeDiv);
  sectionsDiv.appendChild(finishDiv);

  for (var i = 0; i < sections.length; i++) {
    const section = sections[i];
    const sectionDiv = document.createElement("div");
    sectionDiv.className = "sectionDiv hidden";
    sectionDiv.id = section.id; //sectionDiv.style.breakAfter = "page";

    sectionDiv.appendChild(renderSectionHeader(section.id, sections));
    const questionsDiv = document.createElement("div");
    questionsDiv.className = "questionsDiv";
    var nextButton;
    var previousButton;

    if (i < sections.length - 1) {
      var prev = null;
      var prevtext = null;

      if (i > 0) {
        prev = sections[i - 1].id;
        prevtext = "Back";
      }

      if (i > 0) {
        previousButton = createNextButton(section.id, sections[i - 1].id, "Back");
      }

      nextButton = createNextDiv(section.id, sections[i + 1].id, "Next");
    } else {
      nextButton = createNextDiv(section.id, "finishDiv", "Next");

      if (i > 0) {
        previousButton = createNextButton(section.id, sections[i - 1].id, "Back");
      }
    }

    renderQuestions(questionsDiv, section.questions, nextButton, previousButton);
    renderConditionalQuestions(section.conditionalQs);
    sectionDiv.appendChild(questionsDiv);
    sectionsDiv.appendChild(sectionDiv);
  }

  document.getElementById(parent).innerHTML = "";
  document.getElementById(parent).appendChild(sectionsDiv);
}

var delayedParents = {};
var globalTabIndex = 1;

function renderQuestions(questionsDiv, questions, nextButton, previousButton) {
  for (var i = 0; i < questions.length; i++) {
    const question = questions[i];
    const questionDiv = document.createElement("div");
    questionDiv.className = "questionDiv";

    if (i > 0) {
      questionDiv.classList.add("hidden");
    }

    questionDiv.id = question.id;
    const questionText = document.createElement("div");
    questionText.className = "questionText";
    questionText.innerText = question.text;
    questionDiv.appendChild(questionText);

    if (delayedParents.hasOwnProperty(question.id)) {
      delayedParents[question.id].insertBefore(questionDiv, delayedParents[question.id].querySelector('.nextDiv'));
    } else {
      questionsDiv.appendChild(questionDiv);
    }

    renderAnswers(questionDiv, question.id, question.answers, question.type);

    if (i < questions.length - 1) {
      var prev = null;
      var prevtext = null;

      if (i > 0) {
        prev = questions[i - 1].id;
        prevtext = "Back";
      }

      if (i == 0 && previousButton != null) {
        //TODO this currently steps back a section in whatever state is was, it doesn't move to the last question in the previous section
        const tempnextDiv = createNextDiv(question.id, questions[i + 1].id, "Next", prev, prevtext);
        tempnextDiv.insertBefore(previousButton, tempnextDiv.childNodes[0]);
        questionDiv.appendChild(tempnextDiv);
      } else {
        questionDiv.appendChild(createNextDiv(question.id, questions[i + 1].id, "Next", prev, prevtext));
      }
    } else {
      nextButton.insertBefore(createNextButton(question.id, questions[i - 1].id, "Back"), nextButton.childNodes[0]);
      questionDiv.appendChild(nextButton);
    }

    questionDiv.appendChild(renderQuestionBar(question.id, questions));

    if (question.feedback !== undefined) {
      const feedbackDiv = document.createElement("div");
      feedbackDiv.className = "feedbackDiv hidden";

      for (const feedbackId of Object.keys(question.feedback)) {
        const elem = document.getElementById(question.feedback[feedbackId]);

        if (elem !== undefined) {
          feedbackDiv.appendChild(elem);
        }
      }

      questionDiv.appendChild(feedbackDiv);
    } else {
      const feedbackDiv = document.createElement("div");
      feedbackDiv.className = "feedbackDiv hidden";
      var foundFb = false;

      for (const key of surveyIds) {
        const fbElem = document.getElementById(key + "_fb_" + question.getId());

        if (fbElem !== null) {
          feedbackDiv.appendChild(fbElem);
          foundFb = true;
        }
      }

      if (foundFb) {
        questionDiv.appendChild(feedbackDiv);
      }
    }
  }

  questionIdx = questionIdx + questions.length;
}

function renderConditionalQuestions(questions) {
  for (var i = 0; i < questions.length; i++) {
    const question = questions[i];
    const questionDiv = document.createElement("div");
    questionDiv.className = "questionDiv";
    questionDiv.classList.add("conditionalhidden");
    questionDiv.id = question.id;
    const questionText = document.createElement("div");
    questionText.className = "questionText";
    questionText.innerText = question.text;
    questionDiv.appendChild(questionText);
    delayedParents[question.id].insertBefore(questionDiv, delayedParents[question.id].querySelector('.nextDiv'));
    renderAnswers(questionDiv, question.id, question.answers, question.type);
  }
}

function updateSurvey(surveyId, value, id) {
  if (Array.isArray(surveyId)) {
    for (const sid of surveyId) {
      surveyIdx[sid].update(id, value);
    }
  } else {
    surveyIdx[surveyId].update(id, value);
  }

  if (setViaSuperSelect.includes(id)) {
    setViaSuperSelect = setViaSuperSelect.filter(e => e !== id);
  }

  saveProgress();
}

function showHideConditionalQuestions(questionId, show) {
  var condQs = conditionalQs[questionId];

  for (var i = 0; i < condQs.length; i++) {
    if (show) {
      document.getElementById(condQs[i]).classList.remove("conditionalhidden");
    } else {
      const elems = document.getElementById(condQs[i]).querySelectorAll('input');

      for (const elem of elems) {
        elem.checked = false;

        if (elem.type.toLowerCase() == "checkbox") {
          updateSurvey(elem.appliesTo, 0, elem.id);
        } else if (elem.type.toLowerCase() == "radio") {
          updateSurvey(elem.appliesTo, 0, condQs[i]);
        }
      }

      document.getElementById(condQs[i]).classList.add("conditionalhidden");
    }
  }
}

var setViaSuperSelect = [];

function updateSuperSelect(superSelect, checked) {
  if (superSelect !== undefined) {
    const e = new Event("change");

    if (checked) {
      for (const item of superSelect) {
        if (!document.getElementById(item).checked) {
          document.getElementById(item).checked = true;
          document.getElementById(item).dispatchEvent(e);
          setViaSuperSelect.push(item);
        }
      }
    } else {
      for (const item of superSelect) {
        if (setViaSuperSelect.includes(item)) {
          document.getElementById(item).checked = false;
          document.getElementById(item).dispatchEvent(e);
        }
      }
    }
  }
}

function setTabIndex(elem) {
  elem.tabIndex = globalTabIndex;
  globalTabIndex++;
}

var conditionalQs = {};

function renderAnswers(questionDiv, questionId, answers, type) {
  const answersDiv = document.createElement("div");
  answersDiv.className = "answersDiv";
  answersDiv.id = "ans-" + questionId;

  for (const answer of answers) {
    const answerDiv = document.createElement("div");
    answerDiv.className = "answerDiv";
    answerDiv.id = "div" + answer.id;

    if (type == "select") {
      const label = document.createElement("label");
      label.className = "answerlabel";
      label.htmlFor = answer.id;
      label.innerText = answer.title;
      const option = document.createElement("input");
      setTabIndex(option);
      option.className = "answer";
      option.type = "radio";
      option.value = answer.value;
      option.name = "opt-" + questionId;
      option.id = answer.id;
      option.appliesTo = answer.appliesTo;
      option.surveyVal = answer.value;
      option.addEventListener('change', event => {
        radioChecked[questionId] = answer.id;
        updateSurvey(answer.appliesTo, answer.value, questionId);
      });
      label.appendChild(option);
      const checkspan = document.createElement("span");
      checkspan.className = "radiocheck";
      label.appendChild(checkspan);
      answerDiv.appendChild(label);
      addAnswerDetails(label, answer); //answerDiv.appendChild(label);
    } else if (type == "multiselect") {
      const label = document.createElement("label");
      label.className = "answerlabel";
      label.htmlFor = answer.id;
      label.innerText = answer.title;
      const option = document.createElement("input");
      setTabIndex(option);
      option.className = "answer";
      option.type = "checkbox";
      option.value = answer.id;
      option.name = "opt-" + questionId;
      option.id = answer.id;
      option.appliesTo = answer.appliesTo;
      option.surveyVal = answer.value;
      option.addEventListener('change', event => {
        if (!event.target.checked) {
          updateSurvey(answer.appliesTo, 0, answer.id);
        } else {
          updateSurvey(answer.appliesTo, answer.value, answer.id);
        }

        updateSuperSelect(answer.superSelect, event.target.checked);
      });
      label.appendChild(option);
      const checkspan = document.createElement("span");
      checkspan.className = "checkmark";
      label.appendChild(checkspan);
      answerDiv.appendChild(label);
      addAnswerDetails(label, answer); //answerDiv.appendChild(label);
    } else if (type == "conditionalselect") {
      const label = document.createElement("label");
      label.className = "answerlabel";
      label.htmlFor = answer.id;
      label.innerText = answer.title;
      const option = document.createElement("input");
      setTabIndex(option);
      option.className = "answer";
      option.type = "radio";
      option.value = answer.value;
      option.name = "opt-" + questionId;
      option.id = answer.id;
      option.appliesTo = answer.appliesTo;
      option.surveyVal = answer.value;
      var cond = false;

      if (answer.condQs) {
        conditionalQs[questionId] = answer.condQs;

        for (var i = 0; i < answer.condQs.length; i++) {
          delayedParents[answer.condQs[i]] = questionDiv;
        }

        option.addEventListener('change', event => {
          radioChecked[questionId] = answer.id;
          updateSurvey(answer.appliesTo, answer.value, questionId);
          showHideConditionalQuestions(questionId, true);
        });
      } else {
        option.addEventListener('change', event => {
          radioChecked[questionId] = answer.id;
          updateSurvey(answer.appliesTo, answer.value, questionId);
          showHideConditionalQuestions(questionId, false);
        });
      }

      label.appendChild(option);
      const checkspan = document.createElement("span");
      checkspan.className = "radiocheck";
      label.appendChild(checkspan);
      answerDiv.appendChild(label);
      addAnswerDetails(label, answer); //answerDiv.appendChild(label);
    } else if (type == "conditionalmultiselect") {
      const label = document.createElement("label");
      label.className = "answerlabel";
      label.for = answer.id;
      label.innerText = answer.title;
      const option = document.createElement("input");
      setTabIndex(option);
      option.className = "answer";
      option.type = "checkbox";
      option.value = answer.value;
      option.name = "opt-" + questionId;
      option.id = answer.id;
      option.appliesTo = answer.appliesTo;
      option.surveyVal = answer.value;
      var cond = false;

      if (answer.condQs) {
        conditionalQs[answer.id] = answer.condQs;

        for (var i = 0; i < answer.condQs.length; i++) {
          delayedParents[answer.condQs[i]] = questionDiv;
        }

        option.addEventListener('change', event => {
          if (!event.target.checked) {
            updateSurvey(answer.appliesTo, 0, answer.id);
            showHideConditionalQuestions(answer.id, false);
          } else {
            updateSurvey(answer.appliesTo, answer.value, answer.id);
            showHideConditionalQuestions(answer.id, true);
          }

          updateSuperSelect(answer.superSelect, event.target.checked);
        });
      } else {
        option.addEventListener('change', event => {
          if (!event.target.checked) {
            updateSurvey(answer.appliesTo, 0, answer.id);
          } else {
            updateSurvey(answer.appliesTo, answer.value, answer.id);
          }
        });
      }

      label.appendChild(option);
      const checkspan = document.createElement("span");
      checkspan.className = "checkmark";
      label.appendChild(checkspan);
      addAnswerDetails(label, answer);
      answerDiv.appendChild(label);
    }

    answersDiv.appendChild(answerDiv);
  }

  questionDiv.appendChild(answersDiv);
}

function addAnswerDetails(label, answer) {
  const detailsspan = document.createElement("span");
  detailsspan.className = "answerdetails";
  detailsspan.classList.add("hidden");
  var detailString = "";

  if (Array.isArray(answer.appliesTo)) {
    detailString += JSON.stringify(answer.appliesTo);
  } else {
    detailString += "[" + answer.appliesTo + "]";
  }

  detailString += " (" + answer.value + ")";
  detailsspan.innerText = detailString;
  label.appendChild(detailsspan);
}
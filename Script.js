let classSubList = {};
let pendingExamList = {};
let japaClassList = {};
let japaStudentArr = [];
let chapterListArr = [];
let chapterData = {};
let selectedUser = "";
let selectedClass = "";
let selectedExamClass = "";
let selectedSubject = "";
let selectedExamSubject = "";
let selectedExamDetails = {};
let totalSum = 0;
let maxMarksVal = 0;
let examDateVal = "";
let studentData = [];
let studentListArr = [];
let selectedStudentsArr = [];
let studentTimers = [];
let timerIntervalGGs = [];
let lstResponseData = [];
let studentIntervals = {};
let ctResponse = {};
let dataByClassResponse = "";
let japaData = "";
let commentThresholdMarks = 0.5;
let inputPassword = "";
let inputMarksDetails = {};

document.addEventListener("DOMContentLoaded", async function () {
  const loginData = await DB_GET(
    INDEX_DB.storeKey,
    INDEX_DB.dbName,
    INDEX_DB.storeName,
  );

  if (loginData) {
    // Auto login
    selectedUser = loginData;
    renderMenus(loginData.role);
  } else {
    SHOW_SPECIFIC_DIV("passwordPopup");
  }
});

async function submitPass() {
  const errorDiv = document.getElementById("inputPasswordError");
  errorDiv.innerHTML = "";
  let password = GetControlValue("passworTxtBox");

  if (password) {
    password = password.trim();
    inputPassword = password;
    const inputData = {
      password: password,
      roleName: "all",
    };
    const outputData = await CALL_API(
      API_TYPE_CONSTANT.GET_TEACHER_ACCESS_BY_PASSWORD,
      inputData,
    );
    if (outputData?.status && outputData.data) {
      // Save login data in IndexedDB
      await DB_SET(
        INDEX_DB.storeKey,
        outputData.data,
        INDEX_DB.dbName,
        INDEX_DB.storeName,
      );
      selectedUser = outputData.data;
      renderMenus(outputData?.data?.role);
    } else {
      errorDiv.innerHTML = "Please enter correct password !!";
      return;
    }
  } else {
    errorDiv.innerHTML = "Password Required!";
    return;
  }
}

function resetFormFields() {
  studentTimers = [];
  timerIntervalGGs = [];
  selectedClass = "";
  selectedSubject = "";
  document.getElementById("studentsJapaWindow").innerHTML = "";
  document.getElementById("studentsJapaContainer").style.display = "none";

  document.getElementById("class").value = "";
  document.getElementById("subject").value = "";

  document.querySelectorAll(".gg-timer").forEach((timer) => {
    timer.textContent = "00:00:000";
  });

  // Reset dropdown button text
  const dropdownBtn = document.querySelector(".dynamic-dropdown-btn");
  if (dropdownBtn) {
    dropdownBtn.innerText = "Select Student";
  }

  const mainBtn = document.getElementById("toggleAllBtn");
  mainBtn.textContent = "Start All";
  updateTimerColor("greenDisabled", mainBtn);

  document.getElementById("chapterRadioContainer").innerHTML = "";
}

function homePageClick() {
  SHOW_SPECIFIC_DIV("menuPopup");
}

function setUserNameOnFrontScreen(devName) {
  const loginUserDiv = document.getElementById("login-user-name-div_fp");
  const loginUserLabel = document.getElementById("login-user-name-lbl_fp");

  if (devName) {
    loginUserDiv.style.display = "block";
    loginUserLabel.innerHTML = `<strong>${devName}</strong>`;
  } else {
    loginUserDiv.style.display = "none";
    loginUserLabel.innerHTML = `<strong>${devName}</strong>`;
  }
}

async function onLogoutClick() {
  await DB_DELETE(INDEX_DB.storeKey, INDEX_DB.dbName, INDEX_DB.storeName);
  document.getElementById("passworTxtBox").value = "";
  SHOW_SPECIFIC_DIV("passwordPopup");
}

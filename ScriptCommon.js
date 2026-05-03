function renderMenus(roleData) {
  SHOW_BUTTON_BY_ADMIN_ROLE(
    "ggStudentDailyExitTrackerBtn",
    "Student Daily Exit Tracker Role",
    roleData,
  );
  SHOW_BUTTON_BY_ADMIN_ROLE(
    "ggStdEntryBtn",
    "Tution Student Entry Tracker Role",
    roleData,
  );
  SHOW_BUTTON_BY_ADMIN_ROLE(
    "ggSplStdEntryBtn",
    "Tution Student Entry Tracker Role",
    roleData,
  );

  SHOW_BUTTON_BY_ADMIN_ROLE(
    "ggHostelCheckoutBtn",
    "Hostel CheckoutCheckIn Role",
    roleData,
  );

  SHOW_BUTTON_BY_ADMIN_ROLE(
    "ggHostelCheckinBtn",
    "Hostel CheckoutCheckIn Role",
    roleData,
  );

  homePageClick();
  setUserNameOnFrontScreen(selectedUser?.name);
}

async function LOAD_HTML_FILE(fileName, containerId = "popupContainer") {
  try {
    const container = document.getElementById(containerId);

    const res = await fetch(fileName);

    if (!res.ok) {
      throw new Error("File not found: " + fileName);
    }

    const html = await res.text();

    container.innerHTML += html;
  } catch (error) {
    console.error(error);
  }
}

async function INIT_POPUPS() {
  const files = [
    "dailyExitPopup.html",
    "hostelCheckoutPopup.html",
    "hostelCheckinPopup.html",
    "splStdEntryPopup.html",
    "stdEntryPopup.html",
  ];

  for (const file of files) {
    await LOAD_HTML_FILE("Pages/" + file);
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  await INIT_POPUPS();
});

function formatDuration(startTimestamp, endTimestamp) {
  // Calculate the difference in milliseconds
  const durationMs = endTimestamp - startTimestamp;

  // Convert milliseconds to hours and minutes
  const totalMinutes = Math.floor(durationMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  // Format the duration
  return `${hours} Hr ${minutes} Min`;
}

async function checkPassword(password) {
  const pass = password.toString().toLowerCase().trim();
  return new Promise((resolve, reject) => {
    fetch(CHECK_PASSWORD_API + pass)
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Network response was not ok. Status: ${response.status} - ${response.statusText}`,
          );
        }
        return response.json();
      })
      .then((data) => {
        resolve(data); // Resolve the promise with the data
      })
      .catch((error) => {
        reject(error); // Reject the promise with the error
      });
  });
}

function convertDateToFormat(inputDate) {
  const date = new Date(inputDate);

  const options = {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "short", // Short month name (e.g., Jan, Feb)
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true, // 12-hour format with AM/PM
  };

  return new Intl.DateTimeFormat("en-IN", options).format(date);
}

function convertDate(dateString) {
  // Parse the input date string using moment.js
  const date = moment(dateString, "DD-MM-YYYY HH:mm:ss");

  // Get the formatted date and time
  const formattedDate = date.format("DD MMM YYYY HH:mm A");

  return formattedDate;
}

function ShowPopup(id) {
  document.getElementById(id).style.display = "flex";
}

function HidePopup(id) {
  document.getElementById(id).style.display = "none";
}

function ClearTextBoxValue(id) {
  document.getElementById(id).value = "";
}

function ClearDropdownValue(id) {
  document.getElementById(id).selectedIndex = 0;
}

function ClearDivValue(id) {
  document.getElementById(id).innerText = "";
}

function IsLoading(status) {
  if (status) {
    document.getElementById("loadingSpinner").style.display = "flex";
  } else {
    document.getElementById("loadingSpinner").style.display = "none";
  }
}

function adjustTextAreaRows(textarea) {
  // Set the number of rows based on the scroll height to accommodate the text
  textarea.rows = 1; // Reset to 1 row to shrink when necessary
  const lineBreaks = (textarea.value.match(/\n/g) || []).length;
  const minRows = 1;
  textarea.rows = Math.max(minRows, lineBreaks + 1);
}

function disabledButtonState(containerId, buttonId) {
  const container = document.getElementById(containerId);
  const btnControl = container ? container.querySelector(`#${buttonId}`) : null;

  if (container && btnControl) {
    const contentEditableDiv = container.querySelector(
      '[contenteditable="true"]',
    );

    const requiredFields = container.querySelectorAll(
      "input[required], textarea[required], select[required]",
    );
    let allFilled = true;
    requiredFields.forEach((field) => {
      if (!field.value.trim()) {
        allFilled = false;
      }
      // Special validation for the mobile number field
      if (field.id === "mobileTxtBox") {
        const mobileRegex = /^\d{10}$/; // Using \d for digits
        const mobileIsValid = mobileRegex.test(field.value);
        if (!mobileIsValid) {
          allFilled = false; // Invalid mobile number
        }
      }
    });

    // Check contenteditable div
    if (contentEditableDiv && !contentEditableDiv.textContent.trim()) {
      allFilled = false;
    }
    btnControl.disabled = !allFilled;
  }
}

function resetFormByFormId(formId) {
  // Select the form element by its ID
  const form = document.getElementById(formId);

  // If the form exists, proceed to clear its elements
  if (form) {
    // Select all input, textarea, and select elements within the form
    const elements = form.querySelectorAll(
      "input, textarea, select, [contenteditable='true']",
    );

    // Loop through each element and clear its value
    elements.forEach((element) => {
      if (element.type === "checkbox" || element.type === "radio") {
        // For checkboxes and radio buttons, uncheck them
        element.checked = false;
      } else if (element.hasAttribute("contenteditable")) {
        // Clear the content of contenteditable div
        element.innerHTML = "";
      } else {
        // For other inputs and textareas, clear their values
        element.value = "";
      }
    });

    // Find the submit button within the specific form container
    const submitBtn = form.querySelector("#submitBtn");

    if (submitBtn) {
      // Update the disabled state of the submit button
      disabledButtonState(formId, submitBtn.id);
    }
  }
}

function generatePassword(name) {
  const specialChars = "@#$%";

  const firstTwoLetters = name.substring(0, 2).toLowerCase(); // 2 letters
  const special = specialChars.charAt(
    Math.floor(Math.random() * specialChars.length),
  ); // 1 special char
  const timePart = Date.now().toString().slice(-4); // Last 4 digits for high uniqueness

  // Total: 2 (letters) + 1 (symbol) + 4 (timestamp) = 7 characters
  const password = `${firstTwoLetters}${special}${timePart}`;

  return password;
}

function UpdateButtonLabel(id, label) {
  document.getElementById(id).textContent = label;
}

function formatDurationByDurationTime(durationMs) {
  try {
    const totalMinutes = Math.floor(durationMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours} hr ${minutes} min`;
  } catch (ex) {
    return "0 min";
  }
}

function convertTimeStampToDate(timestamp) {
  let savedDate = null;
  try {
    savedDate = new Date(Number(timestamp));
  } catch (ex) {
    console.log("Error - convertTimeStampToDate - ", ex);
  }

  return savedDate;
}

function GetControlValue(id, type = "input") {
  if (type.toString().toLowerCase() == "checkbox") {
    return document.getElementById(id)?.checked ?? "false";
  }
  return document.getElementById(id)?.value ?? "";
}

//#region Common Method
function timeToString(time) {
  let diffInHrs = time / 3600000;
  let hh = Math.floor(diffInHrs);

  let diffInMin = (diffInHrs - hh) * 60;
  let mm = Math.floor(diffInMin);

  let diffInSec = (diffInMin - mm) * 60;
  let ss = Math.floor(diffInSec);

  let diffInMs = (diffInSec - ss) * 1000;
  let ms = Math.floor(diffInMs);

  let formattedHH = hh.toString().padStart(2, "0");
  let formattedMM = mm.toString().padStart(2, "0");
  let formattedSS = ss.toString().padStart(2, "0");
  let formattedMS = ms.toString().padStart(3, "0").substring(0, 2); // Showing only 2 digits for milliseconds

  return `${formattedHH}:${formattedMM}:${formattedSS}.${formattedMS}`;
}

function timeToStringWithouMilliSecond(time) {
  let diffInHrs = time / 3600000;
  let hh = Math.floor(diffInHrs);

  let diffInMin = (diffInHrs - hh) * 60;
  let mm = Math.floor(diffInMin);

  let diffInSec = (diffInMin - mm) * 60;
  let ss = Math.floor(diffInSec);

  let formattedHH = hh.toString().padStart(2, "0");
  let formattedMM = mm.toString().padStart(2, "0");
  let formattedSS = ss.toString().padStart(2, "0");

  return `${formattedHH}:${formattedMM}:${formattedSS}`;
}

function formatTimeToDate(timestamp) {
  if (!timestamp) return "";

  const date = new Date(Number(timestamp)); // Convert timestamp to Date object

  // Extract date components
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // Months are 0-based, so add 1
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  // Convert each component to a string
  const dayStr = day < 10 ? "0" + day : day;
  const monthStr = month < 10 ? "0" + month : month;
  const yearStr = year; // No change needed for year
  const hoursStr = hours < 10 ? "0" + hours : hours;
  const minutesStr = minutes < 10 ? "0" + minutes : minutes;
  const secondsStr = seconds < 10 ? "0" + seconds : seconds;

  // Format the date and time in "dd-mm-yyyy hh:mm:ss"
  return `${dayStr}-${monthStr}-${yearStr} ${hoursStr}:${minutesStr}:${secondsStr}`;
}

function formatTimeToAMPM(timestamp) {
  if (!timestamp) return "";

  const date = new Date(Number(timestamp)); // Convert timestamp to Date object

  // Formatting options for 12-hour clock with AM/PM in IST
  const options = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true, // Use 12-hour clock format
    timeZone: "Asia/Kolkata", // Set the time zone to IST
  };

  return new Intl.DateTimeFormat("en-IN", options).format(date);
}
//#endregion common method

// Function to generate table rows based on server data
function fillDynamicTableRows(data, headerId, bodyId) {
  const tableHead = document.getElementById(headerId);
  const tableBody = document.getElementById(bodyId);

  // Clear any existing content
  tableHead.innerHTML = "";
  tableBody.innerHTML = "";

  // Check if data is not empty
  if (data.length === 0) return;

  // Generate the table header
  const headerRow = document.createElement("tr");
  // Use the keys from the first object as headers
  const headers = Object.keys(data[0]);
  headers.forEach((headerCell) => {
    const th = document.createElement("th");
    th.textContent = headerCell;
    headerRow.appendChild(th);
  });
  tableHead.appendChild(headerRow);

  // Generate the table rows
  data.forEach((row) => {
    const tr = document.createElement("tr");
    headers.forEach((headerCell) => {
      const td = document.createElement("td");
      td.textContent = row[headerCell];
      tr.appendChild(td);
    });
    tableBody.appendChild(tr);
  });
}

function SHOW_SUCCESS_POPUP(message, onClose) {
  const popup = document.getElementById("successPopup");
  const msg = document.getElementById("successMessage");
  const closeBtn = document.getElementById("successOkButton");

  msg.innerHTML = message;
  popup.style.display = "flex";

  closeBtn.onclick = () => {
    popup.style.display = "none";

    // optional callback
    onClose?.();
  };
}

function SHOW_INFO_POPUP(message) {
  document.getElementById("infoMessage").innerHTML = message;
  document.getElementById("infoPopup").style.display = "flex";
}

// Function to show the error popup
function SHOW_ERROR_POPUP(message) {
  document.getElementById("errorMessage").textContent = message;
  document.getElementById("errorPopup").style.display = "flex";
}

function CLOSE_INFO_POPUP(popupId) {
  document.getElementById(popupId).style.display = "none";
}

function SHOW_CONFIRMATION_POPUP(
  message,
  yesCallback,
  noCallback = CLOSE_CONFIRMATION_POPUP,
) {
  const popup = document.getElementById("confirmationPopup");
  const popupMessage = document.getElementById("confirmationMessage");
  const yesButton = document.getElementById("confirmationYesButton");
  const noButton = document.getElementById("confirmationNoButton");

  // Set the message dynamically
  popupMessage.innerHTML = message;

  // Assign event handlers dynamically
  yesButton.onclick = async () => {
    await yesCallback();
    CLOSE_CONFIRMATION_POPUP();
  };
  noButton.onclick = () => {
    noCallback();
  };

  // Show the popup
  popup.style.display = "flex";
}

function CLOSE_CONFIRMATION_POPUP() {
  document.getElementById("confirmationPopup").style.display = "none";
}

// Example YES and NO callbacks
function handleYes() {
  alert("You clicked YES");
}

function handleNo() {
  alert("You clicked NO");
}

function sortObjectByValue(data, columnName) {
  return data.sort((a, b) => {
    return Number(b[columnName]) - Number(a[columnName]);
  });
}

function exportTableToExcel(tableId, filename = "data.xlsx") {
  // Get the table
  var table = document.getElementById(tableId);

  // Check if table exists
  if (!table) {
    console.error(`Table with ID ${tableId} not found.`);
    return;
  }

  // Extract data from the table
  var data = [];
  var rows = table.querySelectorAll("tr");

  // Loop through each row and collect the cell data
  rows.forEach(function (row) {
    var rowData = [];
    row.querySelectorAll("th, td").forEach(function (cell) {
      // Convert number-like strings to numbers
      const cellValue = cell.innerText.trim();
      if (!isNaN(cellValue) && cellValue !== "") {
        rowData.push(parseFloat(cellValue)); // Store as number
      } else {
        rowData.push(cellValue); // Store as string
      }
    });
    data.push(rowData);
  });

  // Create a worksheet and workbook
  var ws = XLSX.utils.aoa_to_sheet(data); // aoa_to_sheet converts 2D array to sheet
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");

  // Set column widths for better display
  const colWidths = [];
  for (let i = 0; i < data[0].length; i++) {
    colWidths.push({
      wch: Math.max(...data.map((row) => (row[i] || "").toString().length)) + 2, // +2 for padding
    });
  }
  ws["!cols"] = colWidths;

  // Export the file
  XLSX.writeFile(wb, filename);
}

function daySuffix(day) {
  if (day >= 11 && day <= 13) return "th"; // Special case for 11th, 12th, and 13th
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

async function API_HANDLER_AXIOS(request) {
  try {
    const url = APPLICATION_URL;
    IsLoading(true); // Start loading

    const jsonReq = JSON.stringify(request);
    const response = await axios.post(url, jsonReq);
    const data = response?.data;
    IsLoading(false); // Stop loading

    if (data?.status) {
      return data; // Resolve the data to be used by the caller
    } else {
      console.log("Error - ", data);
      SHOW_ERROR_POPUP(
        "Something went wrong, please contact any NKD Servants.",
      );
    }
  } catch (error) {
    IsLoading(false); // Stop loading on error
    console.log(error);
    SHOW_ERROR_POPUP(error.message);
  } finally {
    IsLoading(false); // Stop loading regardless of success or error
  }
}

async function API_HANDLER_WITHOUT_LOADING_AXIOS(request) {
  try {
    const url = APPLICATION_URL;

    const jsonReq = JSON.stringify(request);
    const response = await axios.post(url, jsonReq);
    const data = response?.data;

    if (data?.status) {
      return data; // Resolve the data to be used by the caller
    } else {
      console.log("Error - ", data);
      SHOW_ERROR_POPUP(
        "Something went wrong, please contact any NKD Servants.",
      );
    }
  } catch (error) {
    console.log(error);
    SHOW_ERROR_POPUP(error.message);
  }
}

async function API_HANDLER(request) {
  try {
    const url = APPLICATION_URL;
    IsLoading(true); // Start loading

    const fetchOptions = {
      method: "POST",
      //headers: { "Content-Type": "application/json" },
      headers: {
        "Content-Type": "text/plain;charset=utf-8", // Specify content type
      },
      body: JSON.stringify(request),
      redirect: "follow",
    };

    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    IsLoading(false); // Stop loading

    if (data?.status) {
      return data; // Resolve the data to be used by the caller
    } else {
      console.log("Error - ", data);
      SHOW_ERROR_POPUP(
        "Something went wrong, please contact any NKD Servants.",
      );
    }
  } catch (error) {
    IsLoading(false); // Stop loading on error
    console.log(error);
    SHOW_ERROR_POPUP(error.message);
  } finally {
    IsLoading(false); // Stop loading regardless of success or error
  }
}

async function API_HANDLER_WITH_APPLICATION_JSON_TYPE(request) {
  try {
    const url = APPLICATION_URL;
    IsLoading(true); // Start loading

    const fetchOptions = {
      redirect: "follow",
      method: "POST",
      //headers: { "Content-Type": "application/json" },
      headers: {
        "Content-Type": "text/plain;charset=utf-8", // Specify content type
      },
      body: JSON.stringify(request),
    };

    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    IsLoading(false); // Stop loading

    if (data?.status) {
      return data; // Resolve the data to be used by the caller
    } else {
      console.log("Error - ", data);
      SHOW_ERROR_POPUP(
        "Something went wrong, please contact any NKD Servants.",
      );
    }
  } catch (error) {
    IsLoading(false); // Stop loading on error
    console.log(error);
    SHOW_ERROR_POPUP(error.message);
  } finally {
    IsLoading(false); // Stop loading regardless of success or error
  }
}

async function API_HANDLER_WITHOUT_LOADING(request) {
  try {
    const url = APPLICATION_URL;

    const fetchOptions = {
      method: "POST",
      //headers: { "Content-Type": "application/json" },
      headers: {
        "Content-Type": "text/plain;charset=utf-8", // Specify content type
      },
      body: JSON.stringify(request),
      redirect: "follow",
    };

    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    if (data?.status) {
      return data; // Resolve the data to be used by the caller
    } else {
      console.log("Error - ", data);
      SHOW_ERROR_POPUP(
        "Something went wrong, please contact any NKD Servants.",
      );
    }
  } catch (error) {
    console.log(error);
    SHOW_ERROR_POPUP(error.message);
  }
}

async function API_HANDLER_GET(request) {
  try {
    const url = APPLICATION_URL;
    IsLoading(true); // Start loading

    const queryString = new URLSearchParams(request).toString();
    const fullUrl = `${url}?${queryString}`;
    const response = await fetch(fullUrl);
    const data = await response.json();
    IsLoading(false);

    if (data?.status) {
      return data; // Resolve the data to be used by the caller
    } else {
      console.log("Error - ", data);
      SHOW_ERROR_POPUP(
        "Something went wrong, please contact any NKD Servants.",
      );
    }
  } catch (error) {
    IsLoading(false); // Stop loading on error
    console.log(error);
    SHOW_ERROR_POPUP(error.message);
  } finally {
    IsLoading(false); // Stop loading regardless of success or error
  }
}

function SHOW_SPECIFIC_DIV(divId) {
  // Select all divs with class 'popup'
  const allPopups = document.querySelectorAll(".popup");

  // Hide all popups by setting display to 'none'
  allPopups.forEach((popup) => {
    popup.style.display = "none";
  });

  // Show the specific div with the provided divId
  const targetDiv = document.getElementById(divId);
  if (targetDiv) {
    targetDiv.style.display = "flex"; // Adjust display style as per need
  } else {
    console.error(`Div with id '${divId}' not found.`);
  }
}

function SHOW_SPECIFIC_DIV_WITH_BLOCK(divId) {
  // Select all divs with class 'popup'
  const allPopups = document.querySelectorAll(".popup");

  // Hide all popups by setting display to 'none'
  allPopups.forEach((popup) => {
    popup.style.display = "none";
  });

  // Show the specific div with the provided divId
  const targetDiv = document.getElementById(divId);
  if (targetDiv) {
    targetDiv.style.display = "block"; // Adjust display style as per need
  } else {
    console.error(`Div with id '${divId}' not found.`);
  }
}

function filterLiveSearchList(inputCtrlId, ulListId, callback) {
  const inputCtrl = document.getElementById(inputCtrlId);
  const ulList = document.getElementById(ulListId);
  const input = inputCtrl.value.toLowerCase();
  const items = ulList.getElementsByTagName("li");
  let hasVisibleItems = false;

  for (const item of items) {
    const liveSearchValue = item.textContent.toLowerCase();
    if (liveSearchValue.includes(input)) {
      item.style.display = ""; // Show the item
      hasVisibleItems = true;
      item.onclick = function () {
        inputCtrl.value = item.textContent; // Set input value to selected item
        ulList.style.display = "none"; // Hide list after selection
        hasVisibleItems = false;
        if (callback) callback(item.textContent); // Call the callback with the selected text
      };
    } else {
      item.style.display = "none"; // Hide the item
    }
  }

  ulList.style.display = hasVisibleItems ? "block" : "none"; // Show/hide the list based on visible items
}

function hideLiveSearchOnClick(inputCtrlId, ulListId) {
  document.addEventListener("click", function (event) {
    const ulList = document.getElementById(ulListId);
    const inputCtrl = document.getElementById(inputCtrlId);

    // Check if the click is outside the input and list
    if (event.target !== inputCtrl && !ulList.contains(event.target)) {
      ulList.style.display = "none"; // Hide the list
    }
  });
}

function setupLiveSearch(inputCtrlId, ulListId, callback) {
  const inputCtrl = document.getElementById(inputCtrlId);

  inputCtrl.addEventListener("keyup", function () {
    filterLiveSearchList(inputCtrlId, ulListId, function (selectedText) {
      // Call the callback to handle the selected text based on input type
      if (callback) callback(selectedText);
    });
  });

  // Click event to toggle the dropdown list
  inputCtrl.addEventListener("click", function () {
    filterLiveSearchList(inputCtrlId, ulListId, function (selectedText) {
      // Call the callback to handle the selected text based on input type
      if (callback) callback(selectedText);
    });
  });

  // Call the generic function to handle hiding the dropdown
  hideLiveSearchOnClick(inputCtrlId, ulListId);
}

function initializedLiveSearchControl(inputCtrlId, ulListId, responseArray) {
  const inputCtrl = document.getElementById(inputCtrlId);
  const ulList = document.getElementById(ulListId);

  ulList.innerHTML = "";
  responseArray?.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    li.onclick = () => {
      inputCtrl.value = item;
      ulList.style.display = "none";
    };
    ulList.appendChild(li);
  });
}

function showNavBarSection(event, sectionId, containerId, navbarId) {
  event.preventDefault(); // Prevent default link behavior

  // Hide all sections within the specified container
  const sections = document.querySelectorAll(`#${containerId} .section`);
  sections.forEach((section) => (section.style.display = "none"));

  // Show the selected section
  const selectedSection = document.getElementById(sectionId);
  if (selectedSection) {
    selectedSection.style.display = "block";
  }

  // Remove 'active' class from all links within the specified navbar
  const links = document.querySelectorAll(`#${navbarId} a`);
  links.forEach((link) => link.classList.remove("active"));

  // Add 'active' class to the clicked link
  event.target.classList.add("active");
}

function editTableRow(button) {
  const row = button.parentElement.parentElement;
  const cells = row.querySelectorAll("td");

  // If button text is "Edit", convert cells into input fields
  if (button.textContent === "Edit") {
    for (let i = 0; i < cells.length - 1; i++) {
      const currentValue = cells[i].textContent;
      cells[i].innerHTML = `<input type="text" value="${currentValue}" />`;
    }
    button.textContent = "Save";
  }
  // If button text is "Save", update the cells with new values
  else if (button.textContent === "Save") {
    for (let i = 0; i < cells.length - 1; i++) {
      const inputField = cells[i].querySelector("input");
      cells[i].textContent = inputField.value;
    }
    button.textContent = "Edit";
  }
}

function restrictToNumberWithDecimal(input) {
  const invalidCharacters = input.value.match(/[^0-9.]/g); // Find invalid characters

  if (invalidCharacters) {
    SHOW_ERROR_POPUP(`Invalid input: ${invalidCharacters.join("")}`); // Show alert with invalid characters
  }

  // Remove all characters that are not digits or a single decimal point
  input.value = input.value.replace(/[^0-9.]/g, "");

  // Ensure only one decimal point is allowed
  if ((input.value.match(/\./g) || []).length > 1) {
    input.value = input.value.slice(0, -1); // Remove the extra decimal point
  }
}

function restrictToNumberWithDecimalAndNegative(input) {
  const invalidCharacters = input.value.match(/[^0-9.-]/g); // Allow digits, a decimal, and a minus sign

  if (invalidCharacters) {
    SHOW_ERROR_POPUP(`Invalid input: ${invalidCharacters.join("")}`); // Show alert with invalid characters
  }

  // Remove all characters that are not digits, a single decimal point, or a leading minus sign
  input.value = input.value.replace(/[^0-9.-]/g, "");

  // Ensure only one decimal point is allowed
  let parts = input.value.split(".");
  if (parts.length > 2) {
    input.value = parts[0] + "." + parts.slice(1).join("").replace(/\./g, ""); // Keep only the first decimal point
  }

  // Ensure only one leading minus sign is allowed
  if (input.value.includes("-")) {
    input.value = "-" + input.value.replace(/-/g, ""); // Keep minus sign only at the start
  }
}

function setupKeyPressHandler(
  containerId,
  buttonId,
  validKeys,
  modifiers = {},
) {
  document.addEventListener("keydown", function (event) {
    const key = event.key === " " ? "Space" : event.key;

    // Check if the container is visible
    const container = document.getElementById(containerId);
    if (container && container.style.display !== "none") {
      // Check if the pressed key is in the list of valid keys
      if (validKeys.includes(key)) {
        // Check for modifier keys (Ctrl, Shift, Alt)
        const isCtrlPressed = event.ctrlKey;
        const isShiftPressed = event.shiftKey;
        const isAltPressed = event.altKey;

        // If modifiers are required, ensure they are pressed
        const ctrlRequired = modifiers.ctrl === true;
        const shiftRequired = modifiers.shift === true;
        const altRequired = modifiers.alt === true;

        // Check if the modifiers are correctly pressed
        const isModifierValid =
          (ctrlRequired === false || isCtrlPressed) &&
          (shiftRequired === false || isShiftPressed) &&
          (altRequired === false || isAltPressed);

        // Trigger action only if modifiers match
        if (isModifierValid) {
          event.preventDefault(); // Prevent default behavior for the key
          const button = document.getElementById(buttonId);
          if (button && button.style.display !== "none") {
            button.click(); // Trigger the button click
          }
        }
      }
    }
  });
}

function SHOW_CONFIRMATION_GRID_POPUP(
  gridData,
  columnNames, // Array of objects containing both display name and actual name [ { displayName: "Item", actualName: "Item" },]
  yesCallback,
  yesLabel = "Yes",
  noLabel = "No",
  statusText = "",
  noCallback = CLOSE_CONFIRMATION_GRID_POPUP,
) {
  const popup = document.getElementById("confirmationGridPopup");
  const gridContainer = document.getElementById("confirmationGridContainer");
  const yesButton = document.getElementById("confirmationGridYesButton");
  const noButton = document.getElementById("confirmationGridNoButton");
  const statusTextElement = document.getElementById(
    "confirmationGridStatusText",
  );

  // Set custom button labels
  yesButton.textContent = yesLabel;
  noButton.textContent = noLabel;

  // Clear any existing content in the grid container
  gridContainer.innerHTML = "";
  statusTextElement.textContent = statusText;

  // Create the table element and headers dynamically
  const table = document.createElement("table");
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";

  const thead = document.createElement("thead");
  thead.id = "confirmationGridTHead";
  const headerRow = document.createElement("tr");

  // Add table headers dynamically from columnNames array
  columnNames.forEach((column) => {
    const th = document.createElement("th");
    th.textContent = column.displayName; // Use displayName for the header
    th.style.border = "1px solid #ddd";
    th.style.padding = "8px";
    th.style.textAlign = "left";
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  tbody.id = "confirmationGridTBody";

  // Populate table rows dynamically from gridData
  gridData.forEach((item) => {
    const row = document.createElement("tr");

    // Add each data field into a new table cell (td)
    columnNames.forEach((column) => {
      const td = document.createElement("td");
      td.textContent = item[column.actualName] ? item[column.actualName] : ""; // Use actualName to access the data
      td.style.border = "1px solid #ddd";
      td.style.padding = "8px";
      row.appendChild(td);
    });

    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  // Append the table to the grid container
  gridContainer.appendChild(table);

  // Assign event handlers dynamically
  yesButton.onclick = () => {
    yesCallback();
    CLOSE_CONFIRMATION_GRID_POPUP();
  };
  noButton.onclick = () => {
    noCallback();
  };

  // Show the popup
  popup.style.display = "flex";
}

function CLOSE_CONFIRMATION_GRID_POPUP() {
  document.getElementById("confirmationGridPopup").style.display = "none";
}

function PARSE_STRING_TO_DATE_FORMAT(stringDate, desireFormat = "DD-MMM-YYYY") {
  const parsedDate = moment(
    stringDate,
    ["YYYY-MM-DD", "DD/MM/YYYY", "MM-DD-YYYY", "DD-MMM-YYYY", "D-MMM-YYYY"],
    true,
  );

  if (parsedDate.isValid()) {
    const formattedDate = parsedDate.format(desireFormat);
    return formattedDate;
  } else {
    console.error("Invalid date format:", stringDate);
    return null;
  }
}

async function IS_ONLINE() {
  try {
    IsLoading(true); // Start loading indicator

    const response = await fetch("https://www.cloudflare.com/cdn-cgi/trace", {
      cache: "no-store",
    });

    IsLoading(false); // Stop loading indicator
    return response.ok;
  } catch (error) {
    IsLoading(false);
    SHOW_ERROR_POPUP(
      "Please check your internet connection, it is not working.",
    );
    return false;
  }
}

function formatNumber(value) {
  if (!isNaN(value) && value !== null && value !== "") {
    const num = parseFloat(value);
    return Number.isInteger(num) ? num : parseFloat(num.toFixed(2));
  }

  return null;
}

function CREATE_MULTI_SELECT_DROPDOWN_WITH_CATEGORY_WITH_KEYFILTER({
  containerId,
  title,
  data,
  callback,
  controls = {},
  keyFilters = {},
}) {
  const {
    showSelectAll = false,
    showFilters = false,
    showCategoryView = true,
    selectionLimit = null,
    showDataBasedOnFilters = false,
  } = controls;

  const showCategoryToggle = true;

  const container = document.getElementById(containerId);
  if (!container) return;

  const dropdown = document.createElement("div");
  dropdown.classList.add("dynamic-dropdown");

  const dropdownBtn = document.createElement("div");
  dropdownBtn.classList.add("dynamic-dropdown-btn");
  dropdownBtn.innerText = title;

  const dropdownContent = document.createElement("div");
  dropdownContent.classList.add("dynamic-dropdown-content");

  dropdownContent.style.display = "block"; // default open

  dropdownBtn.onclick = () => {
    dropdownContent.style.display =
      dropdownContent.style.display === "block" ? "none" : "block";
  };

  // =============================
  // SEARCH
  // =============================
  const searchWrapper = document.createElement("div");
  searchWrapper.classList.add("dropdown-search-wrapper");

  const searchBox = document.createElement("input");
  searchBox.classList.add("dropdown-search-box");
  searchBox.placeholder = "Search...";

  const clearBtn = document.createElement("span");
  clearBtn.innerHTML = "✖";
  clearBtn.classList.add("dropdown-clear-search-btn");

  searchWrapper.appendChild(searchBox);
  searchWrapper.appendChild(clearBtn);
  dropdownContent.appendChild(searchWrapper);

  // =============================
  // CONTROL BAR
  // =============================
  function setActiveFilter(activeBtn) {
    [btnAll, btnSelected, btnPending].forEach((btn) => {
      if (btn) btn.classList.remove("active-filter");
    });
    if (activeBtn) activeBtn.classList.add("active-filter");
  }

  const controlBar = document.createElement("div");
  controlBar.classList.add("dropdown-controlBar");
  controlBar.style.display = !showSelectAll && !showFilters ? "none" : "flex";
  controlBar.style.gap = "8px";
  let categoryWiseCheckbox;

  let selectAllCheckbox;

  if (showSelectAll) {
    const label = document.createElement("label");
    label.htmlFor = "dynamicDropdownSelectAll_" + containerId; // unique id

    selectAllCheckbox = document.createElement("input");
    selectAllCheckbox.type = "checkbox";
    selectAllCheckbox.id = "dynamicDropdownSelectAll_" + containerId; // bind only this label

    label.appendChild(selectAllCheckbox);
    label.appendChild(document.createTextNode("Select All"));

    controlBar.appendChild(label);
  }

  if (showCategoryToggle) {
    const switchLabel = document.createElement("label");
    switchLabel.classList.add("dynamic-dropdown-switch-label-inline");
    switchLabel.htmlFor = "dynamicDropdownCategory_" + containerId; // unique id

    categoryWiseCheckbox = document.createElement("input");
    categoryWiseCheckbox.type = "checkbox";
    categoryWiseCheckbox.checked = showCategoryView;
    categoryWiseCheckbox.id = "dynamicDropdownCategory_" + containerId; // bind only this
    categoryWiseCheckbox.classList.add("dynamic-dropdown-switch-input");

    const slider = document.createElement("span");
    slider.classList.add("dynamic-dropdown-switch-slider");

    const text = document.createElement("span");
    text.classList.add("dynamic-dropdown-switch-text");
    text.innerText = "Category Wise";

    switchLabel.appendChild(categoryWiseCheckbox);
    switchLabel.appendChild(slider);
    switchLabel.appendChild(text);

    controlBar.appendChild(switchLabel);
  }

  let btnAll, btnSelected, btnPending;

  if (showFilters) {
    btnAll = document.createElement("button");
    btnAll.innerText = "All";

    btnSelected = document.createElement("button");
    btnSelected.innerText = "Selected";

    btnPending = document.createElement("button");
    btnPending.innerText = "Pending";

    controlBar.appendChild(btnAll);
    controlBar.appendChild(btnSelected);
    controlBar.appendChild(btnPending);
  }

  // =============================
  // EXPAND / COLLAPSE ALL BUTTON
  // =============================
  let expandCollapseBtn = document.createElement("button");
  expandCollapseBtn.innerHTML = "Collapse All ⯈";
  expandCollapseBtn.classList.add("expand-collapse-btn");

  let isAllExpanded = true;

  expandCollapseBtn.onclick = () => {
    const allItems = dropdownContent.querySelectorAll(
      ".dropdown-category-items",
    );
    const allIcons = dropdownContent.querySelectorAll(
      ".dropdown-category-icon",
    );

    isAllExpanded = !isAllExpanded;

    allItems.forEach((div) => {
      div.style.display = isAllExpanded ? "block" : "none";
    });

    allIcons.forEach((icon) => {
      icon.style.transform = isAllExpanded ? "rotate(180deg)" : "rotate(0deg)";
    });

    expandCollapseBtn.innerHTML = isAllExpanded
      ? "Collapse All ⯈"
      : "Expand All ⯆";
  };

  controlBar.appendChild(expandCollapseBtn);
  dropdownContent.appendChild(controlBar);

  // =============================
  // 🔥 KEY FILTER UI (SAFE ADD)
  // =============================
  function applyKeyFilters() {
    searchBox.dispatchEvent(new Event("keyup")); // 🔥 reuse search logic
  }

  const activeKeyFilters = {};

  const keyFilterWrapper = document.createElement("div");
  keyFilterWrapper.classList.add("dropdown-keyfilters");

  function formatLabel(key) {
    return key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
  }

  if (Object.keys(keyFilters || {}).length) {
    Object.keys(keyFilters).forEach((key) => {
      const row = document.createElement("div");
      row.classList.add("keyfilter-row");

      const title = document.createElement("div");
      title.classList.add("keyfilter-title-inline");
      title.innerText = formatLabel(key);

      const options = document.createElement("div");
      options.classList.add("keyfilter-options-inline");

      activeKeyFilters[key] = new Set();

      keyFilters[key].forEach((val) => {
        const label = document.createElement("label");
        label.classList.add("keyfilter-chip");

        const cb = document.createElement("input");
        cb.type = "checkbox";

        const actualValue = val.replace(/\s*\(\d+\)\s*$/, "").trim();

        cb.value = actualValue;

        cb.onchange = () => {
          if (cb.checked) activeKeyFilters[key].add(actualValue);
          else activeKeyFilters[key].delete(actualValue);

          applyKeyFilters();
        };

        const span = document.createElement("span");
        span.innerText = val; // UI shows Parent (13)

        label.append(cb, span);
        options.appendChild(label);
      });

      row.append(title, options);
      keyFilterWrapper.appendChild(row);
    });

    dropdownContent.appendChild(keyFilterWrapper);
  }

  const categories = Object.keys(data || {});

  // =============================
  // CATEGORY LOOP (UPDATED)
  // =============================
  categories.forEach((category) => {
    const catDiv = document.createElement("div");

    const catHeader = document.createElement("div");
    catHeader.classList.add("dropdown-category-header");

    const text = document.createElement("span");
    text.classList.add("dropdown-category-text");

    const totalCount = data[category].length;
    text.innerText = `${category} (0 / ${totalCount})`;

    const icon = document.createElement("span");
    icon.classList.add("dropdown-category-icon");
    icon.innerHTML = "▾";

    catHeader.appendChild(text);
    catHeader.appendChild(icon);

    const catItems = document.createElement("div");
    catItems.classList.add("dropdown-category-items");
    catItems.style.display = "block";
    icon.style.transform = "rotate(180deg)";

    catHeader.onclick = () => {
      const isOpen = catItems.style.display === "block";
      catItems.style.display = isOpen ? "none" : "block";
      icon.style.transform = isOpen ? "rotate(0deg)" : "rotate(180deg)";
    };

    data[category].forEach((item) => {
      let tooltipText = "";
      let label = document.createElement("label");
      label.classList.add("dropdown-item");

      let checkbox = document.createElement("input");
      checkbox.type = "checkbox";

      //  IMPORTANT PART
      const isObject = typeof item === "object";

      const displayText = isObject ? item.value : item; // UI
      const storedValue = isObject ? JSON.stringify(item) : item; // full object store

      checkbox.value = storedValue;

      // ==============================
      //  FUNCTIONALITY START
      // ==============================

      let isDisabled = false;

      if (isObject) {
        const enableTime = item?.enableTime || "";
        const disabledProp = item?.disabled;

        // CASE 1: enableTime exists → priority
        if (enableTime) {
          try {
            const now = new Date();
            let enableDate = new Date();

            // CASE 1: 24-hour format (13:00, 09:15)
            if (/^\d{1,2}:\d{2}$/.test(enableTime.trim())) {
              let [hours, minutes] = enableTime.split(":").map(Number);
              enableDate.setHours(hours, minutes, 0, 0);
            }

            //  CASE 2: 12-hour format (01:00 PM)
            else if (/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(enableTime.trim())) {
              const [time, modifier] = enableTime.toUpperCase().split(" ");
              let [hours, minutes] = time.split(":").map(Number);

              if (modifier === "PM" && hours !== 12) hours += 12;
              if (modifier === "AM" && hours === 12) hours = 0;

              enableDate.setHours(hours, minutes, 0, 0);
            } else {
              isDisabled = false;
              return;
            }

            isDisabled = now < enableDate;
            if (isDisabled) {
              tooltipText = `Enable Time : ${enableTime}`;
            }
          } catch (e) {
            isDisabled = false;
          }
        }

        //  CASE 2: fallback to disabled prop
        else if (typeof disabledProp === "boolean") {
          isDisabled = disabledProp;
        }

        //  CASE 3: default
        else {
          isDisabled = false;
        }
      }

      // apply
      checkbox.disabled = isDisabled;
      if (isDisabled) {
        label.classList.add("disabled");
        label.title = tooltipText;

        //  Click par bhi show (better UX)
        label.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();

          showTooltip(label, tooltipText);
        });
      }
      // ==============================
      //  FUNCTIONALITY END
      // ==============================

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(` ${displayText}`));

      catItems.appendChild(label);
    });

    catDiv.appendChild(catHeader);
    catDiv.appendChild(catItems);
    dropdownContent.appendChild(catDiv);
  });

  // =============================
  // COMMON
  // =============================
  function showTooltip(element, text) {
    // remove old
    const old = document.querySelector(".dropdown-custom-tooltip");
    if (old) old.remove();

    const tooltip = document.createElement("div");
    tooltip.className = "dropdown-custom-tooltip";
    tooltip.innerText = text;

    document.body.appendChild(tooltip);

    const rect = element.getBoundingClientRect();

    tooltip.style.top = rect.top - 35 + "px";
    tooltip.style.left = rect.left + "px";

    setTimeout(() => {
      tooltip.remove();
    }, 2000);
  }

  function getAllCheckboxes() {
    return dropdownContent.querySelectorAll(
      ".dropdown-item input[type='checkbox']",
    );
  }

  function updateCategoryVisibility(mode) {
    const categoryBlocks = dropdownContent.querySelectorAll(
      ".dropdown-category-header",
    );

    categoryBlocks.forEach((header) => {
      const catDiv = header.parentElement;
      const itemsDiv = catDiv.querySelector(".dropdown-category-items");

      const checkboxes = itemsDiv.querySelectorAll("input[type='checkbox']");

      let hasSelected = false;
      let hasPending = false;

      checkboxes.forEach((cb) => {
        if (cb.checked) hasSelected = true;
        else hasPending = true;
      });

      if (mode === "ALL") catDiv.style.display = "block";
      else if (mode === "SELECTED")
        catDiv.style.display = hasSelected ? "block" : "none";
      else if (mode === "PENDING")
        catDiv.style.display = hasPending ? "block" : "none";
    });
  }

  function updateSelection() {
    const allCheckboxes = getAllCheckboxes();

    // ==================================================
    // GENERIC DYNAMIC LIMIT SUPPORT (Backward Safe)
    // ==================================================
    if (selectionLimit !== null) {
      let limit =
        typeof selectionLimit === "function"
          ? selectionLimit()
          : selectionLimit;

      limit = Number(limit);

      if (limit > 0) {
        const checkedBoxes = Array.from(allCheckboxes).filter(
          (cb) => cb.checked,
        );

        // If selected > limit → keep first N checked
        if (checkedBoxes.length > limit) {
          checkedBoxes.forEach((cb, index) => {
            cb.checked = index < limit;
          });
        }
      }
    }

    // ==================================================
    // OLD LOGIC START (UNCHANGED BEHAVIOR)
    // ==================================================
    let selected = [];

    allCheckboxes.forEach((cb) => {
      if (cb.checked) {
        try {
          selected.push(JSON.parse(cb.value)); // object return
        } catch (e) {
          selected.push(cb.value); // fallback
        }
      }
    });

    const total = allCheckboxes.length;

    dropdownBtn.innerText = selected.length
      ? `${selected.length} / ${total} Selected`
      : title;

    const headers = dropdownContent.querySelectorAll(".dropdown-category-text");

    headers.forEach((header, index) => {
      const itemsDiv = header.parentElement.parentElement.querySelector(
        ".dropdown-category-items",
      );

      const checkboxes = itemsDiv.querySelectorAll("input[type='checkbox']");

      const total = checkboxes.length;

      let selectedCount = 0;

      checkboxes.forEach((cb) => {
        if (cb.checked) selectedCount++;
      });

      const catName = categories[index];

      header.innerText = `${catName} (${selectedCount} / ${total})`;
    });

    callback(selected);
  }

  dropdownContent.addEventListener("change", (e) => {
    const isKeyFilter = e.target.closest(".dropdown-keyfilters");
    const isItem = e.target.closest(".dropdown-item");

    // OLD LOGIC SAFE
    if (isKeyFilter) return; // ignore key filter clicks
    if (!isItem) return; // only actual dropdown items

    const changedCheckbox = e.target;

    // ==================================================
    // NEW GENERIC LIMIT FEATURE (Backward Compatible)
    // ==================================================
    if (
      changedCheckbox.type === "checkbox" &&
      changedCheckbox.checked &&
      typeof selectionLimit !== "undefined" &&
      selectionLimit !== null
    ) {
      let limit =
        typeof selectionLimit === "function"
          ? selectionLimit()
          : selectionLimit;

      limit = Number(limit);

      if (limit > 0) {
        const checkedCount = dropdownContent.querySelectorAll(
          ".dropdown-item input[type='checkbox']:checked",
        ).length;

        if (checkedCount > limit) {
          changedCheckbox.checked = false;

          SHOW_ERROR_POPUP(`Maximum ${limit} selections allowed.`);
          return;
        }
      }
    }

    // OLD MAIN LOGIC
    updateSelection();
  });

  // SELECT ALL
  if (selectAllCheckbox) {
    selectAllCheckbox.onclick = function () {
      getAllCheckboxes().forEach((cb) => {
        if (!cb.disabled) {
          cb.checked = this.checked;
        }
      });

      updateSelection();
      updateCategoryVisibility("ALL");
    };
  }

  // FILTERS
  if (btnAll) {
    btnAll.onclick = () => {
      // Reuse existing search + key filter logic
      searchBox.dispatchEvent(new Event("keyup"));

      setActiveFilter(btnAll);
    };
  }

  if (btnSelected) {
    btnSelected.onclick = () => {
      // First apply search/filter logic
      searchBox.dispatchEvent(new Event("keyup"));

      dropdownContent.querySelectorAll(".dropdown-item").forEach((l) => {
        if (l.style.display !== "none") {
          const cb = l.querySelector("input");
          l.style.display = cb.checked ? "flex" : "none";
        }
      });

      updateCategoryVisibility("SELECTED");
      setActiveFilter(btnSelected);
    };
  }

  if (btnPending) {
    btnPending.onclick = () => {
      // First apply search/filter logic
      searchBox.dispatchEvent(new Event("keyup"));

      dropdownContent.querySelectorAll(".dropdown-item").forEach((l) => {
        if (l.style.display !== "none") {
          const cb = l.querySelector("input");
          l.style.display = !cb.checked ? "flex" : "none";
        }
      });

      updateCategoryVisibility("PENDING");
      setActiveFilter(btnPending);
    };
  }

  // SEARCH
  searchBox.onkeyup = function () {
    const val = this.value.toLowerCase().trim();

    const categoryBlocks = dropdownContent.querySelectorAll(
      ".dropdown-category-header",
    );

    categoryBlocks.forEach((header) => {
      const catDiv = header.parentElement;
      const itemsDiv = catDiv.querySelector(".dropdown-category-items");

      const labels = itemsDiv.querySelectorAll(".dropdown-item");

      let visibleCount = 0;
      let selectedCount = 0;

      labels.forEach((label) => {
        const cb = label.querySelector("input");

        let text = label.innerText.toLowerCase();

        // 🔥 include object fields (OLD logic same)
        let obj;
        try {
          obj = JSON.parse(cb.value);
          if (typeof obj === "object") {
            text += " " + Object.values(obj).join(" ").toLowerCase();
          }
        } catch (e) {}

        const searchMatch = text.includes(val);

        // 🔥 KEY FILTER MATCH
        let filterMatch = true;
        const hasKeyFilters = Object.keys(keyFilters || {}).length > 0;

        let anyFilterSelected = false; // ✅ NEW

        if (hasKeyFilters) {
          for (let key in activeKeyFilters) {
            const set = activeKeyFilters[key];

            if (set.size) {
              anyFilterSelected = true; // ✅ NEW
            }

            if (set.size && (!obj || !set.has(obj[key]))) {
              filterMatch = false;
              break;
            }
          }
        }

        if (showDataBasedOnFilters && !anyFilterSelected) {
          filterMatch = false;
        }

        const finalMatch = searchMatch && filterMatch;

        label.style.display = finalMatch ? "flex" : "none";

        if (finalMatch) {
          visibleCount++;
          if (cb.checked) selectedCount++;
        }
      });

      // 🔥 hide empty category
      catDiv.style.display = visibleCount > 0 ? "block" : "none";

      // 🔥 update count
      const catName = header
        .querySelector(".dropdown-category-text")
        .innerText.split("(")[0]
        .trim();

      header.querySelector(".dropdown-category-text").innerText =
        `${catName} (${selectedCount} / ${visibleCount})`;
    });
  };

  clearBtn.onclick = () => {
    searchBox.value = "";

    // Reapply current filter/search rules
    searchBox.dispatchEvent(new Event("keyup"));

    // keep active top button mode if selected
    if (btnSelected && btnSelected.classList.contains("active-filter")) {
      btnSelected.click();
    } else if (btnPending && btnPending.classList.contains("active-filter")) {
      btnPending.click();
    } else if (btnAll && btnAll.classList.contains("active-filter")) {
      btnAll.click();
    }
  };

  dropdown.appendChild(dropdownBtn);
  dropdown.appendChild(dropdownContent);

  if (categoryWiseCheckbox) {
    categoryWiseCheckbox.onchange = function () {
      const allHeaders = dropdownContent.querySelectorAll(
        ".dropdown-category-header",
      );

      const allCategoryBoxes = dropdownContent.querySelectorAll(
        ".dropdown-category-items",
      );

      if (this.checked) {
        allHeaders.forEach((h) => (h.style.display = "flex"));

        allCategoryBoxes.forEach((box) => {
          box.style.display = "block";
          box.style.paddingLeft = "";
        });
      } else {
        allHeaders.forEach((h) => (h.style.display = "none"));

        allCategoryBoxes.forEach((box) => {
          box.style.display = "block";
          box.style.paddingLeft = "0px";
        });
      }
    };

    // 🔥 apply initial state
    categoryWiseCheckbox.dispatchEvent(new Event("change"));
  }

  dropdown.forceUpdateSelection = updateSelection;
  container.appendChild(dropdown);
  if (showDataBasedOnFilters) {
    searchBox.dispatchEvent(new Event("keyup"));
  }
}

function UPDATE_MULTI_SELECT_DROPDOWN_WITH_CATEGORY_WITH_KEYFILTER(
  containerId,
  data,
  callback,
  controls = {},
  keyFilters = {},
) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  CREATE_MULTI_SELECT_DROPDOWN_WITH_CATEGORY_WITH_KEYFILTER({
    containerId,
    title: "Select",
    data,
    callback,
    controls,
    keyFilters,
  });
}

function GET_KEY_FILTERS(data, keys) {
  const result = {};
  const tempSets = {};

  // Initialize sets
  keys.forEach((key) => {
    tempSets[key] = new Set();
  });

  // Single loop over data
  Object.values(data).forEach((student) => {
    keys.forEach((key) => {
      const value = (student[key] || "").toString().trim();

      if (value !== "") {
        tempSets[key].add(value);
      }
    });
  });

  // Convert to array
  keys.forEach((key) => {
    result[key] = Array.from(tempSets[key]);
  });

  return result;
}

function DISABLED_OLD_DATES(controlId) {
  let today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
  document.getElementById(controlId).setAttribute("min", today);
}

async function CALL_API(apiType, data) {
  const onlineRes = await IS_ONLINE();
  if (onlineRes) {
    const request = {
      apiType: apiType,
      inputData: data,
    };
    try {
      const response = await API_HANDLER_AXIOS(request);
      if (response) {
        return response;
        //
      } else {
        SHOW_ERROR_POPUP("Something Went Wrong");
      }
    } catch (ex) {
      SHOW_ERROR_POPUP("Error :- " + ex);
    }
  }
}

async function CALL_API_WITHOUT_LOADING(apiType, data) {
  const onlineRes = await IS_ONLINE();
  if (onlineRes) {
    const request = {
      apiType: apiType,
      inputData: data,
    };
    try {
      const response = await API_HANDLER_WITHOUT_LOADING_AXIOS(request);
      if (response) {
        return response;
        //
      } else {
        SHOW_ERROR_POPUP("Something Went Wrong");
      }
    } catch (ex) {
      SHOW_ERROR_POPUP("Error :- " + ex);
    }
  }
}

function SHOW_BUTTON_BY_ADMIN_ROLE(buttonId, roleKey, roleObj) {
  const button = document.getElementById(buttonId);
  if (!button) return;

  const userRoleValue = roleObj?.[roleKey]?.toString().trim().toLowerCase();

  if (userRoleValue && userRoleValue.includes("admin")) {
    button.style.display = "inline-block";
  } else {
    button.style.display = "none";
  }
}

// Open (or create) database and object store
function DB_OPEN_INTERNAL(dbName = "AppDB", storeName = "store") {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = function (event) {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: "id" });
      }
    };

    request.onsuccess = function (event) {
      resolve(event.target.result);
    };

    request.onerror = function () {
      reject("IndexedDB error");
    };
  });
}

// Save or update data in given store
async function DB_SET(storeKey, data, dbName = "AppDB", storeName = "store") {
  const db = await DB_OPEN_INTERNAL(dbName, storeName);
  const tx = db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);

  store.put({ id: storeKey, data: data });
  return tx.complete;
}

// Get data from store by key
async function DB_GET(storeKey, dbName = "AppDB", storeName = "store") {
  const db = await DB_OPEN_INTERNAL(dbName, storeName);

  return new Promise((resolve) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.get(storeKey);

    request.onsuccess = function () {
      resolve(request.result ? request.result.data : null);
    };

    request.onerror = function () {
      resolve(null);
    };
  });
}

// Delete data from store by key
async function DB_DELETE(storeKey, dbName = "AppDB", storeName = "store") {
  const db = await DB_OPEN_INTERNAL(dbName, storeName);
  const tx = db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  store.delete(storeKey);
  return tx.complete;
}

function populateActionGrid(
  inputType,
  inputMsg,
  columnNames,
  gridData,
  instance = 0,
) {
  const gridContainer = document.getElementById(
    inputType + "GridContainer_" + instance,
  );
  const statusTextElement = document.getElementById(
    inputType + "GridStatusText_" + instance,
  );
  let totalRows = 0;

  // Clear any existing content in the grid container
  statusTextElement.textContent = inputMsg;

  // Create the table element and headers dynamically
  let table = document.getElementById(inputType + "GridTable_" + instance);

  const thead = document.getElementById(`${inputType}GridTHead_${instance}`);
  thead.replaceChildren();

  const headerRow = document.createElement("tr");
  headerRow.id = `${inputType}GridTHRow_${instance}`;

  // Add table headers dynamically from columnNames array
  columnNames.forEach((column) => {
    const th = document.createElement("th");
    th.textContent = column; // Use displayName for the header
    th.style.textAlign = "center";
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.getElementById(`${inputType}GridTBody_${instance}`);
  tbody.replaceChildren();

  console.info(gridData);

  // Populate table rows dynamically from gridData
  for (let key in gridData) {
    const row = document.createElement("tr");
    let spiritualFlag = gridData[key]["Spiritual Mentor's Name"] == "" ? 0 : 1;
    row.id = `${inputType}GridTRow_${instance}_${totalRows}`;
    row.dataset.name = `TableRow_${gridData[key]["row"]}_${gridData[key]["Student Name"]}_${spiritualFlag}_${key}`;

    if (gridData[key]["red"] != null && gridData[key]["red"] == 1) {
      row.style.backgroundColor = "#b81414";
      row.style.color = "white";
    }

    // Add each data field into a new table cell (td)
    columnNames.forEach((column) => {
      if (gridData[key][column] == null) return;
      const td = document.createElement("td");
      td.textContent = gridData[key][column];
      row.appendChild(td);
    });

    totalRows++;

    tbody.appendChild(row);
  }
  table.appendChild(tbody);

  // Append the table to the grid container
  gridContainer.appendChild(table);
  return totalRows;
}

//Populate Grid for verification
function openVerifyDetailsWindow(
  columnNames = [],
  headerArr = [],
  inputMap,
  submitClassBack,
  returnId = "",
  gridHeading = "Verify Details",
  buttonLables = ["Submit", "Back"],
) {
  const parent_popup = document.getElementById("verificationGridPopup");
  const popup = document.getElementById("verificationGridSubPopup");
  const verifySubmitButton = document.getElementById("verificationSubmitBtn");
  const returnSubmitButton = document.getElementById("verificationBackButton");
  const buttonRow = popup.querySelector(".button-row");
  const gridheadingelement = document.getElementById("gridHeading");

  if (gridHeading == "") gridheadingelement.hidden = true;
  else gridheadingelement.innerHTML = gridHeading;

  let cntr = 0;

  verifySubmitButton.onclick = function () {
    submitClassBack();
  };

  returnSubmitButton.hidden = true;

  verifySubmitButton.innerHTML = buttonLables[0];

  if (buttonLables.length == 2) {
    returnSubmitButton.innerHTML = buttonLables[1];
    returnSubmitButton.onclick = function () {
      SHOW_SPECIFIC_DIV(returnId);
    };

    returnSubmitButton.hidden = false;
  }

  //Removing all elements or cleanup
  const heading = popup.querySelector(".heading");

  let current = heading.nextElementSibling;

  while (current && current !== buttonRow) {
    const next = current.nextElementSibling;
    current.remove();
    current = next;
  }

  for (cntr = 0; cntr < headerArr.length; cntr++) {
    // Add Header element
    const header = document.createElement("div");
    header.className = "heading";
    header.id = `verifyDetailsGridStatusText_${cntr}`;
    header.style.marginTop = "10px";
    popup.insertBefore(header, buttonRow);

    // Add Table

    const container = document.createElement("div");
    console.log(
      `Creating container with ID verifyDetailsGridContainer_${cntr}`,
    );

    container.id = `verifyDetailsGridContainer_${cntr}`;

    container.classList.add(
      "collection-table-container",
      "scrollable-content-table",
    );

    // Avoid style string
    container.style.marginTop = "10px";

    // TABLE
    const table = document.createElement("table");
    table.id = `verifyDetailsGridTable_${cntr}`;

    // THEAD
    const thead = document.createElement("thead");
    thead.id = `verifyDetailsGridTHead_${cntr}`;
    thead.classList.add("table-header");

    // TBODY
    const tbody = document.createElement("tbody");
    tbody.id = `verifyDetailsGridTBody_${cntr}`;
    tbody.innerHTML = "";

    // Build hierarchy
    table.appendChild(thead);
    table.appendChild(tbody);

    container.appendChild(table);

    popup.insertBefore(container, buttonRow);

    populateActionGrid(
      `verifyDetails`,
      headerArr[cntr],
      columnNames,
      inputMap[headerArr[cntr]],
      cntr,
    );
  }

  // Show the parent popup
  SHOW_SPECIFIC_DIV(parent_popup.id);
}

function PARSE_IST_DATE(dateString) {
  if (!dateString) return null;

  dateString = dateString.toString().trim();

  const monthNames = {
    jan: 0,
    january: 0,
    feb: 1,
    february: 1,
    mar: 2,
    march: 2,
    apr: 3,
    april: 3,
    may: 4,
    jun: 5,
    june: 5,
    jul: 6,
    july: 6,
    aug: 7,
    august: 7,
    sep: 8,
    sept: 8,
    september: 8,
    oct: 9,
    october: 9,
    nov: 10,
    november: 10,
    dec: 11,
    december: 11,
  };

  let parts;

  // =============================
  // 1. dd-MMM-yyyy / dd-MMMM-yyyy
  // =============================
  parts = dateString.match(/^(\d{1,2})-([A-Za-z]+)-(\d{4})/);
  if (parts) {
    const day = parseInt(parts[1], 10);
    const month = monthNames[parts[2].toLowerCase()];
    const year = parseInt(parts[3], 10);

    if (month === undefined) return null;
    return new Date(year, month, day);
  }

  // =============================
  // 2. dd MMM yyyy
  // =============================
  parts = dateString.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (parts) {
    const day = parseInt(parts[1], 10);
    const month = monthNames[parts[2].toLowerCase()];
    const year = parseInt(parts[3], 10);

    if (month === undefined) return null;
    return new Date(year, month, day);
  }

  // =============================
  // 3. dd-MM-yyyy
  // =============================
  parts = dateString.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (parts) {
    const day = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10) - 1;
    const year = parseInt(parts[3], 10);

    return new Date(year, month, day);
  }

  // =============================
  // 4. M/D/YYYY
  // =============================
  parts = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (parts) {
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const year = parseInt(parts[3], 10);

    return new Date(year, month, day);
  }

  // =============================
  // 5. YYYY/MM/DD
  // =============================
  parts = dateString.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (parts) {
    const year = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10) - 1;
    const day = parseInt(parts[3], 10);

    return new Date(year, month, day);
  }

  // =============================
  // 6. ISO (safe only)
  // =============================
  if (dateString.includes("T")) {
    const d = new Date(dateString);
    if (!isNaN(d)) {
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
  }

  return null; //  unsupported format
}

function SET_DIV_TITLE(popupId, titleText) {
  const el = document.querySelector(`#${popupId} .popup-title-box`);
  if (el) {
    el.innerText = titleText;
  } else {
    console.warn("popup-title-box not found inside:", popupId);
  }
}

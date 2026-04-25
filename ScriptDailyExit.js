let selectedProductionItem = "";
let pendingStdList = {};
let selectedStudents = [];
let keyFiltersDataStdExit = {};
const CLASS_NAME_HINDI_MAP = {
  "Pre Nursery": "प्री नर्सरी",
  Nursery: "नर्सरी",
  KG: "केजी",
  UKG: "यूकेजी",
  I: "पहली",
  II: "दूसरी",
  III: "तीसरी",
  IV: "चौथी",
  V: "पाँचवीं",
  VI: "छठी",
  VII: "सातवीं",
  VIII: "आठवीं",
  IX: "नौवीं",
  X: "दसवीं",
  XI: "ग्यारहवीं",
  XII: "बारहवीं",
};

CREATE_MULTI_SELECT_DROPDOWN_WITH_CATEGORY_WITH_KEYFILTER({
  containerId: "dynamic-dropdown-container",
  title: "Select",
  options: [],
  callback: () => {},
  controls: {
    showSelectAll: false,
    showFilters: true,
  },
  keyFilters: {},
});

async function studentDailyExitBtnClick() {
  const response = await CALL_API("GET_DAILY_EXIT_RAW_DATA", {});
  const role = selectedUser?.role?.["Student Daily Exit Tracker Role"];
  debugger;
  pendingStdList = PROCESS_DAILY_EXIT_DATA(
    response?.data?.attendanceData,
    response?.data?.exitData,
    response?.data?.allStudentsData,
    response?.data?.tutionEntryData,
    response?.data?.specialEntryApprovedData,
    role,
  );
  keyFiltersDataStdExit = GET_KEY_FILTERS(response?.data?.allStudentsData, [
    "driverName",
  ]);
  console.log(pendingStdList);
  populateMultiSelectDropdown();
  SHOW_SPECIFIC_DIV("dailyExitPopup");
  SET_DIV_TITLE("dailyExitPopup", "Student Exit System");
}

function populateMultiSelectDropdown() {
  UPDATE_MULTI_SELECT_DROPDOWN_WITH_CATEGORY_WITH_KEYFILTER(
    "dynamic-dropdown-container",
    pendingStdList,
    (data) => {
      console.log(data);
      selectedStudents = data.map((item) =>
        typeof item === "object" ? item.englishValue : item,
      );
    },
    {
      showSelectAll: false,
      showFilters: true,
    },
    keyFiltersDataStdExit,
  );
}

async function stdSubmitClick() {
  try {
    if (!selectedStudents.length) {
      SHOW_ERROR_POPUP("Please select students");
      return;
    }

    // convert to single string with \n
    const studentListStr = selectedStudents.join("\n");

    //  teacher name
    const teacherName = selectedUser?.name || "";

    // payload
    const payload = {
      studentList: studentListStr,
      teacherName: teacherName,
    };

    console.log("Sending:", payload);

    const res = await CALL_API("SAVE_DAILY_EXIT", payload);

    if (res?.status) {
      resetExitForm();
      SHOW_SUCCESS_POPUP("Saved successfully ✅");
    } else {
      SHOW_ERROR_POPUP("Error saving data ❌");
    }
  } catch (err) {
    console.error(err);
    SHOW_ERROR_POPUP("Something went wrong");
  }
}

function PROCESS_DAILY_EXIT_DATA(
  attendanceData,
  exitData,
  allStudentsData,
  tutionEntryData,
  specialEntryApprovedData,
  filterType,
) {
  const today = new Date();

  const presentSet = new Set();
  const exitSet = new Set();
  const extraEntrySet = new Set();

  function isSameDay(d1, d2) {
    return (
      d1 &&
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  function addNamesToSet(rawValue, targetSet) {
    (rawValue?.toString().split("\n") || []).forEach((s) => {
      const name = s.trim();
      if (name) targetSet.add(name);
    });
  }

  // =============================
  // 1. PRESENT ENTRY
  // =============================
  for (let i = 1; i < attendanceData.length; i++) {
    const row = attendanceData[i];
    const rowDate = PARSE_IST_DATE(row[0]);

    if (!isSameDay(rowDate, today)) continue;

    addNamesToSet(row[2], presentSet);
  }

  // =============================
  // 2. TUTION ENTRY
  // =============================
  for (let i = 1; i < tutionEntryData.length; i++) {
    const row = tutionEntryData[i];
    const rowDate = PARSE_IST_DATE(row[0]);

    if (!isSameDay(rowDate, today)) continue;

    addNamesToSet(row[2], presentSet);
    addNamesToSet(row[2], extraEntrySet);
  }

  // =============================
  // 3. SPECIAL ENTRY
  // =============================
  for (let i = 1; i < specialEntryApprovedData.length; i++) {
    const row = specialEntryApprovedData[i];
    const rowDate = PARSE_IST_DATE(row[0]);

    if (!isSameDay(rowDate, today)) continue;

    addNamesToSet(row[2], presentSet);
    addNamesToSet(row[2], extraEntrySet);
  }

  // =============================
  // 4. EXIT ENTRY
  // =============================
  for (let i = 1; i < exitData.length; i++) {
    const row = exitData[i];
    const rowDate = PARSE_IST_DATE(row[0]);

    if (!isSameDay(rowDate, today)) continue;

    addNamesToSet(row[2], exitSet);
  }

  // =============================
  // 5. PENDING = PRESENT - EXIT
  // =============================
  const pending = Array.from(presentSet).filter(
    (student) => !exitSet.has(student),
  );

  // =============================
  // 6. FILTER + OBJECT MAP
  // =============================
  const filteredWithObj = pending
    .map((student) => {
      let obj = allStudentsData[student];

      // If not found in master, use Others
      if (!obj && extraEntrySet.has(student)) {
        obj = {
          studentName: student,
          studentHindiName: student,
          studentOrgClassName: "Others",
          lastClassTime: "",
          driverName: "",
          hostler: "N",
        };
      }

      return {
        name: student,
        obj,
      };
    })
    .filter(({ obj }) => {
      if (!obj) return false;

      if (filterType === "Admin") return true;
      if (filterType === "H Admin") return obj.hostler === "Y";
      if (filterType === "NH Admin") return obj.hostler === "N";

      return false;
    });

  // =============================
  // 7. CATEGORY CREATE
  // =============================
  const ALL_CLASS_NAME =
    "Pre Nursery, Nursery, KG, UKG, I, II, III, IV, V, VI, VII, VIII, IX, X, XI, XII, Others";

  const categorized = {};

  ALL_CLASS_NAME.split(",").forEach((c) => {
    const cls = c.trim();
    const clsHindi = CLASS_NAME_HINDI_MAP[cls] || cls;
    categorized[clsHindi] = [];
  });

  // =============================
  // 8. FINAL PUSH
  // =============================
  filteredWithObj.forEach(({ obj }) => {
    const cls = obj.studentOrgClassName;
    if (!cls) return;

    const clsHindi = CLASS_NAME_HINDI_MAP[cls] || cls;

    if (!categorized[clsHindi]) return;

    categorized[clsHindi].push({
      value: obj.studentHindiName || obj.studentName,
      englishValue: obj.studentName,
      class: cls,
      enableTime: obj.lastClassTime || "",
      driverName: obj.driverName || "",
    });
  });

  // =============================
  // 9. REMOVE EMPTY
  // =============================
  Object.keys(categorized).forEach((cls) => {
    if (!categorized[cls].length) delete categorized[cls];
  });

  return categorized;
}

function removeSelectedDataFromPending() {
  // selected ka unique set banao (fast lookup)
  const selectedSet = new Set(
    selectedStudents.map((s) => (typeof s === "object" ? s.englishValue : s)),
  );

  Object.keys(pendingStdList).forEach((cls) => {
    pendingStdList[cls] = pendingStdList[cls].filter((student) => {
      const key = typeof student === "object" ? student.englishValue : student;

      return !selectedSet.has(key);
    });

    if (pendingStdList[cls].length === 0) {
      delete pendingStdList[cls];
    }
  });
}

function resetExitForm() {
  removeSelectedDataFromPending();
  selectedStudents = [];
  populateMultiSelectDropdown();
}

async function handleRefreshClick(btn) {
  const button = event.currentTarget;
  button.querySelector(".refresh-text").innerText = "Refreshing...";
  resetExitForm();
  await studentDailyExitBtnClick();
  button.querySelector(".refresh-text").innerText = "Refresh";
}

function stdExitBackClick() {
  SHOW_SPECIFIC_DIV("menuPopup");
}

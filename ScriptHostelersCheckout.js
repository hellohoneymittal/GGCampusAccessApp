let pendinghostelCheckoutList = {};
let selectedHostelCheckout = [];
let keyFiltersDatahostelCheckout = {};

CREATE_MULTI_SELECT_DROPDOWN_WITH_CATEGORY_WITH_KEYFILTER({
  containerId: "hostelCheckout-dynamic-dropdown-container",
  title: "Select",
  options: [],
  callback: () => {},
  controls: {
    showSelectAll: false,
    showFilters: false,
  },
  keyFilters: {},
});

function PROCESS_HOSTEL_CHECKOUT_DATA(
  hcReqApprovedSheetData,
  hcReqSheetData,
  allStudentsData,
) {
  const today = new Date();
  const requestSet = new Set();
  const approvedSet = new Set();
  const requestedByMap = {};

  function isSameDay(d1, d2) {
    return (
      d1 &&
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  // =============================
  // 1. REQUEST (TODAY)
  // =============================
  for (let i = 1; i < hcReqSheetData.length; i++) {
    const row = hcReqSheetData[i];
    const rowDate = PARSE_IST_DATE(row[0]);

    if (!isSameDay(rowDate, today)) continue;

    const requestedBy = row[3] || "";
    const reason = row[4] || "";
    const duration = row[5] || "";

    const now = new Date();
    const lastTimeDate = new Date(now.getTime() + duration * 60000);
    const hh = String(lastTimeDate.getHours()).padStart(2, "0");
    const mm = String(lastTimeDate.getMinutes()).padStart(2, "0");

    const lastTime = `${hh}:${mm}`; // 24 hour format

    (row[2]?.split("\n") || []).forEach((s) => {
      const name = s.trim();
      if (name) {
        requestSet.add(name);
        requestedByMap[name] = {
          requestedBy: requestedBy,
          reason: reason,
          duration: duration,
          lastTime: lastTime,
        };
      }
    });
  }

  // =============================
  // 2. APPROVED
  // =============================
  for (let i = 1; i < hcReqApprovedSheetData.length; i++) {
    const row = hcReqApprovedSheetData[i];
    const rowDate = PARSE_IST_DATE(row[0]);

    if (!isSameDay(rowDate, today)) continue;

    (row[2]?.split("\n") || []).forEach((s) => {
      const name = s.trim();
      if (name) approvedSet.add(name);
    });
  }

  // =============================
  // 3. PENDING
  // =============================
  const pending = Array.from(requestSet).filter(
    (name) => !approvedSet.has(name),
  );

  // =============================
  // 4. CATEGORY INIT
  // =============================
  const ALL_CLASS_NAME =
    "Pre Nursery, Nursery, KG, UKG, I, II, III, IV, V, VI, VII, VIII, IX, X, XI, XII";

  const categorized = {};

  ALL_CLASS_NAME.split(",").forEach((c) => {
    const cls = c.trim();
    const clsHindi = CLASS_NAME_HINDI_MAP[cls] || cls;
    categorized[clsHindi] = [];
  });

  //  NEW: Others category
  categorized["Others"] = [];

  // =============================
  // 5. MAP
  // =============================

  pending.forEach((name) => {
    const originalKey = name.replace(/^s_/, "");
    const obj = allStudentsData[originalKey];
    const requestedByObj = requestedByMap[name] || "";
    let cls = obj?.studentOrgClassName;
    let clsHindi = CLASS_NAME_HINDI_MAP[cls] || cls;

    // fallback to Others
    if (!obj || !cls || !categorized[clsHindi]) {
      categorized["Others"].push({
        value: name,
        englishValue: name,
        class: "",
        enableTime: "",
        requestedBy: requestedByObj.requestedBy || "",
        reason: requestedByObj.reason || "",
        duration: requestedByObj.duration || "",
        lastTime: requestedByObj.lastTime || "",
      });
      return;
    }

    const hindiName = obj.studentHindiName || obj.studentName;

    categorized[clsHindi].push({
      value: `s_${hindiName}`,
      englishValue: name,
      class: cls,
      enableTime: "",
      requestedBy: requestedByObj.requestedBy || "",
      reason: requestedByObj.reason || "",
      duration: requestedByObj.duration || "",
      lastTime: requestedByObj.lastTime || "",
    });
  });

  // =============================
  // REMOVE EMPTY
  // =============================
  Object.keys(categorized).forEach((cls) => {
    if (!categorized[cls].length) delete categorized[cls];
  });

  splKeyFiltersDataStdEntry = GET_UNIQUE_REQUESTED_BY(requestedByMap);
  allData = categorized;
  return categorized;
}

function populateMultiSelectDropdownHostelCheckout() {
  UPDATE_MULTI_SELECT_DROPDOWN_WITH_CATEGORY_WITH_KEYFILTER(
    "hostelCheckout-dynamic-dropdown-container",
    pendinghostelCheckoutList,
    (data) => {
      console.log(data);
      selectedHostelCheckout = data.map((item) =>
        typeof item === "object" ? item.englishValue : item,
      );
    },
    {
      showSelectAll: true,
      showFilters: true,
    },
    keyFiltersDatahostelCheckout,
  );
}

async function ggHostelCheckoutBtnClick() {
  const response = await CALL_API("GET_HOSTEL_CHECKOUT_APPROVAL_RAW_DATA", {});
  const role = selectedUser?.role?.["Student Daily Exit Tracker Role"];

  pendinghostelCheckoutList = PROCESS_HOSTEL_CHECKOUT_DATA(
    response?.data?.hcReqApprovedSheetData,
    response?.data?.hcReqSheetData,
    response?.data?.allStudentsData,
    role,
  );
  keyFiltersDatahostelCheckout = {};
  console.log(pendinghostelCheckoutList);
  populateMultiSelectDropdownHostelCheckout();
  SHOW_SPECIFIC_DIV("hostelCheckoutPopup");
  SET_DIV_TITLE("hostelCheckoutPopup", "Hostelers Checkout System");
}

async function hostelCheckoutSubClick() {
  try {
    if (!selectedHostelCheckout.length) {
      SHOW_ERROR_POPUP("Please select students");
      return;
    }

    const studentListStrEntry = selectedHostelCheckout.join("\n");

    //  teacher name
    const teacherName = selectedUser?.name || "";

    // payload
    const payload = {
      studentList: studentListStrEntry,
      teacherName: teacherName,
    };

    console.log("Sending:", payload);

    const res = await CALL_API("SAVE_DAILY_TUTION_ENTRY", payload);

    if (res?.status) {
      resetEntryForm();
      SHOW_SUCCESS_POPUP("Saved successfully ✅");
    } else {
      SHOW_ERROR_POPUP("Error saving data ❌");
    }
  } catch (err) {
    console.error(err);
    SHOW_ERROR_POPUP("Something went wrong");
  }
}

function resetEntryForm() {
  removeSelectedDataFromPendingEntry();
  selectedHostelCheckout = [];
  populateMultiSelectDropdownHostelCheckout();
}

function removeSelectedDataFromPendingEntry() {
  // selected ka unique set banao (fast lookup)
  const selectedSet = new Set(
    selectedHostelCheckout.map((s) =>
      typeof s === "object" ? s.englishValue : s,
    ),
  );

  Object.keys(pendinghostelCheckoutList).forEach((cls) => {
    pendinghostelCheckoutList[cls] = pendinghostelCheckoutList[cls].filter(
      (student) => {
        const key =
          typeof student === "object" ? student.englishValue : student;

        return !selectedSet.has(key);
      },
    );

    if (pendinghostelCheckoutList[cls].length === 0) {
      delete pendinghostelCheckoutList[cls];
    }
  });
}

function hostelCheckoutBackBtnClick() {
  SHOW_SPECIFIC_DIV("menuPopup");
}

async function hostelCheckoutRefClick() {
  await ggHostelCheckoutBtnClick();
}

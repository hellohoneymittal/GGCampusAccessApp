let pendinghostelCheckinList = {};
let selectedHostelCheckin = [];
let keyFiltersDatahostelCheckin = {};
let hostelCheckinRowMap = {};

CREATE_MULTI_SELECT_DROPDOWN_WITH_CATEGORY_WITH_KEYFILTER({
  containerId: "hostelCheckin-dynamic-dropdown-container",
  title: "Select",
  options: [],
  callback: () => {},
  controls: {
    showSelectAll: false,
    showFilters: false,
  },
  keyFilters: {},
});

function PROCESS_HOSTEL_CHECKIN_DATA(
  hcReqApprovedSheetData,
  hChkInDataSheetData,
  allStudentsData,
) {
  hostelCheckinRowMap = {};
  const requestedByMap = {};

  // =============================
  // 1. GET ALL HOSTLERS WITH currentResident = N
  // =============================
  const pending = [];

  Object.keys(allStudentsData || {}).forEach((key) => {
    const obj = allStudentsData[key];

    if (obj?.hostler === "Y" && obj?.currentResident === "N") {
      pending.push(key);
    }
  });

  // =============================
  // 2. GET LATEST DETAILS FROM APPROVED SHEET
  // bottom to top
  // =============================
  for (let i = hcReqApprovedSheetData.length - 1; i >= 1; i--) {
    const row = hcReqApprovedSheetData[i];

    const studentName = row[2] || "";
    if (!studentName) continue;

    if (!pending.includes(studentName)) continue;

    // already found latest row
    if (requestedByMap[studentName]) continue;

    requestedByMap[studentName] = {
      requestedBy: row[3] || "",
      reason: row[4] || "",
      lastTime: row[5] || "",
      approvedBy: row[6] || "",
      durationType: row[7] || "",
      duration: row[8] || "",
      purpose: row[9] || "",
    };
  }

  // =============================
  // 3. CATEGORY INIT
  // =============================
  const ALL_CLASS_NAME =
    "Pre Nursery, Nursery, KG, UKG, I, II, III, IV, V, VI, VII, VIII, IX, X, XI, XII";

  const categorized = {};

  ALL_CLASS_NAME.split(",").forEach((c) => {
    const cls = c.trim();
    const clsHindi = CLASS_NAME_HINDI_MAP[cls] || cls;
    categorized[clsHindi] = [];
  });

  categorized["Others"] = [];

  // =============================
  // 4. MAP FINAL DATA
  // =============================
  pending.forEach((name) => {
    const obj = allStudentsData[name];
    const reqObj = requestedByMap[name] || {};

    let cls = obj?.studentOrgClassName;
    let clsHindi = CLASS_NAME_HINDI_MAP[cls] || cls;

    const finalObj = {
      value: obj?.studentHindiName || name,
      englishValue: name,
      class: cls || "",
      enableTime: "",
      requestedBy: reqObj.requestedBy || "",
      reason: reqObj.reason || "",
      lastTime: reqObj.lastTime || "",
      approvedBy: reqObj.approvedBy || "",
      duration: reqObj.duration || "",
      durationType: reqObj.durationType || "",
      purpose: reqObj.purpose || "",
      rowNo: obj.rowNo || "",
    };

    hostelCheckinRowMap[name] = obj.rowNo || "";

    if (!obj || !cls || !categorized[clsHindi]) {
      categorized["Others"].push(finalObj);
      return;
    }

    categorized[clsHindi].push(finalObj);
  });

  // =============================
  // REMOVE EMPTY
  // =============================
  Object.keys(categorized).forEach((cls) => {
    if (!categorized[cls].length) delete categorized[cls];
  });

  keyFiltersDatahostelCheckin = GET_UNIQUE_REQUESTED_BY(requestedByMap);
  allData = categorized;

  return categorized;
}

function populateMultiSelectDropdownHostelCheckin() {
  UPDATE_MULTI_SELECT_DROPDOWN_WITH_CATEGORY_WITH_KEYFILTER(
    "hostelCheckin-dynamic-dropdown-container",
    pendinghostelCheckinList,
    (data) => {
      console.log(data);
      selectedHostelCheckin = data.map((item) =>
        typeof item === "object" ? item.englishValue : item,
      );
    },
    {
      showSelectAll: false,
      showFilters: true,
      showCategoryView: false,
      showDataBasedOnFilters: true,
    },
    keyFiltersDatahostelCheckin,
  );
}

async function ggHostelCheckinBtnClick() {
  const response = await CALL_API("GET_HOSTEL_CHECKIN_APPROVAL_RAW_DATA", {});
  debugger;
  pendinghostelCheckinList = PROCESS_HOSTEL_CHECKIN_DATA(
    response?.data?.hcReqApprovedSheetData,
    response?.data?.hChkInDataSheetData,
    response?.data?.allStudentsData,
  );

  console.log(pendinghostelCheckinList);
  populateMultiSelectDropdownHostelCheckin();
  SHOW_SPECIFIC_DIV("hostelCheckinPopup");
  SET_DIV_TITLE("hostelCheckinPopup", "Hostelers Checkin System");
}

async function hostelCheckinSubClick() {
  try {
    if (!selectedHostelCheckin.length) {
      SHOW_ERROR_POPUP("Please select students");
      return;
    }

    const doneBy = selectedUser?.name || "";

    // one student = one row payload
    const payload = selectedHostelCheckin.map((name) => ({
      studentName: name,
      rowNo: hostelCheckinRowMap[name] || "",
      doneBy,
    }));

    console.log(payload);

    const res = await CALL_API("SAVE_HOSTEL_CHECKIN_APPROVAL_DATA", payload);

    if (res?.status) {
      resetHostelCheckinForm();
      SHOW_SUCCESS_POPUP("Saved successfully ✅");
    } else {
      SHOW_ERROR_POPUP("Error saving data ❌");
    }
  } catch (err) {
    console.error(err);
  }
}

function resetHostelCheckinForm() {
  removeSelectedDataFromPendingEntryHostelCheckin();
  selectedHostelCheckin = [];
  populateMultiSelectDropdownHostelCheckin();
}

function removeSelectedDataFromPendingEntryHostelCheckin() {
  // selected ka unique set banao (fast lookup)
  const selectedSet = new Set(
    selectedHostelCheckin.map((s) =>
      typeof s === "object" ? s.englishValue : s,
    ),
  );

  Object.keys(pendinghostelCheckinList).forEach((cls) => {
    pendinghostelCheckinList[cls] = pendinghostelCheckinList[cls].filter(
      (student) => {
        const key =
          typeof student === "object" ? student.englishValue : student;

        return !selectedSet.has(key);
      },
    );

    if (pendinghostelCheckinList[cls].length === 0) {
      delete pendinghostelCheckinList[cls];
    }
  });
}

function hostelCheckinBackBtnClick() {
  SHOW_SPECIFIC_DIV("menuPopup");
}

async function hostelCheckinRefClick() {
  await ggHostelCheckinBtnClick();
}

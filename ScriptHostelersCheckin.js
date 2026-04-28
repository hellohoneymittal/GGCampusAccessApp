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
  const today = new Date();
  const requestSet = new Set();
  const checkedInSet = new Set();
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
  // 1. BASE DATA = APPROVED SHEET
  // =============================
  for (let i = 1; i < hcReqApprovedSheetData.length; i++) {
    const row = hcReqApprovedSheetData[i];
    const rowDate = PARSE_IST_DATE(row[0]);

    if (!isSameDay(rowDate, today)) continue;

    const requestedBy = row[3] || "";
    const reason = row[4] || "";
    const lastTime = row[5] || "";
    const approvedBy = row[6] || "";
    const duration = row[7] || "";
    const durationType = row[8] || "";
    const purpose = row[9] || "";

    (row[2]?.split("\n") || []).forEach((s) => {
      const name = s.trim();

      if (name) {
        requestSet.add(name);

        requestedByMap[name] = {
          requestedBy,
          reason,
          lastTime,
          approvedBy,
          duration,
          durationType,
          purpose,
        };
      }
    });
  }

  // =============================
  // 2. CHECKIN SHEET => SKIP THESE
  // =============================
  for (let i = 1; i < hChkInDataSheetData.length; i++) {
    const row = hChkInDataSheetData[i];
    const rowDate = PARSE_IST_DATE(row[0]);

    if (!isSameDay(rowDate, today)) continue;

    (row[2]?.split("\n") || []).forEach((s) => {
      const name = s.trim();
      if (name) checkedInSet.add(name);
    });
  }

  // =============================
  // 3. PENDING = APPROVED - CHECKEDIN
  // =============================
  const pending = Array.from(requestSet).filter(
    (name) => !checkedInSet.has(name),
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

  categorized["Others"] = [];

  // =============================
  // 5. MAP DATA
  // =============================
  pending.forEach((name) => {
    const originalKey = name.replace(/^s_/, "");
    const obj = allStudentsData[originalKey];
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
      rowNo: reqObj.rowNo || "",
    };

    // fast lookup map for submit click
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

  splKeyFiltersDataStdEntry = GET_UNIQUE_REQUESTED_BY(requestedByMap);
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
      showSelectAll: true,
      showFilters: true,
    },
    keyFiltersDatahostelCheckin,
  );
}

async function ggHostelCheckinBtnClick() {
  const response = await CALL_API("GET_HOSTEL_CHECKIN_APPROVAL_RAW_DATA", {});

  pendinghostelCheckinList = PROCESS_HOSTEL_CHECKIN_DATA(
    response?.data?.hcReqApprovedSheetData,
    response?.data?.hChkInDataSheetData,
    response?.data?.allStudentsData,
  );

  keyFiltersDatahostelCheckin = {};
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

    const payload = {
      studentList: selectedHostelCheckin.join("\n"),
      rowNos: selectedHostelCheckin.map((name) => hostelCheckinRowMap[name]),
      doneBy: selectedUser?.name || "",
    };

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

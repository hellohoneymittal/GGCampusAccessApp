let pendinghostelCheckoutList = {};
let selectedHostelCheckout = [];
let keyFiltersDatahostelCheckout = {};
let hostelCheckoutRowMap = {};

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
  hostelCheckoutRowMap = {};
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

  function formatDateTime(dateObj) {
    const dd = String(dateObj.getDate()).padStart(2, "0");
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const yyyy = dateObj.getFullYear();

    const hh = String(dateObj.getHours()).padStart(2, "0");
    const min = String(dateObj.getMinutes()).padStart(2, "0");

    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  }

  for (let i = 1; i < hcReqSheetData.length; i++) {
    const row = hcReqSheetData[i];
    const rowDate = PARSE_IST_DATE(row[0]);

    if (!isSameDay(rowDate, today)) continue;

    const requestedBy = row[3] || "";

    const reason = row[4] || "";
    const durationType = (row[5] || "").toLowerCase(); // day // min
    const durationValue = Number(row[6]) || 0;
    const purpose = row[7] || "";

    const now = new Date();
    const lastTimeDate = new Date(now);

    if (durationType === "day") {
      lastTimeDate.setDate(lastTimeDate.getDate() + durationValue);
    } else {
      lastTimeDate.setMinutes(lastTimeDate.getMinutes() + durationValue);
    }

    const lastTime = formatDateTime(lastTimeDate);

    (row[2]?.split("\n") || []).forEach((s) => {
      const name = s.trim();

      if (name) {
        requestSet.add(name);

        requestedByMap[name] = {
          requestedBy: requestedBy,
          reason: reason,
          durationType: durationType,
          duration: durationValue,
          purpose: purpose,
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

  categorized["Others"] = [];

  // =============================
  // 5. MAP
  // =============================
  pending.forEach((name) => {
    const originalKey = name.replace(/^s_/, "");

    const obj = allStudentsData[originalKey];
    const requestedByObj = requestedByMap[name] || {};

    let cls = obj?.studentOrgClassName;
    let clsHindi = CLASS_NAME_HINDI_MAP[cls] || cls;

    const finalObj = {
      value: obj?.studentHindiName || name,
      englishValue: name,
      class: cls || "",
      enableTime: "",
      requestedBy: requestedByObj.requestedBy || "",
      reason: requestedByObj.reason || "",
      durationType: requestedByObj.durationType || "",
      duration: requestedByObj.duration || "",
      purpose: requestedByObj.purpose || "",
      lastTime: requestedByObj.lastTime || "",
      rowNo: obj?.rowNo || "",
    };

    hostelCheckoutRowMap[name] = obj?.rowNo || "";

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

  keyFiltersDatahostelCheckout = GET_UNIQUE_REQUESTED_BY_HC(requestedByMap);

  allData = categorized;

  return categorized;
}

function GET_UNIQUE_REQUESTED_BY_HC(data) {
  return {
    requestedBy: [
      ...new Set(
        Object.values(data)
          .map((obj) => obj.requestedBy || "")
          .filter(Boolean),
      ),
    ],
  };
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
      showSelectAll: false,
      showFilters: true,
      showCategoryView: false,
      showDataBasedOnFilters: false,
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

    const approvedBy = selectedUser?.name || "";
    const allStudentObjects = [];

    // allData flatten
    Object.values(allData || {}).forEach((arr) => {
      arr.forEach((obj) => allStudentObjects.push(obj));
    });

    const grouped = {};

    selectedHostelCheckout.forEach((selectedName) => {
      const obj = allStudentObjects.find(
        (x) => x.englishValue.trim() === selectedName.trim(),
      );

      if (!obj) return;

      const requestedBy = obj.requestedBy || "";
      const reason = obj.reason || "";
      const durationType = obj.durationType || "";
      const duration = obj.duration || "";
      const purpose = obj.purpose || "";
      const lastTime = obj.lastTime || "";

      const key = `${requestedBy}__${reason}__${durationType}__${duration}__${purpose}`;

      if (!grouped[key]) {
        grouped[key] = {
          requestedBy,
          reason,
          durationType,
          duration,
          purpose,
          lastTime,
          studentList: [],
          rowNos: [],
        };
      }

      grouped[key].studentList.push(selectedName);

      // row map se row add karo
      grouped[key].rowNos.push(hostelCheckoutRowMap[selectedName] || "");
    });

    const payload = Object.values(grouped).map((g) => ({
      studentList: g.studentList.join("\n"),
      requestedBy: g.requestedBy,
      reason: g.reason,
      durationType: g.durationType,
      duration: g.duration,
      purpose: g.purpose,
      lastTime: g.lastTime,
      approvedBy: approvedBy,
      rowNos: g.rowNos.filter(Boolean),
    }));

    console.log("Sending:", payload);

    const res = await CALL_API("SAVE_HOSTEL_CHECKOUT_APPROVAL_DATA", payload);

    if (res?.status) {
      resetHostelCheckoutForm();
      SHOW_SUCCESS_POPUP("Saved successfully ✅");
    } else {
      SHOW_ERROR_POPUP("Error saving data ❌");
    }
  } catch (err) {
    console.error(err);
    SHOW_ERROR_POPUP("Something went wrong");
  }
}

function resetHostelCheckoutForm() {
  removeSelectedDataFromPendingEntryHostelCheckout();
  selectedHostelCheckout = [];
  populateMultiSelectDropdownHostelCheckout();
}

function removeSelectedDataFromPendingEntryHostelCheckout() {
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

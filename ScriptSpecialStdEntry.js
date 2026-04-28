let splPendingStdEntryList = {};
let splSelectedStdEntry = [];
let splKeyFiltersDataStdEntry = {};
let allData = {};

CREATE_MULTI_SELECT_DROPDOWN_WITH_CATEGORY_WITH_KEYFILTER({
  containerId: "splStdEntry-dynamic-dropdown-container",
  title: "Select",
  options: [],
  callback: () => {},
  controls: {
    showSelectAll: false,
    showFilters: false,
  },
  keyFilters: {},
});

function GET_UNIQUE_REQUESTED_BY(data) {
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

function PROCESS_DAILY_ENTRY_DATA(
  splEntryData,
  specialEntryRequestData,
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
  for (let i = 1; i < specialEntryRequestData.length; i++) {
    const row = specialEntryRequestData[i];
    const rowDate = PARSE_IST_DATE(row[0]);

    if (!isSameDay(rowDate, today)) continue;

    const requestedBy = row[3] || "";
    const reason = row[4] || "";
    const duration = row[5] || "";

    const now = new Date();
    const lastTimeDate = new Date(now.getTime() + duration * 60000);

    const dd = String(lastTimeDate.getDate()).padStart(2, "0");
    const mmDate = String(lastTimeDate.getMonth() + 1).padStart(2, "0");
    const yyyy = lastTimeDate.getFullYear();

    const hh = String(lastTimeDate.getHours()).padStart(2, "0");
    const mm = String(lastTimeDate.getMinutes()).padStart(2, "0");

    const lastTime = `${dd}/${mmDate}/${yyyy} ${hh}:${mm}`;

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
  for (let i = 1; i < splEntryData.length; i++) {
    const row = splEntryData[i];
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

  // ✅ NEW: Others category
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

function splPopulateMultiSelectDropdownEntry() {
  UPDATE_MULTI_SELECT_DROPDOWN_WITH_CATEGORY_WITH_KEYFILTER(
    "splStdEntry-dynamic-dropdown-container",
    splPendingStdEntryList,
    (data) => {
      console.log(data);
      splSelectedStdEntry = data.map((item) =>
        typeof item === "object" ? item.englishValue : item,
      );
    },
    {
      showSelectAll: true,
      showFilters: true,
    },
    splKeyFiltersDataStdEntry,
  );
}

async function ggSplStdEntryBtnClick() {
  const response = await CALL_API("GET_SPL_ENTRY_RAW_DATA", {});
  debugger;
  splPendingStdEntryList = PROCESS_DAILY_ENTRY_DATA(
    response?.data?.splEntryData,
    response?.data?.specialEntryRequestData,
    response?.data?.allStudentsData,
  );
  console.log("Pending List - ", splPendingStdEntryList);

  splPopulateMultiSelectDropdownEntry();
  SHOW_SPECIFIC_DIV("splStdEntryPopup");
  SET_DIV_TITLE("splStdEntryPopup", "Special Entry Check in System");
}

async function splStdEntrySubClick() {
  try {
    if (!splSelectedStdEntry.length) {
      SHOW_ERROR_POPUP("Please select students");
      return;
    }

    const approvedBy = selectedUser?.name || "";
    const allStudentObjects = [];
    debugger;
    Object.values(allData).forEach((arr) => {
      arr.forEach((obj) => allStudentObjects.push(obj));
    });

    const grouped = {};

    splSelectedStdEntry.forEach((selectedName) => {
      const obj = allStudentObjects.find(
        (x) => x.englishValue === selectedName,
      );

      if (!obj) return;

      const requestedBy = obj.requestedBy || "";
      const duration = obj.duration || "";
      const reason = obj.reason || "";
      const lastTime = obj.lastTime || "";
      const key = `${requestedBy}__${duration}`;

      if (!grouped[key]) {
        grouped[key] = {
          requestedBy,
          reason,
          duration,
          studentList: [],
          lastTime,
        };
      }

      grouped[key].studentList.push(selectedName);
    });

    const data = Object.values(grouped).map((g) => ({
      studentList: g.studentList.join("\n"),
      requestedBy: g.requestedBy,
      reason: g.reason,
      lastTime: g.lastTime,
      approvedBy,
      duration: g.duration,
    }));

    const res = await CALL_API("SAVE_SPECIAL_ENTRY_APPROVAL", data);

    if (res?.status) {
      resetSplEntryForm();
      SHOW_SUCCESS_POPUP("Saved successfully ✅");
    } else {
      SHOW_ERROR_POPUP("Error saving data ❌");
    }
  } catch (err) {
    console.error(err);
    SHOW_ERROR_POPUP("Something went wrong");
  }
}

function resetSplEntryForm() {
  splRemoveSelectedDataFromPendingEntry();
  splSelectedStdEntry = [];
  splPopulateMultiSelectDropdownEntry();
}

function splRemoveSelectedDataFromPendingEntry() {
  // selected ka unique set banao (fast lookup)
  const selectedSet = new Set(
    splSelectedStdEntry.map((s) =>
      typeof s === "object" ? s.englishValue : s,
    ),
  );

  Object.keys(splPendingStdEntryList).forEach((cls) => {
    splPendingStdEntryList[cls] = splPendingStdEntryList[cls].filter(
      (student) => {
        const key =
          typeof student === "object" ? student.englishValue : student;

        return !selectedSet.has(key);
      },
    );

    if (splPendingStdEntryList[cls].length === 0) {
      delete splPendingStdEntryList[cls];
    }
  });
}

function splStdEntryBackBtnClick() {
  SHOW_SPECIFIC_DIV("menuPopup");
}

async function splStdEntryPopupRefClick() {
  await ggSplStdEntryBtnClick();
}

function SHOW_ADD_MORE_BOX() {
  document.getElementById("addMoreRow").style.display = "flex";
}

function ADD_MORE_ROW() {
  const box = document.getElementById("multiStudentBox");

  const row = document.createElement("div");
  row.className = "add-more-input-row";

  row.innerHTML = `
    <input
      type="text"
      class="manual-student-input"
      placeholder="Enter Student Name / ID"
    />
  `;

  box.appendChild(row);
}

function ADD_ALL_MANUAL_STUDENTS() {
  const inputs = document.querySelectorAll(".manual-student-input");

  const container = document.getElementById(
    "splStdEntry-dynamic-dropdown-container",
  );

  inputs.forEach((input) => {
    const val = input.value.trim();

    if (val) {
      const row = document.createElement("div");

      row.innerHTML = `
        <label style="display:block;padding:8px 0;">
          <input type="checkbox" checked>
          ${val}
        </label>
      `;

      container.prepend(row);
    }
  });

  // reset again one row only
  document.getElementById("multiStudentBox").innerHTML = `
    <div class="add-more-input-row">
      <input
        type="text"
        class="manual-student-input"
        placeholder="Enter Student Name / ID"
      />
    </div>
  `;
}

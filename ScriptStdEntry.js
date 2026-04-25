let pendingStdEntryList = {};
let selectedStdEntry = [];
let keyFiltersDataStdEntry = {};

CREATE_MULTI_SELECT_DROPDOWN_WITH_CATEGORY_WITH_KEYFILTER({
  containerId: "stdEntry-dynamic-dropdown-container",
  title: "Select",
  options: [],
  callback: () => {},
  controls: {
    showSelectAll: false,
    showFilters: false,
  },
  keyFilters: {},
});

function PROCESS_DAILY_ENTRY_DATA(exitData, allStudentsData, roleData) {
  const today = new Date();
  const presentMap = new Map(); // t_key → original key
  const exitSet = new Set();

  function isSameDay(d1, d2) {
    return (
      d1 &&
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  // =============================
  // 1. PRESENT (FROM allStudentsData)
  // =============================
  Object.keys(allStudentsData).forEach((key) => {
    const obj = allStudentsData[key];

    // Only tuition students
    if (obj.tutionTeacher && obj.tutionTeacher.trim() !== "") {
      const tKey = `t_${key}`; // display + matching key
      presentMap.set(tKey, key); // map t_key → original key
    }
  });

  // =============================
  // 2. EXIT
  // =============================
  for (let i = 1; i < exitData.length; i++) {
    const row = exitData[i];
    const rowDate = PARSE_IST_DATE(row[0]);
    if (!isSameDay(rowDate, today)) continue;

    (row[2]?.split("\n") || []).forEach((s) => {
      const name = s.trim();
      if (name) exitSet.add(name); // must match t_key format
    });
  }

  // =============================
  // 3. PENDING
  // =============================
  const pending = Array.from(presentMap.keys()).filter(
    (student) => !exitSet.has(student),
  );

  // =============================
  // 4. FILTER + MAP
  // =============================
  const filteredWithObj = pending
    .map((student) => {
      const originalKey = presentMap.get(student);
      return {
        name: student, // t_key
        obj: allStudentsData[originalKey],
      };
    })
    .filter(({ obj }) => {
      if (!obj) return false;

      if (roleData === "Admin") return true;
      if (roleData === "H Admin") return obj.hostler === "Y";
      if (roleData === "NH Admin") return obj.hostler === "N";

      return false;
    });

  // =============================
  // 5. CATEGORY (Hindi Keys)
  // =============================
  const ALL_CLASS_NAME =
    "Pre Nursery, Nursery, KG, UKG, I, II, III, IV, V, VI, VII, VIII, IX, X, XI, XII";

  const categorized = {};

  ALL_CLASS_NAME.split(",").forEach((c) => {
    const cls = c.trim();
    const clsHindi = CLASS_NAME_HINDI_MAP[cls] || cls;

    categorized[clsHindi] = [];
  });

  // =============================
  // FINAL DATA PUSH
  // =============================
  filteredWithObj.forEach(({ name, obj }) => {
    const cls = obj.studentOrgClassName;
    if (!cls) return;

    const clsHindi = CLASS_NAME_HINDI_MAP[cls] || cls;
    if (!categorized[clsHindi]) return;

    const engName = name; // already t_key
    const hindiName = obj.studentHindiName || obj.studentName;
    const modifiedHindiName = `t_${hindiName}`;

    categorized[clsHindi].push({
      value: modifiedHindiName,
      englishValue: engName,
      class: cls,
      enableTime: obj.lastClassTime || "",
      tutionTeacher: obj.tutionTeacher || "",
    });
  });

  // =============================
  // REMOVE EMPTY CLASSES
  // =============================
  Object.keys(categorized).forEach((cls) => {
    if (!categorized[cls].length) delete categorized[cls];
  });

  return categorized;
}

function populateMultiSelectDropdownEntry() {
  UPDATE_MULTI_SELECT_DROPDOWN_WITH_CATEGORY_WITH_KEYFILTER(
    "stdEntry-dynamic-dropdown-container",
    pendingStdEntryList,
    (data) => {
      console.log(data);
      selectedStdEntry = data.map((item) =>
        typeof item === "object" ? item.englishValue : item,
      );
    },
    {
      showSelectAll: true,
      showFilters: true,
    },
    keyFiltersDataStdEntry,
  );
}

async function ggStdEntryBtnClick() {
  const response = await CALL_API("GET_STD_ENTRY_RAW_DATA", {});
  const role = selectedUser?.role?.["Student Daily Exit Tracker Role"];

  pendingStdEntryList = PROCESS_DAILY_ENTRY_DATA(
    response?.data?.exitData,
    response?.data?.allStudentsData,
    role,
  );
  keyFiltersDataStdEntry = GET_KEY_FILTERS(response?.data?.allStudentsData, [
    "tutionTeacher",
  ]);
  console.log(pendingStdEntryList);
  populateMultiSelectDropdownEntry();
  SHOW_SPECIFIC_DIV("stdEntryPopup");
  SET_DIV_TITLE("stdEntryPopup", "Tution Student Entry System");
}

async function stdEntrySubClick() {
  try {
    if (!selectedStdEntry.length) {
      SHOW_ERROR_POPUP("Please select students");
      return;
    }

    const studentListStrEntry = selectedStdEntry.join("\n");

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
  selectedStdEntry = [];
  populateMultiSelectDropdownEntry();
}

function removeSelectedDataFromPendingEntry() {
  // selected ka unique set banao (fast lookup)
  const selectedSet = new Set(
    selectedStdEntry.map((s) => (typeof s === "object" ? s.englishValue : s)),
  );

  Object.keys(pendingStdEntryList).forEach((cls) => {
    pendingStdEntryList[cls] = pendingStdEntryList[cls].filter((student) => {
      const key = typeof student === "object" ? student.englishValue : student;

      return !selectedSet.has(key);
    });

    if (pendingStdEntryList[cls].length === 0) {
      delete pendingStdEntryList[cls];
    }
  });
}

function stdEntryBackBtnClick() {
  SHOW_SPECIFIC_DIV("menuPopup");
}

function GET_ALL_STUDENT_DATA(isExtendedColumnRequired = false) {
  try {
    const school_db = SpreadsheetApp.openById(
      "1iK2guH70XkRw4Haf38g9qnq34b6DRTmi2rqDHU0T6F4",
    );

    // =========================
    //  MAIN STUDENT SHEET
    // =========================
    const studentSheet = school_db.getSheetByName("Students");
    const studentData = studentSheet.getDataRange().getDisplayValues();
    const header = studentData[0];

    const COL = {
      NAME: header.indexOf("Name"),
      ACTIVE: header.indexOf("Active"),
      CLASS: header.indexOf("Class"),
      ADM_NO: header.indexOf("Admission Number"),
      GENDER: header.indexOf("Gender"),
      PASSWORD: header.indexOf("Password"),
      HOSTLER: header.indexOf("Hostler"),
      PEN: header.indexOf("PEN Number"),
      DATE_OF_ADMISSION: header.indexOf("Date of Admission"),
      HINDI_NAME: header.indexOf("Hindi Name"),
    };

    const students = {};

    for (let i = 1; i < studentData.length; i++) {
      const row = studentData[i];

      if (row[COL.ACTIVE]?.toString().trim().toUpperCase() !== "Y") continue;

      const studentName = row[COL.NAME].toString().trim();
      const studentHindiName =
        row[COL.HINDI_NAME]?.toString().trim() || studentName;
      const admissionNo = row[COL.ADM_NO].toString().trim();
      const className = row[COL.CLASS].toString().trim();

      const key = `${admissionNo}_${studentName}`;
      const studentNameWithId = `${studentName}_${admissionNo}`;
      const hindiKey = `${admissionNo}_${studentHindiName}`;

      students[key] = {
        studentOrgName: studentName,
        studentName: key,
        studentNameWithId: studentNameWithId,
        studentHindiName: hindiKey,

        active: "Yes",
        stdClass: className,
        gender: row[COL.GENDER]?.toString().trim() || "",
        hostler: row[COL.HOSTLER]?.toString().trim() || "N",
        penNumber: row[COL.PEN]?.toString().trim() || "",
        studentOrgClassName: getClassStandard(className),
        admissionDate:
          row[COL.DATE_OF_ADMISSION]?.toString()?.trim()?.split("/")[2] || "",
      };
    }

    // =========================
    //  STUDENT DETAILS (UPDATED)
    // =========================
    if (isExtendedColumnRequired) {
      const extSheet = school_db.getSheetByName("Student Details");
      if (!extSheet) throw new Error("Sheet 'Student Details' not found");

      const extData = extSheet.getDataRange().getDisplayValues();
      const extHeader = extData[0];

      const EXT_COL = {
        NAME: 0,
        ACTIVE: 1,
        ADM_NO: 2,
      };

      const dynamicStartIndex = 11; // 🔥 Column L

      for (let i = 1; i < extData.length; i++) {
        const row = extData[i];

        if (row[EXT_COL.ACTIVE]?.toString().trim().toUpperCase() !== "Y")
          continue;

        const studentName = row[EXT_COL.NAME].toString().trim();
        const admissionNo = row[EXT_COL.ADM_NO].toString().trim();

        const key = `${admissionNo}_${studentName}`;

        if (!students[key]) continue;

        for (let col = dynamicStartIndex; col < extHeader.length; col++) {
          const colName = extHeader[col];
          if (!colName) continue;

          students[key][colName] = row[col];
        }
      }
    }

    console.log(JSON.stringify(students, null, 2));
    return students;
  } catch (err) {
    console.error("GET_ALL_STUDENT_DATA Error:", err);
    throw err;
  }
}

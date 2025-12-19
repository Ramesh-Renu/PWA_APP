

export const compareObject = (a = {}, b = {}) => {
  if (a === b) return true;
  if (
    (Array.isArray(a) && !Array.isArray(b)) ||
    (!Array.isArray(a) && Array.isArray(b))
  )
    return false;
  const aggregate = { ...a, ...b };
  for (const key in aggregate) {
    if (typeof a[key] === "object" && typeof b[key] === "object") {
      return compareObject(a[key], b[key]);
    }
    if (a[key] !== b[key]) return false;
  }
  return true;
};

/**
 *
 * @param {Record<string,any>} data
 * @returns {Record<string,any>}
 */
export const trimObjectProperties = (data = {}) => {
  const newData = { ...data };
  for (const key in data) {
    if (Object.hasOwnProperty.call(data, key)) {
      const element = data[key];
      if (typeof element === "string") {
        newData[key] = element.trim();
      }
    }
  }
  return newData;
};

export const isObjectEmpty = (objectName) => {
  return (
    Object.keys(objectName).length === 0 && objectName.constructor === Object
  );
};

export const isArrayEmpty = (array) => {
  return array.length === 0;
};

export const isValidType = (name, allowType) => {
  for (let j = 0; j < allowType.length; j++) {
    let sCurExtension = allowType[j];
    if (
      name
        .substr(name.length - sCurExtension.length, sCurExtension.length)
        .toLowerCase() === sCurExtension.toLowerCase()
    ) {
      return true;
    }
  }
  return false;
};

export const validateFiles = (fileArray, allowFileType) => {
  return fileArray.filter((file) => isValidType(file.name, allowFileType));
};

export const hasScrollBar = (className) => {
  const element = document.querySelector(className);
  if (!element) {
    return false;
  }
  const hasScrollBar =
    element.clientHeight < element.scrollHeight ||
    element.clientWidth < element.scrollWidth;

  return hasScrollBar;
};

export const normalizeData = (data) => {
  const normalizedData = {
    entities: {},
    result: [],
  };

  data.forEach((item) => {
    const { id } = item;
    normalizedData.entities[id] = item;
    normalizedData.result.push(id);
  });

  return normalizedData;
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.getMonth() + 1; // Months are zero-based
  const year = date.getFullYear();

  const formattedDay = day < 10 ? `0${day}` : day;
  const formattedMonth = month < 10 ? `0${month}` : month;

  return `${formattedDay}/${formattedMonth}/${year}`;
};

export const getFileTypeClassName = (fileType) => {
  if (!fileType) {
    return ""; // Return a default class or an empty string if file is not provided
  }

  const fileTypeParam = fileType.split("/")[0]; // 'image', 'application', etc.
  const fileFormat = fileType.split("/")[1];
  switch (fileTypeParam) {
    case "image":
    case ".png":
    case ".jpg":
    case ".jpeg":
    case ".gif":
    case ".bmp":
    case ".webp":
    case ".svg":
    case ".ico":
      return "icon-image-file";
    case "application":
      if (fileFormat == "pdf") {
        return "icon-pdf-file";
      } else if (fileFormat == "x-zip-compressed") {
        return "icon-archive-file";
      } else if (
        fileFormat ==
        "vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        return "icon-doc-file";
      } else if (
        fileFormat == "vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        return "icon-xls-file";
      } else {
        return "icon-unsupported-file";
      }
    case ".pdf":
      return "icon-pdf-file";
    case ".zip":
      return "icon-archive-file";
    case ".doc":
    case ".docx":
      return "icon-doc-file";
    case ".xls":
    case ".xlsx":
      return "icon-xls-file";
    default:
      return "icon-unsupported-file"; // Return a default class for unknown file types
  }
};

/** CALCULATE LUMINANCE CODE */
export const calculateLuminance = (r, g, b) => {
  const [rNormalized, gNormalized, bNormalized] = [r, g, b].map((x) => {
    x = x / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rNormalized + 0.7152 * gNormalized + 0.0722 * bNormalized;
};

/** Function to convert HEX to RGB **/
export const hexToRgb = (hex) => {
  let r = 0,
    g = 0,
    b = 0;

  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex[1] + hex[2], 16);
    g = parseInt(hex[3] + hex[4], 16);
    b = parseInt(hex[5] + hex[6], 16);
  }

  return { r, g, b };
};

/** Function to determine text color based on background color */
export const getOptimalTextColor = (backgroundColor) => {
  let r, g, b;
  if (backgroundColor.startsWith("#")) {
    const { r: red, g: green, b: blue } = hexToRgb(backgroundColor);
    r = red;
    g = green;
    b = blue;
  }
  const luminance = calculateLuminance(r, g, b);

  // If luminance is above 0.5, it’s light, so return dark text color, else light text color
  return luminance > 0.5 ? "black" : "white";
};

export const getMimeTypeFromExtension = (extension) => {
  switch (extension.toLowerCase()) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "pdf":
      return "application/pdf";
    case "csv":
      return "text/csv";
    case "json":
      return "application/json";
    // Add more cases for other file types as needed
    default:
      return "application/octet-stream"; // Default to generic binary data
  }
};
/**
 * Returns an array of years based on a provided configuration.
 * The function returns regular calendar years (e.g., 2023, 2024, 2025).
 *
 * @param {Object} [config={ previousYears: 1, currentYear: 1, nextYears: 1 }] - Configuration object for specifying year offsets.
 * @returns {Object[]} Array containing the years.
 */
export const getSingleYear = (
  config = { previousYears: 1, currentYear: 1, nextYears: 1 }
) => {
  const today = new Date();
  const currentYear = today.getFullYear();

  // Helper function to format the year as a string
  const formatYear = (year) => `${year}`;

  // Initialize the result array
  const result = [];

  // Initialize the ID counter
  let id = 0;

  // Add previous years based on config
  for (let i = config.previousYears; i > 0; i--) {
    result.push({
      id: id++, // Assign current id and then increment
      year: formatYear(currentYear - i),
    });
  }

  // Add the current year
  if (config.currentYear > 0) {
    result.push({
      id: id++, // Assign current id and then increment
      year: formatYear(currentYear),
    });
  }

  // Add future years based on config
  for (let i = 1; i <= config.nextYears; i++) {
    result.push({
      id: id++, // Assign current id and then increment
      year: formatYear(currentYear + i),
    });
  }

  return result;
};

/**
 * Returns an array of financial years based on a provided configuration.
 * The financial year runs from April 1 to March 31.
 *
 * @param {Object} [config={ previousYears: 5, currentFinancialYear: 1, nextFinancialYear: 1 }] - Configuration object for specifying year offsets.
 * @returns {Object[]} Array containing the financial years from the current year down to previous years, and optionally the next financial year.
 */
export const getFinancialYears = (
  config = { previousYears: 5, currentFinancialYear: 1, nextFinancialYear: 1 }
) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Determine the start year of the current financial year
  let startYear = currentMonth >= 3 ? currentYear : currentYear - 1;

  // Helper function to format the financial year string
  const formatYear = (year) => `${year}-${(year + 1).toString().slice(-2)}`;

  // Initialize the result array
  const result = [];

  // Add the current financial year
  result.push({
    id: config.currentFinancialYear,
    year: formatYear(startYear),
  });

  // Add previous financial years in reverse order
  for (let i = 1; i <= config.previousYears; i++) {
    result.push({
      id: config.currentFinancialYear + i,
      year: formatYear(startYear - i),
    });
  }

  // Add the next financial year if the config allows it
  if (config.nextFinancialYear > 0) {
    result.unshift({
      id: config.currentFinancialYear - 1,
      year: formatYear(startYear + 1),
    });
  }

  // Ensure unique IDs by removing duplicates
  const uniqueResult = result.reduce((acc, current) => {
    const x = acc.find((item) => item.id === current.id);
    if (!x) {
      return acc.concat([current]);
    }
    return acc;
  }, []);

  return uniqueResult;
};

/**
 * Returns an array of financial years from a specified start year up to the current financial year.
 * The financial year runs from April 1 to March 31.
 *
 * @param {string} startYear - The start year in "YYYY-YY" format (e.g., "2022-23").
 * @returns {Object[]} Array containing the financial years from the specified start year up to the current financial year.
 */
export const getFinancialYearsFromStart = (startYear) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Determine the start year of the current financial year
  const currentFinancialStartYear =
    currentMonth >= 3 ? currentYear : currentYear - 1;

  // Extract the starting year from the input
  const startYearParts = startYear.split("-");
  const startYearStart = parseInt(startYearParts[0]);

  // Helper function to format the financial year string
  const formatYear = (year) => `${year}-${(year + 1).toString().slice(-2)}`;

  // Initialize the result array
  const result = [];

  // Check if the starting year is valid
  if (startYearStart > currentFinancialStartYear) {
    throw new Error("Start year cannot be after the current financial year.");
  }

  // Populate the result array starting from the specified start year up to the current financial year
  let yearToAdd = startYearStart;

  while (yearToAdd <= currentFinancialStartYear) {
    result.push({
      id: currentFinancialStartYear - yearToAdd + 1,
      year: formatYear(yearToAdd),
    });
    yearToAdd++;
  }

  // Sort the result array in descending order of financial years
  result.sort((a, b) => {
    // Extract years from the 'year' property to sort correctly
    const yearA = parseInt(a.year.split("-")[0]);
    const yearB = parseInt(b.year.split("-")[0]);
    return yearB - yearA;
  });

  return result;
};

export const isOnlyWhitespaceHtml = (input) => {
  // Use a DOM parser to extract text content and handle <br> or similar elements
  const parser = new DOMParser();
  const doc = parser.parseFromString(input, "text/html");
  const body = doc.body;

  // Remove non-textual elements like <br>, <img>, etc., if they should be ignored
  body.querySelectorAll("br, img").forEach((el) => el.remove());

  // Get the remaining text content
  const textContent = body.textContent || "";

  // Check if the remaining text content is only whitespace
  return /^\s*$/.test(textContent);
};

export const isCharacterLimitExceeded = (input, maxLength = 1000) => {
  // Use a DOM parser to extract text content and handle <br> or similar elements
  const parser = new DOMParser();
  const doc = parser.parseFromString(input || "", "text/html");
  const body = doc.body;

  // Remove non-textual elements like <br>, <img>, etc., if they should be ignored
  body.querySelectorAll("br, img").forEach((el) => el.remove());

  // Get the remaining text content
  const textContent = body.textContent || "";
  const currentLength = textContent.length;
  const isExceeded = currentLength > maxLength;
  const remainingCharacters = isExceeded ? 0 : maxLength - currentLength;

  // Return an object with the character count, limit status, and remaining count
  return {
    characterCount: currentLength,
    isExceeded,
    remainingCharacters,
  };
};

export const getLimitedHtmlContent = (input, maxLength = 1000) => {
  // Use a DOM parser to extract text content and handle <br> or similar elements
  const parser = new DOMParser();
  const doc = parser.parseFromString(input, "text/html");
  const body = doc.body;

  // Remove non-textual elements like <br>, <img>, etc., if they should be ignored
  // body.querySelectorAll("br, img").forEach((el) => el.remove());

  // Get the remaining text content
  const textContent = body.textContent || "";

  // Check if the text content exceeds the max length
  if (textContent.length > maxLength) {
    // Truncate the HTML content while preserving structure
    let charCount = 0;
    const truncateNodes = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (charCount + node.textContent.length > maxLength) {
          node.textContent = node.textContent.slice(0, maxLength - charCount);
        }
        charCount += node.textContent.length;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        Array.from(node.childNodes).forEach((child) => {
          if (charCount < maxLength) {
            truncateNodes(child);
          } else {
            node.removeChild(child);
          }
        });
      }
    };

    truncateNodes(body);
  }

  // Return the modified HTML content
  return body.innerHTML;
};

export const getLimitedHtmlWithNewlineContent = (input, maxLength = 1000) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(input, "text/html");
  const body = doc.body;

  // Remove images but keep <br> elements
  // body.querySelectorAll("img").forEach((el) => el.remove());

  let charCount = 0;
  let reachedLimit = false;

  const truncateNodes = (node) => {
    if (reachedLimit) {
      // Allow only <img> and <br> elements if the limit is reached
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        (node.tagName === "IMG" ||
          (node.tagName === "P" && node.innerHTML.trim() === "<br>"))
      ) {
        return; // Keep images and line breaks
      } else {
        node.remove(); // Remove everything else
        return;
      }
    }

    if (node.nodeType === Node.TEXT_NODE) {
      let text = node.textContent;
      let length = text.length;

      if (charCount + length >= maxLength) {
        let cutoffIndex = maxLength - charCount;

        // If cutoffIndex lands on a space, adjust to prevent trimming the last word
        if (text[cutoffIndex - 1] === " ") {
          cutoffIndex--; // Move back one character to keep a word
        }

        node.textContent = text.slice(0, cutoffIndex);
        charCount = maxLength;
        reachedLimit = true;
      } else {
        charCount += length;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      let childNodes = Array.from(node.childNodes);
      for (let i = 0; i < childNodes.length; i++) {
        if (reachedLimit) {
          // Remove all remaining children
          while (node.childNodes[i]) {
            node.removeChild(node.childNodes[i]);
          }
          break;
        } else {
          truncateNodes(childNodes[i]);
        }
      }
    }
  };

  truncateNodes(body);

  return body.innerHTML;
};

export const selectedQuatreColor = [
  { id: 1, colorCode: "#00ADF0", name: "Q1" },
  { id: 2, colorCode: "#44EBB1", name: "Q2" },
  { id: 3, colorCode: "#E283BB", name: "Q3" },
  { id: 4, colorCode: "#384955", name: "Q4" },
  { id: 5, colorCode: "#EC6240", name: "H1" },
  { id: 6, colorCode: "#9CADBC", name: "H2" },
  { id: 7, colorCode: "#3FC08C", name: "Annual" },
];

export const getLast30DaysDate = (date = new Date()) => {
  // Clone the date to avoid modifying the original one
  const last30DaysDate = new Date(date);
  last30DaysDate.setDate(date.getDate() - 30); // Subtract 30 days

  // Format the date as YYYY-MM-DD
  const formattedDate = `${last30DaysDate.getFullYear()}-${String(
    last30DaysDate.getMonth() + 1
  ).padStart(2, "0")}-${String(last30DaysDate.getDate()).padStart(2, "0")}`;

  return formattedDate;
};

/** USED TO GENERATE EXCEL FILE AND PERFORM DOWNLOAD */
// export const generateExcelFile = (data, reportName = null) => {
//   const ws = XLSX.utils.aoa_to_sheet(data);

//   const wb = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

//   const wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" });
//   const date = new Date();
//   const formattedDate = date.toLocaleDateString("en-GB").replace(/\//g, "");
//   const formattedTime = date
//     .toLocaleTimeString("en-GB", { hour12: false })
//     .replace(/:/g, "");
//   const filename = reportName || `Report_${formattedDate}${formattedTime}.xlsx`;

//   // Create a Blob from the binary string and download
//   const buf = new ArrayBuffer(wbout.length);
//   const view = new Uint8Array(buf);
//   for (let i = 0; i < wbout.length; i++) {
//     view[i] = wbout.charCodeAt(i) & 0xff;
//   }
//   const blob = new Blob([buf], { type: "application/octet-stream" });
//   const link = document.createElement("a");
//   link.href = URL.createObjectURL(blob);
//   link.download = filename;
//   link.click();
// };

export const updateMatserInfoWithValue = (companyInfo, sourceData) => {
  const updatedCompanyInfo = { ...companyInfo };

  // Helper map: field in companyInfo => source list & matcher
  const fieldMappings = {
    language: {
      listKey: "customerLanguageList",
      idKey: "languageId",
    },
    primaryMarket: {
      listKey: "marketRegionList",
      idKey: "marketid",
    },
    industrySector: {
      listKey: "industryData",
      idKey: "industryid",
    },
    country: {
      listKey: "countryList",
      idKey: "country_id",
    },
    region: {
      listKey: "regionList", // special handling below
      idKey: "regionId",
    },
    orderVal_Currency: {
      listKey: "currency",
      idKey: "country_id",
    },
    startUpFee_Currency: {
      listKey: "currency",
      idKey: "country_id",
    },
    fontFamily: {
      listKey: "fontFamilyList",
      idKey: "font_id",
    },
    instrument: {
      listKey: "instrumentList",
      idKey: "id",
    },

    // You can extend here:
    // tools: { listKey: "toolsList", idKey: "toolId" },
    // currency: { listKey: "currencyList", idKey: "currencyId" },
  };

  Object.entries(fieldMappings).forEach(([field, config]) => {
    const sourceList = sourceData?.[config.listKey];

    if (!sourceList) return;
    // if (field === "region") {
    //   updatedCompanyInfo.region = (companyInfo?.region || [])
    //     .map((id) => {
    //       for (const region of sourceList) {
    //         const match = region.countryList?.find((c) => c.countryId === id);
    //         if (match) return match;
    //       }
    //       return null;
    //     })
    //     .filter(Boolean);
    // } else {
    updatedCompanyInfo[field] = (companyInfo?.[field] || [])
      .map((id) => sourceList?.find((item) => item?.[config.idKey] === id))
      .filter(Boolean);
    // }
  });

  return updatedCompanyInfo;
};

export const stripMasterInfoToIdOnly = (companyInfo = {}) => {
  // Field config: key in companyInfo => ID key to extract
  const fieldIdMappings = {
    language: "languageId",
    primaryMarket: "marketid",
    region: "regionId",
    industrySector: "industryid",
    country: "country_id",
    orderVal_Currency: "country_id",
    startUpFee_Currency: "country_id",
    fontFamily: "font_id",
    instrument: "id",
    // Add more fields here as needed
  };

  const updatedInfo = { ...companyInfo };

  Object.entries(fieldIdMappings).forEach(([key, idKey]) => {
    if (Array.isArray(companyInfo[key])) {
      updatedInfo[key] = companyInfo[key].map((item) =>
        typeof item === "object" && item !== null ? item[idKey] : item
      );
    }
  });

  return updatedInfo;
};

export const renderOrderType = (
  ids,
  orderType,
  background,
  color,
  className
) => {
  const isArrayOfNumbers =
    Array.isArray(ids) && ids?.every((item) => typeof item === "number");
  const orders = isArrayOfNumbers ? ids : ids?.orderType;
  if (!Array.isArray(orders) || !orderType) return "";
  const typeOfOrder = orders
    .map((id) => orderType.find((o) => o.status_id === id))
    .filter(Boolean);
  const getOrderTypeStyles = (code) => {
    switch (code) {
      case "NC":
        return { backgroundColor: "#F6F7FB", color: "#0077B6" };
      case "PLG":
        return { backgroundColor: "#E8F5E9", color: "#388E3C" };
      case "UP":
        return { backgroundColor: "#FFE0CE", color: "#FF5C00" };
      case "RD":
        return { backgroundColor: "#F0EBFE", color: "#9A71F7" };
      default:
        return { backgroundColor: "#ECEFF1", color: "#37474F" };
    }
  };


  return typeOfOrder.map((item, i) => {
    const style = getOrderTypeStyles(item.code);
    const appliedStyles = {
      ...(background && { backgroundColor: style.backgroundColor }),
      ...(color && { color: style.color }),
      fontWeight: !className && "500",
      fontSize: !className && "12px",
    };

    return (
      <div
        key={i}
        className={`px-3 rounded py-1 ${className}`}
        style={appliedStyles}
      >
        {item.name}
      </div>
    );
  });
};



export const isValidFileSelection = (
  allselectedFiles,
  restrictedFileTypes,
  maxSizeMB = 50
) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  let totalSize = 0;

  const emptyFiles = [];
  const invalidTypeFiles = [];

  for (const file of allselectedFiles) {
    const fileSize = file?.size || 0;
    const fileName = file?.name || "";

    if (fileSize === 0) {
      emptyFiles.push(fileName);
    }

    const extension = fileName.includes(".")
      ? fileName.split(".").pop().toLowerCase()
      : "";

    if (restrictedFileTypes && restrictedFileTypes.includes(extension)) {
      invalidTypeFiles.push({ name: fileName, ext: extension });
    }

    totalSize += fileSize;
  }

  // Check for empty files
  if (emptyFiles.length > 0) {
    return {
      data: [],
      isValid: false,
      reason:
        emptyFiles.length === 1
          ? `File "${emptyFiles[0]}" is empty (0 bytes).`
          : `Files "${emptyFiles.join(", ")}" are empty (0 bytes).`,
    };
  }

  // Check for invalid type files
  if (invalidTypeFiles.length > 0) {
    return {
      data: [],
      isValid: false,
      reason:
        invalidTypeFiles.length === 1
          ? `File "${invalidTypeFiles[0].name}" has unsupported type or malicious. Please choose a different file.`
          : `Files ${invalidTypeFiles
              .map((f) => `"${f.name}" (.${f.ext})`)
              .join(
                ", "
              )} have unsupported types. Please choose different files.`,
    };
  }

  // Check total size
  if (totalSize > maxSizeBytes) {
    return {
      data: [],
      isValid: false,
      reason: `Total file size exceeds the limit of ${maxSizeMB} MB. Please choose smaller files.`,
    };
  }

  return {
    data: allselectedFiles,
    isValid: true,
    reason: "",
  };
};
export const getValue = (obj, path) => {
  try {
    return path
      .replace(/\[(\d+)\]/g, ".$1") // convert [0] → .0
      .split(".")
      .reduce(
        (acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined),
        obj
      );
  } catch {
    return undefined;
  }
};

export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
};

export const checkMandatoryFields = (
  companyData,
  beforeProcessOrderSalesMandatoryField,
  step = null
) => {
  const stepsToCheck = step
    ? [step]
    : Object.keys(beforeProcessOrderSalesMandatoryField);

  for (const s of stepsToCheck) {
    // normalize key
    const config = beforeProcessOrderSalesMandatoryField[String(s)];
    if (!config) continue;

    // allow fields to be either an array OR a function(companyData)
    const fields =
      typeof config.fields === "function"
        ? config.fields(companyData)
        : config.fields;

    if (!fields || fields.length === 0) continue;

    for (const fieldPath of fields) {
      const value = getValue(companyData, fieldPath);
      if (isEmpty(value)) {
        return false; // ❌ some field missing
      }
    }
  }

  return true; // ✅ all filled
};

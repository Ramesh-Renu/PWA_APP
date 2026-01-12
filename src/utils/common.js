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

export const selectedQuatreColor = [
  { id: 1, colorCode: "#00ADF0", name: "Q1" },
  { id: 2, colorCode: "#44EBB1", name: "Q2" },
  { id: 3, colorCode: "#E283BB", name: "Q3" },
  { id: 4, colorCode: "#384955", name: "Q4" },
  { id: 5, colorCode: "#EC6240", name: "H1" },
  { id: 6, colorCode: "#9CADBC", name: "H2" },
  { id: 7, colorCode: "#3FC08C", name: "Annual" },
];

export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
};
export const renderBookingStatus = (id, data) => {
    const location = data.filter((loc) => loc.status_id === id);
    return location ? location : "N/A";
  };

export const renderLocation = (id, data) => {
  const location = data.filter((loc) => loc.id === id);
  return location ? location : "N/A";
};

export const renderArea = (id, data) => {
  const area = data.filter((area) => area.id === id);
  return area ? area : "N/A";
};

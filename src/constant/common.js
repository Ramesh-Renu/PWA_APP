const appConstants = Object.freeze({
  // Validation patterns
  VALIDATION_PATTERNS: {
    onlyAlphabet: "^[a-zA-Z]+$", // Applicable for alphapet field
    alphaNumeric: "[أ-يa-zA-Z-_()0-9]+", // Applicable for alpha Numeric field
    alphaNumericWithDot: "[أ-يa-zA-Z-_()0-9.]+", // Applicable for alpha Numeric with dot
    alphaNumericWithSpace: "[أ-يa-zA-Z-_()0-9 ]+", // Applicable for alpha Numeric with space
    onlyNumber: "^[0-9]*$", // Applicable for Number field
    alphabetWithSpace: "^[a-zA-Z ]+$", // Applicable for alphapet with space
    phonenumber: "[+0-9 ]+", // Applicable for phone Number field
    phonenumberHyphens: "^[+0-9\\- ]+$", //allow numbers with hyphens
    email:
      "([a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]{1}[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]*)((@[a-zA-Z-]{2}[a-zA-Z-]*)[\\.](([a-zA-Z]{3}|[a-zA-Z]{2})|([a-zA-Z]{3}|[a-zA-Z]{2}).[a-zA-Z]{2}))", // Applicable for email field
    countryCode: "[+0-9]+", // Applicable for country code field
    password: "^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$",
    url: /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/, // Applicable for URL field
    customUrl: /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*\.com(?:\/[^\s/?#]+(?:\?(?:[^\s#&]+(?:=[^\s&]*)?&)*(?:[^\s#&]+(?:=[^\s&]*)?)?)?(?:#[^\s]*)?)?(?:\/[^\s]*)?(?:\/|(?![^\s]))?$/,
    priceFormatPattern: "[0-9.,]+", // Applicable for price format
    colorPickerPattern: "^#[0-9A-Fa-f]{0,6}$",
  },

  pageOffSet: 0,
  pageSize: 20,
  listOffSet: 0,
  listSize: 10,
  maxFileSize: 50,
  restrictedFileTypes: [
    // Executable & system files
    "exe",
    "msi",
    "bat",
    "cmd",
    "com",
    "scr",
    "pif",
    "cpl",
    "dll",
    "sys",
    "drv",

    // Script & code files (cross-site scripting or malware risk)
    "js",
    "vbs",
    "sh",
    "php",
    "py",
    "rb",
    "pl",
    "asp",
    "aspx",
    "jsp",
    "jar",

    // Disk and ISO related
    "vhd",
    "vhdx",
    "vmdk",
    "ova",
    "ovf",
    "iso",
    "dmg",
    "img",
    "vmdk",

    // Dangerous documents/macros
    "docm",
    "xlsm",
    "pptm",
    "dotm",
    "xltm",
    "ppam",

    // Misc (abuse-prone or misleading)
    "torrent",
    "apk",
    "bin",
    "dat",
    "ps1",
    "db",
    "sql",
  ],
  intervalTime: 120000,
  commentsIntervalTime: 60000,
  charCountLimit: {
    comments: 5000,
    compnayDescription: 5000,
    brandingNotes: 5000,
  },
  orderCreationMandatoryField: {
    1: {
      fields: [
        "companyName",
        // "companyCode",
        "primaryMarket",
        "language",
        "websiteLink",
      ],
      tab_restiction: [2, 3, 5, 7],
    },
    2: {
      fields: [
        "tools.orderDate",
        "tools.toolsDetails[0].toolsId",
        "tools.toolsDetails[1].toolsId",
        "tools.toolsDetails[0].package",
        // "tools.toolsDetails[1].package",
      ],
      tab_restiction: [],
    },
    4: {
      fields: [],
      tab_transition: [],
    },
    3: {
      fields: [],
      tab_transition: [],
    },
    6: {
      fields: [],
      tab_transition: [],
    },
    5: {
      fields: [],
      tab_transition: [],
    },
    7: {
      fields: [],
      tab_transition: [],
    },
    8: {
      fields: [],
      tab_transition: [],
    },
    9: {
      fields: [],
      tab_transition: [],
    },
    10: {
      fields: [],
      tab_transition: [],
    },
    11: {
      fields: [],
      tab_transition: [],
    },
    12: {
      fields: [],
      tab_transition: [],
    },
    13: {
      fields: [],
      tab_transition: [],
    },
    14: {
      fields: [],
      tab_transition: [],
    },
    15: {
      fields: [],
      tab_transition: [],
    },
    16: {
      fields: [],
      tab_transition: [],
    },
    17: {
      fields: [],
      tab_transition: [],
    },
    18: {
      fields: [],
      tab_transition: [],
    },
    19: {
      fields: [],
      tab_transition: [],
    },
    20: {
      fields: [],
      tab_transition: [],
    },
    21: {
      fields: [],
      tab_transition: [],
    },
  },
  beforeProcessOrderSalesMandatoryField: {
    1: {
      fields: [
        "companyName",
        // "companyCode",
        "primaryMarket",
        "language",
        "websiteLink",
      ],
      tab_restiction: [2, 3, 5, 7],
    },
    2: {
      fields: [
        "tools.orderDate",
        "tools.toolsDetails[0].toolsId",
        "tools.toolsDetails[1].toolsId",
        "tools.toolsDetails[0].package",
        // "tools.toolsDetails[1].package",
      ],
      tab_restiction: [],
    },
    3: {
      fields: [],
      tab_transition: [],
    },
    4: {
      fields: [],
      tab_transition: [],
    },
    5: {
      fields: [],
      tab_transition: [],
    },
    6: {
      fields: [],
      tab_transition: [],
    },
    7: {
      fields: [],
      tab_transition: [],
    },
    8: {
      fields: [],
      tab_transition: [],
    },
    9: {
      fields: [],
      tab_transition: [],
    },
    10: {
      fields: [],
      tab_transition: [],
    },
    11: {
      fields: [],
      tab_transition: [],
    },
    12: {
      fields: [],
      tab_transition: [],
    },
    13: {
      fields: [],
      tab_transition: [],
    },
    14: {
      fields: [],
      tab_transition: [],
    },
    15: {
      fields: [],
      tab_transition: [],
    },
    16: {
      fields: [],
      tab_transition: [],
    },
    17: {
      fields: [],
      tab_transition: [],
    },
    18: {
      fields: [],
      tab_transition: [],
    },
    19: {
      fields: [],
      tab_transition: [],
    },
    20: {
      fields: [],
      tab_transition: [],
    },
    21: {
      fields: [],
      tab_transition: [],
    },
  },
  afterProcessOrderSalesMandatoryField: {
    1: {
      fields: [],
      tab_restiction: [],
    },
    2: {
      fields: [],
      tab_restiction: [],
    },
    3: {
      fields: [],
      tab_transition: [],
    },
    4: {
      fields: [],
      tab_transition: [],
    },
    5: {
      fields: [],
      tab_transition: [],
    },
    6: {
      fields: [],
      tab_transition: [],
    },
    7: {
      fields: [],
      tab_transition: [],
    },
    8: {
      fields: [],
      tab_transition: [],
    },
    9: {
      fields: [],
      tab_transition: [],
    },
    10: {
      fields: [],
      tab_transition: [],
    },
    11: {
      fields: [],
      tab_transition: [],
    },
    12: {
      fields: [],
      tab_transition: [],
    },
    13: {
      fields: [],
      tab_transition: [],
    },
    14: {
      fields: [],
      tab_transition: [],
    },
    15: {
      fields: [],
      tab_transition: [],
    },
    16: {
      fields: [],
      tab_transition: [],
    },
    17: {
      fields: [],
      tab_transition: [],
    },
    18: {
      fields: [],
      tab_transition: [],
    },
    19: {
      fields: [],
      tab_transition: [],
    },
    20: {
      fields: [],
      tab_transition: [],
    },
    21: {
      fields: [],
      tab_transition: [],
    },
  },
  afterProcessOrderOnboardMandatoryField: {
    1: {
      fields: [
        "companyName",
        "region",
        "primaryMarket",
        "country",
        "websiteLink",
        "instrument",
      ],
      tab_restiction: [],
    },
    2: {
      fields: ["tools.deliveryDate"],
      tab_restiction: [],
    },
    3: {
      fields: [],
      tab_transition: [],
    },
    4: {
      fields: [],
      tab_transition: [],
    },
    5: {
      fields: [
        "primaryColor",
        "secondaryColor",
        "fontFamily",
        "fontColor",
        "fontSize",
        "attachments",
      ],
      tab_transition: [],
    },
    6: {
      fields: [],
      tab_transition: [],
    },
    7: {
      fields: [],
      tab_transition: [],
    },

    8: {
      fields: [],
      tab_transition: [],
    },
    9: {
      fields: [],
      tab_transition: [],
    },
    10: {
      fields: [],
      tab_transition: [],
    },
    11: {
      fields: [],
      tab_transition: [],
    },
    12: {
      fields: [],
      tab_transition: [],
    },
    13: {
      fields: [],
      tab_transition: [],
    },
    14: {
      fields: [],
      tab_transition: [],
    },
    15: {
      fields: [],
      tab_transition: [],
    },
    16: {
      fields: [],
      tab_transition: [],
    },
    17: {
      fields: [],
      tab_transition: [],
    },
    18: {
      fields: [],
      tab_transition: [],
    },
    19: {
      fields: [],
      tab_transition: [],
    },
    20: {
      fields: [],
      tab_transition: [],
    },
    21: {
      fields: [],
      tab_transition: [],
    },
  },
  afterProcessOrderSalesCanEditField: {
    1: {
      fields: [],
    },
    2: {
      fields: [],
    },
    5: {
      fields: ["branding_guidelines"],
    },
    7: {
      fields: ["confidential_attachment", "common_attachment"],
    },
  },
  afterProcessOrderOnboardCanEditField: {
    1: {
      fields: [
        "region",
        "primaryMarket",
        "country",
        "websiteLink",
        "instrument",
      ],
    },
    2: {
      fields: ["tools.deliveryDate"],
    },
    5: {
      fields: [
        "primaryColor",
        "secondaryColor",
        "fontFamily",
        "fontColor",
        "fontSize",
        "branding_guidelines",
      ],
    },
    7: {
      fields: ["common_attachment"],
      ticket_flow_dept: ["OB"],
    },
  },
});
export default appConstants;

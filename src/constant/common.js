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
});
export default appConstants;

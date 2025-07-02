const fs = require("fs");
const path = require("path");

function getfiltered_language(lang) {
  const languageSet = new Set([
    "hi", "gom", "kn", "doi", "brx", "ur", "ta", "ks",
    "as", "bn", "mr", "sd", "mai", "pa", "ml", "mni",
    "te", "sa", "ne", "sat", "gu", "or"
  ]);

  return languageSet.has(lang) ? lang : "en";
}

function convertDateFormat(dateStr) {
  const [day, month, year] = dateStr.split("-");
  return `${month}-${day}-${year}`;
}


function cleanAmount(amount) {
  return amount % 1 === 0 ? parseInt(amount) : parseFloat(amount);
}

module.exports = {
  getfiltered_language,
  convertDateFormat,
  cleanAmount
};
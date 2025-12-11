// src/services/parsers/parseFile.js
import parseBTG from "./btgParser";
//import parseC6 from "./c6Parser";
//import parseBradesco from "./bradescoParser";
//import parseNubank from "./nubankParser";
//import parseBanrisul from "./banrisulParser";
//import parseCaixa from "./caixaParser";

/**
 * Generic parser entry point.
 * @param {File} file - The uploaded file
 * @param {string} bankName - Bank selected by user (e.g. "BTG", "C6", etc.)
 * @returns {Promise<Array>} Array of normalized transaction objects
 */
export async function parseFile(file, bankName) {
  console.log(`🟢 Parsing file for bank: ${bankName}`);
  console.log(`🟢 The file: ${file}`);
  switch (bankName.toLowerCase()) {
    case "btg":
      return await parseBTG(file);
    case "c6":
        return "WIP"
      //return await parseC6(file);
    case "bradesco":
        return "WIP"
      //return await parseBradesco(file);
    case "nubank":
        return "WIP"
      //return await parseNubank(file);
    case "banrisul":
        return "WIP"
      //return await parseBanrisul(file);
    case "caixa":
        return "WIP"
      //return await parseCaixa(file);
    default:
      throw new Error(`Unsupported bank: ${bankName}`);
  }
}

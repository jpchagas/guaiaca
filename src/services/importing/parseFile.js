import parseBTG from "../parsers/btgParser";


const parsers = {
  btg: parseBTG,
};

export async function parseFile(
  file,
  bankName
) {
  const parser =
    parsers[bankName.toLowerCase()];

  if (!parser) {
    throw new Error(
      `Unsupported bank: ${bankName}`
    );
  }

  return await parser(file);
}
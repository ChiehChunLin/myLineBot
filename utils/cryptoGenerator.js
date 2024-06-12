const crypto = require("crypto");
const { promisify } = require("util");
const randomBytes = promisify(crypto.randomBytes);

const KEY_LENGTH = 20;

async function getCryptoID() {
  const rawBytes = await randomBytes(KEY_LENGTH);
  return rawBytes.toString("hex");
}

module.exports = { getCryptoID };

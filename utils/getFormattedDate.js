function getFormattedDate() {
  //YYYY-MM-DD
  return new Date().toISOString().slice(0, 10);
}

module.exports = { getFormattedDate };

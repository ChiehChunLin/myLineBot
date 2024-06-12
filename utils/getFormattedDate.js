function getFormattedDate() {
  //YYYY-MM-DD
  return new Date().toISOString().slice(0, 10);
}
function getSerialTimeFormat() {
  //YYYYMMDDHHmmss
  return Number(
    new Date().toLocaleString("af-ZA", { hour12: false }).replace(/-| |:|/g, "")
  );
}
function getLogTimeFormat() {
  //YYYY-MM-DD HH:mm:ss
  return new Date().toLocaleString("af-ZA", { hour12: false });
}
function getCalendarDate() {
  //Oct 12. 2023
  const date = new Date();
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const formattedDate = `${month} ${day}. ${year}`;

  return formattedDate;
}

module.exports = { getFormattedDate };

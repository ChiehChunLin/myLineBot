async function setText(conn, user_id, baby_id, content, date) {
  const [rows] = await conn.query(
    `
       INSERT INTO texts (user_id,baby_id,content,textDate)
       VALUES (?,?,?,?)
      `,
    [user_id, baby_id, content, date]
  );
  // console.log("setImage:" + JSON.stringify(rows));
  if (rows.length == 0 || !rows.insertId) {
    return undefined;
  } else {
    return rows.insertId;
  }
}
async function getTextByDate(conn, baby_id, date) {
  const [rows] = await conn.query(
    `
       SELECT * FROM texts where baby_id = ? AND textDate = ?
      `,
    [baby_id, date]
  );
  if (rows.length == 0) {
    return undefined;
  } else {
    return rows;
  }
}
module.exports = {
  setText,
  getTextByDate
};

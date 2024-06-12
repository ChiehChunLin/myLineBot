async function newBaby(
  conn,
  name,
  gender,
  birthday,
  picture = "",
  banner = ""
) {
  const [rows] = await conn.query(
    `INSERT INTO babys (name,gender,birthday,picture,banner)
        VALUES (?,?,?,?,?)
        `,
    [name, gender, birthday, picture, banner]
  );
  // console.log("newBaby:" + JSON.stringify(rows));
  if (rows.length == 0 || !rows.insertId) {
    return undefined;
  } else {
    const baby_id = rows.insertId;
    return getBaby(baby_id);
  }
}
async function getBaby(conn, id) {
  const [rows] = await conn.query(
    `
        SELECT * FROM babys where id = ?
        `,
    [id]
  );
  if (rows.length == 0) {
    return undefined;
  } else {
    return rows[0];
  }
}
module.exports = {
  newBaby,
  getBaby
};

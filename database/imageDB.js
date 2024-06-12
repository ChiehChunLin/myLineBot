async function setImage(conn, user_id, baby_id, filename, date) {
  const [rows] = await conn.query(
    `
     INSERT INTO images (user_id,baby_id,filename,imageDate)
     VALUES (?,?,?,?)
    `,
    [user_id, baby_id, filename, date]
  );
  // console.log("setImage:" + JSON.stringify(rows));
  if (rows.length == 0 || !rows.insertId) {
    return undefined;
  } else {
    return rows.insertId;
  }
}
async function getImageByTag(conn, baby_id, tag) {
  const [rows] = await conn.query(
    `
      SELECT * FROM images where baby_id = ? AND tag = ?
    `,
    [baby_id, tag]
  );
  if (rows.length == 0) {
    return undefined;
  } else {
    return rows;
  }
}
async function getImageByDate(conn, baby_id, date) {
  const [rows] = await conn.query(
    `
     SELECT * FROM images where baby_id = ? AND imageDate = ?
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
  setImage,
  getImageByTag,
  getImageByDate
};

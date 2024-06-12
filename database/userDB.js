async function newUser(
  conn,
  provider,
  role,
  name,
  email,
  password,
  picture = ""
) {
  const [rows] = await conn.query(
    `INSERT INTO users (provider,role,name,email,password, picture)
      VALUES (?,?,?,?,?,?)
      `,
    [provider, role, name, email, password, picture]
  );
  // console.log("newUser:" + JSON.stringify(rows));
  if (rows.length == 0 || !rows.insertId) {
    return undefined;
  } else {
    const user_id = rows.insertId;
    return getUser(user_id);
  }
}
async function getUser(conn, id) {
  const [rows] = await conn.query(
    `
      SELECT * FROM users where id = ?
      `,
    [id]
  );
  if (rows.length == 0) {
    return undefined;
  } else {
    return rows[0];
  }
}
async function getUserByEmail(conn, email) {
  const [rows] = await conn.query(
    `
      SELECT * FROM users where email = ?
      `,
    [email]
  );
  if (rows.length == 0) {
    return undefined;
  } else {
    return rows[0];
  }
}
async function setUserFollowBaby(conn, user_id, baby_id) {
  const [rows] = await conn.query(
    `INSERT INTO follows (user_id,baby_id)
      VALUES (?,?)
      `,
    [user_id, baby_id]
  );
  // console.log("setUserFollowBaby:" + JSON.stringify(rows));
  if (rows.length == 0 || !rows.insertId) {
    return undefined;
  } else {
    return rows.insertId;
  }
}
module.exports = {
  newUser,
  getUser,
  getUserByEmail,
  setUserFollowBaby
};

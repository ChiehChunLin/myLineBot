"use strict";

const dotenv = require("dotenv").config();
const mysql = require("mysql2");

const funcDB = {
  SET_IMAGE: "setImage",
  SET_TEXT: "setText"
};
const configDB = [
  {
    host: process.env.AWS_RDS_HOST,
    user: process.env.AWS_RDS_USERNAME,
    password: process.env.AWS_RDS_PASSWORD,
    database: process.env.AWS_RDS_DATABASE //myBaby
  }
];
const conn = mysql.createPool(configDB[0]).promise();

//===========================================
//=========   AWS RDS Function   =============
//===========================================
async function setImage(user_id, baby_id, filename, date) {
  const [rows] = await conn.query(
    `
     INSERT INTO images (user_id, baby_id, filename, imageDate)
     VALUES (?,?,?,?);
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
async function setText(user_id, baby_id, content, date) {
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

exports.handler = async (event) => {
  // event = {
  //   funcDB: "setImage",
  //   user_id: 1,
  //   baby_id: 1,
  //   date: "2024-06-14",
  //   content: "512561391317286962"
  // };
  try {
    let result = {
      funcDB: event.funcDB,
      insertId: -1
    };
    switch (event.funcDB) {
      case funcDB.SET_IMAGE:
        const imageId = await setImage(
          event.user_id,
          event.baby_id,
          event.content,
          event.date
        );
        result.insertId = imageId;
        break;
      case funcDB.SET_TEXT:
        const textId = await setText(
          event.user_id,
          event.baby_id,
          event.content,
          event.date
        );
        result.insertId = textId;
        break;
      default:
        console.log("Unknown funcDB: " + event.funcDB);
        return {
          statusCode: 500,
          funcDB: event.funcDB,
          error: "Unknown funcDB"
        };
    }
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (err) {
    console.log(err.message);
    return { statusCode: 500, funcDB: event.funcDB, error: err.message };
  }
};

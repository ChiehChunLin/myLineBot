"use strict";

const dotenv = require("dotenv").config();
const mysql = require("mysql2");
const moment = require('moment');

const funcDB = {
  SET_IMAGE: "setImage",
  SET_TEXT: "setText",
  SET_DAILY: "setDaily"
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
async function setImage(conn, userId, babyId, type, filename, date = "") {
  const imageDate = date == "" ? getLogTimeFormat() : date;
  const [rows] = await conn.query(
    `
     INSERT INTO images (userId, babyId, type, filename, timestamp)
     VALUES (?,?,?,?,?)
    `,
    [userId, babyId, type, filename, imageDate]
  );
  // console.log("setImage:" + JSON.stringify(rows));
  return rows.insertId;
}
async function setText(conn, userId, babyId, content, date = "") {
  const textDate = date == "" ? getLogTimeFormat() : date;
  const [rows] = await conn.query(
    `
     INSERT INTO texts (userId, babyId, content, timestamp)
     VALUES (?,?,?,?)
    `,
    [userId, babyId, content, textDate]
  );
  // console.log("setImage:" + JSON.stringify(rows));
  return rows.insertId;
}
async function setBabyDaily(conn, userId, babyId, activity, quantity, date = "") {
  const activityDate = date == "" ? getLogTimeFormat() : date;
  const week = moment(activityDate, 'YYYY-MM-DD').week();
  console.log(activityDate);
  console.log(week);
  const [rows] = await conn.query(
    `
      INSERT INTO babyDaily (userId, babyId, week, activity, quantity, timestamp)
      VALUES (?,?,?,?,?,?)
    `,
    [userId, babyId, week, activity, quantity, activityDate]
  );
  // console.log("setBabyDaily:" + JSON.stringify(rows));
  return rows.insertId;
}
async function getManagerBabyList(conn, userId){
  const [rows] = await conn.query(
    `
      SELECT babyId FROM follows where userId = ? AND babyRole = 'manager'
    `,
    [userId]
  );
  // console.log("getManagerBabyList:" + JSON.stringify(rows));
  return rows;
}
function getLogTimeFormat() {
  //YYYY-MM-DD HH:mm:ss
  return new Date().toLocaleString("af-ZA", { hour12: false });
}

exports.handler = async (event) => {
  // event = {
  //   funcDB: "setImage",
  //   userId: 1,
  //   babyId: 1,
  //   type: "image",
  //   title: "2024-06-14",           //or babyActivity
  //   content: "512561391317286962"  //or quantity
  // };
  console.log("%j", event);
  try {
    let result = {
      funcDB: event.funcDB,
      insertId: -1
    };
    if(event.userid === "" || Number(event.babyId) < 0){
      return { statusCode: 500, funcDB: event.funcDB, error: "Unknown userId or babyId" };
    }
    if(Number(event.babyId) < 10 ){
      const babyLists = await getManagerBabyList(conn, event.userid);
      event.babyId = babyLists[Number(event.babyId)];
    }
    switch (event.funcDB) {
      case funcDB.SET_IMAGE:
        const imageId = await setImage(
          conn,
          event.userId,
          event.babyId,
          event.type,
          event.content,
        );
        result.insertId = imageId;
        break;
      case funcDB.SET_TEXT:
        const textId = await setText(
          conn,
          event.userId,
          event.babyId,
          event.content,
        );
        result.insertId = textId;
        break;
      case funcDB.SET_DAILY:
        const diaryId = await setBabyDaily(
          conn,
          event.userId,
          event.babyId,
          event.title,
          event.content            
        );
        result.insertId = diaryId;
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

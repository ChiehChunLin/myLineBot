"use strict";

const dotenv = require("dotenv").config();
const mysql = require("mysql2");
const moment = require('moment');

const funcDB = {
  GET_MAIN_BABYS: "getMainBabys", //babyRole='manager'
  GET_USERID: "getUserId",
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
  const week = moment(activityDate).week();
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
async function getUserFollowsByLineID(conn, lineId){
   const [rows] = await conn.query(
    `
      SELECT
          follows.userId AS userId,
          JSON_ARRAYAGG(
              JSON_OBJECT(
                  'babyId', follows.babyId,
                  'babyRole', follows.babyRole
              )
          ) AS babys
      FROM 
          users
      JOIN 
          follows ON users.id = follows.userId
      WHERE 
          users.lineId = ? AND follows.babyRole = 'manager'
      GROUP BY
          follows.userId; 
    `,
    [lineId]
  );
  // console.log("getManagerBabyList:" + JSON.stringify(rows));
  return rows;
}
async function getUserIDByLineID(conn, lineId){
  const [rows] = await conn.query(
   `
     SELECT
         id AS userId         
     FROM 
         users
     WHERE 
         users.lineId = ? ; 
   `,
   [lineId]
 );
//  console.log("getManagerBabyList:" + JSON.stringify(rows[0]));
 return rows;
}
function getLogTimeFormat() {
  //YYYY-MM-DD HH:mm:ss
  return moment().utc().add(8, 'h').format('YYYY-MM-DD HH:mm:ss');
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
    if(event.funcDB === funcDB.GET_USERID){
      const lineId = event.userId;
      const babyResult = await getUserIDByLineID(conn, lineId);
      console.log(babyResult);
      // const babyResult = { userId };
      return { statusCode: 200, funcDB: event.funcDB, body: JSON.stringify({ babyResult }) };
    }
    if(event.funcDB === funcDB.GET_MAIN_BABYS){
      const lineId = event.userId;
      const babyResult = await getUserFollowsByLineID(conn, lineId);
      return { statusCode: 200, funcDB: event.funcDB, body: JSON.stringify({ babyResult }) };
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

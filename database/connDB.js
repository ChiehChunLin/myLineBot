const mysql = require("mysql2");
const dotenv = require("dotenv").config();

const configDB = [
  {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE //myDB
  }
  // {
  //   host: process.env.RDS_HOST_1,
  //   user: process.env.RDS_USER_1,
  //   password: process.env.RDS_PASSWORD_1,
  //   database: process.env.MYSQL_DATABASE, //myDB
  // },
  // {
  //   host: process.env.RDS_HOST_2,
  //   user: process.env.RDS_USER_2,
  //   password: process.env.RDS_PASSWORD_2,
  //   database: process.env.MYSQL_DATABASE, //myDB
  // },
];

const connections = configDB.map((config) =>
  mysql.createPool(config).promise()
);

module.exports = { connections };

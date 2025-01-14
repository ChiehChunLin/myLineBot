const mysql = require("mysql2");
const dotenv = require("dotenv").config();

const configDB = [
  {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE 
  },
  {
    host: process.env.AWS_RDS_HOST,
    user: process.env.AWS_RDS_USERNAME,
    password: process.env.AWS_RDS_PASSWORD,
    database: process.env.AWS_RDS_DATABASE 
  }
];

const conn = mysql.createPool(configDB[1]).promise();

module.exports = { conn };

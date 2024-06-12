const mysql = require("mysql2");
const dotenv = require("dotenv").config();

const configDB = [
  {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE //myBaby
  },
  {
    host: process.env.RDS_HOST_1,
    user: process.env.RDS_USER_1,
    password: process.env.RDS_PASSWORD_1,
    database: process.env.MYSQL_DATABASE //myBaby
  }
];

const pool = mysql.createPool(configDB[0]).promise();

async function createUserTable() {
  const userTable = await pool.query(
    `CREATE TABLE IF NOT EXISTS \`users\` (
                \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'User id',
                \`provider\` VARCHAR(255) NOT NULL COMMENT 'Service Provider',
                \`role\` VARCHAR(255) NOT NULL DEFAULT 'user' COMMENT 'User Role',
                \`name\` VARCHAR(255) NOT NULL COMMENT 'User name',
                \`email\` VARCHAR(255) NOT NULL UNIQUE KEY COMMENT 'User email',
                \`password\` VARCHAR(255) NOT NULL COMMENT 'User password',
                \`picture\` VARCHAR(255) NOT NULL COMMENT 'User picture',
                \`timestamp\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
              );`
  );
  if (userTable) console.log("userTable is ready for service.");
}
async function createBabyTable() {
  const babyTable = await pool.query(
    `CREATE TABLE IF NOT EXISTS \`babys\` (
                \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Baby id',
                \`name\` VARCHAR(255) NOT NULL COMMENT 'Baby name',
                \`gender\` VARCHAR(255) NOT NULL COMMENT 'Baby gender',
                \`birthday\` VARCHAR(255) NOT NULL COMMENT 'Baby birthday',                
                \`picture\` VARCHAR(255) NOT NULL COMMENT 'Baby picture',
                \`banner\` VARCHAR(255) NOT NULL COMMENT 'Baby banner',
                \`timestamp\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
              );`
  );
  if (babyTable) console.log("babyTable is ready for service.");
}

async function createFollowTable() {
  const followTable = await pool.query(
    `CREATE TABLE IF NOT EXISTS \`follows\` (
                \`user_id\` BIGINT UNSIGNED NOT NULL COMMENT 'User id',
                \`baby_id\` BIGINT UNSIGNED NOT NULL COMMENT 'Baby id',
                UNIQUE KEY (user_id, baby_id)
              );`
  );
  if (followTable) console.log("followTable is ready for service.");
}
async function createImageTable() {
  const imageTable = await pool.query(
    `CREATE TABLE IF NOT EXISTS \`images\` (
                  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Image id',
                  \`user_id\` BIGINT UNSIGNED NOT NULL COMMENT 'User id',
                  \`baby_id\` BIGINT UNSIGNED NOT NULL COMMENT 'Baby id',
                  \`tag\` VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'Image tag',
                  \`directory\` VARCHAR(255) NOT NULL COMMENT 'Image directory in S3',
                  \`timestamp\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                );`
  );
  if (imageTable) console.log("imageTable is ready for service.");
}

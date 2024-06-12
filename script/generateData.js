const mysql = require("mysql2");
const dotenv = require("dotenv").config();
const CONT = require("../utils/getAuthConst");
const { conn } = require("../database/connDB");
const { newUser, setUserFollowBaby } = require("../database/userDB");
const { newBaby } = require("../database/babyDB");
const { setImage } = require("../database/imageDB");

const pool = conn;

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
                \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Follow id',
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
                  \`filename\` VARCHAR(255) NOT NULL COMMENT 'Image filename',
                  \`imageDate\` VARCHAR(255) NOT NULL COMMENT 'Image date in S3',
                  \`timestamp\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                );`
  );
  if (imageTable) console.log("imageTable is ready for service.");
}
async function createTextTable() {
  const textTable = await pool.query(
    `CREATE TABLE IF NOT EXISTS \`texts\` (
                  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'Text id',
                  \`user_id\` BIGINT UNSIGNED NOT NULL COMMENT 'User id',
                  \`baby_id\` BIGINT UNSIGNED NOT NULL COMMENT 'Baby id',
                  \`content\` TEXT NOT NULL COMMENT 'Text content',
                  \`textDate\` VARCHAR(255) NOT NULL COMMENT 'Text date',
                  \`timestamp\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                );`
  );
  if (textTable) console.log("textTable is ready for service.");
}

createUserTable();
createBabyTable();
createFollowTable();
createImageTable();
createTextTable();

const commands = [
  newUser(
    pool,
    CONT.authProvider.NATIVE,
    CONT.authRole.ADMIN,
    "aaa123456",
    "aaa123456@fakemail.com",
    "$2b$10$tzcVE8bVVv6k151knLPC1.xuA5GbFpuRtDO3ekKhDsiu85td5i6by"
  ),
  newBaby(pool, "puff", CONT.babyGender.GIRL, "2024-03-24"),
  setUserFollowBaby(1, 1)
];
Promise.all(commands)
  .then((result) => {
    console.log("result %j", result);
  })
  .catch((err) => {
    console.log("Error: " + err.message);
  });

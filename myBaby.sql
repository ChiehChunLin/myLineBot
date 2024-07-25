-- phpMyAdmin SQL Dump
-- version 5.1.1deb5ubuntu1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jul 23, 2024 at 07:05 AM
-- Server version: 8.0.37-0ubuntu0.22.04.3
-- PHP Version: 8.1.2-1ubuntu2.18

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `myBaby`
--

-- --------------------------------------------------------

--
-- Table structure for table `babyDaily`
--

CREATE TABLE `babyDaily` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'Text id',
  `userId` bigint UNSIGNED NOT NULL COMMENT 'User id',
  `babyId` bigint UNSIGNED NOT NULL COMMENT 'Baby id',
  `week` int DEFAULT NULL COMMENT 'Activity week',
  `activity` varchar(255) NOT NULL COMMENT 'Baby activity',
  `quantity` float NOT NULL COMMENT 'Baby quantity',
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Living date'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `babyDaily`
--


-- --------------------------------------------------------

--
-- Table structure for table `babys`
--

CREATE TABLE `babys` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'Baby id',
  `name` varchar(255) NOT NULL COMMENT 'Baby name',
  `gender` varchar(255) NOT NULL COMMENT 'Baby gender',
  `birthday` varchar(255) NOT NULL COMMENT 'Baby birthday',
  `headshot` varchar(255) NOT NULL DEFAULT 'default/defaultBaby' COMMENT 'Baby picture',
  `cover` varchar(255) NOT NULL DEFAULT 'default/defaultCover' COMMENT 'Baby banner',
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `babys`
--


-- --------------------------------------------------------

--
-- Table structure for table `follows`
--

CREATE TABLE `follows` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'Follow id',
  `userId` bigint UNSIGNED NOT NULL COMMENT 'User id',
  `babyId` bigint UNSIGNED NOT NULL COMMENT 'Baby id',
  `babyRole` varchar(255) NOT NULL COMMENT 'Baby role',
  `relation` varchar(255) NOT NULL COMMENT 'Baby relation'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `follows`
--


-- --------------------------------------------------------

--
-- Table structure for table `images`
--

CREATE TABLE `images` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'Image id',
  `userId` bigint UNSIGNED NOT NULL COMMENT 'User id',
  `babyId` bigint UNSIGNED NOT NULL COMMENT 'Baby id',
  `tag` varchar(255) NOT NULL DEFAULT '' COMMENT 'Image tag',
  `type` varchar(255) NOT NULL DEFAULT 'image' COMMENT 'Image type',
  `filename` varchar(255) NOT NULL COMMENT 'Image full filename',
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Image date in S3'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `images`
--



-- --------------------------------------------------------

--
-- Table structure for table `texts`
--

CREATE TABLE `texts` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'Text id',
  `userId` bigint UNSIGNED NOT NULL COMMENT 'User id',
  `babyId` bigint UNSIGNED NOT NULL COMMENT 'Baby id',
  `content` text NOT NULL COMMENT 'Text content',
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Text date'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `texts`
--



-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint UNSIGNED NOT NULL COMMENT 'User id',
  `lineId` varchar(255) NOT NULL DEFAULT '' COMMENT 'User line id',
  `provider` varchar(255) NOT NULL COMMENT 'Service Provider',
  `authRole` varchar(255) NOT NULL DEFAULT 'user' COMMENT 'User Role',
  `name` varchar(255) NOT NULL COMMENT 'User name',
  `email` varchar(255) NOT NULL COMMENT 'User email',
  `password` varchar(255) NOT NULL COMMENT 'User password',
  `picture` varchar(255) NOT NULL DEFAULT 'default/defaultUser' COMMENT 'User picture',
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--



--
-- Indexes for dumped tables
--

--
-- Indexes for table `babyDaily`
--
ALTER TABLE `babyDaily`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `babys`
--
ALTER TABLE `babys`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `follows`
--
ALTER TABLE `follows`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `userId` (`userId`,`babyId`);

--
-- Indexes for table `images`
--
ALTER TABLE `images`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `babyId` (`babyId`,`filename`);

--
-- Indexes for table `texts`
--
ALTER TABLE `texts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `babyDaily`
--
ALTER TABLE `babyDaily`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Text id', AUTO_INCREMENT=68;

--
-- AUTO_INCREMENT for table `follows`
--
ALTER TABLE `follows`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Follow id', AUTO_INCREMENT=146;

--
-- AUTO_INCREMENT for table `images`
--
ALTER TABLE `images`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Image id', AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `texts`
--
ALTER TABLE `texts`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Text id', AUTO_INCREMENT=5;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

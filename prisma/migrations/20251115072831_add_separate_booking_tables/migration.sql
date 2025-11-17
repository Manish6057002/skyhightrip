-- CreateTable
CREATE TABLE `flight_bookings` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `bookingRef` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `departure` VARCHAR(191) NOT NULL,
    `arrival` VARCHAR(191) NOT NULL,
    `departureDate` VARCHAR(191) NOT NULL,
    `arrivalDate` VARCHAR(191) NULL,
    `airline` VARCHAR(191) NULL,
    `price` VARCHAR(191) NOT NULL,
    `currency` VARCHAR(191) NULL,
    `passenger` JSON NOT NULL,
    `contact` JSON NOT NULL,
    `bookingData` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `flight_bookings_userId_idx`(`userId`),
    INDEX `flight_bookings_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hotel_bookings` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `bookingRef` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `hotelName` VARCHAR(191) NOT NULL,
    `hotelCode` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `checkIn` VARCHAR(191) NOT NULL,
    `checkOut` VARCHAR(191) NOT NULL,
    `roomType` VARCHAR(191) NULL,
    `roomCode` VARCHAR(191) NULL,
    `price` VARCHAR(191) NOT NULL,
    `currency` VARCHAR(191) NULL,
    `guests` JSON NULL,
    `contact` JSON NOT NULL,
    `bookingData` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `hotel_bookings_userId_idx`(`userId`),
    INDEX `hotel_bookings_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_bookings` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `bookingRef` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `activityName` VARCHAR(191) NOT NULL,
    `activityCode` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `dateFrom` VARCHAR(191) NOT NULL,
    `dateTo` VARCHAR(191) NULL,
    `price` VARCHAR(191) NOT NULL,
    `currency` VARCHAR(191) NULL,
    `passengers` JSON NULL,
    `contact` JSON NOT NULL,
    `bookingData` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `activity_bookings_userId_idx`(`userId`),
    INDEX `activity_bookings_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `flight_bookings` ADD CONSTRAINT `flight_bookings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hotel_bookings` ADD CONSTRAINT `hotel_bookings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_bookings` ADD CONSTRAINT `activity_bookings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - A unique constraint covering the columns `[userId,title,dueDate]` on the table `Task` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `task` ADD COLUMN `dueDate` DATE NULL;

-- CreateIndex
CREATE INDEX `Task_userId_idx` ON `Task`(`userId`);

-- CreateIndex
CREATE INDEX `Task_userId_dueDate_idx` ON `Task`(`userId`, `dueDate`);

-- CreateIndex
CREATE INDEX `Task_userId_createdAt_idx` ON `Task`(`userId`, `createdAt`);

-- CreateIndex
CREATE UNIQUE INDEX `Task_userId_title_dueDate_key` ON `Task`(`userId`, `title`, `dueDate`);

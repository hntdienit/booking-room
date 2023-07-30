/*
  Warnings:

  - A unique constraint covering the columns `[color]` on the table `Room` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `color` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "color" TEXT NOT NULL,
ADD COLUMN     "isEnable" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "Room_color_key" ON "Room"("color");

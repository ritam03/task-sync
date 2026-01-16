/*
  Warnings:

  - You are about to drop the column `boardId` on the `ActivityLog` table. All the data in the column will be lost.
  - Added the required column `entityTitle` to the `ActivityLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entityType` to the `ActivityLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workspaceId` to the `ActivityLog` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ActivityLog" DROP CONSTRAINT "ActivityLog_boardId_fkey";

-- AlterTable
ALTER TABLE "ActivityLog" DROP COLUMN "boardId",
ADD COLUMN     "entityTitle" TEXT NOT NULL,
ADD COLUMN     "entityType" TEXT NOT NULL,
ADD COLUMN     "workspaceId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

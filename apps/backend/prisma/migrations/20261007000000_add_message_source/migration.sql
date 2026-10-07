-- Development data only: the project owner approved deleting old Inbox messages.
-- Keep deletion and schema change atomic, blocking concurrent message writes.
BEGIN;
LOCK TABLE "DirectMessage" IN ACCESS EXCLUSIVE MODE;
DELETE FROM "DirectMessage";

-- CreateEnum
CREATE TYPE "MessageSource" AS ENUM ('BUYER', 'SELLER', 'AI', 'SYSTEM');

-- AlterTable
ALTER TABLE "DirectMessage" ADD COLUMN     "source" "MessageSource" NOT NULL;

COMMIT;

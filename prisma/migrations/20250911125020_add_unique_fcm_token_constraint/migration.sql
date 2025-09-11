/*
  Warnings:

  - A unique constraint covering the columns `[fcmToken]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "users_fcmToken_key" ON "public"."users"("fcmToken");

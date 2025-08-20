import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ProfileDeletionRequest, Users } from '@prisma/client';

@Injectable()
export class ProfileDeletionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createDeletionRequest(
    userId: number,
    code: string,
    expiresAt: Date,
  ): Promise<ProfileDeletionRequest> {
    return this.prisma.profileDeletionRequest.upsert({
      where: { userId },
      update: {
        code,
        expiresAt,
        confirmed: false,
        attempts: 0,
        updatedAt: new Date(),
      },
      create: {
        userId,
        code,
        expiresAt,
        confirmed: false,
        attempts: 0,
      },
    });
  }

  async findActiveRequestByUserId(userId: number): Promise<ProfileDeletionRequest | null> {
    return this.prisma.profileDeletionRequest.findFirst({
      where: {
        userId,
        confirmed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  async findRequestByUserIdAndCode(
    userId: number,
    code: string,
  ): Promise<ProfileDeletionRequest | null> {
    return this.prisma.profileDeletionRequest.findFirst({
      where: {
        userId,
        code,
      },
    });
  }

  async incrementAttempts(id: number): Promise<ProfileDeletionRequest> {
    return this.prisma.profileDeletionRequest.update({
      where: { id },
      data: {
        attempts: {
          increment: 1,
        },
      },
    });
  }

  async confirmDeletionRequest(id: number): Promise<ProfileDeletionRequest> {
    return this.prisma.profileDeletionRequest.update({
      where: { id },
      data: {
        confirmed: true,
      },
    });
  }

  async scheduleDeletion(userId: number, deletionDate: Date): Promise<Users> {
    return this.prisma.users.update({
      where: { id: userId },
      data: {
        deletionScheduledAt: deletionDate,
      },
    });
  }

  async cancelDeletion(userId: number): Promise<Users> {
    return this.prisma.users.update({
      where: { id: userId },
      data: {
        deletionScheduledAt: null,
      },
    });
  }

  async deleteDeletionRequest(userId: number): Promise<void> {
    await this.prisma.profileDeletionRequest.deleteMany({
      where: { userId },
    });
  }

  async findUsersScheduledForDeletion(): Promise<Users[]> {
    return this.prisma.users.findMany({
      where: {
        deletionScheduledAt: {
          lte: new Date(),
        },
      },
    });
  }

  async findUsersWithDeletionScheduled(): Promise<Users[]> {
    return this.prisma.users.findMany({
      where: {
        deletionScheduledAt: {
          not: null,
          gte: new Date(),
        },
      },
    });
  }

  async deleteUser(userId: number): Promise<void> {
    await this.prisma.users.delete({
      where: { id: userId },
    });
  }

  async cleanupExpiredRequests(): Promise<void> {
    await this.prisma.profileDeletionRequest.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
        confirmed: false,
      },
    });
  }
}

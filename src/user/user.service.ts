import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const user = await this.prisma.user.create({
        data: {
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
          email: createUserDto.email,
          username: createUserDto.username,
          passwordHash: hashedPassword,
        },
      });
      return { ...user, passwordHash: undefined };
    } catch (error) {
      this.handlePrismaError(error, 'create user');
    }
  }

  async findAll() {
    try {
      return await this.prisma.user.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          username: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      this.handlePrismaError(error, 'fetch users');
    }
  }

  async findOne(id: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          username: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handlePrismaError(error, 'fetch user');
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      // First check if user exists
      await this.findOne(id);

      let hashedPassword = updateUserDto.password;
      if (updateUserDto.password) {
        hashedPassword = await bcrypt.hash(updateUserDto.password, 10);
      }

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: {
          firstName: updateUserDto.firstName,
          lastName: updateUserDto.lastName,
          email: updateUserDto.email,
          username: updateUserDto.username,
          passwordHash: hashedPassword,
        },
      });

      return { ...updatedUser, passwordHash: undefined };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handlePrismaError(error, 'update user');
    }
  }

  async remove(id: string) {
    try {
      // First check if user exists
      await this.findOne(id);

      const deletedUser = await this.prisma.user.delete({ where: { id } });
      return { ...deletedUser, passwordHash: undefined };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handlePrismaError(error, 'delete user');
    }
  }

  /**
   * Centralized Prisma error handler
   */
  private handlePrismaError(error: any, operation: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002': {
          // Unique constraint violation
          const target = error.meta?.target as string[] | undefined;
          if (target?.includes('email')) {
            throw new ConflictException('Email already exists');
          }
          if (target?.includes('username')) {
            throw new ConflictException('Username already exists');
          }
          throw new ConflictException(
            'A user with this information already exists',
          );
        }

        case 'P2025':
          // Record not found
          throw new NotFoundException(`User not found`);

        case 'P2003':
          // Foreign key constraint violation
          throw new BadRequestException(
            'Cannot perform operation due to related records',
          );

        case 'P2014':
          // Relation violation
          throw new BadRequestException(
            'The change you are trying to make would violate a required relation',
          );

        default:
          throw new BadRequestException(
            `Failed to ${operation}: ${error.message}`,
          );
      }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      throw new BadRequestException('Invalid data provided');
    }

    // Re-throw if it's already a NestJS exception
    if (
      error instanceof ConflictException ||
      error instanceof NotFoundException ||
      error instanceof BadRequestException
    ) {
      throw error;
    }

    // Unknown error
    throw new BadRequestException(`Failed to ${operation}`);
  }
}

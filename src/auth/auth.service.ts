import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: createUserDto.email },
            { username: createUserDto.username },
          ],
        },
      });

      if (existingUser) {
        if (existingUser.email === createUserDto.email) {
          throw new ConflictException('Email already exists');
        }
        if (existingUser.username === createUserDto.username) {
          throw new ConflictException('Username already exists');
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
          email: createUserDto.email,
          username: createUserDto.username,
          passwordHash: hashedPassword,
        },
      });

      // Generate JWT token
      const payload = { sub: user.id, username: user.username };
      const access_token = await this.jwtService.signAsync(payload);

      const { passwordHash, ...userWithoutPassword } = user;
      return {
        access_token,
        user: userWithoutPassword,
      };
    } catch (error) {
      this.handlePrismaError(error, 'register user');
    }
  }

  async logIn(loginDto: LoginDto) {
    try {
      // Find user by email
      const user = await this.prisma.user.findFirst({
        where: { email: loginDto.email },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.passwordHash,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Generate JWT token
      const payload = { sub: user.id, username: user.username };
      const access_token = await this.jwtService.signAsync(payload);

      const { passwordHash, ...userWithoutPassword } = user;
      return {
        access_token,
        user: userWithoutPassword,
      };
    } catch (error) {
      // Re-throw UnauthorizedException as-is for security
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.handlePrismaError(error, 'login');
    }
  }

  async validateUser(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.handlePrismaError(error, 'validate user');
    }
  }

  /**
   * Centralized Prisma error handler for auth operations
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
          throw new UnauthorizedException('Invalid credentials');

        case 'P2003':
          // Foreign key constraint violation
          throw new BadRequestException(
            'Cannot perform operation due to related records',
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
      error instanceof UnauthorizedException ||
      error instanceof BadRequestException
    ) {
      throw error;
    }

    // Unknown error - don't expose details for security
    throw new BadRequestException(`Failed to ${operation}`);
  }
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class User {
  @ApiProperty({
    description: 'Unique identifier for the user',
    example: 'clxyz123abc',
  })
  id: string;

  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
    minLength: 1,
    maxLength: 25,
  })
  firstName: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
    minLength: 1,
    maxLength: 25,
  })
  lastName: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
    uniqueItems: true,
  })
  email: string;

  @ApiProperty({
    description: 'Username for the user',
    example: 'johndoe',
    minLength: 3,
    maxLength: 20,
    uniqueItems: true,
  })
  username: string;

  @ApiPropertyOptional({
    description: 'Hashed password (excluded from responses)',
    example: '$2b$10$...',
  })
  passwordHash?: string;

  @ApiProperty({
    description: 'Timestamp when the user was created',
    example: '2026-02-16T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the user was last updated',
    example: '2026-02-16T15:45:00.000Z',
  })
  updatedAt: Date;
}

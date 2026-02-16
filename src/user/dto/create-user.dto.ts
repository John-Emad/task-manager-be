import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
    minLength: 3,
    maxLength: 25,
  })
  @IsNotEmpty({ message: 'First name is required' })
  @IsString({ message: 'First name must be a string' })
  @MinLength(3, { message: 'First name must be at least 3 characters' })
  @MaxLength(25, { message: 'First name must be less than 25 characters' })
  firstName: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
    minLength: 3,
    maxLength: 25,
  })
  @IsNotEmpty({ message: 'Last name is required' })
  @IsString({ message: 'Last name must be a string' })
  @MinLength(3, { message: 'Last name must be at least 3 characters' })
  @MaxLength(25, { message: 'Last name must be less than 25 characters' })
  lastName: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
  })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'Password for the user account',
    example: 'SecurePassword123!',
    minLength: 8,
    maxLength: 40,
  })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&^#()[\]{}\-_=+\\|;:'",.<>\/?])[A-Za-z\d@$!%*?&^#()[\]{}\-_=+\\|;:'",.<>\/?]{8,}$/,
    {
      message:
        'Password must be at least 8 characters long and include at least one letter, one number, and one special character',
    },
  )
  @MaxLength(40, { message: 'Password must be less than 40 characters' })
  password: string;

  @ApiProperty({
    description: 'Unique username for the user',
    example: 'johndoe',
    minLength: 3,
    maxLength: 20,
  })
  @IsNotEmpty({ message: 'Username is required' })
  @IsString({ message: 'Username must be a string' })
  @MinLength(3, { message: 'Username must be at least 3 characters' })
  @MaxLength(20, { message: 'Username must be less than 20 characters' })
  username: string;
}

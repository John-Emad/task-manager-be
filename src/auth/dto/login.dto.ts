import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email of the user',
    example: 'johndoe@example.com',
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsString({ message: 'Email must be a string' })
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @ApiProperty({
    description: 'Password of the user',
    example: 'Password123!',
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  password: string;
}

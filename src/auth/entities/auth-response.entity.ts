import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseEntity {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'User information',
    example: {
      id: 'clx1234567890',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      username: 'johndoe',
    },
  })
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
  };
}


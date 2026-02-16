import { ApiProperty } from '@nestjs/swagger';

export class LogoutResponseEntity {
  @ApiProperty({
    description: 'Logout success message',
    example: 'Successfully logged out',
  })
  message: string;

  @ApiProperty({
    description: 'ID of the logged out user',
    example: 'clxyz123abc',
  })
  userId: string;
}


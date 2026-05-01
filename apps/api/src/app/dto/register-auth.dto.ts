import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterAuthRequestDto {
    @ApiProperty({ example: 'nam088@example.com' })
    @IsEmail()
    email!: string;

    @ApiProperty({ example: 'Nam Nguyen' })
    @IsString()
    @MinLength(1)
    name!: string;

    @ApiProperty({ example: 'StrongPassword@123' })
    @IsString()
    @MinLength(8)
    password!: string;

    @ApiPropertyOptional({ example: 'reg_abc_123' })
    @IsOptional()
    @IsString()
    idempotencyKey?: string;
}

export class RegisterAuthResponseDto {
    @ApiProperty({ example: '88bda7c7-0f42-4466-a364-f95ba7ad6f3b' })
    userId!: string;

    @ApiProperty({ example: 'nam088@example.com' })
    email!: string;

    @ApiProperty({ example: 'Nam Nguyen' })
    name!: string;

    @ApiProperty({ example: true })
    created!: boolean;
}

export class LoginAuthRequestDto {
    @ApiProperty({ example: 'nam088@example.com' })
    @IsEmail()
    email!: string;

    @ApiProperty({ example: 'StrongPassword@123' })
    @IsString()
    @MinLength(8)
    password!: string;
}

export class LoginAuthResponseDto {
    @ApiProperty({ example: '88bda7c7-0f42-4466-a364-f95ba7ad6f3b' })
    userId!: string;

    @ApiProperty({ example: 'eyJhbGciOi...' })
    accessToken!: string;

    @ApiProperty({ example: 'eyJhbGciOi...refresh' })
    refreshToken!: string;
}

export class RefreshTokenRequestDto {
    @ApiProperty({ example: 'eyJhbGciOi...refresh' })
    @IsString()
    @MinLength(10)
    refreshToken!: string;
}

export class LogoutAuthResponseDto {
    @ApiProperty({ example: true })
    success!: boolean;
}

export class MeAuthResponseDto {
    @ApiProperty({ example: '88bda7c7-0f42-4466-a364-f95ba7ad6f3b' })
    userId!: string;

    @ApiProperty({ example: 'nam088@example.com' })
    email!: string;

    @ApiProperty({ example: '4b4f5f8a-d5a4-4f90-b8cf-8a7c6494a551' })
    sid!: string;
}

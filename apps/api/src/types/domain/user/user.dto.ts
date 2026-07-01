export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  ssn?: string | null;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface UserResponseDto {
  id: string;
  name: string;
  email: string;
  ssn: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AvailableCreditsResponseDto {
  availableCredits: number;
}

export interface AuthResponseDto {
  user: UserResponseDto;
  token: string;
}

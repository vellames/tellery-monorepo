export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface UserResponseDto {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponseDto {
  user: UserResponseDto;
  token: string;
}

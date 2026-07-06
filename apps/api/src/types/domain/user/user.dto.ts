export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
}

export interface CreateTemporaryUserDto {
  name: string;
}

export interface ConvertTemporaryUserDto {
  name: string;
  email: string;
  password: string;
}

export interface UpdateUserAddressDto {
  zipCode: string;
  street: string;
  state: string;
  city: string;
  neighborhood: string;
  number?: string | null;
  complement?: string | null;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  ssn?: string | null;
  address?: UpdateUserAddressDto;
}

export interface UserAddressResponseDto {
  zipCode: string;
  street: string;
  state: string;
  city: string;
  neighborhood: string;
  number: string | null;
  complement: string | null;
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
  email: string | null;
  accountType: 'permanent' | 'temporary';
  ssn: string | null;
  address: UserAddressResponseDto | null;
  emailVerifiedAt: string | null;
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

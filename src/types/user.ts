export interface User {
  id?: number;
  first_name: string;
  last_name: string;
  email: string;
  password?: string; // Optional for responses (excluded from API responses)
  role: "user" | "admin";
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role?: "user" | "admin";
  is_active?: boolean;
  send_email?: boolean; // Whether to send credentials via email
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: "user" | "admin";
  is_active?: boolean;
}

export interface UserResponse {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: "user" | "admin";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: UserResponse;
  message?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface UpdatePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface PasswordResetToken {
  id?: number;
  user_id: number;
  token: string;
  expires_at: string;
  used: boolean;
  created_at?: string;
}

export interface EmailCredentials {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface PaginatedUsersResult {
  data: UserResponse[];
  total: number;
  page: number;
  limit: number;
}

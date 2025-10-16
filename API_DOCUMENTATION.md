# API Documentation - User Management & Authentication

This document describes the API endpoints for user management and authentication features.

## Base URL

```
http://localhost:5008/api
```

## Authentication

Most endpoints require authentication via JWT token. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## User Management Endpoints

### Create User

**POST** `/users`

Creates a new user account.

**Headers:**

- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Request Body:**

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "is_active": true,
  "send_email": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get All Users

**GET** `/users`

Retrieves a paginated list of users with optional search.

**Headers:**

- `Authorization: Bearer <token>` (required)

**Query Parameters:**

- `search` (optional): Search term for first name, last name, or email
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 100)

**Example:**

```
GET /users?search=john&page=1&limit=10
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

### Get User by ID

**GET** `/users/:id`

Retrieves a specific user by ID.

**Headers:**

- `Authorization: Bearer <token>` (required)

**Response:**

```json
{
  "success": true,
  "user": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Update User

**PUT** `/users/:id`

Updates an existing user.

**Headers:**

- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Request Body:**

```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane.smith@example.com",
  "is_active": false
}
```

**Response:**

```json
{
  "success": true,
  "message": "User updated successfully",
  "user": {
    "id": 1,
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane.smith@example.com",
    "is_active": false,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Delete User

**DELETE** `/users/:id`

Deletes a user account.

**Headers:**

- `Authorization: Bearer <token>` (required)

**Response:**

```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

## Authentication Endpoints

### Login

**POST** `/auth/login`

Authenticates a user and returns a JWT token.

**Headers:**

- `Content-Type: application/json`

**Request Body:**

```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Forgot Password

**POST** `/auth/forgot-password`

Sends a password reset link to the user's email.

**Headers:**

- `Content-Type: application/json`

**Request Body:**

```json
{
  "email": "john.doe@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

### Reset Password

**POST** `/auth/reset-password`

Resets the user's password using a reset token.

**Headers:**

- `Content-Type: application/json`

**Request Body:**

```json
{
  "token": "reset-token-from-email",
  "new_password": "NewSecurePass123!"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

### Update Password

**POST** `/auth/update-password`

Updates the current user's password (requires authentication).

**Headers:**

- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Request Body:**

```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewPassword123!"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

### Get Profile

**GET** `/auth/profile`

Gets the current authenticated user's profile.

**Headers:**

- `Authorization: Bearer <token>` (required)

**Response:**

```json
{
  "success": true,
  "user": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "success": false,
  "error": "Error message",
  "details": ["Additional error details"]
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (invalid token)
- `404` - Not Found
- `500` - Internal Server Error

## Password Requirements

Passwords must meet the following criteria:

- At least 8 characters long
- At least one lowercase letter
- At least one uppercase letter
- At least one number
- At least one special character (@$!%\*?&)

## Email Features

### User Creation Email

When creating a user with `send_email: true`, an email will be sent containing:

- Welcome message
- Login credentials (email and password)
- Security notice to change password

### Password Reset Email

When requesting a password reset, an email will be sent containing:

- Password reset link (expires in 1 hour)
- Security notice
- Instructions for resetting password

## Security Features

- Passwords are hashed using bcryptjs with salt rounds of 12
- JWT tokens expire after 24 hours (configurable)
- Password reset tokens expire after 1 hour
- Email validation for all email fields
- Input validation and sanitization
- CORS protection
- SQL injection protection through parameterized queries

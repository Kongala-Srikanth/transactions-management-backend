# Bank Transaction Management System

This is a **Node.js**-based backend project for managing bank transactions, including user registration, login, and CRUD operations for transactions. The application uses **Express.js**, **MongoDB**, and **JWT** for secure and efficient data handling.

## Features

- **User Registration**: Register new users with hashed passwords.
- **User Login**: Authenticate users and generate JWT tokens.
- **Transactions**:
  - Create transactions (Deposit/Withdrawal).
  - Update transaction status.
  - Retrieve transaction details.
- **Secure API Endpoints**: Protected routes using JWT authentication.
- **Error Handling**: Robust error handling for all endpoints.

## Tech Stack

- **Backend Framework**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Unique IDs**: uuid
- **Environment Variables**: dotenv

## Installation

## 1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <project-directory>
### 2. Install dependencies:
```bash
npm install
```
### 3. Create a .env file in the root directory with the following content:
```bash
DB_USER=<your-db-user>
DB_PASSWORD=<your-db-password>
DB_CLUSTER=<your-db-cluster>
DB_NAME=<your-database-name>
JWT_SECRET=<your-jwt-secret>
```
### 4. Start the server:
```bash
node <file-name>.js
```
Replace <file-name> with the name of your server file.

## API Endpoints
### 1. Register New User
- Endpoint: /register
- Method: POST
- Request Body:
```bash
{
  "username": "Srikanth",
  "email": "srikanth.doe@example.com",
  "password": "srikanth"
}
```
- **Response**:
```bash
{
  "message": "User Successfully Registered"
}
```
### 2. Login
- Endpoint: /login
- Method: POST
- Request Body:
```bash
{
  "email": "srikanth@gmail.com",
  "password": "srikanth"
}
```
- **Response**:
```bash
{
  "jwtToken": "<token>",
  "userId": "<user-id>"
}
```

## Transaction Endpoints
### 3. Create Transaction
- URL: /api/transactions
- Method: POST
- Headers: Authorization: Bearer <jwt-token>
- Request Body:
```bash
{
  "amount": 500,
  "transaction_type": "DEPOSIT",
  "user": "<user-id>"
}
```
- **Response**:
```bash
{
  "message": "Transaction successfully done"
}
```

### 4. Get User Transactions
- URL: /api/transactions/:id
- Method: GET
- Headers: Authorization: Bearer <jwt-token>
- **Response**:
```bash
{
  "transactions": [/* transactions array */]
}
```

### 5. Update Transaction Status
- URL: /api/transactions/:id
- Method: PUT
- Headers: Authorization: Bearer <jwt-token>
- Request Body:
```bash
{
  "status": "COMPLETED"
}
```
- **Response**:
```bash
{
  "message": "Successfully Status Updated"
}
```

### 6. Get Transaction by ID
- URL: /api/transaction/:id
- Method: GET
- Headers: Authorization: Bearer <jwt-token>
- **Response**:
```bash
{
  /* transaction details */
}
```


## Dependencies
- express: Fast, unopinionated web framework
- cors: Enable Cross-Origin Resource Sharing
- uuid: Generate unique identifiers
- mongodb: MongoDB driver for Node.js
- jsonwebtoken: Authenticate and secure API
- bcrypt: Hash passwords for secure storage
- dotenv: Manage environment variables
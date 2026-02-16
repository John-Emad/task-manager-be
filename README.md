# Task Manager API

A robust NestJS-based REST API for task management with user authentication. This application provides a complete backend solution for managing tasks with user registration, authentication, and CRUD operations.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Architecture & Design Decisions](#architecture--design-decisions)
- [Technology Stack](#technology-stack)
- [Additional Resources](#additional-resources)

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v18.x or higher) - [Download](https://nodejs.org/)
- **MySQL** or **MariaDB** database server - [MySQL Download](https://dev.mysql.com/downloads/) | [MariaDB Download](https://mariadb.org/download/)
- **npm** or **yarn** package manager (npm comes with Node.js)
- **Git** (for cloning the repository) - [Download](https://git-scm.com/)

## Environment Configuration

### Creating the `.env` File

Create a `.env` file in the project root directory (`task-manager/.env`) with the following environment variables:

### Required Environment Variables

| Variable       | Description                                                   | Example                                                |
| -------------- | ------------------------------------------------------------- | ------------------------------------------------------ |
| `DATABASE_URL` | MySQL connection string                                       | `mysql://username:password@localhost:3306/taskmanager` |
| `JWT_SECRET`   | Secret key for JWT token signing (use a strong random string) | `your-super-secret-jwt-key-change-this-in-production`  |
| `NODE_ENV`     | Environment mode                                              | `development`, `production`, or `test`                 |
| `PORT`         | Application port (optional, defaults to 3000)                 | `3000`                                                 |

### `.env` Example Template

Copy and paste this template into your `.env` file and update the values:

```env
# Database Configuration
DATABASE_URL="mysql://root:password@localhost:3306/taskmanager"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Application Configuration
NODE_ENV="development"
PORT=3000
```

> **Security Note**: Never commit your `.env` file to version control. The `.env` file should be listed in `.gitignore`. Always use strong, randomly generated secrets for `JWT_SECRET` in production environments.

## Installation & Setup

Follow these steps to set up the application:

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd task-manager
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

Create and configure your `.env` file as described in the [Environment Configuration](#environment-configuration) section above.

### Step 4: Set Up the Database

Create a MySQL database for the application:

```sql
CREATE DATABASE taskmanager;
```

Or use your MySQL client:

```bash
mysql -u root -p -e "CREATE DATABASE taskmanager;"
```

### Step 5: Run Prisma Migrations

Apply the database schema migrations:

```bash
npx prisma migrate dev
```

This command will:

- Create the necessary database tables
- Apply all pending migrations
- Generate the Prisma Client

### Step 6: Generate Prisma Client

If not already generated in the previous step, run:

```bash
npx prisma generate
```

## Running the Application

### Development Mode

Run the application in development mode with hot-reload (watch mode):

```bash
npm run start:dev
```

The application will start on `http://localhost:3000` (or the port specified in your `.env` file).

### Production Mode

Build and run the application in production mode:

```bash
# Build the application
npm run build

# Start the production server
npm run start:prod
```

### Accessing the Application

- **API Base URL**: `http://localhost:3000`
- **Swagger Documentation**: `http://localhost:3000/api`

## API Documentation

### Swagger/OpenAPI Documentation

This application includes comprehensive API documentation powered by Swagger/OpenAPI. Once the application is running, you can access the interactive API documentation at:

**`http://localhost:3000/api`**

The Swagger UI provides:

- Complete endpoint documentation
- Request/response schemas
- Interactive API testing
- Authentication configuration

### API Endpoints Overview

The API is organized into the following main categories:

- **Authentication** (`/auth`) - User registration, login, and logout
- **Users** (`/users`) - User management operations
- **Tasks** (`/tasks`) - Task CRUD operations

### Postman Collection

A Postman collection for testing all API endpoints can be created by importing the OpenAPI specification from the Swagger documentation:

1. Access the Swagger UI at `http://localhost:3000/api`
2. Download the OpenAPI JSON specification
3. Import it into Postman

Alternatively, you can manually test endpoints using the Swagger UI's built-in testing interface.

## Architecture & Design Decisions

### Authentication Strategy - Cookie-based JWT

This application implements a **cookie-based JWT authentication** strategy instead of the traditional approach of storing tokens in localStorage and sending them via the `Authorization: Bearer` header.

#### Implementation Details

- **JWT Storage**: JWT tokens are stored in HttpOnly cookies named `access_token`
- **Token Extraction**: The JWT strategy extracts tokens from the `access_token` cookie in incoming requests
- **Cookie Configuration**: Cookies are configured with security attributes:
  - `httpOnly: true` - Prevents JavaScript access to the cookie
  - `secure: true` (in production) - Ensures HTTPS-only transmission
  - `sameSite: 'strict'` - Provides CSRF protection
  - `maxAge: 24 hours` - Token expiration time

#### Security Rationale

**1. XSS Protection**

- HttpOnly cookies cannot be accessed by JavaScript code running in the browser
- This protects against Cross-Site Scripting (XSS) attacks where malicious scripts attempt to steal authentication tokens
- Even if an attacker injects malicious JavaScript, they cannot read the authentication cookie

**2. CSRF Mitigation**

- Combined with `SameSite` cookie attributes (`strict` or `lax`), provides robust protection against Cross-Site Request Forgery (CSRF) attacks
- The browser automatically enforces same-site policies, preventing unauthorized cross-origin requests

**3. Automatic Handling**

- Browsers automatically include cookies in requests to the same domain
- Simplifies client-side implementation - no need to manually attach tokens to every request
- Reduces the risk of developer errors in token handling

**4. Secure Transmission**

- Cookies marked as `Secure` in production ensure tokens are only transmitted over HTTPS
- Prevents token interception over insecure connections

#### Code Reference

The JWT extraction logic is implemented in `src/auth/strategies/jwt.strategy.ts`:

```typescript
jwtFromRequest: ExtractJwt.fromExtractors([
  (request: Request) => {
    return request?.cookies?.access_token;
  },
]),
```

The cookie is set during login in `src/auth/auth.controller.ts`:

```typescript
res.cookie('access_token', result.access_token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
});
```

### Database Architecture

- **ORM**: Prisma ORM for type-safe database access
- **Database**: MySQL/MariaDB with connection pooling via `@prisma/adapter-mariadb`
- **Migrations**: Version-controlled schema migrations using Prisma Migrate

### Validation & Transformation

- **class-validator**: Automatic DTO validation with decorators
- **class-transformer**: Automatic payload transformation to DTO classes
- **Global Validation Pipe**: Configured to whitelist properties and reject unknown fields

## Technology Stack

This application is built with the following technologies:

- **[NestJS](https://nestjs.com/)** - Progressive Node.js framework for building efficient and scalable server-side applications
- **[Prisma ORM](https://www.prisma.io/)** - Next-generation ORM for Node.js and TypeScript with MySQL/MariaDB
- **[Passport.js](http://www.passportjs.org/)** - Authentication middleware with JWT strategy
- **[Swagger/OpenAPI](https://swagger.io/)** - API documentation and testing interface
- **[bcrypt](https://www.npmjs.com/package/bcrypt)** - Password hashing library
- **[class-validator](https://github.com/typestack/class-validator)** - Decorator-based validation
- **[class-transformer](https://github.com/typestack/class-transformer)** - Object transformation and serialization
- **[cookie-parser](https://www.npmjs.com/package/cookie-parser)** - Cookie parsing middleware
- **[TypeScript](https://www.typescriptlang.org/)** - Typed superset of JavaScript

## Additional Resources

- **[NestJS Documentation](https://docs.nestjs.com)** - Official NestJS documentation
- **[Prisma Documentation](https://www.prisma.io/docs)** - Official Prisma documentation
- **[Passport JWT Strategy](http://www.passportjs.org/packages/passport-jwt/)** - Passport JWT authentication strategy

---

**License**: UNLICENSED

**Version**: 0.0.1

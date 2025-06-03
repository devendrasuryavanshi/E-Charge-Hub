# E-Charge Hub - Electric Vehicle Charging Station Management System

A comprehensive full-stack application for managing electric vehicle charging stations with real-time monitoring, interactive maps, and user authentication.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Usage](#usage)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Overview

E-Charge Hub is a modern web application designed to streamline the management of electric vehicle charging stations. The platform provides administrators with tools to monitor, manage, and analyze charging infrastructure while offering users an intuitive interface to locate and interact with charging stations.

### Key Capabilities

- **Station Management**: Complete CRUD operations for charging stations
- **User Authentication**: Secure JWT-based authentication system
- **Interactive Maps**: Real-time visualization of charging stations using OpenStreetMap
- **Advanced Filtering**: Multi-parameter filtering and search functionality
- **Responsive Design**: Mobile-first approach with cross-device compatibility
- **Real-time Updates**: Live status monitoring and updates

## Features

### Backend Features

- RESTful API architecture with Express.js
- JWT-based authentication and authorization
- MongoDB integration with Mongoose ODM
- Input validation and sanitization
- Error handling and logging
- CORS configuration for cross-origin requests
- Environment-based configuration management

### Frontend Features

- Modern Vue.js 3 with Composition API
- TypeScript integration for type safety
- Responsive UI with custom CSS variables
- Interactive maps with Leaflet.js
- Real-time search and filtering
- Form validation and error handling
- Toast notifications for user feedback
- Progressive Web App (PWA) capabilities

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT)
- **Validation**: Express Validator
- **Security**: Helmet, CORS, bcryptjs
- **Development**: Nodemon, TypeScript

### Frontend
- **Framework**: Vue.js 3 with Composition API
- **Language**: TypeScript
- **Build Tool**: Vite
- **State Management**: Pinia
- **HTTP Client**: Axios
- **Maps**: Leaflet.js with Vue-Leaflet
- **Icons**: Lucide Vue
- **Notifications**: Vue3-Toastify

### DevOps & Deployment
- **Version Control**: Git with GitHub
- **CI/CD**: GitHub Actions
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Render
- **Database**: MongoDB Atlas
- **Environment Management**: dotenv

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Vue.js)      │◄──►│   (Express.js)  │◄──►│   (MongoDB)     │
│                 │    │                 │    │                 │
│ - Components    │    │ - REST APIs     │    │ - Collections   │
│ - Composables   │    │ - Middleware    │    │ - Indexes       │
│ - Services      │    │ - Controllers   │    │ - Validation    │
│ - Stores        │    │ - Models        │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Prerequisites

Before running this application, ensure you have the following installed:

- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher (comes with Node.js)
- **MongoDB**: Local installation or MongoDB Atlas account
- **Git**: For version control

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/devendrasuryavanshi/E-Charge-Hub.git
cd E-Charge-Hub
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure environment variables (see Configuration section)
nano .env
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Configure environment variables
nano .env.local
```

## Configuration

### Backend Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/echarge-hub
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/echarge-hub

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# CORS Configuration
CLIENT_URL=http://localhost:5173
```

### Frontend Environment Variables

Create a `.env.local` file in the frontend directory:

```env
# API Configuration
VUE_APP_SERVER_URL=http://localhost:3000
```

### Database Setup

#### MongoDB Atlas (Recommended)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Configure network access (add your IP)
4. Create database user
5. Get connection string and update `MONGODB_URI`

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| POST | `/api/auth/register` | User registration | None |
| POST | `/api/auth/login` | User login | None |
| POST | `/api/auth/logout` | User logout | Required |
| GET | `/api/auth/me` | Get current user | Required |

### Charging Station Endpoints

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| GET | `/api/charging-stations` | Get all stations | Required |
| GET | `/api/charging-stations/:id` | Get station by ID | Required |
| POST | `/api/charging-stations` | Create new station | Required |
| PUT | `/api/charging-stations/:id` | Update station | Required |
| DELETE | `/api/charging-stations/:id` | Delete station | Required |

### Request/Response Examples

#### Register User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

#### Create Charging Station

```bash
curl -X POST http://localhost:3000/api/charging-stations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Downtown Charging Hub",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "status": "Active",
    "powerOutput": 150,
    "connectorType": "CCS"
  }'
```

## Usage

### Development Mode

#### Start Backend Server

```bash
cd backend
npm run dev
```

The backend server will start on `http://localhost:3000`

#### Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend application will be available at `http://localhost:5173`

### Production Build

#### Backend

```bash
cd backend
npm run build
npm start
```

#### Frontend

```bash
cd frontend
npm run build
npm run preview
```

## Deployment

### Backend Deployment (Render)

1. **Create account** on Render
2. **Connect GitHub repository**
3. **Configure environment variables**
4. **Set build command**: `npm run build`
5. **Set start command**: `npm start`
6. **Deploy**

### Frontend Deployment (Vercel)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   cd frontend
   vercel --prod
   ```

3. **Configure environment variables** in Vercel dashboard

### API Testing

Use the provided Postman collection or test with curl:

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Project Structure

```
E-Charge-Hub/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── composables/
│   │   ├── services/
│   │   ├── stores/
│   │   ├── types/
│   │   ├── utils/
│   │   └── views/
│   ├── package.json
│   └── vite.config.ts
├── .gitignore
├── README.md
└── LICENSE
```

## Contributing

We welcome contributions to E-Charge Hub! Please follow these guidelines:

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes** following the coding standards
4. **Write tests** for new functionality
5. **Run the test suite**: `npm test`
6. **Commit your changes**: `git commit -m "Add your feature"`
7. **Push to your fork**: `git push origin feature/your-feature-name`
8. **Create a Pull Request**

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Support

For support and questions:

- **GitHub Issues**: [Create an issue](https://github.com/devendrasuryavanshi/E-Charge-Hub/issues)
- **Email**: devendrasooryavanshee@gmail.com
---

**Built with ❤️ by [Devendra Suryavanshi](https://github.com/devendrasuryavanshi)**
# EXO - Personal Portfolio

A modern, interactive portfolio website built with React and Spring Boot.

## Project Structure

```
EXO/
├── frontend/           # React + Vite frontend
│   ├── src/
│   │   ├── assets/    # Static assets
│   │   ├── components/# Reusable components
│   │   ├── sections/  # Page sections
│   │   ├── models3D/  # 3D models and components
│   │   ├── hooks/     # Custom React hooks
│   │   ├── utils/     # Utility functions
│   │   ├── types/     # TypeScript type definitions
│   │   ├── services/  # API services
│   │   ├── context/   # React context providers
│   │   └── styles/    # Custom styles
│   └── public/        # Public assets
│
└── backend/           # Spring Boot backend
    ├── src/
    │   ├── main/
    │   │   ├── java/
    │   │   │   └── com/
    │   │   │       └── exo/
    │   │   │           ├── controller/  # REST controllers
    │   │   │           ├── service/     # Business logic
    │   │   │           ├── repository/  # Data access
    │   │   │           ├── model/       # Entity classes
    │   │   │           └── config/      # Configuration
    │   │   └── resources/
    │   │       └── application.properties
    │   └── test/      # Test classes
    └── pom.xml        # Maven configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Java 17+
- Maven

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Build the project:
   ```bash
   mvn clean install
   ```

3. Run the application:
   ```bash
   mvn spring-boot:run
   ```

The backend will be available at `http://localhost:8080`

## Features

- Modern, responsive design
- Interactive 3D models
- Smooth animations
- RESTful API
- Project showcase
- Blog section
- Contact form

## Technologies

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Three.js (@react-three/fiber)

### Backend
- Java 17
- Spring Boot 3.2
- Spring Data JPA
- H2 Database (Development)
- Maven

## Development

### Code Style
- Frontend: ESLint + Prettier
- Backend: Google Java Style Guide

### Git Workflow
1. Create feature branch from `develop`
2. Make changes
3. Create pull request to `develop`
4. Code review
5. Merge to `develop`
6. Periodically merge `develop` to `main`

## License

MIT License 
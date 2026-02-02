# Backend Paza

A TypeScript Express backend application.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration

### Development

Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Building

Build the project:
```bash
npm run build
```

### Production

Start the production server:
```bash
npm start
```

### Testing

Run tests:
```bash
npm test
```

### Linting

Check code quality:
```bash
npm run lint
```

Fix linting issues:
```bash
npm run lint:fix
```

## API Endpoints

- `GET /` - Hello World message
- `GET /health` - Health check endpoint
- `GET /api-docs` - Swagger API documentation

## API Documentation

The API is documented using Swagger/OpenAPI 3.0. You can access the interactive documentation at:

**Swagger UI:** `http://localhost:3000/api-docs`

The Swagger documentation provides:
- Interactive API testing
- Request/response schemas
- Authentication details (when applicable)
- Example requests and responses

## Project Structure

```
src/
├── index.ts          # Main application file
└── ...               # Additional source files

dist/                 # Compiled JavaScript files
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the project
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Check code quality
- `npm run lint:fix` - Fix linting issues

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)

## License

ISC
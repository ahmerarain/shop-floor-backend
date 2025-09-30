# CSV Ingest Backend

A robust Node.js/TypeScript backend service for processing CSV files with data validation, storage, and export capabilities. Built with Express.js and better-sqlite3 for high-performance data management.

## 🚀 Features

- **CSV Upload & Processing**: Upload CSV files with automatic validation
- **Data Validation**: Mandatory field validation with detailed error reporting
- **Database Storage**: SQLite database with better-sqlite3 for high-performance data persistence
- **Search & Pagination**: Search through data with pagination support
- **Data Export**: Export processed data back to CSV format
- **Error Handling**: Comprehensive error handling with detailed error reports
- **TypeScript**: Full TypeScript support with type safety
- **Clean Architecture**: MVC pattern with services, controllers, and utilities
- **Security Features**: File size limits, MIME type validation, and CSV formula injection protection

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm (package manager)
- TypeScript

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

## 🚀 Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

The server will start on port 5008 (or the port specified in the PORT environment variable).

## 📁 Project Structure

```
backend/
├── src/                 # Source code
│   ├── controllers/     # Request/response handling
│   │   ├── csvController.ts
│   │   └── index.ts
│   ├── services/        # Business logic
│   │   ├── csvService.ts
│   │   └── index.ts
│   ├── utils/           # Utility functions
│   │   ├── validation.ts    # Data validation utilities
│   │   ├── database.ts      # Database operation utilities
│   │   ├── csv.ts          # CSV processing utilities
│   │   ├── fileValidation.ts # File upload security
│   │   └── index.ts
│   ├── routes/          # API routes
│   │   └── csvRoutes.ts
│   ├── database/        # Database configuration
│   │   └── init.ts
│   └── index.ts         # Application entry point
├── tests/               # Test files
│   ├── validation-unit.test.ts
│   ├── validation.test.ts
│   ├── upload-simple.test.ts
│   └── setup.ts
├── data/               # Database files (auto-created)
│   ├── .gitignore     # Ignores database files
│   └── csv_data.db    # SQLite database file (auto-created)
├── uploads/            # Temporary file uploads
├── sample-data/        # Sample CSV files for testing
│   ├── sample.csv
│   └── sample-with-errors.csv
├── dist/               # Compiled JavaScript
├── .github/workflows/  # GitHub Actions CI/CD
├── Dockerfile          # Docker configuration
├── docker-compose.yml  # Docker Compose setup
├── .env.example        # Environment variables template
└── package.json        # Dependencies and scripts
```

## 🔌 API Endpoints

- `POST /api/csv/upload` - Upload and process CSV file
- `GET /api/csv/data` - Get paginated data with search
- `PUT /api/csv/data/:id` - Update specific data row
- `GET /api/csv/export` - Export all data as CSV
- `GET /api/csv/error` - Download error CSV file
- `GET /api/csv/error/check` - Check if error file exists
- `DELETE /api/csv/data` - Delete specific records by IDs
- `DELETE /api/csv/data/:id` - Delete specific record by ID
- `DELETE /api/csv/data/clear` - Clear all data from database

### POST `/api/csv/upload`

Upload and process a CSV file.

**Request:**

- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: `csvFile` (file)

**Response:**

```json
{
  "success": true,
  "validRows": 150,
  "invalidRows": 5,
  "hasErrorFile": true
}
```

### GET `/api/csv/data`

Retrieve paginated data with optional search.

**Query Parameters:**

- `search` (optional): Search term for part_mark, assembly_mark, or material
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 100)

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "part_mark": "PART001",
      "assembly_mark": "ASSY001",
      "material": "Steel",
      "thickness": "5mm",
      "quantity": 10,
      "length": 100,
      "width": 50,
      "height": 25,
      "weight": 2.5,
      "notes": "Sample part",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 100
}
```

### PUT `/api/csv/data/:id`

Update a specific data row.

**Request:**

```json
{
  "part_mark": "PART001",
  "assembly_mark": "ASSY001",
  "material": "Steel",
  "thickness": "5mm",
  "quantity": 10,
  "length": 100,
  "width": 50,
  "height": 25,
  "weight": 2.5,
  "notes": "Updated notes"
}
```

**Response:**

```json
{
  "success": true,
  "changes": 1
}
```

### GET `/api/csv/export`

Export all data as a CSV file.

**Response:**

- Content-Type: `text/csv`
- File download with all data

### GET `/api/csv/error`

Download the error CSV file containing validation errors from the last upload.

**Response:**

- Content-Type: `text/csv`
- File download with error details
- Returns 404 if no error file exists

### GET `/api/csv/error/check`

Check if an error file exists from the last upload.

**Response:**

```json
{
  "hasErrorFile": true,
  "message": "Error file available for download"
}
```

or

```json
{
  "hasErrorFile": false,
  "message": "No error file found"
}
```

### DELETE `/api/csv/data`

Delete specific records by their IDs.

**Request:**

```json
{
  "ids": [1, 2, 3, 4, 5]
}
```

**Response:**

```json
{
  "success": true,
  "deletedCount": 5,
  "message": "Successfully deleted 5 record(s)"
}
```

**Error Response:**

```json
{
  "error": "IDs array is required and cannot be empty"
}
```

### DELETE `/api/csv/data/clear`

Clear all data from the database.

**Request:**

- Method: `DELETE`
- No body required

**Response:**

```json
{
  "success": true,
  "message": "All data has been cleared from the database"
}
```

**Error Response:**

```json
{
  "error": "Failed to clear database"
}
```

## 🚨 Error Codes

### File Upload Errors

- `NO_FILE`: No file was uploaded
- `FILE_VALIDATION_FAILED`: File validation failed (size, type, or extension)
- `FILE_TOO_LARGE`: File size exceeds 10MB limit
- `TOO_MANY_FILES`: More than one file uploaded
- `INVALID_FILE_TYPE`: File type is not CSV

### Example Error Response

```json
{
  "error": "File validation failed",
  "details": [
    "File size exceeds 10MB limit",
    "File type 'application/pdf' is not allowed"
  ],
  "code": "FILE_VALIDATION_FAILED"
}
```

## 📊 CSV Format

### Expected CSV Headers

The system supports flexible column naming. The following headers are recognized:

| Database Field | Supported Headers                                |
| -------------- | ------------------------------------------------ |
| part_mark      | "Part Mark", "PartMark", "Part_Mark"             |
| assembly_mark  | "Assembly Mark", "AssemblyMark", "Assembly_Mark" |
| material       | "Material"                                       |
| thickness      | "Thickness"                                      |
| quantity       | "Quantity"                                       |
| length         | "Length"                                         |
| width          | "Width"                                          |
| height         | "Height"                                         |
| weight         | "Weight"                                         |
| notes          | "Notes"                                          |

### Required Fields

- Part Mark
- Assembly Mark
- Material
- Thickness

### Optional Fields

- Quantity (defaults to 1)
- Length, Width, Height, Weight
- Notes

## 🗄️ Database Schema

```sql
CREATE TABLE csv_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_mark TEXT NOT NULL,
  assembly_mark TEXT NOT NULL,
  material TEXT NOT NULL,
  thickness TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  length REAL,
  width REAL,
  height REAL,
  weight REAL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Available variables:

- `NODE_ENV`: Environment mode (development/production)
- `PORT`: Server port (default: 5008)
- `DATABASE_PATH`: SQLite database path (default: ./data/csv_data.db)
- `MAX_FILE_SIZE`: Maximum file upload size in bytes (default: 10485760)
- `UPLOAD_DIR`: Upload directory (default: ./uploads)
- `CORS_ORIGIN`: CORS origin (default: http://localhost:3000)

### Database

- Uses better-sqlite3 for high-performance SQLite database
- Database file: `data/csv_data.db` (real SQLite file)
- WAL mode enabled for better performance
- Automatically created on first run
- Graceful shutdown handling

## 🔒 Security Features

### File Upload Security

- **File Size Limit**: Maximum 10MB per file upload
- **MIME Type Validation**: Only allows CSV files (`text/csv`, `application/csv`, `text/plain`, `application/vnd.ms-excel`)
- **File Extension Validation**: Only accepts `.csv` files
- **File Name Validation**: Prevents directory traversal attacks

### CSV Formula Injection Protection

- **Export Protection**: All exported CSV data is sanitized to prevent formula injection
- **Prefix Guard**: Values starting with `=`, `+`, `-`, `@`, `\t`, or `\r` are prefixed with `'` to prevent execution
- **Command Injection Detection**: Warns about suspicious patterns like `=cmd|` or `=powershell|`

### Error Handling

- **Structured Error Responses**: Consistent error format with error codes
- **File Validation Errors**: Detailed validation error messages
- **Multer Error Handling**: Proper handling of file upload errors

## 🚨 Error Handling

### Validation Errors

When CSV upload contains invalid rows, an error file (`error.csv`) is generated with:

- Row number
- Original data
- Validation error messages

### API Errors

All endpoints return appropriate HTTP status codes:

- `200`: Success
- `400`: Bad Request (missing file, invalid data, invalid IDs)
- `404`: Not Found (error file not found)
- `500`: Internal Server Error

## 🧪 Development

### Scripts

```bash
# Development with hot reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Type checking
npm run type-check
```

### Docker Development

```bash
# Start with Docker
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down

# Clean up
npm run docker:clean
```

### Testing

The project includes comprehensive tests:

- **Unit Tests**: Validation functions and utilities
- **Integration Tests**: File upload and API endpoints
- **Coverage**: Test coverage reporting

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI
npm run test:ci
```

### Code Structure

- **Controllers**: Handle HTTP requests/responses
- **Services**: Contain business logic
- **Utils**: Reusable utility functions
- **Routes**: Define API endpoints

### TypeScript Configuration

The project uses TypeScript with path aliases for clean imports:

```typescript
// Using path aliases
import { csvRoutes } from "@/routes/csvRoutes";
import { initDatabase } from "@/database/init";
import { validateRow } from "@/utils/validation";
```

Path mapping in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### Docker Support

The project includes full Docker support:

- **Dockerfile**: Multi-stage build for production
- **docker-compose.yml**: One-command deployment
- **Environment Variables**: Configurable via `.env`
- **Health Checks**: Automatic service monitoring
- **Volume Persistence**: Data and uploads persist between restarts

### CI/CD

GitHub Actions workflows for:

- **Backend Tests**: Automated testing on Node.js 18.x, 20.x
- **Docker Build**: Container build and validation
- **Security Scanning**: Vulnerability detection
- **Code Quality**: Linting and format checks

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support or questions, please open an issue in the repository.

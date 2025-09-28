# CSV Ingest Backend

A robust Node.js/TypeScript backend service for processing CSV files with data validation, storage, and export capabilities. Built with Express.js and SQL.js for efficient data management.

## 🚀 Features

- **CSV Upload & Processing**: Upload CSV files with automatic validation
- **Data Validation**: Mandatory field validation with detailed error reporting
- **Database Storage**: SQLite database with SQL.js for client-side data persistence
- **Search & Pagination**: Search through data with pagination support
- **Data Export**: Export processed data back to CSV format
- **Error Handling**: Comprehensive error handling with detailed error reports
- **TypeScript**: Full TypeScript support with type safety
- **Clean Architecture**: MVC pattern with services, controllers, and utilities

## 📋 Prerequisites

- Node.js (v18 or higher)
- pnpm (recommended) or npm
- TypeScript

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Build the project**
   ```bash
   pnpm run build
   # or
   npm run build
   ```

## 🚀 Usage

### Development Mode

```bash
pnpm run dev
# or
npm run dev
```

### Production Mode

```bash
pnpm run build
pnpm start
# or
npm run build
npm start
```

The server will start on port 5008 (or the port specified in the PORT environment variable).

## 📁 Project Structure

```
backend/
├── controllers/          # Request/response handling
│   ├── csvController.ts
│   └── index.ts
├── services/            # Business logic
│   ├── csvService.ts
│   └── index.ts
├── utils/               # Utility functions
│   ├── validation.ts    # Data validation utilities
│   ├── database.ts      # Database operation utilities
│   ├── csv.ts          # CSV processing utilities
│   └── index.ts
├── routes/              # API routes
│   └── csvRoutes.ts
├── database/            # Database configuration
│   └── init.ts
├── data/               # Database files (auto-created)
├── uploads/            # Temporary file uploads
├── dist/               # Compiled JavaScript
└── index.ts            # Application entry point
```

## 🔌 API Endpoints

- `POST /api/csv/upload` - Upload and process CSV file
- `GET /api/csv/data` - Get paginated data with search
- `PUT /api/csv/data/:id` - Update specific data row
- `GET /api/csv/export` - Export all data as CSV
- `GET /api/csv/error` - Download error CSV file
- `GET /api/csv/error/check` - Check if error file exists
- `DELETE /api/csv/data` - Delete specific records by IDs
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

- `PORT`: Server port (default: 5008)

### Database

- Uses SQL.js for client-side SQLite database
- Database file: `data/csv_data.db`
- Automatically created on first run

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
pnpm run dev

# Build TypeScript
pnpm run build

# Start production server
pnpm start
```

### Code Structure

- **Controllers**: Handle HTTP requests/responses
- **Services**: Contain business logic
- **Utils**: Reusable utility functions
- **Routes**: Define API endpoints

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

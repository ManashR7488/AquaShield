# AquaShield API Documentation 🚀

Welcome to the official API documentation for the **AquaShield Smart Community Health Surveillance System**. This guide provides detailed information about all available endpoints, authentication, response formats, and examples.

## 📋 Table of Contents

- [API Overview](#-api-overview)
- [Authentication](#-authentication)
- [Response Format](#-response-format)
- [Authentication Endpoints](#-authentication-endpoints)
- [District Management Endpoints](#-district-management-endpoints)
- [Block Management Endpoints](#-block-management-endpoints)
- [User Management Endpoints](#-user-management-endpoints)
- [Health Report Endpoints](#-health-report-endpoints)
- [Patient Record Endpoints](#-patient-record-endpoints)
- [Vaccination Endpoints](#-vaccination-endpoints)
- [Water Quality Test Endpoints](#-water-quality-test-endpoints)
- [Health Observation Endpoints](#-health-observation-endpoints)
- [Community Report Endpoints](#-community-report-endpoints)
- [Personal Health Record Endpoints](#-personal-health-record-endpoints)
- [Family Member Endpoints](#-family-member-endpoints)
- [Health Program Endpoints](#-health-program-endpoints)
- [AI Chatbot Endpoints](#-ai-chatbot-endpoints)
- [ML Microservice Endpoints](#-ml-microservice-endpoints)
- [Query Parameters](#-query-parameters)
- [Error Codes Reference](#-error-codes-reference)
- [Rate Limiting](#-rate-limiting)
- [Postman Collection](#-postman-collection)
- [Code Examples](#-code-examples)

## 🌐 API Overview

### Base URL
- **Development**: `http://localhost:5000/api`
- **Production**: `https://api.aquashield.com/api` (example)

### API Version
- **Current Version**: `v1`
- All endpoints are prefixed with `/api`

### Content-Type
- All requests and responses are in `application/json` format.

### Authentication
- **Method**: JWT Bearer Token
- **Header**: `Authorization: Bearer <token>`

## 🔐 Authentication

### Token-Based Authentication
AquaShield uses JSON Web Tokens (JWT) for secure authentication. The system uses a pair of tokens:
- **Access Token**: Short-lived (e.g., 15 minutes), used for API requests.
- **Refresh Token**: Long-lived (e.g., 7 days), used to obtain new access tokens.

### How to Obtain Tokens
1. **Register**: `POST /api/auth/signup`
2. **Login**: `POST /api/auth/login`
   - Successful login returns an access token and a refresh token.
   - The refresh token is stored in an `httpOnly` cookie for security.

### Token Refresh Mechanism
- When an access token expires, the client should call `POST /api/auth/refresh`.
- This endpoint uses the refresh token (sent via cookie) to generate a new access token.
- If the refresh token is also expired, the user must log in again.

### Authorization Header
All protected endpoints require the access token in the `Authorization` header:
```
Authorization: Bearer <your-access-token>
```

### Logout
- `POST /api/auth/logout` clears the refresh token cookie, invalidating the session.

## 📝 Response Format

### Success Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Resource retrieved successfully",
  "data": {
    "id": "60d5f3f77b8e9a001f8e8d8c",
    "name": "Example Resource"
  }
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### Paginated Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Resources retrieved successfully",
  "data": [
    { "id": "1", "name": "Item 1" },
    { "id": "2", "name": "Item 2" }
  ],
  "pagination": {
    "totalDocs": 100,
    "limit": 10,
    "totalPages": 10,
    "page": 1,
    "pagingCounter": 1,
    "hasPrevPage": false,
    "hasNextPage": true,
    "prevPage": null,
    "nextPage": 2
  }
}
```

### HTTP Status Codes
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `204 No Content`: Request successful, no response body
- `400 Bad Request`: Invalid request (validation errors)
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate resource
- `500 Internal Server Error`: Server-side error

## 🔑 Authentication Endpoints

### `POST /api/auth/signup`
**Description**: Register a new user.
**Authentication**: None
**Request Body**:
```json
{
  "personalInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com"
  },
  "contactInfo": {
    "mobile": "1234567890"
  },
  "password": "Password123!",
  "roleInfo": {
    "role": "User"
  }
}
```
**Response (201 Created)**:
```json
{
  "success": true,
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "email": "john.doe@example.com"
    },
    "accessToken": "..."
  }
}
```

### `POST /api/auth/login`
**Description**: Log in an existing user.
**Authentication**: None
**Request Body**:
```json
{
  "email": "john.doe@example.com",
  "password": "Password123!"
}
```
**Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "email": "john.doe@example.com",
      "role": "User"
    },
    "accessToken": "..."
  }
}
```

### `POST /api/auth/logout`
**Description**: Log out the current user.
**Authentication**: Required
**Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Logout successful"
}
```

### `POST /api/auth/refresh`
**Description**: Refresh the access token.
**Authentication**: Refresh token (via cookie)
**Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Access token refreshed",
  "data": {
    "accessToken": "..."
  }
}
```

### `POST /api/auth/forgot-password`
**Description**: Request a password reset link.
**Authentication**: None
**Request Body**:
```json
{
  "email": "john.doe@example.com"
}
```
**Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password reset link sent to your email"
}
```

### `POST /api/auth/reset-password`
**Description**: Reset password with a valid token.
**Authentication**: None
**Request Body**:
```json
{
  "token": "reset-token-from-email",
  "password": "NewPassword123!"
}
```
**Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password reset successful"
}
```

## 🏛️ District Management Endpoints

**Access**: Admin only

### `GET /api/districts`
**Description**: Get all districts with pagination and filtering.
**Query Parameters**: `page`, `limit`, `sortBy`, `sortOrder`, `search`
**Response (200 OK)**: Paginated list of districts.

### `POST /api/districts`
**Description**: Create a new district.
**Request Body**:
```json
{
  "name": "Kamrup",
  "state": "Assam",
  "districtId": "AS-01"
}
```
**Response (201 Created)**: The newly created district object.

### `GET /api/districts/:id`
**Description**: Get a single district by ID.
**Response (200 OK)**: The district object.

### `PUT /api/districts/:id`
**Description**: Update a district.
**Request Body**:
```json
{
  "name": "Kamrup Metropolitan",
  "population": 1300000
}
```
**Response (200 OK)**: The updated district object.

### `DELETE /api/districts/:id`
**Description**: Delete a district.
**Response (204 No Content)**.

### `POST /api/districts/:id/assign-officer`
**Description**: Assign a district officer.
**Request Body**:
```json
{
  "userId": "user-id-of-officer"
}
```
**Response (200 OK)**: Success message.

### `POST /api/districts/:id/blocks/token`
**Description**: Generate a registration token for a new block.
**Request Body**:
```json
{
  "expiresIn": "7d"
}
```
**Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Block registration token generated successfully",
  "data": {
    "token": "generated-block-token"
  }
}
```

### `GET /api/districts/:id/stats`
**Description**: Get statistics for a district.
**Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "District statistics retrieved successfully",
  "data": {
    "population": 1250000,
    "blockCount": 12,
    "healthReports": 5432,
    "waterQuality": {
      "safe": 85,
      "unsafe": 15
    }
  }
}
```

## 🏢 Block Management Endpoints

**Access**: Health Officer, Admin

### `GET /api/blocks`
**Description**: Get all blocks.
**Query Parameters**: `page`, `limit`, `district`, `status`
**Response (200 OK)**: Paginated list of blocks.

### `POST /api/blocks`
**Description**: Create a new block using a registration token.
**Request Body**:
```json
{
  "token": "block-registration-token",
  "name": "Hajo",
  "blockId": "AS-01-B01"
}
```
**Response (201 Created)**: The newly created block object.

### `GET /api/blocks/:id`
**Description**: Get a single block by ID.
**Response (200 OK)**: The block object.

### `PUT /api/blocks/:id`
**Description**: Update a block.
**Response (200 OK)**: The updated block object.

### `DELETE /api/blocks/:id`
**Description**: Delete a block.
**Response (204 No Content)**.

### `POST /api/blocks/:id/assign-officer`
**Description**: Assign a block officer.
**Request Body**:
```json
{
  "userId": "user-id-of-officer"
}
```
**Response (200 OK)**: Success message.

### `POST /api/blocks/:id/assign-staff`
**Description**: Assign staff (e.g., ASHA workers) to a block.
**Request Body**:
```json
{
  "userIds": ["user-id-1", "user-id-2"]
}
```
**Response (200 OK)**: Success message.

### `POST /api/blocks/:id/village-tokens`
**Description**: Generate registration tokens for villages.
**Request Body**:
```json
{
  "count": 5,
  "expiresIn": "30d"
}
```
**Response (200 OK)**: List of generated village tokens.

### `GET /api/blocks/:id/stats`
**Description**: Get statistics for a block.
**Response (200 OK)**: Block statistics object.

## 👤 User Management Endpoints

**Access**: Admin only

### `GET /api/users`
**Description**: Get all users.
**Query Parameters**: `page`, `limit`, `role`, `status`, `search`
**Response (200 OK)**: Paginated list of users.

### `GET /api/users/:id`
**Description**: Get a single user by ID.
**Response (200 OK)**: The user object (without password).

### `PUT /api/users/:id`
**Description**: Update user profile information.
**Response (200 OK)**: The updated user object.

### `PATCH /api/users/:id/role`
**Description**: Update a user's role.
**Request Body**:
```json
{
  "role": "HealthOfficer"
}
```
**Response (200 OK)**: Success message.

### `PATCH /api/users/:id/status`
**Description**: Update a user's status (active, suspended).
**Request Body**:
```json
{
  "status": "suspended",
  "reason": "Violation of terms"
}
```
**Response (200 OK)**: Success message.

### `POST /api/users/:id/assign-district`
**Description**: Assign a user to a district.
**Request Body**:
```json
{
  "districtId": "district-id"
}
```
**Response (200 OK)**: Success message.

## 🩺 Health Report Endpoints

**Access**: ASHA Worker, Health Officer, Admin

### `GET /api/health-reports`
**Description**: Get all health reports.
**Query Parameters**: `page`, `limit`, `block`, `village`, `disease`
**Response (200 OK)**: Paginated list of health reports.

### `POST /api/health-reports`
**Description**: Create a new health report.
**Request Body**:
```json
{
  "patientId": "patient-id",
  "villageId": "village-id",
  "symptoms": ["fever", "cough"],
  "diagnosis": "Viral Fever",
  "treatment": "Paracetamol"
}
```
**Response (201 Created)**: The newly created health report.

### `GET /api/health-reports/:id`
**Description**: Get a single health report by ID.
**Response (200 OK)**: The health report object.

### `PUT /api/health-reports/:id`
**Description**: Update a health report.
**Response (200 OK)**: The updated health report.

### `DELETE /api/health-reports/:id`
**Description**: Delete a health report.
**Response (204 No Content)**.

## 🤒 Patient Record Endpoints

**Access**: ASHA Worker, Health Officer, Admin

### `GET /api/patient-records`
**Description**: Get all patient records.
**Query Parameters**: `page`, `limit`, `search`
**Response (200 OK)**: Paginated list of patient records.

### `POST /api/patient-records`
**Description**: Create a new patient record.
**Request Body**:
```json
{
  "personalInfo": {
    "firstName": "Jane",
    "lastName": "Doe",
    "dob": "1990-05-15"
  },
  "contactInfo": {
    "mobile": "0987654321"
  },
  "address": {
    "village": "Village Name",
    "blockId": "block-id"
  }
}
```
**Response (201 Created)**: The newly created patient record.

### `GET /api/patient-records/:id`
**Description**: Get a single patient record by ID.
**Response (200 OK)**: The patient record object.

### `PUT /api/patient-records/:id`
**Description**: Update a patient record.
**Response (200 OK)**: The updated patient record.

## 💉 Vaccination Endpoints

**Access**: ASHA Worker, Health Officer, Admin

### `GET /api/vaccinations`
**Description**: Get all vaccination records.
**Query Parameters**: `page`, `limit`, `patientId`, `vaccineName`
**Response (200 OK)**: Paginated list of vaccination records.

### `POST /api/vaccinations`
**Description**: Create a new vaccination record.
**Request Body**:
```json
{
  "patientId": "patient-id",
  "vaccineName": "BCG",
  "dateAdministered": "2025-01-20",
  "administeredBy": "user-id-of-asha-worker"
}
```
**Response (201 Created)**: The newly created vaccination record.

### `GET /api/vaccinations/:id`
**Description**: Get a single vaccination record by ID.
**Response (200 OK)**: The vaccination record object.

### `PUT /api/vaccinations/:id`
**Description**: Update a vaccination record.
**Response (200 OK)**: The updated vaccination record.

## 💧 Water Quality Test Endpoints

**Access**: Volunteer, Health Officer, Admin

### `GET /api/water-tests`
**Description**: Get all water quality tests.
**Query Parameters**: `page`, `limit`, `village`, `result`
**Response (200 OK)**: Paginated list of water tests.

### `POST /api/water-tests`
**Description**: Submit a new water quality test.
**Request Body**:
```json
{
  "location": {
    "villageId": "village-id",
    "latitude": 26.1445,
    "longitude": 91.7362
  },
  "parameters": {
    "ph": 7.2,
    "turbidity": 1.5,
    "dissolvedOxygen": 8.2,
    "coliform": "absent"
  }
}
```
**Response (201 Created)**: The newly created water test record.

### `GET /api/water-tests/:id`
**Description**: Get a single water test by ID.
**Response (200 OK)**: The water test object.

### `POST /api/water-tests/predict`
**Description**: Predict water quality using the ML model.
**Request Body**:
```json
{
  "ph": 7.2,
  "turbidity": 1.5,
  "dissolvedOxygen": 8.2
}
```
**Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Water quality predicted successfully",
  "data": {
    "prediction": "safe",
    "confidence": 0.95
  }
}
```

## 👁️ Health Observation Endpoints

**Access**: Volunteer, ASHA Worker, Health Officer, Admin

### `GET /api/health-observations`
**Description**: Get all health observations.
**Response (200 OK)**: Paginated list of observations.

### `POST /api/health-observations`
**Description**: Create a new health observation.
**Request Body**:
```json
{
  "villageId": "village-id",
  "observationType": "SymptomCluster",
  "description": "Multiple families reporting similar stomach issues.",
  "urgency": "high"
}
```
**Response (201 Created)**: The newly created observation.

### `GET /api/health-observations/:id`
**Description**: Get a single health observation by ID.
**Response (200 OK)**: The observation object.

## 🏘️ Community Report Endpoints

**Access**: Volunteer, ASHA Worker, Health Officer, Admin

### `GET /api/community-observations`
**Description**: Get all community reports.
**Response (200 OK)**: Paginated list of reports.

### `POST /api/community-observations`
**Description**: Create a new community report.
**Request Body**:
```json
{
  "villageId": "village-id",
  "reportType": "Sanitation",
  "description": "Community well is contaminated with runoff.",
  "location": {
    "latitude": 26.1445,
    "longitude": 91.7362
  }
}
```
**Response (201 Created)**: The newly created report.

### `GET /api/community-observations/:id`
**Description**: Get a single community report by ID.
**Response (200 OK)**: The report object.

## ❤️ Personal Health Record Endpoints

**Access**: User (own records)

### `GET /api/personal-health-records`
**Description**: Get the current user's health records.
**Response (200 OK)**: List of health records.

### `POST /api/personal-health-records`
**Description**: Create a new personal health record.
**Request Body**:
```json
{
  "recordType": "Allergy",
  "description": "Allergic to penicillin",
  "date": "2024-05-10"
}
```
**Response (201 Created)**: The newly created record.

### `GET /api/personal-health-records/:id`
**Description**: Get a single personal health record by ID.
**Response (200 OK)**: The record object.

## 👨‍👩‍👧‍👦 Family Member Endpoints

**Access**: User (own family)

### `GET /api/family-members`
**Description**: Get the current user's family members.
**Response (200 OK)**: List of family members.

### `POST /api/family-members`
**Description**: Add a new family member.
**Request Body**:
```json
{
  "firstName": "Sam",
  "lastName": "Doe",
  "relationship": "Son",
  "dob": "2015-10-20"
}
```
**Response (201 Created)**: The newly added family member.

### `GET /api/family-members/:id`
**Description**: Get a single family member by ID.
**Response (200 OK)**: The family member object.

### `PUT /api/family-members/:id`
**Description**: Update a family member's information.
**Response (200 OK)**: The updated family member object.

## 🏥 Health Program Endpoints

**Access**: Health Officer, Admin

### `GET /api/health-programs`
**Description**: Get all health programs.
**Response (200 OK)**: Paginated list of health programs.

### `POST /api/health-programs`
**Description**: Create a new health program.
**Request Body**:
```json
{
  "name": "Maternal Health Drive",
  "description": "A 3-month program for expectant mothers.",
  "startDate": "2025-02-01",
  "endDate": "2025-05-01",
  "targetAudience": "Pregnant women"
}
```
**Response (201 Created)**: The newly created program.

### `GET /api/health-programs/:id`
**Description**: Get a single health program by ID.
**Response (200 OK)**: The program object.

### `PUT /api/health-programs/:id`
**Description**: Update a health program.
**Response (200 OK)**: The updated program object.

## 🤖 AI Chatbot Endpoints

**Access**: All authenticated users

### `POST /api/ai/chat`
**Description**: Send a message to the AI chatbot.
**Request Body**:
```json
{
  "message": "What are the symptoms of cholera?",
  "sessionId": "optional-session-id"
}
```
**Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Response from AI assistant",
  "data": {
    "response": "Cholera is an acute diarrhoeal infection caused by ingestion of food or water contaminated with the bacterium Vibrio cholerae...",
    "sessionId": "new-or-existing-session-id"
  }
}
```

### `POST /api/ai/voice`
**Description**: Process voice input for the chatbot.
**Request Body**: `multipart/form-data` with audio file.
**Response (200 OK)**: Same as `/api/ai/chat`.

### `GET /api/ai/history`
**Description**: Get the chat history for a session.
**Query Parameters**: `sessionId`
**Response (200 OK)**: List of chat messages.

## 🔬 ML Microservice Endpoints

**Access**: All authenticated users

### `POST /api/ml/predict-water-quality`
**Description**: Predict water quality.
**Request Body**:
```json
{
  "ph": 6.8,
  "turbidity": 4.5,
  "dissolvedOxygen": 5.1
}
```
**Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Prediction successful",
  "data": {
    "prediction": "unsafe",
    "confidence": 0.88
  }
}
```

### `GET /api/ml/model-info`
**Description**: Get information about the current ML model.
**Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Model information retrieved",
  "data": {
    "modelName": "RandomForestClassifier",
    "version": "1.2.0",
    "trainingDate": "2024-12-15"
  }
}
```

## ⚙️ Query Parameters

Common query parameters for list endpoints:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | Number | Page number for pagination | `?page=2` |
| `limit` | Number | Number of items per page | `?limit=20` |
| `sortBy` | String | Field to sort by | `?sortBy=createdAt` |
| `sortOrder` | String | Sort order (`asc` or `desc`) | `?sortOrder=desc` |
| `search` | String | Search query for relevant fields | `?search=fever` |
| `status` | String | Filter by status | `?status=active` |
| `role` | String | Filter by user role | `?role=ASHAWorker` |
| `district` | String | Filter by district ID | `?district=district-id` |
| `block` | String | Filter by block ID | `?block=block-id` |
| `village` | String | Filter by village ID | `?village=village-id` |

## ❌ Error Codes Reference

| Code | Status | Description |
|------|--------|-------------|
| `400` | Bad Request | Invalid syntax or validation error. |
| `401` | Unauthorized | Authentication is required and has failed. |
| `403` | Forbidden | You do not have permission to access this resource. |
| `404` | Not Found | The requested resource could not be found. |
| `409` | Conflict | The request could not be completed due to a conflict (e.g., duplicate entry). |
| `429` | Too Many Requests | You have exceeded the rate limit. |
| `500` | Internal Server Error | An unexpected error occurred on the server. |

## ⏱️ Rate Limiting

To prevent abuse, API endpoints are rate-limited.

- **General Endpoints**: 100 requests per 15 minutes per IP.
- **Authentication Endpoints**: 5 requests per 15 minutes per IP.

If you exceed the rate limit, you will receive a `429 Too Many Requests` error. The response headers will include:
- `X-RateLimit-Limit`: The maximum number of requests.
- `X-RateLimit-Remaining`: The number of requests remaining in the window.
- `Retry-After`: The number of seconds to wait before making a new request.

## 📦 Postman Collection

A Postman collection is available to help you test the API endpoints.

[**Download Postman Collection**](link-to-postman-collection.json)

To use it:
1. Open Postman.
2. Click "Import".
3. Upload the JSON file.
4. Configure environment variables (e.g., `baseUrl`, `accessToken`).

## 💻 Code Examples

### JavaScript (Axios)
```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include the token
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Example: Get all districts
async function getDistricts() {
  try {
    const response = await apiClient.get('/districts?page=1&limit=10');
    console.log(response.data);
  } catch (error) {
    console.error(error.response.data);
  }
}
```

### cURL
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password"}'

# Get districts (replace with your token)
curl -X GET http://localhost:5000/api/districts \
  -H "Authorization: Bearer <your-access-token>"
```

### Python (requests)
```python
import requests
import json

BASE_URL = "http://localhost:5000/api"

def login(email, password):
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": email, "password": password}
    )
    if response.status_code == 200:
        return response.json()['data']['accessToken']
    return None

def get_districts(token):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/districts", headers=headers)
    return response.json()

if __name__ == "__main__":
    access_token = login("admin@example.com", "password")
    if access_token:
        districts = get_districts(access_token)
        print(json.dumps(districts, indent=2))
```
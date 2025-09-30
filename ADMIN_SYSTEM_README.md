# Admin District Management System - Backend API

A comprehensive backend system for managing districts, blocks, and administrative hierarchies in a health surveillance system. This system provides role-based access control, token-based block registration, and comprehensive administrative features.

## 🏗️ System Architecture

### Core Components

1. **District Management**
   - Create, update, and manage districts
   - Assign district officers
   - Generate block registration tokens
   - District statistics and analytics

2. **Block Management**
   - Token-based block registration
   - Block approval workflow
   - Assign block officers
   - Block analytics and reporting

3. **User Management**
   - Role-based user creation and management
   - Profile management
   - User verification and status control
   - User search and filtering

4. **Administrative Hierarchy**
   - State → District → Block structure
   - Officer assignments and permissions
   - Hierarchical access control

## 📋 Features Implemented

### ✅ District Controller & Routes
- **CRUD Operations**: Complete create, read, update, delete functionality
- **Officer Management**: Assign/remove district officers
- **Token Generation**: Create registration tokens for blocks
- **Statistics**: Comprehensive district analytics
- **Search & Filter**: Advanced search capabilities
- **Status Management**: Active/inactive/suspended states

### ✅ Block Controller & Routes
- **Token Registration**: Secure block registration using tokens
- **Approval Workflow**: Pending → Approved/Rejected workflow
- **Officer Management**: Assign/remove block officers
- **Analytics**: Block statistics and reporting
- **Search & Filter**: Multi-criteria search functionality

### ✅ User Controller & Routes
- **Profile Management**: User profile CRUD operations
- **Role Management**: Admin can manage user roles and permissions
- **Status Control**: User activation/deactivation
- **Verification System**: User verification workflow
- **Password Management**: Secure password change functionality

### ✅ Validation & Security
- **Joi Validation**: Comprehensive input validation for all endpoints
- **Role-Based Access**: Fine-grained permission system
- **Token Security**: Secure token generation and validation
- **Data Sanitization**: Input cleaning and validation

### ✅ Utilities & Helpers
- **ID Generation**: Unique ID generation for districts, blocks, and users
- **Token Generation**: Secure token creation and management
- **Response Helpers**: Standardized API response format
- **Error Handling**: Comprehensive error management

## 🔧 API Endpoints

### District Management

```
GET    /api/districts                    # Get all districts
POST   /api/districts                    # Create new district (Admin)
GET    /api/districts/:id                # Get district by ID
PUT    /api/districts/:id                # Update district (Admin)
DELETE /api/districts/:id                # Delete district (Admin)
POST   /api/districts/search             # Search districts
GET    /api/districts/:id/stats          # Get district statistics
GET    /api/districts/:id/dashboard      # Get district dashboard
GET    /api/districts/:id/blocks         # Get district blocks
PATCH  /api/districts/:id/status         # Update district status (Admin)

# District Officer Management
POST   /api/districts/:id/assign-officer    # Assign district officer (Admin)
DELETE /api/districts/:id/remove-officer    # Remove district officer (Admin)

# Block Token Management
POST   /api/districts/:id/blocks/token      # Generate block token
GET    /api/districts/:id/blocks/tokens     # Get block tokens
DELETE /api/districts/:id/blocks/tokens/:tokenId  # Revoke token
POST   /api/districts/validate-token       # Validate token
```

### Block Management

```
GET    /api/blocks                       # Get all blocks
POST   /api/blocks/register              # Register new block (Health Officials)
GET    /api/blocks/:id                   # Get block by ID
PUT    /api/blocks/:id                   # Update block
DELETE /api/blocks/:id                   # Delete block
POST   /api/blocks/search               # Search blocks
GET    /api/blocks/pending-approvals    # Get pending approvals
GET    /api/blocks/:id/stats            # Get block statistics
GET    /api/blocks/:id/dashboard        # Get block dashboard
PATCH  /api/blocks/:id/status           # Update block status

# Block Approval Workflow
POST   /api/blocks/:id/approve          # Approve block registration
POST   /api/blocks/:id/reject           # Reject block registration

# Block Officer Management
POST   /api/blocks/:id/assign-officer   # Assign block officer
DELETE /api/blocks/:id/remove-officer   # Remove block officer
```

### User Management

```
GET    /api/users                       # Get all users (Admin)
POST   /api/users                       # Create new user (Admin)
GET    /api/users/profile               # Get current user profile
PUT    /api/users/profile               # Update current user profile
GET    /api/users/stats                 # Get user statistics (Admin)
POST   /api/users/search               # Search users
GET    /api/users/:id                   # Get user by ID
PUT    /api/users/:id                   # Update user
DELETE /api/users/:id                   # Delete user (Admin)

# User Status & Role Management
PATCH  /api/users/:id/status            # Update user status (Admin)
PATCH  /api/users/:id/verify            # Verify user (Admin)
PATCH  /api/users/:id/role              # Update user role (Admin)
PATCH  /api/users/change-password       # Change password
```

## 🔐 Authentication & Authorization

### Roles
- **Admin**: Full system access, can manage all resources
- **Health Official**: Can be assigned as district/block officer, manage assigned areas
- **User**: Basic access to own profile and data

### Access Control Examples

```javascript
// District Officer can manage their district
router.post(
  '/:id/blocks/token',
  authorize(['admin', 'health_official'], { allowDistrictOfficer: true }),
  generateBlockToken
);

// Block Officer can manage their block
router.put(
  '/:id',
  authorize(['admin', 'health_official'], { 
    allowBlockOfficer: true, 
    allowDistrictOfficer: true 
  }),
  updateBlock
);
```

## 📊 Data Models

### District Model
```javascript
{
  districtId: "MH-DIST-2024-0001",
  name: "Mumbai",
  state: "Maharashtra",
  code: "MUM001",
  boundaries: { area, coordinates, features },
  demographics: { population, literacy, etc },
  healthInfrastructure: { hospitals, PHCs, CHCs },
  districtOfficer: { userId, contact, appointed },
  blockRegistration: { 
    registrationEnabled: true,
    requiresApproval: false,
    registrationTokens: [...]
  },
  status: "active"
}
```

### Block Model
```javascript
{
  blockId: "MH-DIST-2024-0001-BLOCK-0001",
  name: "Andheri",
  blockType: "urban",
  districtId: ObjectId,
  boundaries: { area, coordinates },
  demographics: { population, villages },
  healthInfrastructure: { PHCs, CHCs, SHCs },
  blockOfficer: { userId, contact },
  registrationToken: "BLOCK-20241215-ABC123",
  status: "active"
}
```

### User Model
```javascript
{
  personalInfo: { name, dateOfBirth, employeeId },
  contactInfo: { email, phone, emergency },
  address: { street, city, district, state, pincode },
  roleInfo: { role, department, status, verified },
  professionalInfo: { 
    designation, organization, qualifications 
  }
}
```

## 🛡️ Validation Schema Examples

### District Creation Validation
```javascript
const createDistrictSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  state: Joi.string().min(2).max(50).required(),
  code: Joi.string().alphanum().min(2).max(10).required(),
  boundaries: boundariesSchema.required(),
  demographics: demographicsSchema.required(),
  healthInfrastructure: healthInfrastructureSchema.required()
});
```

### Block Registration Validation
```javascript
const blockRegistrationSchema = Joi.object({
  token: Joi.string().min(10).max(100).required(),
  name: Joi.string().min(2).max(100).required(),
  blockType: Joi.string().valid('rural', 'urban', 'tribal', 'coastal', 'hill').required(),
  boundaries: boundariesSchema.required(),
  demographics: demographicsSchema.required(),
  healthInfrastructure: healthInfrastructureSchema.required()
});
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB 5.0+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone [repository-url]
cd server
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
# Copy environment template
cp .env.example .env

# Configure your environment variables
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/health-surveillance
JWT_SECRET=your-jwt-secret
JWT_EXPIRE=7d
```

4. **Start the server**
```bash
# Development
npm run dev

# Production
npm start
```

### Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/health-surveillance

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# Security
BCRYPT_SALT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=5

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

## 📋 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "timestamp": "2024-12-15T10:30:00Z"
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [...],
  "pagination": {
    "total": 150,
    "limit": 10,
    "totalPages": 15,
    "currentPage": 1,
    "hasNext": true,
    "hasPrevious": false
  },
  "timestamp": "2024-12-15T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ],
  "timestamp": "2024-12-15T10:30:00Z"
}
```

## 🔧 Utility Functions

### ID Generation
```javascript
// Generate unique district ID
const districtId = await generateDistrictId("Maharashtra");
// Returns: "MH-DIST-2024-0001"

// Generate unique block ID
const blockId = await generateBlockId("MH-DIST-2024-0001");
// Returns: "MH-DIST-2024-0001-BLOCK-0001"
```

### Token Generation
```javascript
// Generate block registration token
const token = await generateBlockToken();
// Returns: "BLOCK-20241215-A1B2C3D4E5F6G7H8"

// Validate token format
const isValid = validateBlockToken(token);
```

## 🧪 Testing

### API Testing with curl

**Create District**
```bash
curl -X POST http://localhost:5000/api/districts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Mumbai",
    "state": "Maharashtra",
    "code": "MUM001",
    "boundaries": { "area": 603.4, "coordinates": {...} },
    "demographics": { "totalPopulation": 12442373, ... },
    "healthInfrastructure": { "districtHospitals": 15, ... }
  }'
```

**Register Block**
```bash
curl -X POST http://localhost:5000/api/blocks/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "token": "BLOCK-20241215-A1B2C3D4E5F6G7H8",
    "name": "Andheri",
    "blockType": "urban",
    "boundaries": { "area": 58.33, ... },
    "demographics": { "totalPopulation": 1800000, ... },
    "healthInfrastructure": { "primaryHealthCenters": 8, ... }
  }'
```

## 📈 Performance & Scalability

### Database Indexing
```javascript
// Recommended indexes
districtSchema.index({ state: 1, name: 1 });
districtSchema.index({ districtId: 1 }, { unique: true });
blockSchema.index({ districtId: 1, name: 1 });
blockSchema.index({ blockId: 1 }, { unique: true });
userSchema.index({ 'contactInfo.email': 1 }, { unique: true });
```

### Caching Strategy
- Implement Redis caching for frequently accessed data
- Cache district lists, block statistics
- Use pagination for large datasets

### Monitoring & Logging
- Request/response logging in development
- Error tracking and monitoring
- Performance metrics collection

## 🔒 Security Features

1. **Input Validation**: Comprehensive Joi schema validation
2. **Rate Limiting**: Configurable rate limits per endpoint
3. **Token Security**: Cryptographically secure token generation
4. **Role-Based Access**: Fine-grained permission control
5. **Data Sanitization**: Clean and validate all inputs
6. **Secure Headers**: Helmet.js security headers
7. **Password Hashing**: bcrypt with configurable salt rounds

## 🚀 Deployment

### Docker Configuration
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "index.js"]
```

### Production Considerations
- Use PM2 for process management
- Configure reverse proxy (nginx)
- Set up SSL/TLS certificates
- Configure monitoring and logging
- Set up database backups
- Configure environment-specific variables

## 📝 TODO / Future Enhancements

- [ ] Add file upload functionality for documents
- [ ] Implement audit logging for all operations
- [ ] Add email notifications for approvals
- [ ] Create data export/import functionality
- [ ] Add comprehensive test suite
- [ ] Implement real-time notifications
- [ ] Add GraphQL API layer
- [ ] Create admin dashboard
- [ ] Add data visualization endpoints
- [ ] Implement backup/restore functionality

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Note**: This implementation provides a robust foundation for district and block management in a health surveillance system. All endpoints are secured with proper authentication and authorization, and the code follows best practices for scalability and maintainability.
# AquaShield Installation Guide 🚀

Complete step-by-step installation guide for the **AquaShield Smart Community Health Surveillance System**.

## 📋 Table of Contents

- [Prerequisites](#-prerequisites)
- [System Requirements](#-system-requirements)
- [Clone Repository](#-clone-repository)
- [Backend Setup (Server)](#-backend-setup-server)
- [Frontend Setup (Client)](#-frontend-setup-client)
- [ML Microservice Setup](#-ml-microservice-setup)
- [Database Setup](#️-database-setup)
- [Environment Variables Reference](#-environment-variables-reference)
- [Verification Steps](#-verification-steps)
- [Common Installation Issues](#-common-installation-issues)
- [Development Tools Setup](#️-development-tools-setup)
- [Next Steps](#-next-steps)
- [Docker Setup (Optional)](#-docker-setup-optional)
- [Troubleshooting Resources](#-troubleshooting-resources)

## ✅ Prerequisites

### Required Software

#### Node.js (18.x or higher)
```bash
# Check if Node.js is installed
node --version
npm --version
```

**Installation:**
- **Windows/macOS**: Download from [nodejs.org](https://nodejs.org/)
- **Ubuntu/Debian**: 
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```
- **macOS (Homebrew)**: `brew install node`

#### MongoDB (5.0 or higher)
Choose one option:

**Option 1: MongoDB Atlas (Cloud - Recommended)**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get connection string
4. Whitelist your IP address

**Option 2: Local MongoDB Installation**
- **Windows**: Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
- **Ubuntu/Debian**: 
  ```bash
  wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
  echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
  sudo apt-get update
  sudo apt-get install -y mongodb-org
  ```
- **macOS**: `brew tap mongodb/brew && brew install mongodb-community`

#### Python (3.8 or higher)
```bash
# Check if Python is installed
python --version
# or
python3 --version
```

**Installation:**
- **Windows**: Download from [python.org](https://www.python.org/downloads/)
- **Ubuntu/Debian**: `sudo apt-get install python3 python3-pip python3-venv`
- **macOS**: `brew install python3`

#### Git
```bash
# Check if Git is installed
git --version
```

**Installation:**
- **Windows**: Download from [git-scm.com](https://git-scm.com/downloads)
- **Ubuntu/Debian**: `sudo apt-get install git`
- **macOS**: `brew install git` or use Xcode Command Line Tools

### Optional Tools
- **VS Code**: [Download here](https://code.visualstudio.com/)
- **Postman**: [Download here](https://www.postman.com/downloads/)
- **MongoDB Compass**: [Download here](https://www.mongodb.com/products/compass)

## 💻 System Requirements

### Minimum Requirements
- **OS**: Windows 10+, macOS 10.15+, Ubuntu 20.04+
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space
- **Internet**: Broadband connection for initial setup
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Recommended Requirements
- **OS**: Latest stable versions
- **RAM**: 8GB or more
- **Storage**: SSD with 5GB+ free space
- **CPU**: Multi-core processor (Intel i5/AMD Ryzen 5 or better)
- **Internet**: High-speed connection for development

### Network Requirements
- **Ports**: 3000 (frontend), 5000 (backend), 8000 (ML service), 27017 (MongoDB)
- **Firewall**: Allow connections to the above ports
- **DNS**: Access to external APIs (Google GenAI, MongoDB Atlas)

## 📥 Clone Repository

```bash
# Clone the repository
git clone <repository-url>
cd "05.ISIH 2025"

# Verify repository structure
ls -la
```

Expected structure:
```
05.ISIH 2025/
├── client/          # React frontend
├── server/          # Express backend
├── microservice/    # Python ML service
├── README.md
└── other files...
```

## 🖥️ Backend Setup (Server)

### 1. Navigate to Server Directory
```bash
cd server
```

### 2. Install Dependencies
```bash
# Install all required packages
npm install

# Verify installation
npm list --depth=0
```

### 3. Environment Configuration
```bash
# Create environment file from template
cp .env.example .env

# Edit the .env file with your settings
# Windows: notepad .env
# macOS/Linux: nano .env
```

### 4. Configure Environment Variables
Edit the `.env` file with your specific settings:

```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/health_surveillance_system
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/health_surveillance_system

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_SALT_ROUNDS=12
```

### 5. Generate Secure JWT Secret
```bash
# Generate a secure random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the generated string and use it as your `JWT_SECRET`.

### 6. Start MongoDB (if local installation)
```bash
# Windows (as Administrator)
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
# or
brew services start mongodb/brew/mongodb-community
```

### 7. Start Backend Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

### 8. Verify Backend
Open http://localhost:5000 in your browser. You should see:
```json
{
  "message": "AquaShield API Server is running",
  "version": "1.0.0",
  "status": "healthy"
}
```

## 🎨 Frontend Setup (Client)

### 1. Navigate to Client Directory
```bash
cd ../client
```

### 2. Install Dependencies
```bash
# Install all required packages
npm install

# Verify installation
npm list --depth=0
```

### 3. Environment Configuration (Optional)
Create `.env` file if you need to override default settings:
```bash
# Create environment file
touch .env

# Add environment variables (optional)
echo "VITE_API_URL=http://localhost:5000/api" >> .env
echo "VITE_ML_SERVICE_URL=http://localhost:8000" >> .env
```

### 4. Start Frontend Development Server
```bash
# Start development server with hot reload
npm run dev

# Alternative: start with specific port
npm run dev -- --port 3000
```

### 5. Verify Frontend
Open http://localhost:5173 in your browser. You should see the AquaShield homepage.

### 6. Build for Production (Optional)
```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## 🤖 ML Microservice Setup

### 1. Navigate to ML Service Directory
```bash
cd ../microservice/main
```

### 2. Create Python Virtual Environment
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Verify activation (should show venv path)
which python
```

### 3. Install Python Dependencies
```bash
# Upgrade pip to latest version
python -m pip install --upgrade pip

# Install required packages
pip install -r requirements.txt

# Verify installation
pip list
```

### 4. Verify ML Dependencies
Check that key packages are installed:
```bash
python -c "import flask; print('Flask:', flask.__version__)"
python -c "import sklearn; print('Scikit-learn:', sklearn.__version__)"
python -c "import pandas; print('Pandas:', pandas.__version__)"
python -c "import numpy; print('NumPy:', numpy.__version__)"
```

### 5. Train ML Model (if needed)
```bash
# If training script exists
python train.py

# Or use pre-trained model (check if model files exist)
ls *.pkl *.joblib 2>/dev/null || echo "No model files found"
```

### 6. Start ML Service
```bash
# Start Flask development server
python main.py

# Alternative: start with specific configuration
FLASK_ENV=development python main.py
```

### 7. Verify ML Service
Open http://localhost:8000 in your browser or use curl:
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "AquaShield ML Service",
  "version": "1.0.0"
}
```

## 🗄️ Database Setup

### MongoDB Atlas Setup (Recommended)

#### 1. Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Verify your email address

#### 2. Create a Cluster
1. Click "Build a Database"
2. Choose "Free" shared cluster
3. Select a cloud provider and region
4. Click "Create Cluster"

#### 3. Create Database User
1. Go to "Database Access" in left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Enter username and generate secure password
5. Set role to "Atlas Admin" or custom role
6. Click "Add User"

#### 4. Configure Network Access
1. Go to "Network Access" in left sidebar
2. Click "Add IP Address"
3. Choose "Add Current IP Address" or "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

#### 5. Get Connection String
1. Go to "Databases" and click "Connect"
2. Choose "Connect your application"
3. Select "Node.js" and version "4.1 or later"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<dbname>` with `health_surveillance_system`

#### 6. Update Environment Variables
```bash
# Update your server/.env file
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/health_surveillance_system?retryWrites=true&w=majority
```

### Local MongoDB Setup

#### 1. Start MongoDB Service
```bash
# Windows (run as Administrator)
net start MongoDB

# macOS
brew services start mongodb/brew/mongodb-community

# Linux (Ubuntu/Debian)
sudo systemctl start mongod
sudo systemctl enable mongod  # Enable auto-start
```

#### 2. Verify MongoDB is Running
```bash
# Connect to MongoDB shell
mongosh

# In MongoDB shell, run:
use health_surveillance_system
show collections
exit
```

#### 3. Create Database and Collections
The application will automatically create collections when needed, but you can pre-create them:

```bash
mongosh health_surveillance_system --eval "
db.createCollection('users');
db.createCollection('districts');
db.createCollection('blocks');
db.createCollection('villages');
db.createCollection('healthreports');
db.createCollection('patientrecords');
db.createCollection('waterqualitytests');
print('Database and collections created successfully');
"
```

#### 4. Create Indexes (Optional but Recommended)
```bash
mongosh health_surveillance_system --eval "
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ roleInfo.role: 1 });
db.districts.createIndex({ districtId: 1 }, { unique: true });
db.blocks.createIndex({ blockId: 1 }, { unique: true });
db.healthreports.createIndex({ createdAt: -1 });
print('Indexes created successfully');
"
```

### Database Connection Verification
Test database connectivity from your application:

```bash
# Navigate to server directory
cd server

# Test database connection
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Database connected successfully'))
  .catch(err => console.error('❌ Database connection failed:', err.message));
"
```

## 🔧 Environment Variables Reference

### Server Environment Variables (.env)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Application environment |
| `PORT` | No | `5000` | Server port number |
| `MONGODB_URI` | **Yes** | - | MongoDB connection string |
| `JWT_SECRET` | **Yes** | - | Secret key for JWT tokens |
| `JWT_EXPIRE` | No | `15m` | Access token expiration |
| `JWT_REFRESH_EXPIRE` | No | `7d` | Refresh token expiration |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed CORS origins |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | Rate limiting window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | No | `100` | Max requests per window |
| `BCRYPT_SALT_ROUNDS` | No | `12` | Password hashing rounds |

### Client Environment Variables (.env) - Optional

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | No | `http://localhost:5000/api` | Backend API URL |
| `VITE_ML_SERVICE_URL` | No | `http://localhost:8000` | ML service URL |
| `VITE_GOOGLE_MAPS_API_KEY` | No | - | Google Maps API key (future use) |

### ML Service Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FLASK_ENV` | No | `development` | Flask environment |
| `FLASK_PORT` | No | `8000` | Flask server port |
| `MODEL_PATH` | No | `./models/` | Path to ML model files |

### Security Considerations
- **Never commit `.env` files** to version control
- **Use strong, unique passwords** for database users
- **Generate secure JWT secrets** (minimum 32 characters)
- **Limit CORS origins** in production
- **Use HTTPS** in production environments

### Example .env File
```bash
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb+srv://aquashield_user:SecurePassword123@cluster.mongodb.net/health_surveillance_system?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_SALT_ROUNDS=12
```

## ✔️ Verification Steps

### 1. Check Server Health
```bash
curl http://localhost:5000/api/health
```
Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-20T10:30:45.123Z",
  "database": "connected",
  "version": "1.0.0"
}
```

### 2. Check ML Service Health
```bash
curl http://localhost:8000/health
```

### 3. Test Database Connection
```bash
# From server directory
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Database connected');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Database error:', err.message);
    process.exit(1);
  });
"
```

### 4. Test Frontend Access
1. Open http://localhost:5173
2. Verify the homepage loads
3. Check browser console for errors
4. Test navigation between pages

### 5. Test API Endpoints
```bash
# Test user registration
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "personalInfo": {
      "firstName": "Test",
      "lastName": "User",
      "email": "test@example.com"
    },
    "contactInfo": {
      "mobile": "1234567890"
    },
    "password": "TestPassword123!",
    "roleInfo": {
      "role": "User"
    }
  }'
```

### 6. Test Authentication Flow
1. Navigate to signup page
2. Create a test account
3. Login with test credentials
4. Verify JWT token storage
5. Access protected routes

### 7. Verify All Services Running
Check that all services are running on correct ports:
```bash
# Check port usage
netstat -an | grep "LISTEN" | grep -E "(5173|5000|8000|27017)"

# Expected output should show:
# :5173 (Frontend - Vite dev server)
# :5000 (Backend - Express server)
# :8000 (ML Service - Flask server)
# :27017 (MongoDB - if running locally)
```

## 🔧 Common Installation Issues

### Issue 1: Node.js Version Incompatibility
**Problem**: "Error: Node.js version not supported"
**Solution**:
```bash
# Check Node.js version
node --version

# Install Node Version Manager (nvm)
# Windows: Download nvm-windows from GitHub
# macOS/Linux:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node.js 18
nvm install 18
nvm use 18
```

### Issue 2: MongoDB Connection Failed
**Problem**: "MongoServerError: Authentication failed"
**Solutions**:
```bash
# Check connection string format
# Correct: mongodb+srv://username:password@cluster.mongodb.net/database
# Wrong: mongodb://username:password@cluster.mongodb.net/database (missing 'srv')

# Verify credentials in MongoDB Atlas
# Check Network Access settings
# Ensure IP address is whitelisted

# For local MongoDB:
# Check if MongoDB service is running
sudo systemctl status mongod  # Linux
brew services list | grep mongodb  # macOS
```

### Issue 3: Port Already in Use
**Problem**: "EADDRINUSE: address already in use :::5000"
**Solutions**:
```bash
# Find process using the port
# Windows:
netstat -ano | findstr :5000

# macOS/Linux:
lsof -ti:5000

# Kill the process
# Windows:
taskkill /PID <PID> /F

# macOS/Linux:
kill -9 <PID>

# Or change port in .env file
PORT=5001
```

### Issue 4: Python Module Not Found
**Problem**: "ModuleNotFoundError: No module named 'flask'"
**Solutions**:
```bash
# Ensure virtual environment is activated
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Verify you're in the right environment
which python
which pip

# Reinstall requirements
pip install -r requirements.txt

# Check if requirements.txt exists
ls requirements.txt
```

### Issue 5: CORS Errors
**Problem**: "Access to fetch at 'http://localhost:5000' from origin 'http://localhost:5173' has been blocked by CORS"
**Solution**:
```bash
# Check CORS_ORIGIN in server/.env
CORS_ORIGIN=http://localhost:5173

# Ensure no trailing slash
# Wrong: http://localhost:5173/
# Correct: http://localhost:5173

# Restart backend server after changing .env
```

### Issue 6: JWT Secret Missing
**Problem**: "Error: JWT secret is required"
**Solution**:
```bash
# Generate secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env file
JWT_SECRET=generated-secret-key-here
```

### Issue 7: Database Permission Errors
**Problem**: "MongoError: not authorized on database"
**Solutions**:
```bash
# For MongoDB Atlas:
# 1. Check user permissions in Database Access
# 2. Ensure user has readWrite access to the database
# 3. Use correct database name in connection string

# For local MongoDB:
# Create admin user
mongosh --eval "
use admin
db.createUser({
  user: 'admin',
  pwd: 'password',
  roles: ['userAdminAnyDatabase', 'readWriteAnyDatabase']
})
"
```

### Issue 8: Frontend Build Errors
**Problem**: Various build/compile errors
**Solutions**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for peer dependency issues
npm ls

# Update dependencies (if needed)
npm update

# Check ESLint configuration
npm run lint
```

### Issue 9: ML Service Import Errors
**Problem**: "ImportError: cannot import name 'xyz'"
**Solutions**:
```bash
# Ensure correct Python version
python --version  # Should be 3.8+

# Recreate virtual environment
rm -rf venv
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Check for conflicting packages
pip list
```

### Issue 10: Environment Variables Not Loading
**Problem**: Environment variables showing as undefined
**Solutions**:
```bash
# Check .env file location (should be in server/ directory)
ls -la server/.env

# Check .env file format (no quotes around values)
# Wrong: JWT_SECRET="abc123"
# Correct: JWT_SECRET=abc123

# Restart server after .env changes
# Verify loading in code:
console.log('JWT_SECRET:', process.env.JWT_SECRET);
```

## 🛠️ Development Tools Setup

### VS Code Extensions (Recommended)
```json
{
  "recommendations": [
    "ms-vscode.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "mongodb.mongodb-vscode",
    "ms-python.python",
    "ms-python.flake8",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-thunder-client"
  ]
}
```

Install extensions:
```bash
# Install all recommended extensions
code --install-extension ms-vscode.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
code --install-extension mongodb.mongodb-vscode
code --install-extension ms-python.python
```

### Browser Extensions
1. **React Developer Tools**: [Chrome](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi) | [Firefox](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)
2. **Redux DevTools**: [Chrome](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd) | [Firefox](https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/)

### API Testing Tools
**Option 1: Thunder Client (VS Code)**
- Install Thunder Client extension
- Import API collection (if available)

**Option 2: Postman**
1. Download from [postman.com](https://www.postman.com/downloads/)
2. Install and create account
3. Import API collection

### Database GUI Tools
**Option 1: MongoDB Compass**
```bash
# Download and install MongoDB Compass
# Connect using your MongoDB URI
```

**Option 2: VS Code MongoDB Extension**
```bash
# Install MongoDB extension for VS Code
code --install-extension mongodb.mongodb-vscode
```

### Git Configuration
```bash
# Set up Git user information
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Set up Git aliases (optional)
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.cm commit

# Set default branch name
git config --global init.defaultBranch main
```

## 🎯 Next Steps

### 1. Create Admin User Account
After successful installation, create your first admin account:
```bash
# Use the API or frontend signup
# Set role to "Admin" for full system access
```

### 2. Explore the Application
1. **Dashboard**: Navigate to the main dashboard
2. **District Management**: Create test districts
3. **User Roles**: Understand different user capabilities
4. **AI Chatbot**: Test the health assistant
5. **Water Quality**: Try water quality predictions

### 3. Read Documentation
- [API Documentation](API_DOCUMENTATION.md)
- [Architecture Guide](ARCHITECTURE.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Deployment Guide](DEPLOYMENT.md)

### 4. Development Setup
```bash
# Set up pre-commit hooks (optional)
npm install -g husky
npx husky install

# Configure auto-formatting on save in VS Code
# Add to settings.json:
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### 5. Test Data Setup
Create test data for development:
1. Create sample districts and blocks
2. Add test users with different roles
3. Generate sample health reports
4. Add water quality test data

### 6. Production Preparation
When ready for production:
1. Change environment to production
2. Use production database
3. Configure SSL certificates
4. Set up monitoring and logging
5. Configure backups

## 🐳 Docker Setup (Optional)

### Prerequisites for Docker
- Docker Engine 20.0+
- Docker Compose 2.0+

### Docker Installation
```bash
# Windows/macOS: Download Docker Desktop
# Ubuntu/Debian:
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### Docker Compose Configuration
Create `docker-compose.yml` in project root:
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:5.0
    container_name: aquashield-mongo
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
      MONGO_INITDB_DATABASE: health_surveillance_system
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  backend:
    build: ./server
    container_name: aquashield-backend
    restart: always
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://admin:password@mongodb:27017/health_surveillance_system?authSource=admin
      JWT_SECRET: your-jwt-secret-here
      PORT: 5000
    ports:
      - "5000:5000"
    depends_on:
      - mongodb

  frontend:
    build: ./client
    container_name: aquashield-frontend
    restart: always
    environment:
      VITE_API_URL: http://localhost:5000/api
    ports:
      - "3000:3000"
    depends_on:
      - backend

  ml-service:
    build: ./microservice/main
    container_name: aquashield-ml
    restart: always
    ports:
      - "8000:8000"

volumes:
  mongodb_data:
```

### Docker Commands
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild specific service
docker-compose build backend
docker-compose up -d backend
```

## 📚 Troubleshooting Resources

### Documentation Links
- [Main README](README.md) - Project overview and features
- [API Documentation](API_DOCUMENTATION.md) - Complete API reference
- [Architecture Guide](ARCHITECTURE.md) - System design and patterns
- [Contributing Guide](CONTRIBUTING.md) - Development guidelines
- [Deployment Guide](DEPLOYMENT.md) - Production deployment

### Community Support
- **GitHub Issues**: [Project Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Email**: [maintainers@aquashield.org]

### External Resources
- **React Documentation**: [reactjs.org](https://reactjs.org/)
- **Express.js Guide**: [expressjs.com](https://expressjs.com/)
- **MongoDB Manual**: [docs.mongodb.com](https://docs.mongodb.com/)
- **Flask Documentation**: [flask.palletsprojects.com](https://flask.palletsprojects.com/)
- **Node.js Documentation**: [nodejs.org/docs](https://nodejs.org/docs/)

### Getting Help
If you're still experiencing issues:
1. **Check existing issues** on GitHub
2. **Search documentation** for similar problems
3. **Join community discussions** for help
4. **Create detailed bug report** if needed

Include in your bug report:
- Operating system and version
- Node.js and Python versions
- Error messages and stack traces
- Steps to reproduce the issue
- Screenshots if applicable

---

## 🎉 Congratulations!

You've successfully installed AquaShield! The system is now ready for development and testing. 

### Quick Verification Checklist
- [ ] Backend server running on http://localhost:5000
- [ ] Frontend application running on http://localhost:5173
- [ ] ML service running on http://localhost:8000
- [ ] Database connection established
- [ ] All environment variables configured
- [ ] API endpoints responding correctly
- [ ] Admin user account created

**Next**: Explore the application, create test data, and start contributing to improve healthcare in rural communities!

---

<div align="center">

**Happy Development!** 🚀

*Building technology solutions for better health outcomes in rural Northeast India*

</div>
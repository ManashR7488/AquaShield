# AquaShield Deployment Guide 🚀

This guide provides comprehensive instructions for deploying the **AquaShield Smart Community Health Surveillance System** to a production environment.

## 📋 Table of Contents

- [Deployment Overview](#-deployment-overview)
- [Pre-Deployment Checklist](#-pre-deployment-checklist)
- [Environment Configuration](#-environment-configuration)
- [Database Setup](#️-database-setup)
- [Backend Deployment](#-backend-deployment)
- [Frontend Deployment](#-frontend-deployment)
- [ML Microservice Deployment](#-ml-microservice-deployment)
- [Nginx Configuration](#-nginx-configuration)
- [SSL/TLS Certificate Setup](#-ssltls-certificate-setup)
- [PM2 Process Management](#-pm2-process-management)
- [Docker Deployment](#-docker-deployment)
- [Cloud Platform Deployment](#-cloud-platform-deployment)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Monitoring & Logging](#-monitoring--logging)
- [Backup Strategy](#-backup-strategy)
- [Security Hardening](#-security-hardening)
- [Performance Optimization](#-performance-optimization)
- [Scaling Strategy](#-scaling-strategy)
- [Health Checks & Monitoring](#-health-checks--monitoring)
- [Rollback Procedures](#-rollback-procedures)
- [Post-Deployment Verification](#-post-deployment-verification)
- [Maintenance & Updates](#-maintenance--updates)
- [Cost Optimization](#-cost-optimization)
- [Troubleshooting Common Issues](#-troubleshooting-common-issues)

## 🌐 Deployment Overview

### Production Strategy
The recommended production strategy involves deploying the frontend, backend, and ML microservice as separate components, managed by a reverse proxy like Nginx. This provides flexibility, scalability, and security.

### Infrastructure Recommendations
- **Cloud Provider**: AWS, Azure, or Google Cloud Platform (GCP)
- **Server**: Virtual Private Server (VPS) with Ubuntu 20.04+ (e.g., AWS EC2 t3.medium)
- **Database**: Managed MongoDB service (e.g., MongoDB Atlas)
- **Frontend Hosting**: Static hosting service (e.g., Netlify, Vercel) or cloud storage (e.g., AWS S3 + CloudFront)
- **Containerization**: Docker and Docker Compose for consistency and portability

## ✅ Pre-Deployment Checklist

- [ ] All code reviewed and merged to the `main` branch.
- [ ] All automated tests are passing.
- [ ] Production environment variables are configured and secured.
- [ ] Production database is set up and credentials are ready.
- [ ] A comprehensive security audit has been completed.
- [ ] Performance testing has been conducted to identify bottlenecks.
- [ ] A database backup and recovery strategy is in place.
- [ ] A custom domain has been acquired and configured.
- [ ] SSL/TLS certificates are ready to be installed.

## ⚙️ Environment Configuration

### Production Environment Variables

#### Backend (`server/.env`)
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-url>/aquashield_prod
JWT_SECRET=a-very-strong-and-long-random-secret-key
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=30d
CORS_ORIGIN=https://www.yourappdomain.com
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

#### Frontend (`client/.env.production`)
```bash
VITE_API_URL=https://api.yourappdomain.com/api
VITE_ML_SERVICE_URL=https://ml.yourappdomain.com
```

#### ML Microservice (`microservice/main/.env`)
```bash
FLASK_ENV=production
MODEL_PATH=/app/models/
```

**Security Note**: Never commit production `.env` files. Use environment variable management tools provided by your hosting platform or a secret management service like AWS Secrets Manager or HashiCorp Vault.

## 🗄️ Database Setup

**MongoDB Atlas** is highly recommended for production.

1. **Create Production Cluster**:
   - In MongoDB Atlas, create a new cluster (e.g., M10 or higher for production workloads).
   - Choose a region close to your application server to minimize latency.
2. **Configure Network Access**:
   - Go to "Network Access" and add the IP address of your application server(s). For security, avoid allowing access from anywhere (0.0.0.0/0).
3. **Set Up Database User**:
   - Create a dedicated database user for your production application with strong credentials.
   - Grant it the `readWrite` role for the production database (`aquashield_prod`).
4. **Enable Backup**:
   - Ensure that automated backups are enabled for your cluster. Configure a retention policy that meets your project's requirements.
5. **Configure Monitoring**:
   - Set up alerts for high CPU usage, low free storage, and slow queries.

## 🖥️ Backend Deployment

### Option 1: Traditional Server (VPS) with PM2

1. **Provision Server**: Create a VPS (e.g., AWS EC2) with Ubuntu 20.04+.
2. **Install Dependencies**:
   ```bash
   sudo apt update
   sudo apt install -y nodejs npm nginx
   ```
3. **Clone Repository**:
   ```bash
   git clone <your-repo-url>
   cd aquashield/server
   ```
4. **Install Dependencies**:
   ```bash
   npm install --production
   ```
5. **Configure Environment**: Create the `.env` file with production variables.
6. **Start with PM2**:
   ```bash
   sudo npm install -g pm2
   pm2 start index.js --name aquashield-backend
   pm2 startup
   pm2 save
   ```
7. **Configure Nginx**: Set up Nginx as a reverse proxy (see [Nginx Configuration](#-nginx-configuration)).

### Option 2: Docker Deployment
(See [Docker Deployment](#-docker-deployment) section for details)

## 🎨 Frontend Deployment

### Build Process
1. **Navigate to Client Directory**: `cd client`
2. **Install Dependencies**: `npm install`
3. **Create Production Build**:
   ```bash
   npm run build
   ```
   This will create an optimized production build in the `dist/` directory.

### Option 1: Static Hosting (Netlify/Vercel - Recommended)
1. **Connect GitHub Repository**: Link your GitHub repo to Netlify or Vercel.
2. **Configure Build Settings**:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `client/dist`
3. **Set Environment Variables**: Add your `VITE_API_URL` and other variables in the platform's UI.
4. **Deploy**: The platform will automatically build and deploy on every push to `main`.

### Option 2: Traditional Web Server (Nginx)
1. **Copy Build Files**: Transfer the `client/dist` directory to your server (e.g., `/var/www/aquashield`).
2. **Configure Nginx**: Set up Nginx to serve the static files and handle SPA routing (see [Nginx Configuration](#-nginx-configuration)).

## 🤖 ML Microservice Deployment

### Option 1: Traditional Server with Gunicorn
1. **Provision Server**: Can be the same server as the backend or a separate one.
2. **Install Dependencies**:
   ```bash
   sudo apt update
   sudo apt install -y python3 python3-pip python3-venv
   ```
3. **Clone Repository**:
   ```bash
   git clone <your-repo-url>
   cd aquashield/microservice/main
   ```
4. **Set Up Virtual Environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   pip install gunicorn
   ```
5. **Start with Gunicorn**:
   ```bash
   gunicorn --workers 3 --bind 0.0.0.0:8000 main:app
   ```
6. **Use PM2 for Gunicorn**:
   ```bash
   pm2 start gunicorn --name aquashield-ml -- --workers 3 --bind 0.0.0.0:8000 main:app
   ```
7. **Configure Nginx**: Set up Nginx as a reverse proxy.

### Option 2: Docker Deployment
(See [Docker Deployment](#-docker-deployment) section for details)

## 🌐 Nginx Configuration

Create a new Nginx configuration file in `/etc/nginx/sites-available/aquashield`:

```nginx
server {
    listen 80;
    server_name yourappdomain.com www.yourappdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourappdomain.com www.yourappdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourappdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourappdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Frontend (React App)
    location / {
        root /var/www/aquashield;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # ML Microservice
    location /ml/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/aquashield /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🔒 SSL/TLS Certificate Setup

Use **Let's Encrypt** with **Certbot** for free SSL certificates.

1. **Install Certbot**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```
2. **Obtain Certificate**:
   ```bash
   sudo certbot --nginx -d yourappdomain.com -d www.yourappdomain.com
   ```
   Certbot will automatically update your Nginx configuration and set up auto-renewal.

## 🔄 PM2 Process Management

PM2 is a process manager for Node.js applications.

1. **Install PM2**: `sudo npm install -g pm2`
2. **Create Ecosystem File** (`ecosystem.config.js`):
   ```javascript
   module.exports = {
     apps: [
       {
         name: 'aquashield-backend',
         script: 'server/index.js',
         instances: 'max',
         exec_mode: 'cluster',
         env_production: {
           NODE_ENV: 'production',
         },
       },
       {
         name: 'aquashield-ml',
         script: 'gunicorn',
         args: '--workers 3 --bind 0.0.0.0:8000 main:app',
         cwd: 'microservice/main',
         interpreter: 'python3',
       },
     ],
   };
   ```
3. **Start Applications**:
   ```bash
   pm2 start ecosystem.config.js --env production
   ```
4. **Manage Processes**:
   - `pm2 list`: List all processes
   - `pm2 logs`: View logs
   - `pm2 restart <name>`: Restart a process
   - `pm2 stop <name>`: Stop a process

## 🐳 Docker Deployment

### Dockerfiles

#### Backend (`server/Dockerfile`)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["node", "index.js"]
```

#### Frontend (`client/Dockerfile`)
```dockerfile
# Build stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```
(You'll need an `nginx.conf` file for the frontend container).

### Docker Compose (`docker-compose.yml`)
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:5.0
    volumes:
      - mongo-data:/data/db
    # ... other mongo config

  backend:
    build: ./server
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=...
    depends_on:
      - mongodb

  frontend:
    build: ./client
    ports:
      - "80:80"
    depends_on:
      - backend

  # ... ml-service config
volumes:
  mongo-data:
```

### Run with Docker Compose
```bash
docker-compose up -d --build
```

## ☁️ Cloud Platform Deployment

### AWS Example
- **Frontend**: Deploy the `client/dist` folder to an **S3 bucket** configured for static website hosting, with **CloudFront** as a CDN for performance and SSL.
- **Backend**: Deploy the backend application to **AWS Elastic Beanstalk** or an **EC2 instance** with an Auto Scaling Group.
- **Database**: Use **Amazon DocumentDB** (MongoDB-compatible) or run MongoDB on EC2.
- **ML Service**: Deploy as a container on **AWS Fargate** or to a separate EC2 instance.

## 🔄 CI/CD Pipeline

### GitHub Actions Example (`.github/workflows/deploy.yml`)
```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Build Frontend
        run: |
          cd client
          npm install
          npm run build

      - name: Deploy to Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /path/to/aquashield
            git pull origin main
            cd server && npm install --production
            pm2 restart aquashield-backend
            # ... commands to deploy frontend build
```

## 📊 Monitoring & Logging

- **Application Monitoring**: Use a service like **New Relic**, **Datadog**, or **PM2 Plus** to monitor application performance, CPU, and memory usage.
- **Log Management**: Use `winston` to write logs to files and a log aggregation service like **Loggly**, **Papertrail**, or the **ELK Stack** (Elasticsearch, Logstash, Kibana).
- **Error Tracking**: Integrate **Sentry** or **Rollbar** to capture and get alerts for runtime errors in both frontend and backend.
- **Uptime Monitoring**: Use a service like **UptimeRobot** or **Pingdom** to monitor the availability of your application endpoints.

## 💾 Backup Strategy

- **Database**: If using MongoDB Atlas, configure automated daily backups with a suitable retention period (e.g., 7 days).
- **Application Code**: Your Git repository serves as the backup for your code.
- **Configuration Files**: Store sensitive configuration securely and back it up (e.g., using a private S3 bucket or a secret manager).
- **Backup Testing**: Regularly test your backup restoration process to ensure its reliability.

## 🛡️ Security Hardening

- **Firewall**: Configure a firewall (e.g., `ufw` on Ubuntu) to only allow traffic on necessary ports (80, 443, 22).
- **SSH Access**: Disable password-based SSH login and use SSH keys only.
- **Regular Updates**: Keep your server's operating system and all software packages updated.
- **Intrusion Detection**: Use tools like `fail2ban` to block IPs that show malicious behavior.
- **Security Scanning**: Regularly scan your application for vulnerabilities using tools like **NPM Audit**, **Snyk**, or **OWASP ZAP**.

## ⚡ Performance Optimization

- **CDN**: Use a Content Delivery Network (e.g., Cloudflare, CloudFront) to serve static assets and reduce latency.
- **Caching**:
  - **Browser Caching**: Configure Nginx to set appropriate `Cache-Control` headers.
  - **API Caching**: Use a caching layer like Redis for frequently accessed, non-critical data.
- **Database Optimization**: Regularly analyze slow queries and add necessary indexes.
- **Load Balancing**: Distribute traffic across multiple application instances.

## 📈 Scaling Strategy

- **Vertical Scaling**: Increase the resources (CPU, RAM) of your server(s).
- **Horizontal Scaling**: Add more server instances and use a load balancer to distribute traffic.
- **Database Scaling**:
  - **Read Replicas**: Use MongoDB read replicas to handle high read traffic.
  - **Sharding**: For extremely large datasets, shard your database across multiple servers.
- **Auto-scaling**: Use cloud platform features to automatically add or remove instances based on traffic.

## ❤️ Health Checks & Monitoring

- **Health Check Endpoint**: Create a `/api/health` endpoint that checks the status of the database connection and other critical services.
- **Uptime Monitoring**: Configure an external service to ping your health check endpoint regularly and alert you if it fails.
- **Performance Metrics**: Monitor key metrics like response time, error rate, and CPU/memory usage.

## ↩️ Rollback Procedures

- **Version Tagging**: Tag every production release in Git.
- **Quick Rollback**: If a deployment fails, you can quickly roll back by deploying the previous Git tag.
- **Database Migrations**: If you use database migrations, ensure you have a rollback script for each migration.
- **Blue-Green Deployment**: A more advanced strategy where you deploy to a new "green" environment and switch traffic over once it's verified. If issues occur, you can immediately switch back to the "blue" environment.

## ✔️ Post-Deployment Verification

- **Smoke Testing**: Manually test critical user flows (e.g., registration, login, creating a report).
- **API Testing**: Use Postman or an automated script to test key API endpoints.
- **Check Logs**: Monitor application logs for any errors or warnings after deployment.
- **Performance Baseline**: Measure key performance metrics to establish a baseline for future comparisons.

## 🔧 Maintenance & Updates

- **Dependency Updates**: Regularly update dependencies to their latest stable versions to get security patches and new features. Use tools like `npm outdated` and `pip list --outdated`.
- **Security Patches**: Apply security patches for your OS and other software as soon as they are available.
- **Log Rotation**: Set up log rotation to prevent log files from consuming all disk space.

## 💰 Cost Optimization

- **Resource Monitoring**: Monitor resource utilization to ensure you are not over-provisioned.
- **Right-Sizing**: Choose the appropriate instance types for your workload.
- **Reserved Instances**: If you have predictable long-term usage, purchase reserved instances to save costs.
- **Spot Instances**: Use spot instances for non-critical, fault-tolerant workloads.

## 🛠️ Troubleshooting Common Issues

- **502 Bad Gateway**: Often indicates that the backend application (e.g., PM2 process) has crashed or is not running. Check the application logs.
- **CORS Issues in Production**: Ensure `CORS_ORIGIN` is set to your exact production frontend domain.
- **SSL Certificate Errors**: Check that your certificate has not expired and is correctly installed.
- **Performance Degradation**: Check for slow database queries, memory leaks, or high CPU usage.
- **Memory Leaks**: Use tools like `pm2 monit` or Node.js memory profiling to identify leaks.
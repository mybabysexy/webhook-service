# 🎯 Webhook Service

A retro-styled webhook testing and management service built with Next.js, featuring a nostalgic Windows 98 aesthetic powered by [system.css](https://github.com/sakun/system.css).

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6.19.2-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)

## ✨ Features

### 🔗 Webhook Management
- **Create Custom Webhooks**: Generate unique webhook endpoints with customizable paths
- **HTTP Method Support**: POST, GET, PUT, PATCH, DELETE, or ANY method
- **Custom Response Configuration**: 
  - Set HTTP status codes (200, 201, 400, 404, 500, etc.)
  - Define custom JSON response payloads with built-in JSON editor
- **Webhook Naming**: Optional names for better organization

### 🔐 Authentication
- **Optional Authentication**: Enable/disable authentication per webhook
- **Multiple Auth Types**:
  - **Bearer Token** (Header-based): `Authorization: Bearer <token>`
  - **Query Parameter**: `?token=<token>`
- **Auto-generated Tokens**: Secure tokens for protected endpoints

### 📊 Request Monitoring
- **Request History**: View all incoming requests to your webhooks
- **Detailed Request Info**:
  - Timestamp
  - HTTP method
  - Request headers
  - Request body
  - Query parameters
- **Real-time Updates**: Automatically refreshes to show new requests

### 🎨 User Interface
- **Retro Design**: Nostalgic Windows 98 aesthetic using system.css
- **Responsive Layout**: Works on desktop and mobile devices
- **Sidebar Navigation**: Quick access to all webhooks
- **Search Functionality**: Filter webhooks by path or name
- **Context Menu Actions**:
  - Right-click to **Duplicate** webhooks (opens dialog with pre-filled data)
  - Right-click to **Delete** webhooks (with confirmation)

### 🔧 Webhook Operations
- **Enable/Disable**: Toggle webhook status without deletion
- **Duplicate**: Create copies of existing webhooks with one click
- **Edit**: Update webhook configurations on the fly
- **Delete**: Remove webhooks with confirmation dialog
- **Copy URL**: One-click copy webhook URL to clipboard
- **Reset Form**: Clear form data when creating/editing webhooks

### 📝 Additional Features
- **Request Testing**: Test your webhooks directly from the UI
- **JSON Validation**: Real-time JSON validation in response editor
- **Error Handling**: Comprehensive error messages and validation
- **Persistent Storage**: PostgreSQL database for reliable data storage

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ 
- PostgreSQL 15+ (or use Docker)
- npm, yarn, pnpm, or bun

### Local Development

1. **Clone the repository**
```bash
git clone <repository-url>
cd webhook-service
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/webhook_service"
```

4. **Set up the database**
```bash
# Run Prisma migrations
npx prisma migrate deploy

# (Optional) Generate Prisma client
npx prisma generate
```

5. **Run the development server**
```bash
npm run dev
```

6. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 🐳 Docker Setup

The easiest way to run the application is using Docker Compose, which sets up both the application and PostgreSQL database.

### Running with Docker Compose

1. **Make sure Docker is installed**
   - [Install Docker Desktop](https://www.docker.com/products/docker-desktop/)

2. **Start the services**
```bash
docker-compose up -d
```

This will:
- Build the Next.js application image
- Start a PostgreSQL 15 container
- Run database migrations automatically
- Start the web application on port 3000

3. **Access the application**
```bash
http://localhost:3000
```

4. **View logs**
```bash
# View all logs
docker-compose logs -f

# View web app logs only
docker-compose logs -f web

# View database logs only
docker-compose logs -f db
```

5. **Stop the services**
```bash
# Stop containers (keeps data)
docker-compose stop

# Stop and remove containers (keeps volumes)
docker-compose down

# Stop, remove containers, and delete volumes (⚠️ deletes all data)
docker-compose down -v
```

### Docker Configuration

**docker-compose.yml** includes:
- **PostgreSQL 15 Alpine** - Lightweight database container
- **Next.js Application** - Optimized production build
- **Persistent Volumes** - Database data persists between restarts
- **Auto-restart** - Containers restart automatically on failure

**Environment Variables** (in docker-compose.yml):
- `POSTGRES_USER`: postgres
- `POSTGRES_PASSWORD`: password (⚠️ Change in production!)
- `POSTGRES_DB`: webhook_service
- `DATABASE_URL`: Auto-configured connection string

### Manual Docker Build

If you prefer to build and run manually:

```bash
# Build the image
docker build -t webhook-service .

# Run with custom database URL
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@host:5432/db" \
  webhook-service
```

## 📚 API Endpoints

### Webhook Management API

#### Create Webhook
```http
POST /api/webhooks
Content-Type: application/json

{
  "name": "My Webhook",
  "path": "my-webhook-path",
  "method": "POST",
  "responseStatus": 200,
  "responseData": "{\"success\": true}",
  "authEnabled": false,
  "authType": "bearer",
  "authToken": "optional-token"
}
```

#### Get All Webhooks
```http
GET /api/webhooks
```

#### Get Webhook Details
```http
GET /api/webhooks/{id}
```

#### Update Webhook
```http
PATCH /api/webhooks/{id}
Content-Type: application/json

{
  "enabled": true,
  "responseStatus": 201
}
```

#### Delete Webhook
```http
DELETE /api/webhooks/{id}
```

### Webhook Endpoint

Access your custom webhooks at:
```
http://localhost:3000/webhook/{your-path}
```

With authentication (if enabled):
```bash
# Bearer token
curl -H "Authorization: Bearer your-token" \
  http://localhost:3000/webhook/{your-path}

# Query parameter
curl http://localhost:3000/webhook/{your-path}?token=your-token
```

## 🧪 Testing

Run the test suite:
```bash
npm run test
```

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Database**: [PostgreSQL 15](https://www.postgresql.org/)
- **ORM**: [Prisma 6](https://www.prisma.io/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) + [system.css](https://github.com/sakun/system.css)
- **State Management**: [TanStack Query 5](https://tanstack.com/query)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **Code Editor**: [CodeMirror 6](https://codemirror.net/)
- **Testing**: [Vitest](https://vitest.dev/)

## 📁 Project Structure

```
webhook-service/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── webhook/           # Webhook endpoints
│   └── page.tsx           # Main dashboard
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── create-webhook-dialog.tsx
│   ├── main-content.tsx
│   └── sidebar.tsx
├── lib/                   # Utilities
│   ├── hooks.ts          # React Query hooks
│   ├── prisma.ts         # Prisma client
│   └── utils.ts          # Helper functions
├── prisma/               # Database schema & migrations
│   └── schema.prisma
├── __tests__/            # Test files
├── docker-compose.yml    # Docker setup
├── Dockerfile           # Container image
└── README.md           # This file
```

## 🔒 Security Notes

⚠️ **For Production Deployments**:
1. Change the default PostgreSQL password in `docker-compose.yml`
2. Use environment variables for sensitive data
3. Enable HTTPS/TLS
4. Implement rate limiting
5. Add proper authentication for the admin dashboard
6. Review and update CORS settings

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📧 Support

For support, please open an issue in the GitHub repository.

---

Built with ❤️ using Next.js and retro vibes from system.css

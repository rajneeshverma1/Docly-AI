# Docly AI Deployment Guide

Deploying Docly AI requires special attention because the application relies on **Poppler** (a system-level C++ library) to extract text from PDF files. Because of this requirement, standard serverless environments (like Vercel or Netlify) often fail out-of-the-box unless custom build scripts are used.

The most reliable, robust, and easiest way to deploy this application is using **Docker**.

We have provided a fully configured `Dockerfile` in the root of this repository. It automatically:
1. Installs Node.js
2. Installs `poppler-utils` (for PDF parsing)
3. Installs `openssl` (for Prisma)
4. Builds your Next.js application in optimized `standalone` mode

---

## Recommended Deployment Platforms

The best platforms for Docker-based deployments with an attached PostgreSQL database are **Render** and **Railway**.

### Option A: Deploying on Render (Easiest)

Render is highly recommended because it natively supports Docker and Managed PostgreSQL databases.

1. **Push to GitHub**: Make sure all your code (including the `Dockerfile`) is pushed to your GitHub repository.
2. **Create a Database**:
   - Go to your Render Dashboard -> **New** -> **PostgreSQL**.
   - Name it (e.g., `docly-db`) and create it.
   - Copy the "Internal Database URL" (or External if deploying elsewhere).
3. **Deploy the App**:
   - Go to Render Dashboard -> **New** -> **Web Service**.
   - Connect your GitHub repository.
   - Render will automatically detect the `Dockerfile` and select the **Docker** environment.
   - Scroll down to **Environment Variables** and add:
     - `DATABASE_URL` (paste the URL you got from step 2)
     - `GROQ_API_KEY` (your Groq key)
     - `JINA_API_KEY` (your Jina key)
4. **Click Create Web Service**. Render will build the Docker container and deploy it to a live URL!

### Option B: Deploying on Railway

Railway operates very similarly to Render.

1. Go to [Railway.app](https://railway.app) and create a New Project.
2. Provision a **PostgreSQL** database from the dashboard.
3. Click **New** -> **GitHub Repo** and select your Docly AI repository.
4. Go to the **Variables** tab of your deployed app and link your `DATABASE_URL`, `GROQ_API_KEY`, and `JINA_API_KEY`.
5. Railway will automatically detect the `Dockerfile`, build it, and provide a public domain.

---

## Important Production Considerations

### 1. Database Migrations
When deploying to production, you must run Prisma migrations against your production PostgreSQL database so that the tables are created.
You can do this locally by running:
```bash
DATABASE_URL="your-production-database-url" npx prisma migrate deploy
```
*Alternatively, you can configure your CI/CD platform to run this command before launching the server.*

### 2. Redis Background Queue (Optional but Recommended)
If your users upload massive PDFs, synchronous processing might time out. 
1. Spin up a Redis instance (both Render and Railway offer Redis with one click).
2. Add the `REDIS_URL` environment variable to your deployment.
3. Docly AI will automatically detect Redis and process PDFs asynchronously using a Bull queue.

### 3. Vercel Workaround
If you absolutely *must* deploy on Vercel, you will need to replace `node-poppler` with a pure Javascript PDF parser (like `pdf-parse`), or build a custom Vercel script that downloads the Poppler binaries during the build phase. Docker (via Render/Railway) is significantly easier.

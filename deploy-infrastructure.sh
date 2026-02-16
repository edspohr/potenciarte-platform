#!/bin/bash

# Exit on error
set -e

# Set explicit project ID to avoid using the wrong active config
PROJECT_ID="potenciarte-platform-v1"
echo "🚀 Setting active project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

echo "🚀 Enable required APIs..."
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com --project=$PROJECT_ID

echo "🚀 Building API container..."
cd api

# Build and submit to Container Registry using the explicit project
gcloud builds submit --tag gcr.io/$PROJECT_ID/potenciarte-api --project=$PROJECT_ID

echo "🚀 Deploying to Cloud Run..."
gcloud run deploy potenciarte-api \
  --image gcr.io/$PROJECT_ID/potenciarte-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="FIREBASE_PROJECT_ID=$PROJECT_ID" \
  --project=$PROJECT_ID

# Get the URL
SERVICE_URL=$(gcloud run services describe potenciarte-api --platform managed --region us-central1 --format "value(status.url)" --project=$PROJECT_ID)

echo ""
echo "✅ Deployment complete!"
echo "Service URL: $SERVICE_URL"
echo ""
echo "👉 Action Required: Copy the URL above and update your frontend configuration."
echo "   File: client/.env.production (or .env.local)"
echo "   Content: NEXT_PUBLIC_API_URL=$SERVICE_URL"
echo ""

#!/bin/bash
set -e

PROJECT_ID="potenciarte-platform-v1"
echo "🚀 Setting active project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

echo "🚀 Building Client container..."
cd client
gcloud builds submit --tag gcr.io/$PROJECT_ID/potenciarte-client --project=$PROJECT_ID

echo "🚀 Deploying Client to Cloud Run..."
gcloud run deploy potenciarte-client \
  --image gcr.io/$PROJECT_ID/potenciarte-client \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --project=$PROJECT_ID

echo "🚀 Deploying Firebase Hosting config (Rewrites)..."
cd ..
firebase deploy --only hosting

echo "✅ Client Deployment complete!"

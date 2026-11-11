#!/bin/bash

# Web App Deployment Script
# Usage: ./scripts/deploy.sh [environment]

set -e

ENVIRONMENT=${1:-development}
NAMESPACE=${2:-default}

echo "🚀 Deploying Web App to $ENVIRONMENT..."

# Build Docker image
echo "📦 Building Docker image..."
docker build -t web:${ENVIRONMENT} .

# Tag image
if [ "$ENVIRONMENT" = "production" ]; then
    docker tag web:${ENVIRONMENT} your-registry/web:latest
    docker tag web:${ENVIRONMENT} your-registry/web:${ENVIRONMENT}
    
    # Push to registry
    echo "🔼 Pushing to registry..."
    docker push your-registry/web:latest
    docker push your-registry/web:${ENVIRONMENT}
fi

# Apply Kubernetes configs
echo "☸️ Applying Kubernetes configs..."
kubectl apply -f k8s/configmap.yaml -n ${NAMESPACE}
kubectl apply -f k8s/deployment.yaml -n ${NAMESPACE}
kubectl apply -f k8s/service.yaml -n ${NAMESPACE}
kubectl apply -f k8s/ingress.yaml -n ${NAMESPACE}
kubectl apply -f k8s/hpa.yaml -n ${NAMESPACE}

# Wait for rollout
echo "⏳ Waiting for deployment rollout..."
kubectl rollout status deployment/web -n ${NAMESPACE}

# Show status
echo "✅ Deployment complete!"
echo ""
echo "📊 Status:"
kubectl get pods -l app=web -n ${NAMESPACE}
echo ""
kubectl get svc web -n ${NAMESPACE}
echo ""
kubectl get ingress web -n ${NAMESPACE}

echo ""
echo "🎉 Web App deployed successfully!"


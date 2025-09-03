#!/bin/bash
set -e

# Configuration
IMAGE_NAME="inbound-mail"
CONTAINER_NAME="smtp-server"
DOCKER_COMPOSE_FILE="docker-compose.yml"

# Optional: pull latest image from registry
echo "📦 Pulling latest image..."
docker pull $IMAGE_NAME || true

# Stop container if running
if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    echo "🛑 Stopping existing container..."
    docker stop $CONTAINER_NAME
fi

# Remove old container if exists
if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
    echo "🗑 Removing old container..."
    docker rm $CONTAINER_NAME
fi

# Start container
if [ -f "$DOCKER_COMPOSE_FILE" ]; then
    echo "🚀 Starting container with docker-compose..."
    docker-compose up -d
else
    echo "🚀 Starting container with docker run..."
    exit 1
fi

echo "✅ Reload complete!"

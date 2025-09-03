#!/bin/bash
set -e


CONTAINER_NAME="inbound-mail"
DOCKER_COMPOSE_FILE="docker-compose.yml"

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

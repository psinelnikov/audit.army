#!/bin/bash

# Start PostgreSQL and Redis using podman compose
# This script should be run from the project root directory

echo "Starting PostgreSQL and Redis containers..."

# Start the containers
podman compose up -d

# Wait for containers to be ready
echo "Waiting for containers to be ready..."
sleep 10

# Check if containers are running
echo "Checking container status..."
podman compose ps

echo "Containers should now be running. You can start the backend with:"
echo "cd backend && npm run start:dev"

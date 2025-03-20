#!/bin/bash

# Helper script for Docker development

# Check if docker and docker-compose are installed
if ! command -v docker &> /dev/null || ! command -v docker-compose &> /dev/null; then
    echo "Error: docker and docker-compose are required but not installed."
    exit 1
fi

# Default action
ACTION=${1:-"start"}

case "$ACTION" in
    start)
        echo "🚀 Starting Docker development environment..."
        docker-compose -f docker-compose.dev.yml up --build
        ;;
    stop)
        echo "🛑 Stopping Docker development environment..."
        docker-compose -f docker-compose.dev.yml down
        ;;
    restart)
        echo "🔄 Restarting Docker development environment..."
        docker-compose -f docker-compose.dev.yml down
        docker-compose -f docker-compose.dev.yml up --build
        ;;
    clean)
        echo "🧹 Cleaning Docker development environment..."
        docker-compose -f docker-compose.dev.yml down --volumes --remove-orphans
        ;;
    logs)
        echo "📋 Showing logs from Docker development environment..."
        docker-compose -f docker-compose.dev.yml logs -f
        ;;
    shell)
        echo "🐚 Opening shell in the dev container..."
        docker-compose -f docker-compose.dev.yml exec dev sh
        ;;
    *)
        echo "❓ Unknown action: $ACTION"
        echo "Usage: $0 [start|stop|restart|clean|logs|shell]"
        exit 1
        ;;
esac 
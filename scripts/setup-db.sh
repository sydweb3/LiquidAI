#!/bin/bash
# Run this in Render Shell to set up database

echo "Setting up PostgreSQL database..."

# Run migrations
pnpm drizzle-kit generate
pnpm drizzle-kit migrate

echo "Database setup complete!"
echo "You can now start the server with: pnpm start"

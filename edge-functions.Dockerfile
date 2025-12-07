# Edge Functions Server for Self-Hosted Supabase
FROM denoland/deno:1.42.0

# Set working directory
WORKDIR /app

# Copy functions directory
COPY supabase/functions ./functions
COPY supabase/config.toml ./config.toml

# Create main server file
COPY edge-functions-server.ts ./server.ts

# Cache dependencies
RUN deno cache server.ts

# Expose port
EXPOSE 8000

# Run the server
CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "server.ts"]

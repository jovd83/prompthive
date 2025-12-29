#!/bin/sh
# Start script for Synology Container
# Logs to both console (for Synology UI) and file (for debug)

LOGFILE="/app/data/startup_log.txt"

# Function to log to both stdout and file
log() {
    echo "$1" | tee -a "$LOGFILE"
}

log "--- Container Starting at $(date) ---"
log "Database URL: $DATABASE_URL"

# Ensure permissions
chmod 777 /app/data >> $LOGFILE 2>&1

# Define Prisma command
# Use local binary to ensure version match (v5.22.0). 
# Fallback to npx with specific version if local not found, preventing v7+ breaking changes.
if [ -f "./node_modules/.bin/prisma" ]; then
    PRISMA="./node_modules/.bin/prisma"
else
    PRISMA="npx prisma@5.22.0"
fi

DB_FILE="/app/data/prod.db"

log "Checking for database file at: $DB_FILE"

if [ -f "$DB_FILE" ]; then
    log "FOUND: Existing database detected."
    log "Attempting safe migration (migrate deploy)..."
    
    # Existing DB: Use migrate deploy to be safe
    # We use a temp file to capture output while preserving exit code check
    $PRISMA migrate deploy > /tmp/prisma_migrate.log 2>&1
    MIGRATE_EXIT_CODE=$?
    cat /tmp/prisma_migrate.log | tee -a "$LOGFILE"

    if [ $MIGRATE_EXIT_CODE -eq 0 ]; then
        log "SUCCESS: Migrations applied to existing database."
    else
        log "ERROR: migrate deploy failed (Exit Code: $MIGRATE_EXIT_CODE). Check migration history."
        log "Attempting fallback: db push --accept-data-loss to sync schema..."
        
        $PRISMA db push --accept-data-loss --skip-generate > /tmp/prisma_push.log 2>&1
        PUSH_EXIT_CODE=$?
        cat /tmp/prisma_push.log | tee -a "$LOGFILE"
        
        if [ $PUSH_EXIT_CODE -eq 0 ]; then
            log "SUCCESS: Database structure synced via db push (fallback)."
        else
            log "CRITICAL ERROR: Fallback db push failed."
            exit 1
        fi
    fi
else
    log "MISSING: No database found. Initializing new database..."
    log "Attempting schema creation (db push)..."
    
    # New DB: Use db push to create structure from scratch
    # Use --skip-generate because we already generated the client in the Dockerfile
    if $PRISMA db push --accept-data-loss --skip-generate 2>&1 | tee -a "$LOGFILE"; then
        log "SUCCESS: New database structure created."
    else
        log "CRITICAL ERROR: Could not create new database."
        exit 1
    fi
fi

log "Starting Next.js Server..."
exec node server.js

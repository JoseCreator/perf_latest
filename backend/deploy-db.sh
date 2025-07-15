#!/bin/bash

# Database deployment script for Render production
echo "🚀 Starting database deployment for production..."

# Set variables
DB_PATH="/tmp/timetracker.db"
BACKUP_PATH="/tmp/timetracker-backup.db"
SQL_DUMP="database-production.sql"

# Check if database already exists and has data
if [ -f "$DB_PATH" ]; then
    echo "📊 Checking existing database..."
    
    # Count users in existing database
    USER_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM utilizadores WHERE active = 1;" 2>/dev/null || echo "0")
    
    if [ "$USER_COUNT" -gt "0" ]; then
        echo "✅ Found $USER_COUNT active users in existing database"
        echo "🔄 Keeping existing database data"
        exit 0
    else
        echo "⚠️  Database exists but no active users found"
    fi
else
    echo "📝 No existing database found, will restore from SQL dump"
fi

# Backup existing database if it exists
if [ -f "$DB_PATH" ]; then
    echo "💾 Backing up existing database..."
    cp "$DB_PATH" "$BACKUP_PATH"
fi

# Restore from SQL dump if available
if [ -f "$SQL_DUMP" ]; then
    echo "📄 Restoring database from SQL dump: $SQL_DUMP"
    
    # Remove existing database
    rm -f "$DB_PATH"
    
    # Restore from SQL dump
    sqlite3 "$DB_PATH" < "$SQL_DUMP"
    
    if [ $? -eq 0 ]; then
        # Verify restoration
        USER_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM utilizadores WHERE active = 1;" 2>/dev/null || echo "0")
        TIMESHEET_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM timesheet;" 2>/dev/null || echo "0")
        
        if [ "$USER_COUNT" -gt "0" ]; then
            echo "✅ Database restored successfully!"
            echo "👥 Users: $USER_COUNT"
            echo "📊 Timesheet records: $TIMESHEET_COUNT"
        else
            echo "⚠️  Database restored but no users found"
        fi
    else
        echo "❌ Failed to restore from SQL dump"
        # Restore backup if restoration failed
        if [ -f "$BACKUP_PATH" ]; then
            echo "🔄 Restoring from backup..."
            cp "$BACKUP_PATH" "$DB_PATH"
        fi
        exit 1
    fi
else
    echo "❌ No SQL dump file found: $SQL_DUMP"
    echo "🔄 Database will be initialized with empty schema"
fi

echo "✅ Database deployment completed"

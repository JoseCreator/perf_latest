#!/bin/bash

# Deployment diagnostic script for Render
echo "🔍 PerformPass Deployment Diagnostics"
echo "======================================"

# Environment information
echo "📍 Environment: ${NODE_ENV:-undefined}"
echo "🕐 Timestamp: $(date)"
echo "💻 Working Directory: $(pwd)"

# Database diagnostics
DB_PATH="/tmp/timetracker.db"
echo ""
echo "📊 Database Diagnostics:"
echo "- Database path: $DB_PATH"
echo "- Database exists: $([ -f "$DB_PATH" ] && echo "YES" || echo "NO")"

if [ -f "$DB_PATH" ]; then
    echo "- Database size: $(du -h "$DB_PATH" | cut -f1)"
    
    # Check database tables
    TABLES=$(sqlite3 "$DB_PATH" ".tables" 2>/dev/null || echo "ERROR")
    echo "- Tables: $TABLES"
    
    # Check user count
    USER_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM utilizadores WHERE active = 1;" 2>/dev/null || echo "ERROR")
    echo "- Active users: $USER_COUNT"
    
    # Check timesheet count
    TIMESHEET_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM timesheet;" 2>/dev/null || echo "ERROR")
    echo "- Timesheet records: $TIMESHEET_COUNT"
fi

# File system checks
echo ""
echo "📁 File System:"
echo "- Backend files:"
ls -la /opt/render/project/src/backend/ 2>/dev/null || echo "  Backend directory not found"

echo "- Database files in /tmp:"
ls -la /tmp/timetracker* 2>/dev/null || echo "  No database files in /tmp"

# Environment variables
echo ""
echo "🔧 Environment Variables:"
echo "- NODE_ENV: ${NODE_ENV:-undefined}"
echo "- PORT: ${PORT:-undefined}"
echo "- JWT_SECRET: $([ -n "$JWT_SECRET" ] && echo "SET" || echo "NOT SET")"
echo "- FRONTEND_URL: ${FRONTEND_URL:-undefined}"

# Network diagnostics
echo ""
echo "🌐 Network:"
echo "- Hostname: $(hostname)"
echo "- Port binding: 0.0.0.0:${PORT:-4000}"

echo ""
echo "✅ Diagnostics completed"

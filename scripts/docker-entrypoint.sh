#!/bin/sh
set -e
# Sync database schema before starting the app
npx prisma db push
exec npm start

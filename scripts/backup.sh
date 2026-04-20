#!/bin/bash
mongodump --uri $MONGODB_URI --out ./backups/$(date +%Y%m%d)

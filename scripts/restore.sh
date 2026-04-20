#!/bin/bash
mongorestore --uri $MONGODB_URI ./backups/$1

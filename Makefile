.PHONY: help install dev build test prod
help:
	@echo "Available commands: install, dev, build, test, prod"
install:
	cd backend && npm install
	cd frontend && npm install
dev:
	docker-compose up --build
build:
	docker-compose -f docker-compose.prod.yml build
test:
	cd backend && npm test
	cd frontend && npm run test
prod:
	docker-compose -f docker-compose.prod.yml up -d

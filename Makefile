.PHONY: backend frontend dev dev-backend dev-frontend test test-backend test-frontend

dev: dev-backend dev-frontend

dev-backend:
	cd backend && python seed_demo_data.py --clear
	uvicorn main:app --app-dir backend --reload

dev-frontend:
	NEXT_PUBLIC_DEV_TOOLS=true npm --prefix frontend run dev

backend:
	uvicorn main:app --app-dir backend --reload

frontend:
	npm --prefix frontend run dev

test: test-backend test-frontend

test-backend:
	pytest

test-frontend:
	npm --prefix frontend test -- --watchAll=false

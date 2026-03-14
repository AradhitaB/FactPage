.PHONY: backend frontend test test-backend test-frontend

backend:
	uvicorn main:app --app-dir backend --reload

frontend:
	npm --prefix frontend run dev

test: test-backend test-frontend

test-backend:
	pytest

test-frontend:
	npm --prefix frontend test -- --watchAll=false

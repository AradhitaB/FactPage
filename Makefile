.PHONY: backend frontend test

backend:
	uvicorn main:app --app-dir backend --reload

frontend:
	npm --prefix frontend run dev

test:
	pytest

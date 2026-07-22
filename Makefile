.PHONY: up down logs test lint typecheck build check backup restore-check
up:
	docker compose up -d
down:
	docker compose down
logs:
	docker compose logs --tail=200 -f
test:
	pnpm test
lint:
	pnpm lint
typecheck:
	pnpm typecheck
build:
	pnpm build
check:
	pnpm check
backup:
	./scripts/backup.sh
restore-check:
	./scripts/restore.sh --check-only

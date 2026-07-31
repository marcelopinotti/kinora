#!/usr/bin/env bash
# Dump do banco para backups/ (gitignored).
#
#   ./scripts/dump.sh                 -> backups/kinora-AAAAMMDD-HHMMSS.sql
#   ./scripts/dump.sh meu-arquivo.sql -> backups/meu-arquivo.sql
#
# Rode ANTES de qualquer coisa que recrie o volume. `docker compose down -v`
# apaga o pgdata e não há como desfazer.
set -euo pipefail

cd "$(dirname "$0")/.."

# Lê o .env sem `source`: o arquivo está com terminação CRLF (editado no Windows),
# e o \r entraria no valor da variável, quebrando o -U do psql.
env_get() {
    [ -f .env ] || return 0
    grep -E "^$1=" .env | tail -1 | cut -d= -f2- | tr -d '\r\n'
}

POSTGRES_USER="${POSTGRES_USER:-$(env_get POSTGRES_USER)}"
: "${POSTGRES_USER:?defina POSTGRES_USER no .env ou no ambiente}"

if ! docker compose ps --status running db | grep -q db; then
    echo "O serviço 'db' não está de pé. Rode: docker compose up -d" >&2
    exit 1
fi

mkdir -p backups
destino="backups/${1:-kinora-$(date +%Y%m%d-%H%M%S).sql}"

# --clean --if-exists deixa o arquivo restaurável sobre um banco já populado.
docker compose exec -T db pg_dump -U "$POSTGRES_USER" -d kinora --clean --if-exists > "$destino"

echo "Dump em $destino ($(du -h "$destino" | cut -f1))"

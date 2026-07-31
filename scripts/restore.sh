#!/usr/bin/env bash
# Restaura um dump gerado por scripts/dump.sh.
#
#   ./scripts/restore.sh                              -> usa o dump mais recente
#   ./scripts/restore.sh backups/kinora-2026....sql   -> usa o arquivo indicado
#
# SOBRESCREVE o conteúdo atual do banco: o dump vem com --clean, então derruba as
# tabelas antes de recriar. Pede confirmação.
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

arquivo="${1:-$(ls -t backups/*.sql 2>/dev/null | head -1)}"

if [ -z "$arquivo" ] || [ ! -f "$arquivo" ]; then
    echo "Nenhum dump encontrado. Gere um com ./scripts/dump.sh" >&2
    exit 1
fi

if ! docker compose ps --status running db | grep -q db; then
    echo "O serviço 'db' não está de pé. Rode: docker compose up -d" >&2
    exit 1
fi

echo "Vai restaurar $arquivo POR CIMA do banco atual, apagando o que existe hoje."
read -r -p "Confirma? (digite: sim) " resposta
[ "$resposta" = "sim" ] || { echo "Cancelado."; exit 1; }

docker compose exec -T db psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d kinora < "$arquivo"

echo "Restaurado de $arquivo"

#!/usr/bin/env bash
# Popula o banco com dados de demonstração. Idempotente: rodar de novo não duplica.
#
#   ./scripts/seed.sh
#
# Precisa do stack no ar (docker compose up -d) e das variáveis do .env.
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

docker compose exec -T db psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d kinora < scripts/seed.sql

echo
docker compose exec -T db psql -U "$POSTGRES_USER" -d kinora -c \
    "select 'categoria' t, count(*) from categoria
     union all select 'streaming', count(*) from streaming
     union all select 'filme', count(*) from filme
     union all select 'usuario', count(*) from usuario;"

echo "Seed aplicado. Usuário não é criado aqui (a senha precisa do hash do backend):"
echo "  registre em /cadastro ou via POST /api/auth/registrar"

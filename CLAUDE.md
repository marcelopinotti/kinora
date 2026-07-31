# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

`JAVA_HOME` is **not** set in this environment — prefix every Maven call:

```bash
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64

./mvnw compile                       # build
./mvnw -DskipTests package           # jar
./mvnw spring-boot:run               # run (needs Postgres up)
```

Spring Boot 4.1 / Java 21 / Postgres / Flyway. **There is no test suite** — não existe `src/test`, e as dependências `*-test` saíram do `pom.xml`. O único teste que existia era um `contextLoads()` vazio que só passava com um Postgres real de pé. Verificação aqui é `./mvnw compile` mais exercitar a API rodando (`docker compose up -d`).

## Environment

Rodando fora do Docker, nada carrega o `.env` — exporte `POSTGRES_USER`, `POSTGRES_PASSWORD` e `JWT_SECRET` na shell. O `docker compose` lê o `.env` sozinho.

Host, porta e nome do banco saem de `POSTGRES_HOST` / `POSTGRES_PORT` / `POSTGRES_DB`, com default `localhost:5432/kinora`. É assim que o compose aponta o backend para o serviço `db` sem sobrescrever a URL inteira.

`JWT_SECRET` não tem default de propósito, e `TokenService` recusa segredo com menos de 32 bytes (HS256 usa chave de 256 bits): boot que falha é melhor que token assinado com segredo fraco. `POSTGRES_USER`/`POSTGRES_PASSWORD` também não têm default no compose — cair para `postgres/postgres` subiria um banco com credencial conhecida numa porta publicada no host.

Perfil `dev` (`SPRING_PROFILES_ACTIVE=dev`) é o único que liga `show-sql`.

## Architecture

Monolito em camadas, um pacote por camada (`controller` → `service` → `repository`, DTOs em `dto`, entidades em `domain`). Pensado para virar microsserviço depois, mas hoje é monolito — não introduza fronteiras de serviço.

**Mappers** são classes com métodos `static` em `dto/` (`FilmeMapper`, `UsuarioMapper`, …). Atenção ao nome: `toRequest(XRequest)` mapeia **DTO → entidade** (não o contrário); `toResponse(entidade)` faz o inverso. `@UtilityClass` do Lombok foi removido de propósito dos mappers — não recolocar; a não-instanciabilidade vem de um construtor privado explícito.

**Nomes em português** (`criar`, `atualizar`, `deletar`, `registrar`) para o que tem regra de negócio; só `findAll`/`findById` seguem o vocabulário herdado do Spring Data. Controllers usam o mesmo nome do método de service que chamam.

**Transações:** todo método de service é `@Transactional` (`readOnly = true` nas leituras). Não é decoração: `spring.jpa.open-in-view` está `false`, então mapear as coleções lazy de `Filme` fora de uma transação estoura `LazyInitializationException`.

**Relacionamentos:** `Filme` é o agregado central, com `@ManyToMany` para `Categoria` e `Streaming` via `filme_categoria` / `filme_streaming`. `FilmeService` resolve os ids recebidos no request e falha se algum não existir. As duas coleções são lazy e carregam por lote (`hibernate.default_batch_fetch_size: 50`) — sem isso a listagem do catálogo faz 1+2N queries. Não troque por `JOIN FETCH` nas duas de uma vez: dois `List` no mesmo fetch levantam `MultipleBagFetchException`.

Os getters de `categorias`/`streamings` devolvem view imutável, para que ninguém contorne a validação de ids mutando a lista pelo getter.

**Série não é entidade.** `Filme.tipo` (`domain/Tipo`: `FILME` | `SERIE`) distingue os dois; tudo o mais — CRUD, categorias, streamings, formulário — é compartilhado. Não crie `Serie`. `FilmeRepository.buscar(tipo, categoriaId)` é o filtro único das telas de catálogo, com os dois params opcionais — a rota legada `/api/filme/search` foi removida.

### Autenticação

`spring-boot-starter-security` está **ativo**, com chain própria em `config/SecurityConfig.java`:

- `BCryptPasswordEncoder` instanciado como campo em `UsuarioService`, sem `@Bean`.
- `TokenService` emite/verifica JWT com `java-jwt` (HS256, issuer `kinora`, `jwt.secret` / `jwt.expiracao` no yaml) e valida o tamanho mínimo do segredo no construtor.
- E-mail é normalizado (`trim` + `lowercase`) no `UsuarioService` antes de qualquer consulta ou persistência: a comparação do Postgres é case-sensitive, e sem isso `Ana@x.com` e `ana@x.com` viravam contas distintas. O `trim` acontece antes, no compact constructor dos DTOs, porque `@Email` recusa espaço em volta e devolveria 400 antes de o service ver o valor.
- CORS tem bean próprio, com origens em `app.cors.allowed-origins` (default `http://localhost:5173`). `allowCredentials` é `false`: a autenticação é por header, não por cookie.
- `config/JwtAuthFilter` popula o `SecurityContext` com o id do usuário; os endpoints `/me` recebem `@AuthenticationPrincipal Long usuarioId`, não o header cru.
- Público: health, `/error`, **todo GET** em `/api/filme/**`, `/api/categoria/**`, `/api/streaming/**`, mais `POST /api/auth/registrar` e `/login`. Todo o resto exige token — inclusive escrita em `/api/filme`.
- `HttpStatusEntryPoint(UNAUTHORIZED)` no lugar do default, senão request sem token volta 403 em vez de 401.
- Não há papéis/roles, e não é para introduzir: a única distinção é anônimo vs. autenticado.

### Erros e validação

Todos os services lançam `ResponseStatusException`. O corpo sai como RFC 9457 (`application/problem+json`) pelo `handler/GlobalExceptionHandler`, que estende `ResponseEntityExceptionHandler` — por isso 400 de tipo errado, 404 de rota inexistente e 405 vêm de graça. Erro de Bean Validation vira 400 com uma propriedade extra `campos` dizendo qual campo falhou.

Bean Validation (`@Valid` no controller + anotações no record) cobre **todos** os DTOs de escrita: `Usuario`, `Filme`, `Categoria` e `Streaming`.

`POST` devolve 201 em todos os recursos. DELETE de id inexistente devolve **404** em todos eles — `deleteById` cru não era usado justamente porque some com o id ausente sem avisar. Nome repetido em `Categoria`/`Streaming` devolve 409, checado com `existsByNomeIgnoreCase` para casar com o índice único em `lower(nome)`.

### Schema

Flyway em `src/main/resources/db/migration` (`V1`…`V12`) com `spring.jpa.hibernate.ddl-auto: validate`. O Hibernate **não** remenda mais o que a migration errar — é a migration que manda, e um descompasso derruba o boot. Ao mudar entidade, escreva a migration junto.

**Nunca edite uma migration já aplicada.** O Flyway guarda o checksum: mudar `V1`…`V12` derruba o boot de qualquer banco existente. Correção de schema entra como `V13` em diante, e migration que muda dado precisa de backfill defensivo — a `V6` faz `nota SET NOT NULL` sem backfill e teria falhado num banco com `nota` nula; a `V8` é o contraexemplo certo (`NOT NULL` com `DEFAULT`).

As join tables `filme_categoria` / `filme_streaming` têm PK composta e índice na segunda FK desde a `V11` (a PK só cobre a coluna à esquerda, e é a outra que é consultada ao deletar uma categoria). Continuam **sem** `ON DELETE CASCADE` de propósito: deletar categoria em uso estoura FK, que o handler converte em 409.

`categoria.nome` e `streaming.nome` têm índice único em `lower(nome)` (`V10`), não `UNIQUE(nome)` — um unique case-sensitive deixaria passar `Ação` e `ação` como registros distintos, contradizendo a checagem do service.

`validate` não checa tamanho de coluna nem índice, então nenhum dos dois quebra o boot se divergir.

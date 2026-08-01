# Kinora

API REST e aplicação web para catalogar filmes e séries e responder a uma pergunta simples:
**o que assistir, de que gênero, e em qual streaming.** Um título pertence a várias
categorias e pode estar disponível em vários serviços de streaming ao mesmo tempo.

[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=flat-square&logo=openjdk&logoColor=white)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1-6DB33F?style=flat-square&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docs.docker.com/compose/)

## Sumário

- [Arquitetura](#arquitetura)
- [Stack](#stack)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Executando com Docker](#executando-com-docker)
- [Executando localmente](#executando-localmente)
- [Endpoints da API](#endpoints-da-api)
- [Tratamento de erros](#tratamento-de-erros)
- [Decisões de projeto](#decisões-de-projeto)

## Arquitetura

Backend em monolito modular por camadas, autenticação stateless via JWT e schema versionado
por migration. Frontend em SPA consumindo a API por REST.

```
┌───────────────────────┐        HTTP + Bearer JWT        ┌───────────────────────────┐
│   frontend (React)     │ ───────────────────────────────▶ │   backend (Spring Boot)   │
│   Vite · TS · Tailwind │ ◀─────────────────────────────── │   controller → service    │
└───────────────────────┘             JSON                 │   → repository            │
                                                             └─────────────┬─────────────┘
                                                                           │ JPA
                                                                           ▼
                                                             ┌───────────────────────────┐
                                                             │        PostgreSQL         │
                                                             │   schema via Flyway (V1…V12)│
                                                             └───────────────────────────┘
```

No backend, toda requisição passa por uma chain de segurança antes do controller: leitura
(`GET`) é pública, qualquer escrita exige token. O `SecurityContext` já chega ao controller
com o id do usuário resolvido — não é o header cru.

```
       Authorization: Bearer <jwt>
                │
                ▼
      ┌──────────────────┐
      │  JwtAuthFilter    │  popula o SecurityContext com o id do usuário
      └────────┬──────────┘
               ▼
      ┌──────────────────┐        XxxRequest ──▶ Mapper ──▶ entidade
      │    controller     │───────────────────────────────────────────┐
      └────────┬──────────┘                                           │
               ▼                                                      ▼
      ┌──────────────────┐   throw ResponseStatusException   ┌──────────────────┐
      │      service      │ ─────────────────────────────────▶│ GlobalException   │
      │  regra de negócio │                                    │     Handler       │
      └────────┬──────────┘                                    │ application/       │
               ▼                                                │ problem+json (RFC 9457) │
      ┌──────────────────┐                                    └──────────────────┘
      │    repository     │  Spring Data JPA
      └──────────────────┘
```

O modelo gira em torno de `Filme`, que também representa séries (campo `tipo`), ligado a
duas tabelas de junção:

```
   ┌───────────┐      filme_categoria      ┌──────────────┐
   │ Categoria │◀─────────  N:N  ──────────▶│              │
   └───────────┘                            │    Filme     │
                                             │   (ou Série) │
   ┌───────────┐      filme_streaming       │              │
   │ Streaming │◀─────────  N:N  ──────────▶│              │
   └───────────┘                            └──────────────┘

   ┌───────────┐
   │  Usuario  │   isolado de propósito, sem FK para Filme.
   └───────────┘   O JWT carrega o id do usuário — validação local, sem consulta.
```

## Stack

### Backend

| Camada | Tecnologia |
| --- | --- |
| Linguagem / runtime | Java 21 |
| Framework | Spring Boot 4.1 (Web MVC) |
| Persistência | Spring Data JPA |
| Banco de dados | PostgreSQL |
| Migrations | Flyway |
| Autenticação | Spring Security + JWT (`java-jwt`, HS256) |
| Validação | Bean Validation |
| Boilerplate | Lombok |
| Observabilidade | Spring Boot Actuator |
| Build | Maven |

### Frontend

| Camada | Tecnologia |
| --- | --- |
| Linguagem | TypeScript |
| Biblioteca de UI | React 18 |
| Build tool | Vite |
| Estilização | Tailwind CSS 4 |
| Roteamento | React Router 6 |
| Servidor de produção | Nginx |

### Infraestrutura

| Item | Tecnologia |
| --- | --- |
| Orquestração local | Docker Compose |
| Imagem do backend | Multi-stage: Maven/JDK no build, JRE na imagem final |
| Imagem do frontend | Multi-stage: Node no build, Nginx servindo estático |

## Estrutura do repositório

```
kinora/
├── src/main/java/com/kinora/
│   ├── controller/     # camada REST — recebe DTO, devolve DTO
│   ├── service/        # regra de negócio, @Transactional
│   ├── repository/     # Spring Data JPA
│   ├── domain/          # entidades JPA
│   ├── dto/             # records de request/response + mappers
│   ├── config/          # segurança, JWT
│   └── handler/         # GlobalExceptionHandler (RFC 9457)
├── src/main/resources/
│   ├── application.yaml
│   └── db/migration/    # scripts Flyway versionados (V1…V12)
├── frontend/
│   ├── src/
│   │   ├── pages/       # telas (catálogo, detalhe, conta, formulário)
│   │   ├── components/  # componentes compartilhados
│   │   └── hooks/       # useFetch, useFocoNoErro
│   └── Dockerfile       # build com Node, Nginx servindo o estático
├── docker-compose.yml
└── Dockerfile
```

## Executando com Docker

Pré-requisito: Docker e Docker Compose.

```bash
docker compose up --build
```

Sobe três serviços: PostgreSQL, backend (`localhost:8080`) e frontend (`localhost:5173`).
As migrations do Flyway rodam automaticamente no primeiro boot do backend.

> [!IMPORTANT]
> `POSTGRES_USER`, `POSTGRES_PASSWORD` e `JWT_SECRET` precisam estar definidos no ambiente —
> nenhum tem valor padrão, e o container falha ao iniciar sem eles. É intencional: credencial
> com default vira credencial conhecida, e token assinado com segredo público não vale nada.
> `JWT_SECRET` exige no mínimo 32 bytes (HS256 usa chave de 256 bits).

## Executando localmente

Pré-requisitos: JDK 21, Node 22+ e uma instância PostgreSQL com o banco `kinora` criado.

**Backend**

```bash
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export POSTGRES_USER=seu_usuario
export POSTGRES_PASSWORD=sua_senha
export JWT_SECRET=uma_chave_aleatoria_de_no_minimo_32_bytes

./mvnw spring-boot:run
```

A API sobe em `http://localhost:8080`. Host, porta e nome do banco saem de `POSTGRES_HOST`,
`POSTGRES_PORT` e `POSTGRES_DB`, com default `localhost:5432/kinora`.

Para ver o SQL gerado durante o desenvolvimento, suba com o perfil `dev`
(`SPRING_PROFILES_ACTIVE=dev`) — é o único que liga `show-sql`.

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

A aplicação sobe em `http://localhost:5173`, consumindo a API local. `npm run lint` roda o
ESLint e `npm run build` faz a checagem de tipos antes de gerar o bundle de produção.

Primeiro request, do zero ao token:

```bash
curl -X POST localhost:8080/api/auth/registrar \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Ana","email":"ana@exemplo.com","senha":"senha12345"}'

curl -X POST localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"ana@exemplo.com","senha":"senha12345"}'
```

## Endpoints da API

`GET` é sempre público. Todo o resto exige `Authorization: Bearer <token>`.

| Recurso | Método | Rota | Descrição |
| --- | --- | --- | --- |
| Auth | `POST` | `/api/auth/registrar` | Cria a conta, devolve 201 |
| Auth | `POST` | `/api/auth/login` | Devolve o token e os dados do usuário |
| Auth | `GET` `PUT` `DELETE` | `/api/auth/me` | Lê, substitui e apaga a própria conta |
| Auth | `PATCH` | `/api/auth/me/senha` | Troca a senha exigindo a atual |
| Filme | `GET` | `/api/filme` \| `/api/filme/{id}` | Lista e detalha, com categorias e streamings |
| Filme | `GET` | `/api/filme?tipo={FILME\|SERIE}&categoria={id}` | Filtra por tipo e/ou categoria — parâmetros opcionais e combináveis |
| Filme | `POST` `PUT` `DELETE` | `/api/filme` \| `/api/filme/{id}` | CRUD completo |
| Categoria | `GET` | `/api/categoria` | Lista todas as categorias |
| Categoria | `POST` `PUT` `DELETE` | `/api/categoria` \| `/api/categoria/{id}` | Cria, renomeia e apaga |
| Streaming | `GET` | `/api/streaming` | Lista todos os serviços |
| Streaming | `POST` `PUT` `DELETE` | `/api/streaming` \| `/api/streaming/{id}` | Cria, renomeia e apaga |

> [!NOTE]
> `PUT /api/filme/{id}` substitui o recurso inteiro. Omitir `categorias` ou `streamings` no
> corpo remove os vínculos existentes — envie sempre as duas listas completas.

> [!NOTE]
> Série não é uma entidade separada: é um `Filme` com `tipo: "SERIE"`, reaproveitando
> categorias, streamings e o mesmo CRUD. Quando omitido, `tipo` vale `FILME`.

Códigos de status que valem conhecer antes de integrar:

| Situação | Status |
| --- | --- |
| `DELETE` de um id que não existe | `404` |
| Apagar categoria ou streaming ainda vinculado a um filme | `409` |
| Nome de categoria ou streaming já cadastrado (ignorando maiúsculas) | `409` |
| E-mail já cadastrado | `409` |
| Requisição sem token em rota protegida | `401` |

## Tratamento de erros

Erros seguem [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) (`application/problem+json`).
Rota inexistente, método não suportado, parâmetro de tipo errado e JSON malformado já saem
nesse formato sem código adicional. Erros de validação incluem uma propriedade `campos`
apontando exatamente o que falhou:

```json
{
  "status": 400,
  "detail": "Campos inválidos",
  "campos": { "senha": "size must be between 8 and 72" }
}
```

## Decisões de projeto

- **`ddl-auto: validate`, não `update`** — o Hibernate não corrige o schema em silêncio; uma
  divergência entre entidade e migration derruba o boot em vez de aparecer meses depois em
  produção.
- **Datas em `dd/MM/yyyy`** — `dataLancamento` usa o formato brasileiro tanto na entrada
  quanto na saída da API.
- **Sem papéis de usuário** — a única distinção é anônimo *vs.* autenticado. Não existe
  perfil administrador; qualquer usuário logado pode escrever. Decisão deliberada para o
  escopo atual.
- **`open-in-view` desligado** — a sessão JPA não fica aberta até a resposta ser escrita, o
  que escondia consultas N+1 em vez de resolvê-las. As coleções de `Filme` carregam por lote,
  deixando a listagem do catálogo com um número constante de queries.
- **Container sem root** — a imagem do backend roda com usuário dedicado e expõe um
  `HEALTHCHECK` no Actuator, que o Compose usa para só subir o frontend quando a API responde.
- **Monolito por decisão, não por inércia** — a separação em camadas mantém uma extração
  futura barata, mas hoje um banco, um deploy e um time não justificam microsserviços.

---

Desenvolvido por **Marcelo Pinotti**.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-marcelopinotti-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://linkedin.com/in/marcelopinotti)

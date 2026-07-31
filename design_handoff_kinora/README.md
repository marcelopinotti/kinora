# Handoff: Kinora — catálogo de filmes (7 telas)

## Overview
Kinora é um catálogo de filmes com estética de streaming (fundo escuro, acento laranja). O escopo cobre sete telas: **Cadastro**, **Login**, **Catálogo**, **Cadastrar filme**, **Editar filme**, **Gerenciar** (categorias e streamings) e **Minha conta**.

Regras de produto que o código deve respeitar:
- **Não existe administrador, papéis nem área admin.** Só dois estados: visitante e usuário logado.
- Visitante vê o catálogo. Para criar ou editar qualquer coisa, precisa entrar.
- Qualquer usuário logado pode criar/editar filmes, categorias e streamings.
- **Logout não tem tela** — é um item do menu do avatar que desloga.
- Não existe recuperar senha, dashboard, relatório nem listagem de usuários.

## About the Design Files
Os arquivos deste pacote são **referências de design escritas em HTML** — protótipos que mostram aparência e comportamento pretendidos, **não código de produção para copiar**. A tarefa é **recriar estas telas no ambiente já existente do codebase alvo** (React, Vue, SwiftUI, Blade, etc.), usando seus padrões e bibliotecas. Se ainda não existe front-end, escolha o framework mais adequado ao projeto e implemente lá.

Os `.dc.html` usam um runtime de protótipo próprio (`support.js`, tags `<sc-if>`, `<sc-for>`, `<dc-import>`). Ignore esse runtime: leia os arquivos como marcação + um bloco de lógica no fim de cada um, e traduza para os componentes do seu stack.

## Fidelity
**Alta fidelidade (hifi).** Cores, tipografia, espaçamentos, estados de erro e microcópia estão definitivos. Recrie pixel-perfect usando os componentes do codebase.

## Design Tokens

**Cores**
| Papel | Hex |
|---|---|
| Fundo da página | `#08080a` |
| Superfície de card / painel | `#141417` |
| Superfície secundária (linha de lista, chip off) | `#1b1b1f` / `#1f1f24` |
| Fundo de input | `#26262a` |
| Borda padrão | `rgba(255,255,255,.06)` – `rgba(255,255,255,.08)` |
| Borda de foco / acento | `#E8502A` |
| Acento hover | `#ff6038` |
| Acento gradiente (logo, botão de play) | `#FF7A45` → `#D63C1C` |
| Destrutivo (botão excluir definitivo) | `#D63C1C`, hover `#ff4d26` |
| Texto de erro / link destrutivo | `#FF6A4A` / `#FF8763` |
| Sucesso | `#7BD389` |
| Texto primário | `#ffffff` |
| Texto secundário | `#c9c9ce` |
| Texto terciário | `#9a9aa1` / `#b6b6bc` |
| Placeholder / muted | `#8b8b90` / `#6d6d74` |

**Gradiente da wordmark KINORA** — `linear-gradient(180deg,#FFF3EC 0%,#F0BFA8 55%,#D97847 100%)` com `background-clip:text`, fonte **Archivo Black**, `letter-spacing:-.005em`. Nunca aplicar arco/curva no texto.

**Símbolo** — quadrado `border-radius:10–12px`, gradiente `linear-gradient(150deg,#FF7A45,#D63C1C)`, sombra `0 6px 18px rgba(232,80,42,.35)`, triângulo de play branco via `clip-path:polygon(0 0, 100% 50%, 0 100%)`. Tamanhos: 32px (topbar) e 40px (telas de auth).

**Tipografia** — corpo **Manrope** (400/500/600/700/800); wordmark **Archivo Black**.
| Uso | Tamanho / peso |
|---|---|
| H1 auth | 40px / 800 / `-.02em` |
| H1 de página interna | 34px / 800 |
| H1 do formulário de filme | 36px / 800 |
| H2 de bloco | 21–24px / 800 |
| Título de card de filme | 22px / 800 |
| Eyebrow | 13px / 700 / `letter-spacing:.18em` / uppercase / `#E8502A` |
| Label de campo | 13px / 700 / `#c9c9ce` |
| Input | 15–16px |
| Corpo / ajuda | 13–15px |
| Erro de campo | 13px / 600 / `#FF6A4A` |

**Raios** — 6–8px (botões, inputs), 10px (linha de lista), 12px (card de filme, menu), 14px (painel), 999px (chip/pílula).

**Alturas de controle** — input auth 60px; input interno 56–58px; botão primário 52–60px; botão de linha 34–40px; chip 40px.

**Espaçamento** — grid de 4px; gaps típicos 7px (campo↔erro), 10px (chips), 16–22px (campos), 22–26px (blocos), 20–22px (grid de cards).

**Sombras** — card de auth `0 40px 90px rgba(0,0,0,.6)`; menu `0 20px 50px rgba(0,0,0,.65)`.

## Screens / Views

### 1. Cadastro (`/cadastro`)
Coluna centralizada, card de **600px** (`rgba(14,14,17,.72)` + `backdrop-filter:blur(18px)`), padding `56px 72px 60px`. Logo no canto superior esquerdo da página (fora do card).
- H1 "Cadastre-se" centralizado; subtítulo "Milhares de filmes e séries. Cancele quando quiser."
- Campos empilhados (gap 16px): nome completo, e-mail, senha. Abaixo da senha, texto de ajuda "Use no mínimo 8 caracteres."
- Botão primário largura total "Criar minha conta".
- Rodapé: "Já tem uma conta? **Faça login**".

### 2. Login (`/login`)
Mesmo card e mesmo fundo. H1 "Entre na sua conta"; campos e-mail + senha; botão "Entrar na conta"; rodapé "Novo por aqui? **Assine agora**". O protótipo mostra o **estado de erro** (borda `#FF6A4A` + "E-mail ou senha inválidos." sob o campo) — esse é o padrão de erro de todas as telas.

**Fundo das telas de auth** (só cadastro e login): `radial-gradient(120% 85% at 78% 8%, #3A1206, #1A0A08 42%, #08080a 78%)`, dois halos laranja desfocados (canto superior direito e inferior esquerdo), listras diagonais finas (`repeating-linear-gradient(102deg, rgba(255,255,255,.035) 0 1px, transparent 1px 74px)`), sete faixas horizontais rotacionadas −11° a `opacity:.32` sugerindo película de filme, e vinheta radial escurecendo as bordas. **Sem pôsteres de filmes** — decisão explícita, para não depender de artes licenciadas.

### 3. Catálogo (`/`)
TopBar + cabeçalho de seção ("CATÁLOGO" / "Em alta hoje") com filtros em pílula à direita (Todos ativo, Ação, Drama, Animação). Grid `repeat(4, minmax(0,1fr))`, gap 22px, padding lateral 48px.

Card de filme: `#141417`, borda 1px, radius 12px, padding `26px 26px 22px`. Contém área de arte 150px (hachura diagonal + legenda "arte do título" — **placeholder, substituir por pôster real**), título 22px/800, sinopse 14px `#a2a2a9` com `text-wrap:pretty`, linha de metadados (duração, selo "18", % de aprovação), e rodapé separado por borda com pílula do streaming e link **Editar** (só para logado). Hover: `translateY(-4px)` + borda `rgba(232,80,42,.5)`, 180ms. Selo TOP 10 opcional, ancorado no topo direito.

### 4. Cadastrar filme (`/filme/novo`) e 5. Editar filme (`/filme/:id/editar`)
**Um único layout em dois modos** — não duplicar tela. Card de 1040px, padding `46px 56px 52px`, cabeçalho centralizado.

| | Cadastrar | Editar |
|---|---|---|
| Eyebrow | NOVO FILME | EDITAR FILME |
| H1 | Cadastre seu filme aqui | Editar filme |
| Sub | Preencha as informações do título para publicá-lo no catálogo. | Ajuste as informações e salve as alterações. |
| Campos | vazios | pré-preenchidos com o filme |
| CTA | Cadastrar filme | Salvar alterações (+ botão Cancelar ao lado) |
| Sucesso | Filme cadastrado no catálogo. | Alterações salvas. |

Campos: grid de 2 colunas — **título** e **data de lançamento** (`dd/mm/aaaa`) na primeira linha; **descrição** (textarea 4 linhas) ocupando as duas colunas; **nota** (0 a 10, decimal, placeholder "0 a 10 — ex.: 8,7"). Depois, dois grupos de chips multi-seleção: **Categorias** e **Streamings** (chip on = fundo `#E8502A`, off = `#1f1f24` + borda sutil). Sob os streamings: "Não encontrou? **Gerencie as listas**" → `/gerenciar`.

Validação (mensagem sob o campo que falhou):
- título / descrição / data / nota obrigatórios
- data precisa casar `dd/mm/aaaa` → "Use o formato dd/mm/aaaa."
- nota numérica entre 0 e 10 (aceita vírgula decimal) → "A nota deve ser um número entre 0 e 10."
- ao menos uma categoria e ao menos um streaming

### 6. Gerenciar (`/gerenciar`)
TopBar + cabeçalho ("GERENCIAR" / "Categorias e streamings" / nota de que qualquer logado pode editar). Dois painéis lado a lado: `grid-template-columns:repeat(auto-fit, minmax(420px,1fr))`, gap 22px, `align-items:start` — em telas estreitas empilham sozinhos.

**Os dois painéis são a MESMA lista genérica instanciada duas vezes** (`ListaSimples.dc.html`), variando só título, subtítulo, placeholder e nome da entidade. Categoria e Streaming têm forma idêntica: `id` + `nome` (máx. 100 caracteres). Implemente como um componente reutilizável.

Anatomia da lista: cabeçalho (título 24px/800 + subtítulo), linha de criação (input + botão "Adicionar" 52px), lista de linhas, e contador ao pé ("N itens cadastrados").

Linha em **modo leitura**: nome à esquerda, `#id` em fonte monoespaçada, botões "Editar" (contorno neutro) e "Excluir" (contorno `rgba(255,106,74,.35)`, texto `#FF8763`).
Linha em **modo edição**: input com borda `#E8502A` + "Salvar" + "Cancelar", inline, sem modal.

Erros **na própria linha**, nunca em toast:
- nome vazio → "Informe um nome."
- acima de 100 caracteres → "O nome deve ter no máximo 100 caracteres."
- nome duplicado na criação → "Já existe um item com esse nome."
- **exclusão bloqueada por uso** → "Não foi possível excluir: {nome} está em uso por N filme(s). Remova esta categoria / este streaming dos filmes antes." A linha ganha borda `rgba(255,106,74,.4)`. No backend isso corresponde ao erro de integridade referencial; o front deve renderizar a mensagem da API na linha correspondente.

### 7. Minha conta (`/conta`)
Coluna de 760px centralizada. Cabeçalho com eyebrow "MINHA CONTA", nome do usuário como H1 e subtítulo. Três blocos empilhados (gap 22px):

1. **Dados** — nome e e-mail, ambos obrigatórios, botão "Salvar". Sucesso: "Dados atualizados." ao lado do botão. Erros: "O nome é obrigatório.", "O e-mail é obrigatório.", "Informe um e-mail válido."
2. **Alterar senha** — senha atual + nova senha. Botão "Alterar senha", sucesso "Senha alterada." (limpa os campos). Erros: "Informe sua senha atual.", "Informe a nova senha.", "A senha deve ter no mínimo 8 caracteres.", "A nova senha deve ser diferente da atual." Texto de ajuda persistente sob o campo quando não há erro.
3. **Excluir conta** — bloco de risco: fundo `linear-gradient(180deg, rgba(232,80,42,.09), rgba(20,20,23,.9))`, borda `rgba(255,106,74,.28)`, título `#FF8763`. Explica que a conta é apagada permanentemente e que os filmes/categorias/streamings cadastrados permanecem no catálogo. Botão de contorno "Excluir minha conta" **abre uma confirmação inline** (não modal): painel `#1b1416` pedindo que o usuário digite `EXCLUIR`, com "Excluir definitivamente" (destrutivo), "Cancelar", e erro "Digite EXCLUIR para confirmar a exclusão." se o texto não casar. Confirmado → sessão encerrada, volta para cadastro/login.

## Navegação (TopBar)
Sticky no topo, padding `20px 48px`, fundo `linear-gradient(#0b0b0e 62%, transparent)`, itens em flex com `gap` e `flex-wrap` (encolhe sozinha em telas estreitas). Presente em Catálogo, Cadastrar/Editar filme, Gerenciar e Minha conta — **ausente** nas telas de auth.

Da esquerda: logo (símbolo + wordmark, leva ao catálogo) · Início · Filmes · Séries · Novidades · **[só logado, após divisor vertical]** Cadastrar filme · Gerenciar · busca (`max-width:340px`, altura 44px, `#1b1b1f`) · avatar/estado de sessão.

O item ativo fica `#fff` e mais pesado; inativos `#b6b6bc` → `#fff` no hover.

**Logado**: avatar quadrado 40px `#E8502A` com inicial. Clique abre menu de 216px: cabeçalho com nome + e-mail, depois **Minha conta**, **Gerenciar**, **Cadastrar filme**, e **Sair** separado por borda em `#FF8763`.
**Visitante**: botões "Entrar" (contorno) e "Criar conta" (preenchido).

## State Management
- `session`: `null` (visitante) ou usuário `{ nome, email }`. Nada de papéis.
- `route` / tela atual.
- Formulário de filme: `{ titulo, descricao, dataLancamento, nota, categorias[], streamings[] }` + mapa `fieldErrors` + flag de sucesso. Modo (`novo` | `editar`) decide cópia, valores iniciais e botão.
- Gerenciar: coleções de categorias e streamings, `editingId`, rascunho do nome em edição, e erro **por linha** (`{ [id]: mensagem }`).
- Minha conta: rascunho de dados, rascunho de senha, mapas de erro por bloco, e estado de exclusão (`idle` | `confirm`) com o texto digitado.
- Menu do avatar: aberto/fechado.

Erros de validação **vêm campo a campo da API** e são renderizados sob o campo correspondente — o mesmo padrão visual do Login. Trate 409/422 de exclusão como erro de linha.

## Data model (API)
- **Filme**: `titulo`, `descricao`, `dataLancamento` (`dd/MM/yyyy`), `nota` (decimal 0–10), `categorias[]` (ids), `streamings[]` (ids).
- **Categoria** / **Streaming**: `id`, `nome` (máx. 100 caracteres).
- **Usuário**: `nome`, `email`, `senha` (mín. 8 caracteres).

## Assets
Nenhum binário. Logo, símbolo, chevrons e ícones são CSS/`clip-path`. Fontes: Manrope e Archivo Black (Google Fonts). **As artes dos filmes são placeholders** — os pôsteres reais devem vir do acervo/licenciamento do projeto; o card já reserva o espaço 2:3.

## Files
| Arquivo | Conteúdo |
|---|---|
| `Kinora.dc.html` | As sete telas + navegação entre elas + mocks |
| `TopBar.dc.html` | Barra de navegação e menu do avatar |
| `ListaSimples.dc.html` | Lista genérica reutilizada por Categorias e Streamings |
| `support.js` | Runtime do protótipo — não portar |

No protótipo há um seletor de telas fixo no rodapé, apenas para navegação da demo. **Não implementar.**

# Glossário

Vocabulário usado nas decisões de arquitetura e testes deste repositório.
Ver [docs/adr](adr/) para o raciocínio completo por trás de cada termo
marcado com ADR.

## PDV / POS / sale (flow)

O fluxo de venda no balcão. Nos ADRs e na documentação em português é "PDV";
no código o flow chama-se `sale` (não `pos`) — renomeado em
[ADR 0004](adr/0004-renomeia-flow-pos-para-sale.md) porque o vocabulário de
domínio já em uso em todo o código é `Sale`/`SaleItem`/`IOpenSale`, não
"pos". `apps/web/src/routes/_app/sale.tsx` (rota `/sale`) é hoje um wrapper
fino; a implementação real vive em `apps/web/src/presentation/flows/sale/`, por
cima de `apps/web/src/domain|data|infra|main/*` — piloto de Clean
Architecture, ver [ADR 0003](adr/0003-clean-architecture-piloto-pos.md).

## Financeiro / financial (flow)

Tela com 5 sub-áreas (Visão geral, Caixa, Fiado, Contas a pagar, Fluxo &
lançamentos), navegadas por abas (`SSeg`) na mesma rota —
`apps/web/src/routes/_app/financial.tsx` é um wrapper fino; a implementação
vive em `apps/web/src/presentation/flows/financial/`, por cima de
`apps/web/src/domain|data|infra|main/*` — 2º módulo em Clean Architecture,
ver [ADR 0006](adr/0006-clean-architecture-financial-promove-convencao.md).
Cada sub-área é um componente MVVM em `presentation/flows/financial/components/`;
não existe um flow único agregando as 5 (ver Decisão 1 do ADR 0006 — as abas
não compartilham estado como o `Sale` faz no PDV).

## Produtos / products (flow)

Cadastro de produtos + entrada de estoque embutida — tela única, sem abas
(diferente de `financial`/`settings`). `apps/web/src/routes/_app/products.tsx`
é um wrapper fino; a implementação vive em
`apps/web/src/presentation/flows/products/`, por cima de
`apps/web/src/domain|data|infra|main/*` — 3º módulo em Clean Architecture,
ver [ADR 0007](adr/0007-clean-architecture-products.md). `StockEntryModal`
(entrada de estoque avulsa) migra junto como componente local do flow;
`stock.tsx` (fora de escopo) importa esse componente do novo caminho.
`Product` passa a ser definido em `domain/models/products.ts` (antes vivia em
`domain/models/sale.ts` por efeito colateral de `sale` ter sido o piloto —
ver ADR 0005); `domain/models/stock.ts` nasce nesta ADR só para o tipo
`StockAlerts`, sem nenhum usecase de `stock` ainda.

## flushPendingQuantity

Função que força o envio imediato ao servidor de qualquer alteração de
quantidade ainda presa no debounce de 400ms. Precisa ser chamada em todo
caminho que sai do estado "editando quantidade" (finalizar venda, remover
item, cancelar venda, aplicar desconto) — senão a mudança fica só no cliente
e se perde. Centralizada em `presentation/flows/sale/hooks/use-quantity-debounce.ts`
(ADR 0003), coberta por `apps/e2e/tests/05-quantidade.spec.ts`.

## qtyPending

`useRef` que guarda, por item da venda, a quantidade otimista exibida na tela
e o timer do debounce de 400ms — deliberadamente fora de `useState` para não
disparar re-render a cada tecla/clique.

## focusScan

Callback que devolve o foco ao campo de entrada do scanner via
`requestAnimationFrame`, chamado depois de qualquer mutação que deveria
manter o operador digitando/escaneando sem precisar clicar de volta no campo.
Centralizado em `presentation/flows/sale/hooks/use-scan-focus.ts`. **Tem** cobertura
E2E, ao contrário do que o ADR 0002 registrou — `apps/e2e/tests/support/sale.ts`
verifica foco após adicionar item (`addKnownItems`) e após cancelar venda
(`ensureFreshSale`); essa suíte pegou uma regressão real na extração das
mutations (ver [ADR 0003](adr/0003-clean-architecture-piloto-pos.md)).

## Refatoração puramente estrutural

Mudança que reorganiza código (quebra de arquivo, extração de
hooks/componentes) sem alterar UI ou comportamento observável. Era a
definição original da refatoração do front ([ADR 0001](adr/0001-e2e-antes-da-refatoracao-do-front.md));
a rodada do PDV passou a incluir correções pontuais além da reorganização
([ADR 0002](adr/0002-escopo-refatoracao-pos.md)).

## Feature folder

Convenção de organizar hooks, componentes e tipos de um fluxo específico sob
`features/<nome>/`, deixando o arquivo de rota (`routes/_app/<nome>.tsx`)
como um wrapper fino. Introduzida para o PDV em
[ADR 0002](adr/0002-escopo-refatoracao-pos.md) — ainda **não** é convenção
obrigatória para o resto do repositório.

## Clean Architecture em camadas (`arquiteture.md`)

Convenção portátil de arquitetura para o front: `presentation → main → data →
domain ← @shared`. Uma camada só importa camadas mais internas; `domain` é
TypeScript puro sem framework. Adotada como piloto no PDV em
[ADR 0003](adr/0003-clean-architecture-piloto-pos.md), estendida ao
`financial` em [ADR 0006](adr/0006-clean-architecture-financial-promove-convencao.md)
e ao `products` em [ADR 0007](adr/0007-clean-architecture-products.md) —
com módulos independentes validando o mesmo padrão, **é a convenção
esperada** para as próximas migrações (`reports`, `stock`, `settings`), não
mais uma decisão caso a caso.

## `IHttpClient`

Interface que é a única fronteira entre `data/` e o cliente HTTP real
(axios, no caso deste repo). `data/handlers` nunca importa axios diretamente,
só essa interface. O adaptador concreto mora em `infra/`.

## Usecase / Handler / Factory

Vocabulário do fluxo de uma integração: `domain/usecases` define a interface
(`ISearchProduct`, `IOpenSale`...); `data/handlers` implementa contra
`IHttpClient` (`SearchProductHandler`); `main/factories` monta o handler
injetando o `IHttpClient` (`makeSearchProduct`) e, por cima, envolve em
`useQuery`/`useMutation`. Verbos custom (fora do CRUD `Search/GetOne/Create/
Update/Delete`) são permitidos para ações de negócio que não são um CRUD
genérico — ex. `IOpenSale`, `ICancelSale`, `ICompleteSale` no PDV. Ver mapeamento
completo em [ADR 0003](adr/0003-clean-architecture-piloto-pos.md).

## Flow (`main/factories/flows`)

Camada de composição que junta as mutations em torno do ciclo de vida de um
agregado num único objeto entregue à `presentation` via props. No PDV:
`useSaleFlow` (`main/factories/flows/use-sale-flow.ts`), consumido por
`presentation/flows/sale/SalePage.tsx`.

## Suíte E2E do PDV

`apps/e2e/tests/01-smoke.spec.ts` a `05-quantidade.spec.ts` — Playwright,
local, sob demanda, sem CI. Cobre abertura de venda, busca por código/nome,
guarda de autenticação, o padrão de debounce+flush de quantidade **e** o
retorno de foco do scanner (via helpers `addKnownItems`/`ensureFreshSale` em
`support/sale.ts` — achado tardio, ver [ADR 0003](adr/0003-clean-architecture-piloto-pos.md)).
Deliberadamente não cobre regra de negócio (totais, taxa de serviço, fiado).
Ver [ADR 0001](adr/0001-e2e-antes-da-refatoracao-do-front.md).

## Suíte supertest do financial

`apps/api/test/financial.e2e-spec.ts` — Jest + supertest, contra um NestJS
`TestingModule` real e o Postgres local (não mockado). Cobre as regras de
negócio que o [ADR 0001](adr/0001-e2e-antes-da-refatoracao-do-front.md)
apontou como bloqueio para `financial.tsx`: diferença de fechamento de caixa
(BR-06), liquidação de fiado (BR-08) e pagamento de contas. Complementa a
[suíte E2E do financeiro](../../apps/e2e/tests/06-financeiro.spec.ts)
(`06-financeiro.spec.ts`), que cobre a integração UI ↔ API das 5 abas, não a
regra de negócio em si. Ver [ADR 0006](adr/0006-clean-architecture-financial-promove-convencao.md).

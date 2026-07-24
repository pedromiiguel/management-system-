# 0008 — Estoque (`stock`) como 4º módulo da Clean Architecture

- **Status:** Aceito (implementado)
- **Data:** 2026-07-24
- **Estende:** o padrão promovido a convenção de repo pela [ADR 0006](0006-clean-architecture-financial-promove-convencao.md), aplicando a mesma receita de migração de tipos do [ADR 0005](0005-centraliza-tipos-em-domain.md) e a convenção de componentes do [componentes-mvvm.md](../componentes-mvvm.md)

## Contexto

Depois de `sale` (ADR 0003), `financial` (ADR 0006) e `products` (ADR 0007),
os candidatos restantes eram `stock.tsx` (232 linhas), `reports.tsx` (400) e
`settings.tsx` (458). `docs/glossario.md` já registra Clean Architecture como
convenção esperada para os três, não mais decisão caso a caso — mesmo assim
a escolha de qual entra primeiro é uma troca real (grilling em
`docs/adr/README`-equivalente desta rodada, via `/grill-with-docs`; skills
`/grilling`/`/domain-modeling` continuam não instaladas nesta máquina —
mesma situação das rodadas anteriores).

`stock.tsx` venceu por ser a menor tela (sem abas) e por fechar duas pontas
soltas que a ADR 0007 deixou deliberadamente abertas: `ICreateStockEntry` e
`IGetStockAlerts` vivem hoje em `domain/usecases/products` só porque `stock`
ainda não tinha migrado; `domain/models/stock.ts` já existe (criado na ADR
0007 só para `StockAlerts`). `reports.tsx` e `settings.tsx` cada um tem seu
próprio problema mais urgente (duplicação de export CSV; acesso duplicado a
`/financial/categories`) que não têm relação com `stock` e ficam para as
próprias rodadas.

Inspeção do backend (`apps/api/src/modules/stock/*`) confirma duas regras de
negócio sem nenhuma cobertura de teste hoje:

- **FR-05 — `createEntry`**: transação única (`StockMovement` + `ProductBatch`
  condicional + incremento de `currentStock` + atualização opcional de
  `purchasePrice`). Mesma transação por trás de `POST /stock/entries`, já
  usada pelo `StockEntryModal` migrado na ADR 0007 (embutido em
  `products.tsx` e avulso em `stock.tsx`) — **já fora do gate de supertest**
  por precedente explícito da ADR 0007 (Decisão 4: "fora do gate,
  deliberadamente").
- **Guarda de estoque negativo em `createAdjustment`**: `updateMany`
  atômico com `currentStock: { gte: -quantity }`; lança
  `BadRequestException` se o ajuste deixaria o estoque negativo. Ramificação
  real, sem precedente de exclusão — candidata ao gate desta rodada.

`stock.tsx` hoje **não** tem nenhuma suíte E2E própria: `07-produtos.spec.ts`
testa o `StockEntryModal` inteiramente pela rota `/products`
(`openProductsPage`), nunca pela rota `/stock`. A listagem de movimentações,
os dois cards de alerta e o `AdjustModal` (novo, sem equivalente em
`products`) não têm cobertura alguma.

## Decisão

### 1. Escopo: `stock.tsx` inteiro, incluindo o `StockEntryModal` que hoje mora em `products`

Diferente da ADR 0007 (que deixou `stock.tsx` de fora e só corrigiu o import
do `StockEntryModal`), esta rodada migra `stock.tsx` por completo **e**
move o `StockEntryModal` para o domínio a que ele conceitualmente pertence:

- `presentation/flows/products/components/StockEntryModal/` →
  `presentation/flows/stock/components/StockEntryModal/`.
- `ProductsPage.view.tsx` passa a importar de `stock` (inverte a direção de
  import de hoje — antes era `stock.tsx` importando de `products`).
- `domain/usecases/products/create-stock-entry.ts` (`ICreateStockEntry`) e
  `domain/usecases/products/get-stock-alerts.ts` (`IGetStockAlerts`) movem
  para `domain/usecases/stock/`. Ambos já eram tratados como desvio
  temporário na ADR 0007 ("mesmo desvio do `IGetSalesTotal`") — esta rodada
  fecha o desvio, não o redecide.

Justificativa: "entrada de estoque" é conceito de `stock`
(`stock.service.ts` já rotula `createEntry` como FR-05, sub-área de
estoque), não de `products`. Manter o componente em `products` só porque
`products` migrou primeiro perpetuaria a mesma inversão que a ADR 0007 já
corrigiu para o tipo `Product`.

### 2. Clean Architecture completa (convenção de repo, ADR 0006 — não redecidida)

`stock.tsx` (232 linhas) vira `presentation/flows/stock/`: `StockPage`
(Model/ViewModel/View, sem abas) e um componente local MVVM novo —
`AdjustModal` — além do `StockEntryModal` herdado de `products` (item 1).
`routes/_app/stock.tsx` vira wrapper fino.

Inventário completo (5 chamadas de API usadas hoje por `stock.tsx`):

| Chamada atual                              | Entidade      | Usecase                          | Handler                    | Factory                  |
| ------------------------------------------- | ------------- | ------------------------------------ | ------------------------------ | ---------------------------- |
| `GET /stock/alerts`                        | StockAlerts   | `IGetStockAlerts` *(custom, movido)* | `GetStockAlertsHandler`        | `makeGetStockAlerts`         |
| `GET /stock/movements`                     | StockMovement | `ISearchStockMovements` *(custom)*   | `SearchStockMovementsHandler`  | `makeSearchStockMovements`   |
| `POST /stock/entries`                      | StockMovement | `ICreateStockEntry` *(movido)*       | `CreateStockEntryHandler`      | `makeCreateStockEntry`       |
| `POST /stock/adjustments`                  | StockMovement | `ICreateStockAdjustment` *(custom)*  | `CreateStockAdjustmentHandler` | `makeCreateStockAdjustment`  |
| `GET /products?search=&perPage=` (`AdjustModal`) | Product | `ISearchProductCatalog` *(reuso)*    | `SearchProductCatalogHandler`  | `makeSearchProductCatalog`   |

**Reuso deliberado cross-domínio**: `AdjustModal` busca produto pelo mesmo
endpoint paginado do catálogo (`GET /products?search=&perPage=6`) —
reaproveita `ISearchProductCatalog`/`makeSearchProductCatalog` de `products`
em vez de criar um usecase próprio. Mesmo espírito do reuso de `sale` por
`reports.tsx` hoje (fora de escopo, só como precedente): um flow consumindo
o usecase de outro quando o contrato já serve, sem duplicar.

**Nome custom deliberado**: `listMovements(productId?)` é filtrado mas não
paginado (`take: 200` fixo, sem cursor/página) — mesmo formato de
`ISearchProduct` no `sale` ("busca rápida... sem paginação", ADR 0007).
`ISearchStockMovements` segue essa convenção em vez de `IGetStockMovements`
(que sugeriria busca única, não uma lista filtrável).

Sem `main/factories/flows/use-stock-flow.ts`: como `financial` e `products`
(Decisão 4 da ADR 0006), `stock.tsx` não é um agregado percorrendo uma tela
em etapas — `StockPage.model.ts` e os dois modais consomem
`main/factories/queries|mutations/stock` diretamente.

### 3. Tipos: `StockMovement` nasce em `domain/models/stock.ts`; `StockPosition` fica de fora

O `interface Movement` hoje local em `stock.tsx` vira `StockMovement` em
`domain/models/stock.ts`, ao lado de `StockAlerts` (já lá desde a ADR 0007).
Nome alinhado ao que a tabela da ADR 0007 já usava para a entidade por trás
de `POST /stock/entries`.

**`StockPosition` (`GET /stock/position`, consumida hoje só por
`reports.tsx` via `/reports/stock-position`) não é adiantada nesta rodada.**
Diferente do precedente de `StockAlerts` na ADR 0007 (adiantada porque
`products.tsx` precisava do tipo imediatamente), `stock.tsx` não chama
`/stock/position` — nenhum consumidor no domínio `stock` nesta rodada.
Fica como tipo local de `reports.tsx` (`StockPositionRow`) até a própria
migração de `reports`.

### 4. Gate de teste do ADR 0001 — só a guarda de estoque negativo

Segue o padrão restrito da ADR 0007 (não o mais amplo de `financial`): só a
regra com ramificação real e zero precedente de exclusão entra no supertest
pré-migração.

- **Guarda de estoque negativo** — `POST /stock/adjustments` com quantidade
  negativa maior que o estoque atual deve falhar com `BadRequestException`;
  deve funcionar quando não deixaria o estoque negativo (incl. caso
  limite: ajuste que zera o estoque exatamente).

**Fora do gate, deliberadamente**: a transação de `createEntry` (FR-05,
mesmo endpoint/mesma transação já excluída pela ADR 0007 — não é
redecidida aqui) e as leituras (`alerts`, `movements`, `position`) — sem
ramificação de negócio, só agregação/filtro. Cobertura fica a cargo dos
testes unitários de handler (`data/handlers/stock/*.test.ts`, fase 3).

Suíte E2E (Playwright, `08-estoque.spec.ts`) cobre os fluxos de UI de
`stock.tsx` **antes** de qualquer reorganização de código: listagem de
movimentações recentes; cards de estoque abaixo do mínimo e vencimento
próximo (FR-07/FR-08); entrada de estoque avulsa pela rota `/stock`
(wiring do `StockEntryModal` nesta página nunca foi exercitado por E2E —
`07-produtos.spec.ts` só cobre via `/products`); ajuste manual positivo e
negativo via `AdjustModal`, incluindo reflexo na listagem de movimentações.
Não repete aqui a guarda de estoque negativo em si (já coberta pelo
supertest) — só o caminho feliz de um ajuste negativo válido.

### 5. Escopo de mudança: permite correções pontuais

Mesmo precedente da ADR 0002/0006/0007: bug revelado durante a migração é
corrigido no mesmo PR, documentado nesta ADR — não vira item separado.

## Faseamento (mesmo espírito da ADR 0006/0007 — verde a cada fatia)

1. Supertest da guarda de estoque negativo (`apps/api/test/stock.e2e-spec.ts`).
2. Suíte E2E dos fluxos de UI contra `stock.tsx` atual (`08-estoque.spec.ts`).
3. `domain/` (`models/stock.ts` ganha `StockMovement`; `usecases/stock/*`
   recebe os 4 usecases, incl. os 2 movidos de `products`) + `data/handlers/stock/*`
   (com teste unitário cada) + `infra` (endpoints) + `main/factories`
   — código novo, morto, não conectado. As duas suítes não deveriam mudar
   de resultado.
4. `presentation/flows/stock/` consome as factories; `routes/_app/stock.tsx`
   vira wrapper fino; `ProductsPage.view.tsx` troca o import do
   `StockEntryModal` para o novo caminho em `stock`. As duas suítes rodam
   de novo — ponto real de risco (inclui a inversão de import
   products→stock).

## Consequências

- 4 usecases implementados (`domain/usecases/stock`), cada um com handler +
  teste unitário (`data/handlers/stock/*.test.ts`) — 5/5 testes verdes
  (`SearchStockMovementsHandler` tem 2 casos, os outros 3 têm 1 cada). Suíte
  `apps/web` completa: 39/39 testes verdes (31 já existentes de
  `sale`/`financial`/`products` + 8 novos de `stock`). Typecheck
  (`tsc --noEmit`) limpo.
- `stock.tsx` (232 linhas, 1 arquivo) virou `presentation/flows/stock/` —
  `StockPage` (Model/ViewModel/View, sem abas) + 2 componentes locais MVVM
  (`AdjustModal`, novo; `StockEntryModal`, movido de `products`), cada um
  com barrel. `routes/_app/stock.tsx` é hoje um wrapper de 5 linhas.
  `ProductsPage.view.tsx` importa `StockEntryModal` de
  `presentation/flows/stock/components/StockEntryModal` — inverteu a
  direção de import de hoje, verificado manualmente no browser (dialog
  "Entrada de estoque" abre normalmente em `/products` e em `/stock`, sem
  erro de console).
- `ICreateStockEntry` e `IGetStockAlerts` saíram de `domain/usecases/products`
  para `domain/usecases/stock` — fecha o desvio temporário registrado na ADR
  0007. `StockMovement` nasceu em `domain/models/stock.ts`, ao lado de
  `StockAlerts`. `lib/types.ts` perdeu os reexports de `Product` e
  `StockAlerts` (sem consumidor depois desta migração — só `reports.tsx`
  ainda usa `Paginated`/`Sale` daquele arquivo).
- `AdjustModal` (novo) reusa `useProductSearchQuery`/`ISearchProductCatalog`
  de `products` para a busca de produto, em vez de um usecase próprio —
  reuso cross-domínio deliberado (Decisão 2).
- Estilização nova nasceu em Tailwind (grid/flex do layout de `StockPage`
  convertidos de `style={{}}` inline), seguindo `arquiteture.md` — mesma
  correção pontual da ADR 0006/0007. `AdjustModal` ganhou validação zod
  (`stockAdjustmentSchema`) via `react-hook-form`, substituindo a validação
  manual do `stock.tsx` original.
- Suíte supertest (`apps/api/test/stock.e2e-spec.ts`, 4 casos) cobre a
  guarda de estoque negativo (incl. caso limite que zera o estoque) — 4/4
  verdes. Rodando junto com `products.e2e-spec.ts` e `financial.e2e-spec.ts`:
  24/24 verdes.
- Suíte E2E (`apps/e2e/tests/08-estoque.spec.ts`, 6 casos) cobre listagem de
  movimentações, alertas (FR-07/FR-08), entrada de estoque avulsa pela
  própria rota `/stock` (nunca testada antes — `07-produtos.spec.ts` só
  cobria via `/products`) e ajuste manual positivo/negativo — 6/6 verdes.
  Suíte completa do projeto (todos os arquivos, incl. PDV, financeiro e
  produtos): 50/50 verdes — sem regressão nos módulos já migrados.
- `reports.tsx` e `settings.tsx` continuam fora de escopo — próximos
  candidatos (5º e 6º módulos).

## Alternativas rejeitadas

- **Deixar `StockEntryModal` em `presentation/flows/products/`, só mover o
  usecase**: rejeitado — separaria a decisão de camada (domain muda de dono,
  presentation não), mas perpetuaria a inversão conceitual que a ADR 0007
  já sinalizou como pendente; preferido fechar as duas pontas juntas agora
  que `stock.tsx` está migrando de qualquer forma.
- **Extrair `StockEntryModal` para um local compartilhado fora de qualquer
  flow** (`presentation/components/`): rejeitado — o componente pertence
  claramente a `stock` (entrada de estoque é ação de `stock`, só
  reaproveitada visualmente dentro do fluxo de cadastro de `products`); um
  local "neutro" evitaria a decisão em vez de resolvê-la.
- **Ampliar o gate de supertest para incluir a transação de `createEntry`**:
  rejeitado — mesma transação já avaliada e excluída na ADR 0007 (mesmo
  endpoint); reabrir essa decisão para `stock.tsx` inflaria o gate sem regra
  de negócio nova.
- **Adiantar `StockPosition` em `domain/models/stock.ts`**: rejeitado —
  diferente do precedente de `StockAlerts` (havia consumidor imediato em
  `products.tsx`), `stock.tsx` não usa `/stock/position`; criar o tipo sem
  consumidor no domínio antecipa uma decisão que é de `reports`, não de
  `stock`.

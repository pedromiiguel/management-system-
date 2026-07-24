# 0007 — Products como 3º módulo da Clean Architecture

- **Status:** Aceito (implementado)
- **Data:** 2026-07-24
- **Estende:** o padrão promovido a convenção de repo pela [ADR 0006](0006-clean-architecture-financial-promove-convencao.md), aplicando a mesma receita de migração de tipos do [ADR 0005](0005-centraliza-tipos-em-domain.md) e a convenção de componentes do [componentes-mvvm.md](../componentes-mvvm.md)

## Contexto

Depois de `sale` (ADR 0003) e `financial` (ADR 0006), os candidatos restantes
eram `products.tsx` (533 linhas), `settings.tsx` (458), `reports.tsx` (400) e
`stock.tsx` (232). Grilling manual (mesma situação das duas rodadas
anteriores — skills `/grilling`/`/domain-modeling` referenciados por
`grill-with-docs` não instalados nesta máquina) decidiu `products.tsx` como
próximo, pelo acoplamento real que ele resolve: `stock.tsx` importa
`StockEntryModal` diretamente de `products.tsx` hoje.

`products.tsx` não tem abas (diferente de financial/settings) — é uma tela
única (tabela + filtros + paginação) com dois modais: `ProductModal`
(cadastro/edição, com entrada de estoque **embutida** opcional) e
`StockEntryModal` (entrada de estoque avulsa, busca produto existente,
reexportada e consumida por `stock.tsx`).

Inspeção confirmou que nenhuma regra de negócio de `products` tem cobertura
supertest: `apps/api/test/products.controller.spec.ts` existe, mas mocka
`ProductsService` inteiro — testa só a checagem de permissão do controller,
não o comportamento real contra banco (BR-04, transação de
`applyStockEntry`, normalização de EAN). `stock.tsx` não tem nenhum spec.

## Decisão

### 1. Escopo: só `products.tsx`; `StockEntryModal` migra junto, `stock.tsx` fica de fora

`stock.tsx` **não** entra nesta rodada. `StockEntryModal` (hoje definido em
`products.tsx` e importado por `stock.tsx`) migra para
`presentation/flows/products/components/StockEntryModal/` como parte desta
ADR. `stock.tsx` passa a importar diretamente desse novo caminho (troca de
uma linha de import, sem migrar o resto do arquivo) — mesmo espírito do
desvio do `IGetSalesTotal` na ADR 0006 (usecase que conceitualmente pertence
a outro domínio fica onde nasceu até esse domínio migrar).

O usecase por trás do `StockEntryModal` (`POST /stock/entries`) nasce em
`domain/usecases/products` como `ICreateStockEntry` *(custom)*, com a mesma
ressalva: pertence conceitualmente a `stock`, não a `products`. Deve se
mover para `domain/usecases/stock` quando `stock.tsx` for migrado.

### 2. Clean Architecture completa (convenção de repo, ADR 0006 — não redecidida)

`products.tsx` (533 linhas) vira `presentation/flows/products/`:
`ProductsPage` (Model/ViewModel/View + tipos, sem abas) e dois componentes
locais MVVM — `ProductModal` e `StockEntryModal`. `routes/_app/products.tsx`
vira wrapper fino.

Inventário completo (7 chamadas de API usadas hoje por `products.tsx`):

| Chamada atual                          | Entidade     | Usecase                          | Handler                       | Factory                        |
| ---------------------------------------- | ------------ | ----------------------------------- | -------------------------------- | ---------------------------------- |
| `GET /products?search=&page=&all=&perPage=` | Product      | `ISearchProductCatalog` *(custom)*  | `SearchProductCatalogHandler`    | `makeSearchProductCatalog`         |
| `GET /stock/alerts`                      | StockAlerts  | `IGetStockAlerts` *(custom)*        | `GetStockAlertsHandler`          | `makeGetStockAlerts`               |
| `POST /products`                         | Product      | `ICreateProduct`                    | `CreateProductHandler`           | `makeCreateProduct`                |
| `PATCH /products/:id`                    | Product      | `IUpdateProduct`                    | `UpdateProductHandler`           | `makeUpdateProduct`                |
| `PATCH /products/:id/deactivate`         | Product      | `IDeactivateProduct` *(custom)*     | `DeactivateProductHandler`       | `makeDeactivateProduct`            |
| `DELETE /products/:id`                   | Product      | `IDeleteProduct`                    | `DeleteProductHandler`           | `makeDeleteProduct`                |
| `POST /stock/entries`                    | StockMovement| `ICreateStockEntry` *(custom)*      | `CreateStockEntryHandler`        | `makeCreateStockEntry`             |

**Desvio de nome deliberado**: `domain/usecases/sale/search-product.ts` já
define `ISearchProduct` (busca rápida do scanner do PDV — `search(query,
perPage) => {items}`, sem paginação). A listagem do catálogo de `products.tsx`
é paginada e filtrável (`search`, `page`, `activeOnly`) e retorna
`Paginated<Product>` — mesma entidade, contrato diferente. Em vez de duas
interfaces `ISearchProduct` divergentes em pastas irmãs, a versão de
`products` recebe nome próprio (`ISearchProductCatalog`). `sale/search-product.ts`
não é tocado.

Sem `main/factories/flows/use-products-flow.ts`: como no `financial`
(Decisão 4 da ADR 0006), `products.tsx` não é um agregado único percorrendo
uma tela em etapas — `ProductsPage.model.ts` e os dois modais consomem
`main/factories/queries|mutations/products` diretamente.

### 3. Tipos: `Product` muda de dono; `StockAlerts` ganha domínio próprio

`Product` é hoje **definido** em `domain/models/sale.ts` (ADR 0005) — efeito
colateral de `sale` ter sido o piloto, não porque `Product` pertence
conceitualmente a `sale`. Esta ADR inverte: `domain/models/products.ts`
passa a definir `Product`; `domain/models/sale.ts` importa de lá para montar
`SaleItemProduct = Pick<Product, 'name' | 'sku' | 'ean' | 'unit'>`.
`lib/types.ts` continua reexportando `Product` (agora a partir de
`@/domain/models/products`), mesmo shim de compatibilidade da ADR 0005/0006
para as rotas que ainda não migraram.

`StockAlerts` (hoje solto em `lib/types.ts`, usado só por `products.tsx`)
ganha `domain/models/stock.ts` — criado nesta ADR só para este tipo, sem
nenhum usecase de `stock` ainda (decisão explícita: adiantar a existência do
domínio `stock` mesmo sem `stock.tsx` migrado, diferente do desvio do item 1
que mantém `ICreateStockEntry` em `products` por enquanto).

### 4. Os dois gates de teste do ADR 0001 — escopo restrito do supertest

Diferente do `financial` (gate cobriu todas as regras apontadas pelo ADR
0001), o grilling desta rodada restringiu deliberadamente o supertest a duas
regras de maior risco de regressão silenciosa:

1. **BR-04** — produto com venda registrada não pode ser excluído (`DELETE
   /products/:id` deve falhar com `BadRequestException`; deve funcionar sem
   venda).
2. **Permissão dupla na entrada embutida** — `POST`/`PATCH /products` com
   `stockEntry` preenchido exige `PRODUCTS_WRITE` **e** `STOCK_WRITE`; só
   `PRODUCTS_WRITE` deve rejeitar com `ForbiddenException`. Já existe
   `products.controller.spec.ts` (mockado) para isso — o supertest valida o
   mesmo contrato contra o `TestingModule` real.

**Fora do gate, deliberadamente**: a transação de `applyStockEntry` (criar
`StockMovement`, incrementar `currentStock`, criar `ProductBatch` condicional)
e a normalização de EAN vazio → `null`. Cobertura para essas duas fica a
cargo dos testes unitários de handler (`data/handlers/products/*.test.ts`,
fase 3) — mesmo padrão dos 15 handlers do `financial`, não do supertest de
pré-migração.

Suíte E2E (Playwright) cobre os fluxos de UI de `products.tsx` **antes** de
qualquer reorganização de código: listagem + busca + filtros (Todos/Ativos/
Estoque baixo/Vencimento próximo) + paginação; criar produto sem entrada;
criar produto com entrada embutida; editar; desativar; excluir sem venda;
entrada de estoque avulsa via `StockEntryModal`. Segue a mesma divisão de
trabalho do `financial` (ADR 0006): E2E cobre integração UI↔API do caminho
feliz, não ramificação de regra de negócio. Por isso **não** repete aqui o
bloqueio de exclusão com venda (BR-04, já coberto pelo supertest) nem a
ocultação condicional da seção de entrada de estoque por permissão (também
coberta pelo supertest + o unit test já existente do controller) — replicar
esses casos via UI exigiria montar um segundo usuário/papel só para o teste,
custo que a suíte do `financial` também não pagou para casos equivalentes.

Nenhuma camada de `domain/data/infra/main` é conectada à `presentation` antes
das duas suítes estarem verdes contra o `products.tsx` atual.

### 5. Escopo de mudança: permite correções pontuais

Mesmo precedente da ADR 0002/0006: bug revelado durante a migração
(validação inconsistente, edge case quebrado) é corrigido no mesmo PR,
documentado nesta ADR — não vira item separado.

## Faseamento (mesmo espírito da ADR 0006 — verde a cada fatia)

1. Supertest das duas regras de negócio (`apps/api/test/products.e2e-spec.ts`).
2. Suíte E2E dos fluxos de UI contra `products.tsx` atual.
3. `domain/` (`models/products.ts`, `models/stock.ts`, `usecases/products/*`)
   + `data/handlers/products/*` (com teste unitário cada) + `infra` (endpoints)
   + `main/factories` — código novo, morto, não conectado. As duas suítes não
   deveriam mudar de resultado.
4. `presentation/flows/products/` consome as factories;
   `routes/_app/products.tsx` vira wrapper fino; `stock.tsx` troca o import
   de `StockEntryModal` para o novo caminho. As duas suítes rodam de novo —
   ponto real de risco.

## Consequências

- 7 usecases implementados (`domain/usecases/products`), cada um com handler
  + teste unitário (`data/handlers/products/*.test.ts`) — 9/9 testes verdes
  (`SearchProductCatalogHandler` tem 2 casos, os outros 6 handlers têm 1 cada).
  Suíte `apps/web` completa: 36/36 testes verdes (28 já existentes de
  `sale`/`financial` + 8 novos de `products`). Typecheck (`tsc --noEmit`)
  limpo.
- `products.tsx` (533 linhas, 1 arquivo) virou
  `presentation/flows/products/` — `ProductsPage` (Model/ViewModel/View, sem
  abas) + 2 componentes locais MVVM (`ProductModal`, `StockEntryModal`),
  cada um com barrel. `routes/_app/products.tsx` é hoje um wrapper de 3
  linhas. `routes/_app/stock.tsx` importa `StockEntryModal` do novo caminho
  (`presentation/flows/products/components/StockEntryModal`) — verificado
  manualmente no browser (busca de produto e listagem funcionando).
- `Product` passou a ser definido em `domain/models/products.ts`;
  `domain/models/sale.ts` reexporta de lá. `domain/models/stock.ts` criado
  só para `StockAlerts`. `lib/types.ts` reexporta `Product`, `Paginated` e
  `StockAlerts` dos novos domínios — `reports.tsx`/`stock.tsx` (fora de
  escopo) continuam importando de `lib/types.ts` sem nenhuma mudança.
- Estilização nova nasceu em Tailwind (não `style={{}}` inline), seguindo
  `arquiteture.md` — mesma correção pontual da ADR 0006.
- Suíte supertest (`apps/api/test/products.e2e-spec.ts`, 6 casos) cobre a
  permissão dupla na entrada embutida (4 casos, incl. guarda no update) e
  BR-04 (2 casos) — 6/6 verdes. Rodando junto com `financial.e2e-spec.ts`:
  20/20 verdes.
- Suíte E2E (`apps/e2e/tests/07-produtos.spec.ts`, 10 casos) cobre listagem/
  busca/filtros, cadastro (com e sem entrada embutida), edição, desativação,
  exclusão e entrada avulsa (incl. filtro de vencimento próximo) — 10/10
  verdes. Suíte completa do projeto (todos os arquivos, incl. PDV e
  financeiro): 44/44 verdes — sem regressão nos módulos já migrados.
- `reports.tsx`, `stock.tsx`, `settings.tsx` continuam fora de escopo, mas
  `stock.tsx` teve uma linha de import trocada (Decisão 1) e agora tem um
  caminho mais claro pra sua própria migração futura (o usecase
  `ICreateStockEntry` já existe, só precisa mudar de domínio).

## Alternativas rejeitadas

- **Ampliar escopo para incluir `stock.tsx` nesta rodada**: rejeitado —
  resolveria o acoplamento de uma vez, mas dobra o escopo da migração; o
  shim de import (mesmo padrão do `IGetSalesTotal`) resolve o acoplamento
  real (import direto de um arquivo de rota) sem esse custo.
- **Manter `Product` definido em `domain/models/sale.ts`**: rejeitado —
  perpetuaria a inversão conceitual (Product pertence a `products`, não a
  `sale`) só porque `sale` migrou primeiro.
- **`StockAlerts` em `domain/models/products.ts` em vez de criar `stock.ts`**:
  rejeitado pelo usuário — prefere adiantar a existência do domínio `stock`
  mesmo sem usecases, para não precisar mover o tipo de novo quando `stock.tsx`
  migrar.
- **Reaproveitar `ISearchProduct` do `sale` para a listagem do catálogo**:
  rejeitado — contratos incompatíveis (paginado vs. busca rápida);
  forçar o mesmo nome exigiria um único usecase servindo dois casos de uso
  com necessidades diferentes, ou renomear o do `sale` (fora de escopo,
  módulo já estabilizado).
- **Gate de supertest cobrindo também a transação de `applyStockEntry` e a
  normalização de EAN**: rejeitado pelo usuário nesta rodada — escopo restrito
  às duas regras com ramificação de negócio real (bloqueio de exclusão,
  permissão dupla); o resto fica coberto por teste unitário de handler na
  fase 3, não pelo gate de pré-migração.

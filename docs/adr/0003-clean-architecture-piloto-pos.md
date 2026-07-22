# 0003 — PDV como piloto da Clean Architecture (`arquiteture.md`)

- **Status:** Aceito
- **Data:** 2026-07-21
- **Supersede:** [0002](0002-escopo-refatoracao-pos.md) na parte estrutural (a decisão de escopo — só `pos.tsx`, `financial.tsx` fora — continua válida) **e corrige** a premissa de 0002 de que o foco do scanner não tinha cobertura E2E — ver Consequências.

## Contexto

Um documento de convenção portátil (`arquiteture.md`, na raiz do repo — **não commitado, não
versionado**, escrito originalmente para um projeto Next.js/axios e marcado para ser
adaptado por projeto) define uma Clean Architecture completa em camadas:

```
presentation → main → data → domain ← @shared
```

com vocabulário canônico de CRUD (`Search/GetOne/Create/Update/Delete{Entity}`),
`IHttpClient` como única fronteira com HTTP, e uma estrutura de pastas para
`presentation/` (componentes globais vs. locais por *flow*, `hooks/`, `flows/`, etc.).

Isso é ordens de grandeza maior do que o `features/pos/` leve fechado em
[0002](0002-escopo-refatoracao-pos.md). Decidiu-se (grilling de 2026-07-21) que
o PDV vira o piloto dessa arquitetura para o resto do app avaliar depois — não
uma adoção de convenção de repo ainda.

## Decisão

### 1. Alias sem colisão

`packages/shared` já existe como `@beverage/shared` (enums/permissions/schemas
compartilhados com `apps/api`). O `@shared/*` do documento (contratos
TypeScript puros de HTTP/cookie, locais a `apps/web`) usa outro nome:

```
"@contracts/*": ["src/@contracts/*"]
```

### 2. Inventário de chamadas de API do PDV → vocabulário de usecases

Levantamento completo de `pos.tsx` (11 chamadas de API, nenhuma delas é CRUD
puro exceto busca de produto/cliente):

| Chamada atual                            | Entidade    | Usecase                     | Handler                       | Factory                          |
| ----------------------------------------- | ----------- | ---------------------------- | ------------------------------ | --------------------------------- |
| `GET /products?search=&perPage=`          | Product     | `ISearchProduct`              | `SearchProductHandler`         | `makeSearchProduct`               |
| `POST /sales`                             | Sale        | `IOpenSale` *(custom)*        | `OpenSaleHandler`               | `makeOpenSale`                    |
| `POST /sales/:id/items`                   | SaleItem    | `IAddSaleItem` *(custom)*     | `AddSaleItemHandler`           | `makeAddSaleItem`                 |
| `PATCH /sales/:id/items/:itemId`          | SaleItem    | `IUpdateSaleItemQuantity` *(custom)* | `UpdateSaleItemQuantityHandler` | `makeUpdateSaleItemQuantity`      |
| `DELETE /sales/:id/items/:itemId`         | SaleItem    | `IDeleteSaleItem`             | `DeleteSaleItemHandler`        | `makeDeleteSaleItem`              |
| `PUT /sales/:id/discount`                 | Sale        | `ISetSaleDiscount` *(custom)* | `SetSaleDiscountHandler`       | `makeSetSaleDiscount`             |
| `POST /sales/:id/cancel`                  | Sale        | `ICancelSale` *(custom)*      | `CancelSaleHandler`            | `makeCancelSale`                  |
| `POST /sales/:id/complete`                | Sale        | `ICompleteSale` *(custom)*    | `CompleteSaleHandler`          | `makeCompleteSale`                |
| `GET /customers?search=`                  | Customer    | `ISearchCustomer`             | `SearchCustomerHandler`        | `makeSearchCustomer`              |
| `POST /customers`                         | Customer    | `ICreateCustomer`             | `CreateCustomerHandler`        | `makeCreateCustomer`              |

Nomes de usecase seguem o verbo da ação de negócio, não o verbo HTTP — ex.
`PATCH .../items/:id` é `UpdateSaleItemQuantity`, não `PatchSaleItem`, porque
só quantidade é editável por essa rota (não é um replace genérico do item).

**Desvio deliberado do padrão do documento**: `make{Verb}{Entity}(id)` no
documento assume página de entidade única (ex. editar 1 produto), onde o id é
fixado na criação da factory. No PDV, `saleId`/`itemId` variam por chamada
dentro da mesma tela (N itens, loop de remoção/quantidade) — as factories
`makeUpdateSaleItemQuantity`, `makeDeleteSaleItem` etc. **não** fixam o id;
ele continua sendo argumento de chamada (`handler.updateQuantity(saleId,
itemId, quantity)`), espelhando como as mutations do TanStack Query já
recebem esses parâmetros hoje.

### 3. Contrato de erro: throw, não `Result<T>`

O documento define `Result<T> = { statusError, response }` como parte do
contrato central, mas isso exigiria reescrever o fallback existente de 404 do
`addItem` (código sem match exato → abre modal de busca por nome) e todo o
padrão `onError` do React Query. **Decisão: manter throw + `axios.isAxiosError`**
dentro dos handlers — desvio consciente do documento, registrado aqui para não
ser confundido com omissão numa revisão futura.

### 4. Onde cada coisa mora

- **domain/models** (`apps/web/src/domain/models/pos.ts`) — **resolvido em
  [ADR 0005](0005-centraliza-tipos-em-domain.md)**, ler lá; texto abaixo é o
  registro histórico do que foi decidido aqui em 2026-07-21: **não migra** os
  tipos, ao contrário do que a intenção original desta seção previa —
  reexporta `Sale`, `SaleItem`, `Product`, `Customer` de `lib/types.ts` (mais
  `AddSaleItemInput` local — ver nota abaixo) e `UpdateSaleItemInput`,
  `DiscountInput`, `CompleteSaleInput` de `@beverage/shared`. **Terceiro
  desvio do documento** (achado pela revisão de código, não previsto
  originalmente): a tabela do documento diz que `domain/` "não importa nada";
  mover os tipos de verdade quebraria `financial.tsx`, `products.tsx`,
  `stock.tsx`, `reports.tsx` (fora de escopo, todos importam de `lib/types.ts`
  hoje) ou duplicaria a definição. Reexportar é o meio-termo: `domain/models`
  vira o único ponto de import para código do PDV, sem duplicar nem quebrar
  rotas fora de escopo. `AddSaleItemInput` é definido localmente (não
  reexportado) porque o tipo inferido de `addSaleItemSchema` tem `quantity`
  obrigatório (efeito do `.default(1)` do zod no tipo de saída), mas o PDV
  precisa que `quantity` seja opcional (o backend aplica o default).
- **domain/usecases**: as 10 interfaces da tabela acima.
- **infra/endpoints**: as URLs/métodos (`/sales`, `/sales/:id/items`, etc.).
  **Quarto desvio** (achado pela revisão de código): a tabela do documento
  lista `data/` como importando só `domain, @shared` — sem `infra`. Mas a
  própria seção "Fluxo completo de uma integração" do documento ordena
  `infra/endpoints` (passo 3) antes de `data/handlers` (passo 4), implicando
  que handlers consomem os endpoints. As duas frases do documento se
  contradizem para este caso; a implementação seguiu o fluxo (passo 3→4:
  `data/handlers/pos/*.ts` importa `posEndpoints` de `infra/endpoints/pos.ts`)
  em vez da tabela, porque mover as URLs para dentro de `data/` violaria a
  frase da própria tabela que diz que `infra` é responsável por "endpoints".
  Não há como satisfazer as duas afirmações do documento ao mesmo tempo;
  ambas as leituras foram consideradas e esta é a registrada.
- **infra**: adaptador `IHttpClient` sobre o axios existente
  (`lib/api.ts`) — os interceptors de auth/401 **continuam ali**, são
  exatamente o tipo de "adaptador" que o documento pede pra reimplementar por
  projeto, já existem, não precisam mudar de comportamento.
- **data/handlers**: implementam os usecases contra `IHttpClient`.
- **main/factories**: `makeXxx` juntando handler + `IHttpClient`; por cima,
  `main/factories/queries|mutations` envolvendo cada handler em
  `useQuery`/`useMutation`; por cima ainda, `main/factories/flows/usePosFlow`
  (ou nome equivalente) compondo todas as mutations/queries do PDV num único
  objeto entregue à `presentation`.
- **presentation/pos/**: o próprio componente, dividido em
  `components/` (locais: linha de item, stepper, modais), `hooks/` — e é
  **aqui**, não em `domain`, que moram as duas correções pontuais do ADR
  0002: o hook de debounce/flush de quantidade (`useQuantityDebounce`, por
  cima da mutation `updateSaleItemQuantity`) e o hook de foco do scanner
  (`useScanFocus`). Nenhum dos dois é lógica de negócio — são orquestração de
  UX sobre usecases que já existem.
- `routes/_app/pos.tsx` vira wrapper fino: `createFileRoute` + import do
  componente de `presentation/pos/` (ou de onde a convenção do time decidir
  montar a árvore — a estrutura interna de `presentation/pos/` segue o padrão
  de "flow" do documento, mas isso é detalhe de implementação, não desta ADR).

### 5. Faseamento (E2E verde a cada fatia)

1. `domain/` + `data/` + `infra/` + `main/factories` (handlers/queries/mutations)
   — código novo, morto, não conectado a `pos.tsx` ainda. Suíte E2E não deveria
   mudar de resultado (nada de produção foi tocado).
2. `main/factories/flows` — composição de tudo num hook/objeto único.
3. `presentation/pos/` consome o flow; `pos.tsx` vira wrapper. Suíte E2E
   completa roda no fim desta fatia — é o ponto real de risco.

## Consequências

- O raio de mudança do PDV cresce bastante em relação ao 0002 original (era
  "extrai 2 hooks", agora é "reescreve toda a árvore de chamadas de API do
  PDV em camadas"). A suíte E2E de 05-quantidade continua sendo o critério de
  aceite de comportamento.
- **Correção sobre o risco de foco "aceito" em 0002**: a implementação (fase
  3, 2026-07-21) mostrou que a premissa de que o foco do scanner "não tem
  cobertura E2E" estava **errada**. `apps/e2e/tests/support/pos.ts` já
  verifica foco em dois pontos usados por quase toda a suíte —
  `addKnownItems` (foco após cada item adicionado, linha ~102) e
  `ensureFreshSale` (foco após cancelar uma venda com itens de um teste
  anterior, linha ~78). A suíte completa (25 casos) pegou uma regressão real
  introduzida pela extração das mutations: `cancelSale` reabre a venda
  internamente, mas nada disparava `focusScan()` depois — no código
  original isso funcionava só porque `cancelSale.onSuccess` chamava
  `openSale.mutate()`, e o `onSuccess` (`focusScan()`) **embutido nessa
  mesma mutation** disparava mesmo sendo acionado indiretamente. Ao mover
  para mutations "puras" em `main/factories/mutations`, esse encadeamento
  implícito se perdeu. Corrigido chamando `focusScan()` explicitamente em
  `handleCancelSale` (`presentation/pos/PosPage.tsx`) depois de
  `await cancelSale()`. 7 de 25 testes falharam antes da correção, todos
  pela mesma causa; 25/25 passam depois. Fica só sem cobertura dedicada o
  caso de foco após *abrir a página pela primeira vez* vs. após
  *reabertura* — mas ambos os fluxos que davam problema (cancelar, adicionar
  item) estão cobertos.
- `financial.tsx`, `products.tsx`, `stock.tsx`, `reports.tsx` **não** adotam
  isso agora — só se o piloto do PDV validar o padrão.
- Quatro divergências do `arquiteture.md` ficam registradas nesta ADR (id
  dinâmico nas factories, throw em vez de `Result<T>`, `domain/models`
  reexportando em vez de migrar, `data/` importando `infra/endpoints`) para
  que uma atualização futura do documento — ou uma auditoria — não as trate
  como erro de quem implementou.

## Correções da revisão de código (Standards + Spec, antes do commit)

Duas revisões paralelas (eixo Standards contra `arquiteture.md`, eixo Spec
contra esta própria ADR) rodaram sobre o diff antes do commit. Achados reais,
corrigidos:

- **Direção de dependência invertida**: `presentation/pos/PosPage.tsx`
  importava `Screen` de `routes/_app.tsx` — o inverso do que a regra única do
  documento exige (`presentation → main`, nunca o caminho de volta). `Screen`
  é usado por 5 outras rotas fora de escopo (`financial`, `products`,
  `reports`, `settings`, `stock`), então a correção moveu a definição para
  `presentation/components/Screen.tsx` (componente global, por ser
  reaproveitado por mais de um flow) e `routes/_app.tsx` passou a
  reexportá-lo — as 5 rotas fora de escopo continuam importando de
  `'../_app'` sem alteração.
- **`&&` em renderização condicional de JSX**: o documento proíbe
  explicitamente (`"ternário ? ... : null, nunca &&"`). Todos os pontos em
  `PosPage.tsx` (herdados do `pos.tsx` original, que já usava esse padrão)
  foram convertidos para `cond ? <jsx> : null`.
- **`.then()`**: `presentation/pos/hooks/use-quantity-debounce.ts` usava
  `.then().catch().finally()`; convertido para `async/await` com
  `try/catch/finally`, como o documento exige.
- **Identificadores de 1 letra**: `(e) =>`, `(i) =>`, `(p) =>`, `(c) =>`,
  `(acc, i) =>`, `(n)` renomeados nos arquivos novos/tocados desta rodada
  (`PosPage.tsx` e os componentes de `presentation/pos/`). O restante do
  repositório (rotas fora de escopo) ainda usa esse padrão — não foi
  tocado, por estar fora do escopo desta ADR.

Nenhuma dessas correções mudou comportamento — a suíte E2E (25/25) e os
testes unitários dos handlers continuaram passando depois.

## Alternativas rejeitadas

- **`Result<T>` conforme documento**: rejeitado — reescreveria o fallback de
  404 do `addItem` e o padrão `onError` inteiro do React Query sem ganho
  claro para este piloto.
- **Id fixado na factory (`make{Verb}{Entity}(id)`)**: rejeitado para as
  operações de item — o PDV opera sobre N itens simultâneos na mesma tela, uma
  factory por item não faz sentido.
- **Adotar `@shared/*` como está, ignorando a colisão**: rejeitado — geraria
  import ambíguo com `@beverage/shared`, que já é usado por `apps/api`.

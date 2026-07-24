# 0006 — Financial como 2º módulo da Clean Architecture; promove `arquiteture.md` a convenção de repo

- **Status:** Aceito (em implementação)
- **Data:** 2026-07-23
- **Resolve:** o bloqueio registrado em [ADR 0001](0001-e2e-antes-da-refatoracao-do-front.md) ("bloqueia incluir `financial.tsx` em refatorações futuras até existir suíte supertest para essas regras")
- **Estende:** o piloto de Clean Architecture do [ADR 0003](0003-clean-architecture-piloto-pos.md) para um segundo módulo; aplica a mesma receita de migração de tipos do [ADR 0005](0005-centraliza-tipos-em-domain.md)

## Contexto

`financial.tsx` (850 linhas) é a maior rota fora do piloto do PDV — 5 abas
praticamente independentes (Visão geral, Caixa, Fiado, Contas a pagar, Fluxo &
lançamentos), 22 `useState`, 18 `useQuery`/`useMutation`, 12 componentes de
modal/tab embutidos no mesmo arquivo. Diferente do PDV, `financial.tsx` tinha
duas restrições que os ADRs anteriores já haviam registrado e que não podiam
ser ignoradas nesta rodada (grilling de 2026-07-23):

1. **ADR 0001** bloqueou explicitamente esta rota: nenhum teste automatizado
   cobre as regras de negócio de caixa/fiado/contas — nem E2E (por design
   original) nem supertest de API (nunca escrito). Confirmado agora por
   inspeção: `apps/api` só tem `products.controller.spec.ts`; não existe
   nenhum spec para `cash-register`, `financial`, `payables` ou `receivables`.
2. **ADR 0003/glossario.md** registravam Clean Architecture como piloto
   isolado do PDV, explicitamente "não é convenção de repo ainda" — adotar o
   padrão aqui exigia decidir se o repo estava pronto para tratá-lo como
   convenção ou se cada módulo decide de novo.

## Decisão

### 1. Recorte: um único flow `financial`, 5 sub-áreas locais

`financial.tsx` vira `presentation/flows/financial/`, mantendo a mesma tela
com abas (`SSeg`) que já existe hoje — não vira 5 flows separados. As 5 abas
(Overview, Register, Receivables, Payables, Entries) nascem como
`components/` locais do flow, cada uma pasta MVVM com barrel, seguindo
[componentes-mvvm.md](../componentes-mvvm.md). Motivo: as abas compartilham a
mesma rota, a mesma navegação (`SSeg`) e o mesmo contexto de tela — tratá-las
como flows independentes duplicaria esse esqueleto sem ganho real.

### 2. Clean Architecture completa — e promovida a convenção de repo

Financial adota a arquitetura completa (`domain/data/infra/main`) como fez o
PDV, não uma versão reduzida (MVVM sem as camadas). Com dois módulos
independentes adotando o mesmo padrão com sucesso, `arquiteture.md` deixa de
ser tratado como piloto isolado: **próximas migrações (`products`, `reports`,
`stock`, `settings`) devem seguir o mesmo padrão por padrão**, não decidir de
novo caso a caso. `docs/glossario.md` é atualizado para refletir isso (ver
Consequências).

Inventário completo de `financial.tsx` (14 chamadas de API usadas hoje pelas
5 abas — mesmo formato da tabela do ADR 0003):

| Chamada atual                       | Entidade         | Usecase                        | Handler                          | Factory                             |
| ------------------------------------ | ---------------- | -------------------------------- | ----------------------------------- | -------------------------------------- |
| `GET /financial/dashboard`           | FinancialDashboard | `IGetFinancialDashboard` *(custom)* | `GetFinancialDashboardHandler`      | `makeGetFinancialDashboard`         |
| `GET /reports/sales?from&to`         | Sale (agregado)  | `IGetSalesTotal` *(custom)*       | `GetSalesTotalHandler`              | `makeGetSalesTotal`                 |
| `GET /cash-register/current`         | CashRegister     | `IGetCurrentCashRegister` *(custom)* | `GetCurrentCashRegisterHandler`  | `makeGetCurrentCashRegister`        |
| `GET /cash-register/history`         | CashRegister     | `ISearchCashRegisterHistory` *(custom)* | `SearchCashRegisterHistoryHandler` | `makeSearchCashRegisterHistory`  |
| `POST /cash-register/open`           | CashRegister     | `IOpenCashRegister` *(custom)*    | `OpenCashRegisterHandler`           | `makeOpenCashRegister`              |
| `POST /cash-register/movements`      | CashMovement     | `ICreateCashMovement`             | `CreateCashMovementHandler`         | `makeCreateCashMovement`            |
| `POST /cash-register/close`          | CashRegister     | `ICloseCashRegister` *(custom)*   | `CloseCashRegisterHandler`          | `makeCloseCashRegister`             |
| `GET /receivables`                   | Receivable       | `ISearchReceivable`               | `SearchReceivableHandler`           | `makeSearchReceivable`              |
| `POST /receivables/:id/settle`       | Receivable       | `ISettleReceivable` *(custom)*    | `SettleReceivableHandler`           | `makeSettleReceivable`              |
| `GET /payables`                      | Payable          | `ISearchPayable`                  | `SearchPayableHandler`              | `makeSearchPayable`                 |
| `POST /payables`                     | Payable          | `ICreatePayable`                  | `CreatePayableHandler`              | `makeCreatePayable`                 |
| `POST /payables/:id/pay`             | Payable          | `IPayPayable` *(custom)*          | `PayPayableHandler`                 | `makePayPayable`                    |
| `GET /financial/cash-flow`           | CashMovement (agregado) | `IGetCashFlow` *(custom)*  | `GetCashFlowHandler`                | `makeGetCashFlow`                   |
| `POST /financial/entries`            | CashMovement     | `ICreateFinancialEntry`           | `CreateFinancialEntryHandler`       | `makeCreateFinancialEntry`          |
| `GET /financial/categories`          | FinancialCategory | `ISearchFinancialCategory`       | `SearchFinancialCategoryHandler`    | `makeSearchFinancialCategory`       |

Nomes seguem o verbo de negócio, não o HTTP — mesma regra do ADR 0003 (ex.
`POST .../pay` é `PayPayable`, não `PostPayable`). `POST /financial/categories`
(criar categoria) existe na API mas **não tem chamada em `financial.tsx`
hoje** — fica de fora do escopo desta migração, mesma lógica do ADR 0003 de
só mapear o que existe de verdade na tela.

**Desvio deliberado**: `IGetSalesTotal` busca dado que pertence
conceitualmente ao domínio de `reports` (fora de escopo, `reports.tsx` não
migrado), não ao de `financial`. Fica em `domain/usecases/financial` mesmo
assim — criar um domínio `reports` inteiro só para este usecase, quando o
resto de `reports.tsx` continua como está, adiantaria escopo sem necessidade.
Quando `reports.tsx` for migrado, este usecase deve se mover para lá.

### 3. Tipos: mesma receita do ADR 0005

`domain/models/financial.ts` passa a **definir** `CashMovement`,
`CashRegister`, `Receivable`, `Payable`, `FinancialCategory`, `Dashboard`.
`lib/types.ts` inverte a direção e reexporta esses 6 tipos de
`@/domain/models/financial` — mesmo shim de compatibilidade usado para
`Product`/`Sale`/`SaleItem`/`Customer`, para não quebrar rotas fora de escopo
que ainda possam referenciá-los indiretamente.

### 4. Os dois gates de teste do ADR 0001

Diferente do PDV (que já tinha suíte E2E antes do piloto de CA), financial
tinha **dois** gates em aberto, tratados como pré-requisito, nesta ordem:

1. **Supertest de API** (`apps/api`) cobrindo as regras de negócio que o ADR
   0001 apontou como motivo do bloqueio: diferença no fechamento de caixa
   (BR-06), liquidação de fiado, pagamento de contas a pagar. Isso resolve o
   bloqueio do ADR 0001 na origem — regra de negócio passa a ser validada no
   nível mais barato (service/controller), não no front.
2. **Suíte E2E (Playwright)** cobrindo os 5 fluxos de UI de `financial.tsx`
   **antes** de qualquer reorganização de código — mesmo precedente do ADR
   0001 para o PDV. Seletores semânticos, local, sob demanda, sem CI.

Nenhuma camada de `domain/data/infra/main` é conectada à `presentation` antes
das duas suítes estarem verdes contra o `financial.tsx` atual.

### 5. Escopo de mudança: permite correções pontuais

Ao contrário da definição original "puramente estrutural" do ADR 0001, esta
rodada segue o precedente do ADR 0002/0003 para o PDV: se a migração revelar
bugs (validação inconsistente, edge case quebrado), a correção entra no mesmo
PR, documentada nesta ADR — não vira um item separado.

## Faseamento (mesmo espírito do ADR 0003 — verde a cada fatia)

1. Supertest das regras de negócio (`apps/api`) — trava o comportamento do
   backend antes de tocar em qualquer coisa.
2. Suíte E2E dos 5 fluxos de UI contra `financial.tsx` atual — trava o
   comportamento observável do front.
3. `domain/` + `data/` + `infra/` + `main/factories` — código novo, morto,
   não conectado ainda. As duas suítes não deveriam mudar de resultado.
4. `main/factories/flows` — **não criado**: diferente do PDV (um único
   agregado `Sale` percorrendo toda a tela), as 5 sub-áreas do financial não
   compartilham estado entre si. Cada `.model.ts` de tab consome
   `main/factories/queries|mutations/financial` diretamente (mesmo padrão do
   `CustomerModal` em [componentes-mvvm.md](../componentes-mvvm.md)) — um
   hook de flow unificado só agruparia chamadas não relacionadas, sem reduzir
   nenhum acoplamento real.
5. `presentation/flows/financial/` consome o flow; `routes/_app/financial.tsx`
   vira wrapper fino. As duas suítes rodam de novo — ponto real de risco.

## Consequências

- 15 usecases implementados (`domain/usecases/financial`), cada um com
  handler + teste unitário (`data/handlers/financial/*.test.ts`) — 15/15
  verdes, mais os 13 já existentes do Sale (28/28 no total da suíte
  `apps/web`). Typecheck (`tsc --noEmit`) limpo.
- `financial.tsx` (850 linhas, 1 arquivo) virou
  `presentation/flows/financial/` — `FinancialPage` + 5 componentes de tab
  (Overview/Register/Receivables/Payables/Entries), cada um pasta MVVM com
  barrel, mais 4 modais locais (`MoneyPromptModal`, `CashMoveModal`,
  `CloseRegisterModal` em `RegisterTab/components/`; `PayableModal` em
  `PayablesTab/components/`; `ManualEntryModal` em `EntriesTab/components/`).
  `routes/_app/financial.tsx` é hoje um wrapper de 3 linhas.
- Estilização convertida de `style={{}}` inline (padrão do arquivo original)
  para classes Tailwind, conforme `arquiteture.md` — correção pontual (item 5
  da Decisão), não prevista no inventário original mas necessária para o
  código novo não nascer já violando a convenção que esta própria ADR adota.
- Suíte supertest (`apps/api/test/financial.e2e-spec.ts`, 14 casos) cobre
  BR-06 (diferença de fechamento de caixa), liquidação de fiado (incl. guarda
  de "sem caixa aberto" e "já recebido") e pagamento de contas (incl. guarda
  de "já paga") — 14/14 verdes. Resolve o bloqueio do ADR 0001 na origem.
- Suíte E2E (`apps/e2e/tests/06-financeiro.spec.ts`, 10 casos) cobre as 5
  abas via seletores semânticos + `data-testid` pontual (`cash-move-*`,
  `payable-*`, `manual-entry-*`) onde o markup original não tinha papel
  acessível estável — mesmo critério do ADR 0001. `prisma/seed.ts` ganhou um
  fiado em aberto determinístico (`seed-customer-fiado`, R$42) para não violar
  a convenção "suíte não cria dado em código" (`support/seed-data.ts`) já que
  não há endpoint de criação direta de `Receivable`.
- **Achado do ambiente, não do código**: `prisma migrate reset --force`
  passou a ser bloqueado pelo próprio Prisma quando detecta que quem invoca é
  um agente de IA — pedirá consentimento explícito do usuário a cada sessão
  nova (`PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION`). Documentado aqui
  porque afeta tanto a suíte supertest nova quanto a suíte E2E existente do
  PDV, não só esta ADR.
- `products.tsx`, `reports.tsx`, `stock.tsx`, `settings.tsx` continuam fora de
  escopo desta ADR, mas passam a ter um caminho obrigatório (não mais
  opcional) para quando forem migrados, dado o item 2 da Decisão.

## Alternativas rejeitadas

- **5 flows separados por aba**: rejeitado — abas compartilham rota e
  navegação; separar infla a estrutura sem separar de fato nenhum
  comportamento (ver Decisão 1).
- **MVVM sem Clean Architecture completa**: rejeitado — deixaria financial em
  um padrão intermediário diferente do PDV, e não resolveria o débito de
  tipos em `lib/types.ts` que o ADR 0005 já apontou como pendente para os
  módulos fora do Sale.
- **Pular o supertest e confiar só no E2E**: rejeitado — E2E não é o lugar
  barato pra travar regra de negócio (mesmo argumento do ADR 0001 original);
  além disso, o bloqueio do ADR 0001 nomeia supertest especificamente, não
  E2E.
- **Manter CA como "caso a caso" em vez de promover a convenção**: rejeitado
  — dois módulos independentes validando o mesmo padrão é o critério que o
  próprio ADR 0003 definiu para essa promoção ("piloto... para o resto do app
  avaliar depois").

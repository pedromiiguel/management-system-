# 0005 — Centraliza os tipos do Sale em `domain/models`; extrai objetos inline

- **Status:** Aceito
- **Data:** 2026-07-22
- **Resolve:** o 3º desvio registrado no [ADR 0003](0003-clean-architecture-piloto-pos.md#4-onde-cada-coisa-mora) (`domain/models` reexportando de `lib/types.ts` em vez de definir os tipos)

## Contexto

O usuário apontou dois problemas no `domain/models/sale.ts` resultante do
ADR 0003:

1. `domain/models/sale.ts` reexportava `Product`, `Sale`, `SaleItem`,
   `Customer` de `@/lib/types` — a camada de domínio (que, pela regra única
   do documento, "não importa nada") dependia de fora de si mesma. Isso já
   tinha sido identificado na revisão de código como divergência consciente
   (ADR 0003, "3º desvio"), mas ficou registrado como aceito, não corrigido.
2. Campos com objeto inline dentro dos tipos (`Sale.customer: { id, name } |
   null`, `Sale.operator: { id, name }`, `SaleItem.product: { name, sku,
   ean, unit }`) deveriam virar tipos nomeados em vez de shapes anônimos
   repetidos.

## Decisão

`domain/models/sale.ts` agora **define** `Product`, `Customer`, `Sale`,
`SaleItem` — são a fonte da verdade. `lib/types.ts` inverte a direção: em
vez de definir esses quatro tipos, reexporta de `@/domain/models/sale`.
`financial.tsx`, `products.tsx`, `reports.tsx`, `stock.tsx` (fora de escopo)
continuam importando de `lib/types.ts` sem nenhuma mudança — o reexport ali
é só um shim de compatibilidade até (se) essas rotas migrarem também.

Os três objetos inline viraram tipos nomeados, reaproveitando o tipo que já
tem o shape em vez de repetir os campos (evita duplicação e destrava se o
shape mudar num lugar só):

```ts
export type SaleItemProduct = Pick<Product, 'name' | 'sku' | 'ean' | 'unit'>;
export type SaleCustomer = Pick<Customer, 'id' | 'name'> | null;
export type SaleOperator = { id: string; name: string };
```

`SaleOperator` não reaproveita `Pick<UserRow, ...>` porque `UserRow` é um
tipo de `financial`/`settings` (fora de escopo) com campos diferentes
(`login`, `roleId`, `role`) — criar essa dependência cruzaria escopo por
nenhum ganho real.

**Escopo desta ADR**: só os 4 tipos do Sale. `lib/types.ts` ainda tem o
mesmo padrão de objeto inline em tipos fora de escopo (`CashMovement.category`,
`Payable.category`, `CashRegister.operator`, `Receivable.customer`,
`Receivable.sale`, etc.) — não foram tocados. Se o padrão for pra aplicar
lá também, é uma mudança em `financial.tsx`/`settings.tsx`, fora do que este
ADR e o piloto do PDV cobrem.

## Consequências

- Nenhuma mudança de comportamento — só reorganização de tipos. Typecheck,
  13 testes unitários e as 25 suítes E2E continuam passando sem alteração.
- O 3º desvio do ADR 0003 está resolvido; o texto original do ADR 0003 não
  foi reescrito (seria reescrever histórico) — esta ADR é quem registra a
  correção.
- `Paginated<T>` e as outras interfaces de `lib/types.ts` (`CashMovement`,
  `CashRegister`, `Receivable`, `Payable`, `FinancialCategory`, `Dashboard`,
  `StockAlerts`, `AppSettings`, `Role`, `UserRow`) continuam onde estavam —
  não fazem parte do Sale, não têm por que migrar pra `domain/` agora.

## Alternativas rejeitadas

- **Migrar todos os tipos de `lib/types.ts` para `domain/models`, não só os
  4 do Sale**: rejeitado — expandiria o escopo desta mudança para
  `financial.tsx`/`products.tsx`/`stock.tsx`/`reports.tsx`/`settings.tsx`,
  todos explicitamente fora do piloto (ADR 0002/0003).
- **Duplicar as definições em `domain/models` e `lib/types.ts`**: rejeitado
  — duas fontes da verdade para o mesmo tipo divergem silenciosamente com o
  tempo.
- **Deletar `Product`/`Sale`/`SaleItem`/`Customer` de `lib/types.ts` e
  atualizar os imports das 5 rotas fora de escopo**: mais "correto" a
  longo prazo, mas expande o raio da mudança pra arquivos que este piloto
  decidiu não tocar; o reexport resolve o problema real (domínio importando
  de fora) sem esse custo.

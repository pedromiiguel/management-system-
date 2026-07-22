# 0004 — Renomeia o flow `pos` para `sale`

- **Status:** Aceito
- **Data:** 2026-07-22

## Contexto

O piloto de Clean Architecture ([ADR 0003](0003-clean-architecture-piloto-pos.md))
nomeou todas as pastas/arquivos novos como `pos` (`domain/usecases/pos/`,
`presentation/pos/`, `PosPage`, `usePosFlow`, etc.) — herdando o nome da
rota que já existia antes desta refatoração (`routes/_app/pos.tsx`, servindo
`/pos`). "pos" vem de *point of sale*; nos ADRs e comentários em português o
termo usado é "PDV".

Ao revisar o resultado, ficou claro que o nome não era o melhor: o
vocabulário de domínio já dominante em todo o código — inclusive nos
próprios usecases do ADR 0003 — é `Sale`/`SaleItem` (`IOpenSale`,
`IAddSaleItem`, `ICompleteSale`...). Nenhum usecase se chama `IOpenPos`. O
nome do flow divergia do nome do agregado que ele manipula.

## Decisão

Renomear `pos` → `sale` em tudo: pastas, arquivos, identificadores, rota e
URL. Não ficou restrito só às pastas internas — a rota mudou de `/pos` para
`/sale`.

| Antes | Depois |
| --- | --- |
| `domain/usecases/pos/` | `domain/usecases/sale/` |
| `domain/models/pos.ts` | `domain/models/sale.ts` |
| `data/handlers/pos/` | `data/handlers/sale/` |
| `infra/endpoints/pos.ts` (`posEndpoints`) | `infra/endpoints/sale.ts` (`saleEndpoints`) |
| `main/factories/{handlers,mutations,queries}/pos.ts` | `.../sale.ts` |
| `main/factories/flows/use-pos-flow.ts` (`usePosFlow`) | `use-sale-flow.ts` (`useSaleFlow`) |
| `presentation/pos/` (`PosPage`) | `presentation/sale/` (`SalePage`) |
| `routes/_app/pos.tsx`, rota `/pos` | `routes/_app/sale.tsx`, rota `/sale` |
| `apps/e2e/tests/support/pos.ts` (`openPos`) | `support/sale.ts` (`openSalePage`) |
| `data-testid="pos-total"` (e os outros 4: `pos-change`, `pos-discount-value`, `pos-service-fee-value`, `pos-selected-customer`) | `data-testid="sale-total"` etc. |

`openPos` virou `openSalePage`, não `openSale` — o backend já tem o conceito
de "abrir uma venda" (`POST /sales`, usecase `IOpenSale`); um helper de teste
que só navega até a tela e confere o estado inicial não deveria se chamar
igual à ação de domínio.

O ícone do menu lateral (`icon: 'pdv'`) e o rótulo visível ("PDV — Caixa")
**não** mudaram — são vocabulário de produto/UI em português, não o nome
técnico do flow. Só o identificador de código e a URL mudaram.

## Consequências

- `financial.tsx`, `products.tsx`, etc. não referenciam nada disso — a
  troca de URL (`/pos` → `/sale`) não quebra outras rotas, só os pontos que já
  apontavam pra `/pos` (nav, redirect pós-login, redirect da raiz, guarda de
  autenticação e specs E2E) — todos atualizados nesta mesma mudança.
- [ADR 0002](0002-escopo-refatoracao-pos.md) e [ADR 0003](0003-clean-architecture-piloto-pos.md)
  continuam mencionando `pos.tsx`/`PosPage`/`usePosFlow`/`support/pos.ts` —
  isso é histórico correto (era esse o nome quando aquelas decisões foram
  tomadas e implementadas) e não foi reescrito. Quem ler aqueles ADRs depois
  desta ADR deve traduzir mentalmente `pos` → `sale` para mapear pro código
  atual. `docs/glossario.md` foi atualizado para refletir o nome atual.
- `routeTree.gen.ts` é gerado automaticamente pelo plugin do TanStack Router
  (`npx vite build` ou `vite dev`) — não foi editado à mão, regenera na
  próxima build/dev.

## Alternativas rejeitadas

- **`checkout`**: cobre só a etapa final (pagamento), não bipagem/ajuste de
  quantidade — o flow é maior que "checkout".
- **`caixa`/`cashier`/`register`**: introduziriam mais um termo novo em vez
  de reaproveitar o vocabulário (`Sale`) já onipresente no código.
- **Só renomear as pastas internas, manter a rota `/pos`**: rejeitado —
  deixaria o nome do flow (`sale`) divergente do nome da rota/URL (`pos`),
  o mesmo tipo de inconsistência que motivou esta ADR.

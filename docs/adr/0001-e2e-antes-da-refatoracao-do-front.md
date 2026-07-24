# 0001 — Suíte E2E do PDV antes de refatorar apps/web

- **Status:** Aceito (implementado — tickets 01 a 05, PRs #1–#5)
- **Data:** 2026-07-20

## Contexto

`apps/web` (React 19 + TanStack Router/Query) tinha cobertura de teste quase
nula — um único spec, na API, para `products.controller`. A refatoração
estrutural planejada para os arquivos grandes de `routes/_app` (PDV, financeiro)
não podia começar sem uma rede de segurança, porque parte do comportamento do
PDV é frágil e implícito:

- debounce de quantidade de 400ms guardado em `useRef` (não em estado), com
  `flushPendingQuantity()` exigido manualmente em cada caminho de saída
  (finalizar, remover item, cancelar venda, aplicar desconto);
- retorno de foco ao campo do scanner via `requestAnimationFrame`, chamado a
  partir de múltiplos callbacks espalhados pelo componente.

Nada disso é observável por teste de API — só existe no DOM, sob tempo.

## Decisão

Construir uma suíte E2E com Playwright **restrita ao PDV** (~10 casos), local
e sob demanda, sem CI, **antes** de tocar na estrutura do arquivo. Regra de
negócio (totais, taxa de serviço, estoque, fiado) fica deliberadamente fora do
Playwright — é mais barata de validar via teste de API (supertest) e a
refatoração estrutural do front não deveria alterá-la.

Seletores de teste são semânticos (`getByRole`/`getByText`), com
`data-testid` só onde falta um papel estável, porque o markup vai mudar com a
refatoração.

## Consequências

- A suíte (`apps/e2e/tests/01-smoke.spec.ts` a `05-quantidade.spec.ts`) hoje
  cobre abertura de venda, busca por código/nome, guarda de autenticação, e o
  padrão de debounce+flush nos quatro caminhos de saída conhecidos.
- **Ela não cobre foco do scanner** — nenhum spec verifica que o input
  recupera foco após uma mutação. Isso ficou como lacuna consciente; ver
  [0002](0002-escopo-refatoracao-pos.md) para a decisão de aceitar esse risco
  na próxima rodada.
- Regra de negócio de `financial.tsx` (taxa de serviço, fiado) permanece sem
  nenhum teste automatizado — nem E2E (por design) nem API (nunca escrito).
  Isso bloqueia incluir `financial.tsx` em refatorações futuras até existir
  suíte supertest para essas regras. **Endereçado em
  [ADR 0006](0006-clean-architecture-financial-promove-convencao.md)**, que
  trata a suíte supertest como pré-requisito antes de tocar no front.

## Alternativas rejeitadas

- **Cobrir tudo com E2E**, incluindo regra de negócio: rejeitado por custo —
  Playwright é mais lento e mais frágil para validar cálculo do que um teste
  de API direto no service/controller.
- **Refatorar primeiro, testar depois**: rejeitado porque o valor do teste é
  travar o comportamento atual antes de reorganizar o código, não depois.

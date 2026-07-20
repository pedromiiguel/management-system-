# ADR 0001 — Suíte E2E com Playwright como rede de segurança para a refatoração do front

- **Status:** Aceita
- **Data:** 2026-07-20
- **Contexto do repositório:** `apps/web` (React 19 + TanStack Router/Query + Tailwind 4),
  `apps/api` (NestJS + Prisma)

## Contexto

O front end (`apps/web`, ~4.400 linhas em 6 rotas) será refatorado. Os arquivos maiores
são `routes/_app/pos.tsx` (904 linhas), `routes/_app/financial.tsx` (850) e
`routes/_app/products.tsx` (533). A refatoração é **exclusivamente estrutural**: quebrar
arquivos grandes em componentes, extrair hooks e organizar pastas. A UI vista pelo usuário
final permanece idêntica.

Hoje o projeto tem cobertura de teste praticamente nula: existe um único
`products.controller.spec.ts` na API, e o script `test:e2e` aponta para `apps/api/test/`,
que não existe. Não há rede de segurança em nenhuma camada.

O risco concreto da refatoração não está no caminho feliz — está no estado frágil e
implícito do PDV:

- Estado otimista de quantidade com debounce de 400ms mais um `useRef` que preserva o
  valor pendente entre cliques mais rápidos que o re-render (`pos.tsx:148-192`).
- `flushPendingQuantity()` precisa ser chamado antes de finalizar, remover item, cancelar
  e aplicar desconto — quatro caminhos, e esquecer um deles fecha a venda com quantidade
  errada (`pos.tsx:194-203`).
- `focusScan()` via `requestAnimationFrame` disparado a partir de seis callbacks
  diferentes; o operador de balcão não usa mouse.
- Atalhos F2/F4/F5–F8/F10 (`pos.tsx:339-345`), atalho de quantidade `3*<código>`, e
  fallback de código não encontrado (404 → abre modal de busca, `pos.tsx:122-128`).

Extrair uma tabela de itens para um componente filho quebra qualquer um desses de forma
silenciosa. Nenhum teste de API observa isso.

## Decisão

**1. O alvo da suíte E2E é o comportamento exclusivo de front, não a regra de negócio.**
Regra de negócio (cálculo de total, taxa de serviço, baixa de estoque, geração de
recebível) é mais barata e mais rápida de validar com teste de API/supertest, e a
refatoração do front não a toca. Playwright cobre o que só existe no navegador.

**2. Escopo: apenas o PDV**, ~8–10 casos. Financeiro, Produtos e Estoque ficam de fora
desta suíte. Justificativa: cobrir as três áreas custaria 2–3 dias para uma suíte que se
pretende usar duas vezes; concentrar no PDV entrega a maior parte da proteção pelo menor
custo, porque é onde mora todo o estado frágil.

**3. Seletores por semântica acessível** (`getByRole`, `getByText`), com `data-testid`
apenas onde não existe papel ou texto estável (linhas de item, campos de total). Isso
torna os testes resistentes à mudança de markup — que é exatamente o que a refatoração vai
produzir.

**4. Um commit de instrumentação vem antes dos testes.** Hoje `pos.tsx` tem dois
`aria-label` e zero `data-testid`. Adicionar nomes acessíveis e testids é pré-requisito,
feito em commit isolado e revisável, antes de escrever qualquer teste.

**5. Isolamento de estado: reset de schema + seed determinístico por arquivo de teste**,
execução serial (`--workers=1`). O domínio é acumulativo (estoque, caixa, fiado), e uma
venda de teste altera o estado da próxima. Aceita-se a lentidão em troca de não caçar
flakiness.

**6. Execução local, sob demanda.** Sem CI nesta etapa. Se a suíte sobreviver útil à
refatoração, portá-la para CI vira uma decisão separada.

## Escopo dos testes

Casos priorizados, do mais valioso para o menos:

1. Clicar `+` três vezes em sequência rápida e finalizar imediatamente → venda fecha com
   quantidade 4. (Cobre debounce + `flushPendingQuantity` no caminho de finalizar.)
2. Alterar quantidade e então remover item / cancelar venda / aplicar desconto → os outros
   três caminhos de flush.
3. Foco retorna ao campo de código após adicionar item, remover item e fechar modal.
4. Atalho `3*<ean>` adiciona 3 unidades.
5. Código inexistente abre o modal de busca preenchido, sem mensagem de erro.
6. Venda completa em dinheiro com cálculo de troco.
7. Venda completa em fiado exigindo cliente.
8. Atalhos de teclado F2/F4/F5–F8/F10 acionam a ação correspondente.
9. Guarda de rota: acesso sem sessão redireciona ao login; após login vai para a rota
   pedida.
10. Cupom exibe os itens e o total da venda concluída.

## Consequências

**Positivas**

- A refatoração passa a ter um critério objetivo de sucesso, em vez de "parece que está
  funcionando".
- O commit de instrumentação melhora a acessibilidade real da aplicação como efeito
  colateral.
- O escopo enxuto reduz a chance de a suíte ser abandonada por custo de manutenção.

**Negativas e riscos aceitos**

- Financeiro, Produtos e Estoque ficam sem cobertura E2E. Uma regressão de front nessas
  telas passa despercebida. Mitigação parcial: são telas com menos estado implícito que o
  PDV.
- Execução serial com reset de banco torna a suíte lenta (estimado alguns minutos). Aceito
  porque roda sob demanda.
- Uma quebra do agrupamento do debounce (3 requisições em vez de 1, com mesmo resultado
  final) **não** será detectada, já que as asserções são sobre a UI e não sobre a rede.
  Classificado como regressão de performance, fora do escopo.
- Sem CI, a suíte tende a apodrecer depois da refatoração.

## Alternativas consideradas

**Testes de API primeiro (supertest), sem E2E.** Mais baratos e rápidos, e o `test:e2e` da
API já está previsto no `package.json`. Rejeitado como substituto porque não observa foco,
atalhos, debounce nem estado otimista — precisamente o que a refatoração ameaça. Continua
válido como camada complementar, e é por isso que Financeiro/Produtos/Estoque saíram do
escopo do Playwright.

**Snapshot visual (screenshots comparados).** Atraente porque a UI deveria ficar idêntica.
Rejeitado por gerar falso-positivo com variação de fonte e renderização, virando ruído
rápido.

**Banco descartável por worker do Playwright.** Daria isolamento total com paralelismo
(o `docker-compose.yml` já existe no repo). Rejeitado como sobre-engenharia para uma suíte
local de ~10 casos.

**Asserções sobre requisições da API além da UI.** Pegariam o bug de debounce com precisão
cirúrgica e seriam imunes a markup. Rejeitado porque as falhas de correção relevantes já
se manifestam na UI (a venda fecha com quantidade errada, visível no cupom), e o ganho
restante cobre apenas performance.

## Referências

- Vocabulário do domínio: [glossário](../glossario.md)
- Estado frágil do PDV: `apps/web/src/routes/_app/pos.tsx`
- Fonte da verdade de cálculo: API (`apps/api`), o front apenas pré-visualiza

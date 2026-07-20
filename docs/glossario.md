# Glossário do domínio

Vocabulário ubíquo do sistema de gestão da distribuidora. Serve como referência para
nomear testes, componentes e conversas. Termos em português são os que aparecem para o
usuário; o identificador em `MAIÚSCULA` é o valor usado em código
(`packages/shared/src/enums.ts`).

## Venda e PDV

**Venda (`Sale`)** — Uma transação de balcão. Nasce aberta quando o operador entra na
tela do PDV (o front dispara `POST /sales` no mount) e termina concluída ou cancelada.
Estados: `IN_PROGRESS`, `COMPLETED`, `CANCELLED`.

**Venda em andamento** — Venda `IN_PROGRESS`. Só existe uma por operador; ao abrir o PDV
o sistema retoma a existente em vez de criar outra. Consequência para testes: toda visita
à tela do PDV deixa uma venda aberta no banco, mesmo que o teste não venda nada.

**Item de venda (`SaleItem`)** — Produto + quantidade dentro de uma venda. Guarda
`unitPrice` e `unitCost` congelados no momento da inclusão, para que mudança de preço
posterior não altere vendas passadas.

**Operador** — Usuário autenticado que executa a venda. Fica registrado na venda.

**Scanner / campo de código** — O input principal do PDV. Aceita EAN, SKU ou id do
produto. Recebe foco de volta automaticamente após quase toda ação (`focusScan()`), o que
é comportamento crítico de balcão: o operador não usa mouse.

**Atalho de quantidade** — Sintaxe do balcão para vender múltiplos sem bipar N vezes:
`3*7891234567890` ou `3x7891234567890` adiciona 3 unidades daquele código.

**Fallback de busca** — Quando o código digitado não casa com nenhum EAN/SKU/id, a API
responde 404 e o front abre o modal de busca por nome com o texto já preenchido, em vez
de mostrar erro.

**Subtotal** — Soma de `unitPrice × quantity` dos itens, antes de desconto e taxa.

**Desconto** — Aplicado à venda inteira (não por item), em valor (`AMOUNT`) ou percentual
(`PERCENT`).

**Taxa de serviço** — Acréscimo opcional de 10% (`SERVICE_FEE_RATE`) calculado sobre o
subtotal **pré-desconto**. O front exibe uma prévia calculada localmente; o backend
recalcula com Decimal na conclusão e é a fonte da verdade.

**Total** — Valor a cobrar: subtotal, menos desconto, mais taxa de serviço.

**Com nota / sem nota (`withInvoice`)** — Marca se a venda emite documento fiscal.
Vendas sem nota geram cupom não-fiscal.

**Cupom** — Comprovante impresso montado no front (`lib/cupom.ts`) a partir da venda
concluída retornada pela API.

**Troco (`change`)** — Só existe em pagamento em dinheiro: valor recebido menos total.

## Meios de pagamento (`PaymentMethod`)

| Código   | Rótulo             | Observação                                       |
| -------- | ------------------ | ------------------------------------------------ |
| `CASH`   | Dinheiro           | Exige valor recebido; calcula troco               |
| `PIX`    | PIX                |                                                   |
| `CARD`   | Cartão             |                                                   |
| `CREDIT` | Fiado (a prazo)    | Exige cliente; gera uma conta a receber           |

Quais meios ficam habilitados é configurável (`ENABLED_PAYMENT_METHODS`).

## Estoque

**Estoque atual (`currentStock`)** — Saldo do produto. Reduzido na conclusão da venda,
não na inclusão do item.

**Estoque mínimo (`minimumStock`)** — Limiar que dispara o alerta de estoque baixo.

**Política de estoque (`StockPolicy`)** — Configuração que define o comportamento ao
vender sem saldo: `BLOCK` impede a venda, `WARN` apenas exibe aviso e permite seguir.
Isso muda o resultado de um mesmo teste — precisa estar fixada no seed.

**Movimento de estoque** — Registro de entrada ou saída (`ENTRY`/`EXIT`) com origem
(`PURCHASE`, `SALE`, `ADJUSTMENT`, `CANCELLATION`).

**Lote e validade** — Entradas podem ter lote e data de validade; produtos vencendo
dentro de `EXPIRY_ALERT_DAYS` aparecem nos alertas.

## Financeiro

**Caixa (`CashRegister`)** — Sessão de caixa com abertura e fechamento. Estados `OPEN` e
`CLOSED`. Vendas em dinheiro só fazem sentido com caixa aberto.

**Saldo de abertura / esperado / contado** — Valor inicial, valor que o sistema calcula
que deveria haver, e valor que o operador realmente contou. A diferença entre os dois
últimos é a quebra de caixa.

**Sangria (`PULL`)** — Retirada de dinheiro do caixa durante o turno.

**Suprimento (`FLOAT`)** — Aporte de dinheiro no caixa (troco inicial, reforço).

**Entrada / Saída (`INFLOW`/`OUTFLOW`)** — Movimentos financeiros genéricos, classificados
por categoria financeira.

**Fiado** — Venda a prazo (`CREDIT`). Gera uma conta a receber vinculada ao cliente.

**Conta a receber (`Receivable`)** — Dívida de um cliente. `OPEN` até ser recebida.

**Saldo em aberto do cliente (`openBalance`)** — Soma dos recebíveis `OPEN` daquele
cliente.

**Conta a pagar (`Payable`)** — Obrigação com fornecedor ou despesa. `OPEN` até ser paga.

**Categoria financeira** — Classificação de receita (`INCOME`) ou despesa (`EXPENSE`).
Algumas são de sistema e não podem ser removidas (Vendas, Recebimento de fiado).

**CMV / `cogs`** — Custo das mercadorias vendidas, calculado a partir do `unitCost`
congelado nos itens. Base do cálculo de lucro nos relatórios.

## Acesso

**Papel (`Role`)** — Conjunto nomeado de permissões. "Administrador" é papel de sistema e
recebe todas.

**Permissão** — String que libera uma capacidade. Controla tanto o acesso na API quanto a
exibição de telas e botões no front.

## Testes

**Fluxo crítico** — Caminho cujo defeito custa dinheiro real (venda, baixa de estoque,
lançamento financeiro), em oposição a defeito visual.

**Comportamento exclusivo de front** — Comportamento que nenhum teste de API consegue
observar: foco, atalhos de teclado, debounce de quantidade, estado otimista, guarda de
rota. É o alvo da suíte E2E — ver [ADR 0001](adr/0001-e2e-antes-da-refatoracao-do-front.md).

**Seed determinístico** — Estado inicial de banco fixo e conhecido, do qual os testes
partem. Sem ele, asserções sobre estoque e totais financeiros são inúteis.

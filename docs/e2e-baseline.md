# Baseline verde da suíte E2E do PDV

- **Status:** suíte verde, refatoração autorizada a começar
- **Data:** 2026-07-20
- **Spec:** [0001 — Suíte E2E do PDV com Playwright](specs/0001-suite-e2e-do-pdv.md)
- **ADR:** [0001 — E2E antes da refatoração do front](adr/0001-e2e-antes-da-refatoracao-do-front.md)

## Resultado

A suíte completa (`npm run test:e2e` na raiz) rodou **três vezes consecutivas, do
zero**, sem nenhuma falha:

| Execução | Resultado    | Servidores           | Duração (Playwright) |
| -------- | ------------ | --------------------- | --------------------- |
| 1        | 55/55 passou | reaproveitados        | 1.1min                |
| 2        | 55/55 passou | reaproveitados        | 1.1min                |
| 3        | 55/55 passou | subiram do zero (Vite + Nest, sem processo prévio na 3000/5173) | 1.2min (75s parede) |

Nenhuma falha intermitente em nenhuma das três rodadas. A terceira execução
partiu com as portas 3000 e 5173 livres, forçando o Playwright a subir os
dois servidores de desenvolvimento (`webServer`) do zero antes da suíte
rodar — cobre o caminho "servidor não estava no ar" além do caminho normal
de reaproveitamento.

## Distribuição por arquivo

| Arquivo                                    | Ticket | Casos |
| ------------------------------------------- | ------ | ----- |
| `01-smoke.spec.ts`                          | 01     | 1     |
| `03-auth-guard.spec.ts`                     | 03     | 4     |
| `04-abertura-venda.spec.ts`                 | 04     | 8     |
| `05-quantidade.spec.ts`                     | 05     | 11    |
| `06-itens-desconto-cancelamento.spec.ts`    | 06     | 8     |
| `07-pagamento-cupom.spec.ts`                | 07     | 12    |
| `08-atalhos.spec.ts`                        | 08     | 9     |
| **Total**                                   |        | **55**|

(53 casos de PDV/auth via o projeto `chromium` + 2 execuções do projeto
`setup`, que faz o login real e é contado por arquivo executado.)

## Regressões encontradas e corrigidas durante a construção da suíte

A suíte não só cobriu comportamento — ela encontrou bugs reais antes da
refatoração, exatamente o papel que a ADR 0001 previu para o caso mais
valioso (história 38 / quantidade + finalização imediata):

1. **Race entre `flushPendingQuantity()` e a ação seguinte.** `flushPendingQuantity`
   disparava o PATCH de quantidade sem aguardar a resposta antes de
   finalizar, remover item, cancelar ou aplicar desconto. Em finalização
   rápida, a venda podia fechar com o subtotal calculado a partir da
   quantidade antiga enquanto o item já mostrava a nova — exatamente o
   "cobra o valor errado sem exibir nenhum erro" descrito na ADR. Corrigido
   em `apps/web/src/routes/_app/pos.tsx`: `commitQuantity` agora usa
   `mutateAsync` e as quatro chamadas de `flushPendingQuantity()` são
   `await`adas antes de prosseguir.
2. **Vendas duplicadas por StrictMode em dev.** O efeito de abertura de venda
   no mount do PDV disparava duas vezes sob `React.StrictMode` (ativo em
   dev, que é onde a suíte roda por decisão da ADR), criando duas vendas
   `IN_PROGRESS` para o mesmo operador. Corrigido com uma guarda por `useRef`
   no efeito de abertura.
3. **`VITE_API_URL` vazio quebrava o proxy da API.** `import.meta.env.VITE_API_URL ?? '/api'`
   não cobria o caso de a variável existir e vier vazia (`??` só cobre
   `null`/`undefined`) — com um `.env` local seguindo o `.env.example`, toda
   chamada à API ia para a origem errada. Trocado para `||`.
4. **Login não respeitava a rota de origem.** `login.tsx` sempre navegava
   para `/pos` após autenticar, ignorando o `redirect` de busca que a guarda
   de rota (`_app.tsx`) propaga. Corrigido para ler `Route.useSearch()` e
   navegar (`navigate({ href })`) para o destino original, com validação
   contra open redirect.

Nenhuma dessas correções muda a experiência do operador — o comportamento
final é o que a spec sempre descreveu como correto. A suíte só tornou os
desvios visíveis.

## Regra de interpretação para a refatoração

**Teste vermelho após a refatoração presume regressão, não teste
desatualizado.** A premissa da refatoração (ADR 0001) é interface e
comportamento idênticos — apenas reorganização de arquivos/componentes.
Alterar um teste para fazê-lo passar de novo exige justificativa explícita
de que o comportamento mudou *de propósito* nesta etapa; isso deveria ser
raríssimo, já que a refatoração é declaradamente estrutural. Quando um
teste falhar:

1. Não edite o teste primeiro. Rode o arquivo isolado (`npx playwright test
   tests/<arquivo>.spec.ts`) para confirmar que a falha é real e não uma
   configuração local.
2. Leia o nome do teste — ele descreve o comportamento esperado em
   linguagem de negócio; a falha já diz o que quebrou sem precisar ler o
   corpo do teste.
3. Corrija o código do PDV para restaurar o comportamento. Só altere o
   teste se houver uma decisão consciente e documentada de mudar o
   comportamento (o que não é esperado nesta refatoração estrutural).

## A partir daqui

A suíte está verde e reflete o comportamento atual do PDV. A refatoração
estrutural de `apps/web` (ver ADR 0001) está autorizada a começar. Rode a
suíte depois de cada etapa (`npm run test:e2e`) para pegar regressão perto
de onde ela foi introduzida.

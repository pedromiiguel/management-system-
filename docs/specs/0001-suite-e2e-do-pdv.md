# Spec — Suíte E2E do PDV com Playwright

- **Status:** Pronta para implementação (`ready-for-agent`)
- **Data:** 2026-07-20
- **ADR relacionada:** [0001 — E2E antes da refatoração do front](../adr/0001-e2e-antes-da-refatoracao-do-front.md)
- **Vocabulário:** [glossário](../glossario.md)

## Problem Statement

O front end vai passar por uma refatoração estrutural: arquivos grandes serão quebrados em
componentes e hooks, com a interface final idêntica à atual. Hoje não existe nenhuma forma
de saber se essa reorganização preservou o comportamento — a cobertura de teste do projeto
é praticamente nula.

O medo não é abstrato. O PDV é a tela onde o negócio acontece e onde mora o estado mais
frágil da aplicação: a quantidade dos itens é atualizada de forma otimista com debounce,
existe um valor pendente guardado fora do ciclo de render, e há um flush obrigatório antes
de finalizar, remover item, cancelar e aplicar desconto. Some a isso o retorno automático
de foco ao campo de código, disparado a partir de vários pontos diferentes.

Quando esse código for dividido entre arquivos, qualquer um desses comportamentos pode
quebrar **em silêncio**: a venda continua fechando, a tela continua bonita, e o valor
cobrado do cliente está errado. Ou o foco para de voltar ao scanner e o operador de balcão
descobre no meio do movimento que precisa clicar com o mouse a cada item.

Sem uma rede de segurança, a única forma de validar a refatoração é conferir na mão, tela
por tela — o que não escala e não é confiável.

## Solution

Uma suíte de testes end-to-end com Playwright, escrita **antes** da refatoração e
executada nos dois momentos: antes (para provar que a suíte reflete o comportamento atual)
e depois (para provar que o comportamento foi preservado).

A suíte é deliberadamente estreita. Ela cobre apenas o PDV, e dentro do PDV cobre apenas o
que **só o navegador consegue observar**: foco, atalhos de teclado, debounce de
quantidade, estado otimista, sequências de interação e guarda de rota. Regra de negócio —
cálculo de total, taxa de serviço, baixa de estoque, geração de recebível — fica fora,
porque é mais barata de validar na API e a refatoração do front não a toca.

Do ponto de vista do usuário deste sistema (o desenvolvedor), o resultado é um comando
único que roda localmente e responde uma pergunta objetiva: *a refatoração preservou o
comportamento do PDV, sim ou não?*

Como pré-requisito, a interface do PDV ganha nomes acessíveis e identificadores de teste
estáveis, para que os testes sobrevivam à mudança de markup que a refatoração vai
produzir.

## User Stories

### Preparação do ambiente de teste

1. Como desenvolvedor, quero rodar a suíte E2E com um único comando, para não precisar
   lembrar de subir servidor e banco na ordem certa.
2. Como desenvolvedor, quero que o Playwright suba os servidores de desenvolvimento
   automaticamente, para que a execução não dependa de eu ter deixado algo rodando antes.
3. Como desenvolvedor, quero que a suíte reaproveite servidores já em execução quando eles
   existirem, para não pagar o tempo de boot a cada rodada enquanto estou refatorando.
4. Como desenvolvedor, quero que o banco seja resetado e re-semeado antes de cada arquivo
   de teste, para que uma venda feita em um teste não altere o resultado do próximo.
5. Como desenvolvedor, quero que o seed contenha produtos com SKU, EAN, preço e estoque
   fixos e conhecidos, para poder afirmar totais exatos nos testes.
6. Como desenvolvedor, quero um cliente cadastrado no seed, para conseguir testar o fluxo
   de fiado, que exige cliente.
7. Como desenvolvedor, quero um produto com estoque zerado no seed, para conseguir testar
   o comportamento do sistema ao vender sem saldo.
8. Como desenvolvedor, quero que a política de estoque venha fixada no seed, para que o
   mesmo teste não mude de resultado conforme a configuração do ambiente.
9. Como desenvolvedor, quero que a suíte rode em série, para que o reset de banco de um
   teste não derrube outro rodando em paralelo.
10. Como desenvolvedor, quero que a autenticação seja resolvida uma vez no setup global,
    para não pagar um login por teste.
11. Como desenvolvedor, quero ver o relatório do Playwright com rastro da execução quando
    um teste falhar, para diagnosticar sem precisar reproduzir na mão.
12. Como desenvolvedor, quero que a suíte não rode em CI nesta etapa, para não travar
    minha refatoração em infraestrutura que ainda não preciso.

### Instrumentação da interface (pré-requisito)

13. Como desenvolvedor, quero que os elementos interativos do PDV tenham nome acessível,
    para poder selecioná-los por papel e não por estrutura de markup.
14. Como desenvolvedor, quero identificadores de teste apenas onde não existe papel ou
    texto estável, para manter os seletores resistentes à refatoração sem poluir o markup.
15. Como desenvolvedor, quero que cada linha de item da venda seja identificável de forma
    estável, para poder agir sobre um item específico independente da ordem em que a
    tabela for renderizada depois.
16. Como desenvolvedor, quero que os valores de subtotal, desconto, taxa de serviço, total
    e troco sejam identificáveis individualmente, para poder afirmar cada um sem depender
    de posição na tela.
17. Como desenvolvedor, quero que a instrumentação venha em um commit separado dos testes,
    para poder revisar a mudança de markup isoladamente.
18. Como usuário do sistema, quero que os botões da interface tenham rótulos acessíveis,
    para que a aplicação seja navegável por leitor de tela — benefício colateral da
    instrumentação.

### Autenticação e guarda de rota

19. Como desenvolvedor, quero um teste que confirme que acessar uma rota protegida sem
    sessão redireciona para o login, para garantir que a guarda continua ativa depois da
    refatoração.
20. Como desenvolvedor, quero um teste que confirme que, após o login, o usuário é levado
    à rota que tentou acessar originalmente, para garantir que o redirecionamento com
    destino preservado continua funcionando.
21. Como desenvolvedor, quero que o teste de guarda de rota rode sem a sessão
    pré-carregada, para que ele realmente exercite o caminho de usuário não autenticado.
22. Como desenvolvedor, quero um teste que confirme que credenciais inválidas mostram erro
    e não criam sessão, para garantir que o tratamento de erro do login sobreviveu.
23. Como desenvolvedor, quero um teste que confirme que o logout limpa a sessão e devolve
    o usuário ao login, para garantir que o encerramento de sessão continua íntegro.

### Abertura da venda e campo de código

24. Como operador de caixa, quero que uma venda seja aberta automaticamente ao entrar no
    PDV, para começar a bipar produtos sem clicar em nada.
25. Como operador de caixa, quero que o campo de código esteja focado assim que a tela
    carrega, para que o scanner funcione imediatamente.
26. Como operador de caixa, quero adicionar um produto digitando seu EAN e pressionando
    Enter, para que o scanner USB funcione como se fosse um teclado.
27. Como operador de caixa, quero adicionar um produto pelo SKU, para conseguir vender
    itens cuja etiqueta de código de barras está danificada.
28. Como operador de caixa, quero que o campo de código seja limpo e volte a receber foco
    depois de cada item adicionado, para bipar o próximo item sem tocar no mouse.
29. Como operador de caixa, quero digitar `3*<código>` para adicionar três unidades de uma
    vez, para não bipar o mesmo produto três vezes.
30. Como operador de caixa, quero que o atalho de quantidade também aceite `3x<código>`,
    porque é a variação que meus colegas usam.
31. Como operador de caixa, quero que um código inexistente abra a busca por nome já
    preenchida com o que digitei, para não ter que redigitar quando bipo algo errado.
32. Como operador de caixa, quero que um código inexistente **não** mostre mensagem de
    erro vermelha, porque não é um erro — é o caminho normal quando o produto não tem
    etiqueta.
33. Como operador de caixa, quero ver sugestões de produto ao digitar duas letras ou mais,
    para encontrar itens pelo nome.
34. Como operador de caixa, quero navegar pelas sugestões com as setas do teclado e
    selecionar com Enter, para não sair do teclado.

### Quantidade — o núcleo de risco da refatoração

35. Como operador de caixa, quero aumentar a quantidade de um item clicando em "+", para
    corrigir uma contagem sem remover e re-bipar.
36. Como operador de caixa, quero que a quantidade apareça na tela imediatamente ao
    clicar, sem esperar o servidor, para que a tela acompanhe o ritmo do balcão.
37. Como operador de caixa, quero clicar "+" várias vezes em sequência rápida e ver a
    quantidade final correta, para que cliques rápidos não se percam.
38. Como operador de caixa, quero clicar "+" três vezes e finalizar a venda imediatamente,
    e ter a venda fechada com a quantidade que eu vi na tela, para nunca cobrar um valor
    diferente do que apareceu.
39. Como operador de caixa, quero alterar a quantidade e remover outro item logo em
    seguida, e ter a alteração preservada, para que uma ação não descarte a outra.
40. Como operador de caixa, quero alterar a quantidade e cancelar a venda logo em seguida,
    e ter a venda cancelada de forma limpa, sem deixar alteração pendente.
41. Como operador de caixa, quero alterar a quantidade e aplicar um desconto logo em
    seguida, e ter o desconto calculado sobre a quantidade nova, para não dar desconto
    sobre um valor desatualizado.
42. Como operador de caixa, quero diminuir a quantidade com o botão "−", para corrigir um
    excesso.
43. Como operador de caixa, quero que a quantidade nunca fique abaixo de um, porque um
    item com quantidade zero não faz sentido na venda.
44. Como operador de caixa, quero digitar a quantidade diretamente no campo, para ajustar
    de 1 para 12 sem clicar doze vezes.

### Itens, desconto e cancelamento

45. Como operador de caixa, quero que remover um item peça confirmação, para não apagar
    uma linha por engano no meio do movimento.
46. Como operador de caixa, quero cancelar a confirmação de remoção e manter o item, para
    que um clique errado não tenha consequência.
47. Como operador de caixa, quero que o foco volte ao campo de código depois de remover um
    item, para continuar bipando.
48. Como operador de caixa, quero aplicar desconto em valor sobre a venda, para negociar
    com o cliente.
49. Como operador de caixa, quero aplicar desconto em percentual sobre a venda, para
    aplicar a política da loja.
50. Como operador de caixa, quero ver o total recalculado assim que o desconto é aplicado,
    para informar o valor ao cliente.
51. Como operador de caixa, quero cancelar a venda inteira e receber uma venda nova e
    vazia, para atender o próximo cliente.
52. Como operador de caixa, quero que o cancelamento peça confirmação quando há itens, para
    não perder uma venda montada por engano.

### Pagamento e conclusão

53. Como operador de caixa, quero escolher dinheiro como meio de pagamento e informar o
    valor recebido, para que o sistema calcule o troco.
54. Como operador de caixa, quero ver o troco calculado enquanto digito o valor recebido,
    para conferir antes de fechar.
55. Como operador de caixa, quero ser impedido de finalizar em dinheiro com valor recebido
    menor que o total, para não fechar uma venda sem receber.
56. Como operador de caixa, quero finalizar uma venda em PIX sem informar valor recebido,
    porque não há troco.
57. Como operador de caixa, quero finalizar uma venda em cartão sem informar valor
    recebido, pelo mesmo motivo.
58. Como operador de caixa, quero que finalizar em fiado sem cliente selecionado abra a
    seleção de cliente em vez de dar erro, para eu completar o que falta.
59. Como operador de caixa, quero finalizar uma venda em fiado após escolher o cliente,
    para registrar a dívida.
60. Como operador de caixa, quero ser impedido de finalizar uma venda sem itens, para não
    gerar venda vazia.
61. Como operador de caixa, quero ativar a taxa de serviço e ver o total subir, para
    cobrar o acréscimo quando aplicável.
62. Como operador de caixa, quero alternar entre venda com nota e sem nota, para atender a
    preferência do cliente.
63. Como operador de caixa, quero ver o cupom com os itens e o total após concluir a
    venda, para entregar ao cliente.
64. Como operador de caixa, quero que a tela volte limpa e pronta para a próxima venda
    depois que eu fechar o cupom, para atender o próximo cliente sem recarregar nada.
65. Como operador de caixa, quero que o meio de pagamento e o cliente sejam resetados
    entre vendas, para não cobrar o cliente errado por descuido.

### Atalhos de teclado

66. Como operador de caixa, quero abrir a busca de produtos com F2, para encontrar itens
    sem tirar a mão do teclado.
67. Como operador de caixa, quero abrir o desconto com F4, pelo mesmo motivo.
68. Como operador de caixa, quero selecionar dinheiro com F5, PIX com F6 e cartão com F7,
    para trocar de meio de pagamento em uma tecla.
69. Como operador de caixa, quero abrir a seleção de cliente com F8, para o fluxo de
    fiado.
70. Como operador de caixa, quero finalizar a venda com F10, porque é a tecla que eu já
    uso no sistema antigo.
71. Como operador de caixa, quero remover o item selecionado com Delete quando o campo de
    código está vazio, para corrigir rápido.
72. Como operador de caixa, quero que Delete **não** remova item enquanto estou digitando
    um código, para não perder uma linha ao apagar um caractere.
73. Como operador de caixa, quero fechar qualquer modal com Escape, para sair de onde
    entrei por engano.
74. Como operador de caixa, quero que Escape com a venda montada e sem modal aberto peça
    confirmação de cancelamento, e não cancele direto.
75. Como operador de caixa, quero que os atalhos fiquem desativados enquanto um modal está
    aberto, para não disparar duas ações ao mesmo tempo.

### Uso da suíte na refatoração

76. Como desenvolvedor, quero rodar a suíte inteira verde antes de começar a refatorar,
    para confirmar que ela descreve o comportamento atual e não uma expectativa minha.
77. Como desenvolvedor, quero rodar a suíte depois de cada etapa da refatoração, para
    descobrir a regressão perto de onde a causei.
78. Como desenvolvedor, quero que a falha de um teste aponte para o comportamento
    quebrado em linguagem de negócio, para saber o que consertar sem ler o teste inteiro.

## Implementation Decisions

### Ferramenta e localização

- Playwright como executor de testes E2E, adicionado como novo workspace do monorepo,
  separado de `apps/web` e `apps/api`. Motivo: a suíte exercita os dois ao mesmo tempo e
  não pertence a nenhum dos dois; e o `apps/api` já usa Jest, cuja convenção de arquivos
  conflitaria.
- Um script na raiz do monorepo dispara a suíte. O script `test:e2e` da raiz hoje aponta
  para `apps/api`, onde não existe diretório de teste — essa referência quebrada será
  resolvida na mesma mudança, com nomes distintos para E2E de API e E2E de navegador.
- Apenas Chromium. Motivo: o sistema é usado em balcão, em máquina controlada; testar três
  motores triplicaria o tempo sem responder nenhuma pergunta relevante para a refatoração.

### Aplicação sob teste

- A suíte roda contra os **servidores de desenvolvimento** (Vite e Nest em watch),
  iniciados pelo próprio Playwright e reaproveitados quando já estiverem no ar. Motivo:
  a suíte será executada muitas vezes durante a refatoração, e pagar um build de produção
  por rodada inviabiliza o uso.
- Consequência aceita: erros que só aparecem no build de produção não são detectados por
  esta suíte.

### Seam de dados

- **Seam único e existente: o seed do Prisma.** Todo estado inicial vem de
  `prisma/seed.ts`. Os testes não criam dado em código, não chamam a API para montar
  cenário e não dependem de dado criado por outro teste.
- O seed existente já é determinístico e será **estendido** — não duplicado — dentro do
  bloco condicionado a `SEED_SAMPLE_DATA` que já existe. Acréscimos:
  - Um cliente ativo, necessário para o fluxo de fiado (o seed atual não tem nenhum).
  - Um produto com estoque zerado, para exercitar venda sem saldo.
  - Estoque e preços dos produtos existentes permanecem como estão; os testes se apoiam
    nesses valores.
- A política de estoque continua fixada pelo seed, já que ela altera o resultado dos
  testes de venda sem saldo.
- Antes de cada arquivo de teste: reset do schema seguido de re-execução do seed. Execução
  em série, com um único worker.
- Consequência aceita: a suíte é lenta. É o preço de não caçar instabilidade em uma
  aplicação cujo domínio é acumulativo (estoque, caixa, fiado).

### Seam de autenticação

- A sessão vive inteiramente em `localStorage`, sob as chaves `sol.token` e `sol.user`.
  Isso permite capturar o estado de armazenamento de um login real e reaproveitá-lo.
- Um setup global executa **um** login pela interface e persiste o estado de
  armazenamento. Os demais testes partem já autenticados.
- Os testes de guarda de rota, login inválido e logout abrem mão desse estado e exercitam
  o caminho não autenticado.
- Decisão explícita: o token **não** é forjado nem obtido chamando a API diretamente. O
  login continua sendo exercitado de verdade, uma vez por execução.

### Seletores e instrumentação

- Seletores por semântica acessível: papel e nome acessível, ou texto visível. Consulta
  por classe CSS, hierarquia de elementos ou posição é proibida — é justamente o que a
  refatoração vai mudar.
- Identificador de teste apenas onde não existe papel ou texto estável. Casos previstos:
  linhas de item da venda, e cada valor monetário do resumo (subtotal, desconto, taxa de
  serviço, total, troco), que hoje são texto solto sem rótulo associável.
- O PDV tem hoje dois rótulos acessíveis e nenhum identificador de teste. A instrumentação
  é um **commit próprio**, anterior aos testes, revisável isoladamente.
- Regra para a refatoração seguinte: nome acessível e identificador de teste são contrato.
  Renomear ou remover um deles é mudança de comportamento, não detalhe interno.

### Modelo de interação nos testes

- Toda ação e toda asserção passam pelo navegador. Nenhum teste consulta o banco ou chama
  a API para verificar resultado. Motivo: manter um seam só; o que o operador não vê na
  tela não é o objeto desta suíte.
- Esperas são por condição observável na interface, nunca por tempo fixo. O único ponto do
  sistema com atraso deliberado é o debounce de quantidade, e o comportamento correto dele
  é verificado pelo **resultado final** (a venda fecha com a quantidade certa), não por
  cronometragem.
- Sequências rápidas de clique são disparadas sem espera entre elas — reproduzir a pressa
  do balcão é o ponto do teste, não um efeito colateral.

### O que a suíte deliberadamente não observa

- Número de requisições enviadas à API. Um debounce que deixasse de agrupar chamadas
  produziria o mesmo resultado final e passaria despercebido. Classificado como regressão
  de performance, fora de escopo — decisão registrada na ADR 0001.
- Valores calculados pelo servidor como verdade de negócio (total com Decimal, taxa de
  serviço, custo de mercadoria). A suíte confere que a tela **mostra** o que o servidor
  devolveu, não que o servidor calculou certo.

## Testing Decisions

### O que caracteriza um bom teste nesta suíte

Um bom teste aqui descreve **o que o operador de caixa faz e o que ele vê**, e nada mais.
Ele continua passando se todo o código por trás for reescrito, desde que a experiência seja
a mesma — que é literalmente o critério de sucesso da refatoração que vem depois.

Concretamente, um teste desta suíte:

- Age por papel e nome acessível ("o botão Aumentar quantidade"), nunca por estrutura.
- Afirma sobre o que está visível na tela, nunca sobre estado interno, chamada de rede,
  contagem de renderização ou existência de um componente.
- Tem nome escrito em linguagem de negócio, de modo que a falha já comunique o problema
  sem que se precise ler o corpo do teste.
- Parte de um estado de banco conhecido e se declara independente de qualquer outro teste.
- Não usa espera por tempo fixo.

O anti-teste correspondente — o que **não** será escrito — é qualquer coisa que afirme
"existe um componente chamado X", "o hook Y foi chamado", "foi disparada uma requisição
PATCH": tudo isso é exatamente o que a refatoração tem permissão de mudar.

### Módulos cobertos

Cobertos por esta suíte:

- Frente de caixa (PDV): abertura de venda, campo de código, sugestões, quantidade,
  remoção, desconto, cancelamento, meios de pagamento, conclusão, cupom, atalhos, foco.
- Autenticação e guarda de rota, na medida em que o PDV depende delas.

Explicitamente **não** cobertos por esta suíte: Produtos, Estoque, Financeiro, Relatórios
e Configurações. A justificativa está na ADR 0001 — concentrar o esforço onde está o
estado frágil.

### Prior art

O projeto praticamente não tem prior art de teste, e isso é parte do problema que esta
spec resolve. O que existe:

- Um único teste de unidade de controller na API, em Jest. Serve de referência para
  convenção de nomenclatura em português, e não muito além disso.
- O script `test:e2e` da API está declarado mas aponta para um diretório inexistente —
  ou seja, houve intenção de E2E de API que nunca foi materializada.

Consequência: esta suíte **estabelece** a prior art de teste de navegador do projeto. Os
padrões que ela fixar (seletores semânticos, seed como fonte única de fixture, nomes em
linguagem de negócio, proibição de espera por tempo) devem ser tratados como a convenção a
seguir por testes futuros.

Recomendação registrada, sem compromisso de execução nesta spec: o vazio de testes na API
é maior e mais barato de preencher do que o do front. Preenchê-lo é o passo natural depois
da refatoração.

## Out of Scope

- **Cobertura E2E de Produtos, Estoque, Financeiro, Relatórios e Configurações.** Uma
  regressão de front nessas telas não será detectada.
- **Testes de regra de negócio.** Cálculo de total, taxa de serviço, baixa de estoque,
  geração de recebível e fechamento de caixa pertencem a testes de API.
- **Testes de unidade e de componente no front.** Esta spec não introduz Vitest nem
  biblioteca de teste de componente.
- **Snapshot visual / comparação de screenshot.** Avaliado e rejeitado na ADR 0001.
- **Execução em integração contínua.** Local e sob demanda. Portar para CI é decisão
  separada, a ser tomada se a suíte sobreviver útil à refatoração.
- **Múltiplos navegadores e teste de responsividade.**
- **Teste de impressão do cupom.** A suíte confere o conteúdo exibido do cupom, não o
  envio para a impressora.
- **A refatoração em si.** Esta spec entrega apenas a rede de segurança.
- **Banco descartável por worker e paralelismo.** Avaliado e rejeitado como
  sobre-engenharia para uma suíte local de porte pequeno.
- **Teste de permissões por papel.** O seed tem apenas o papel Administrador; cobrir
  ocultação de tela por permissão exigiria papéis adicionais e sai do foco.

## Further Notes

**A ordem importa e não é negociável.** A suíte precisa estar verde **antes** da
refatoração começar. Uma suíte escrita durante a refatoração não prova nada: ela seria
ajustada para passar contra o código novo, que é exatamente o código sob suspeita.

**Como interpretar uma falha depois da refatoração.** Se um teste ficar vermelho, a
hipótese padrão é que a refatoração quebrou o comportamento — não que o teste está
desatualizado. Alterar um teste para fazê-lo passar exige justificativa explícita de que o
comportamento mudou de propósito. Como a premissa da refatoração é "interface idêntica",
essa justificativa quase nunca deveria existir.

**O caso mais valioso da suíte inteira** é a história 38: clicar "+" três vezes em
sequência rápida e finalizar imediatamente, e a venda fechar com a quantidade que estava
na tela. Ele cruza o estado otimista, o valor pendente fora do render e o flush obrigatório
antes da conclusão — os três pontos que a divisão do componente ameaça de uma vez. Se
houvesse orçamento para um único teste, seria esse.

**O commit de instrumentação tem valor próprio.** Independente da refatoração, ele torna o
PDV navegável por leitor de tela — hoje a tela tem dois rótulos acessíveis no total.

**Débito conhecido que esta spec não paga:** a cobertura de teste da API. É o maior vazio
do projeto e o mais barato de preencher. Fica registrado para depois.

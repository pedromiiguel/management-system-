# Arquitetura — Clean Architecture (WeFit)

Convenção portátil de arquitetura em camadas. Este documento **é** o ativo
reutilizável: copie-o para outro projeto e siga-o. Nada aqui depende de um
framework específico — os pontos amarrados a Next.js/axios estão marcados como
`(adaptador)` e devem ser reimplementados por projeto.

## Regra única

O fluxo de dependência aponta **sempre para dentro**:

```
presentation → main → data → domain ← @shared
```

- Uma camada só importa camadas **mais internas**. Nunca o contrário.
- `domain` não importa nada de framework — é TypeScript puro.
- `main` é a **única** camada que cruza todas as fronteiras: é o _composition
  root_, onde os concretos são instanciados e injetados na `presentation` via
  props (Dependency Inversion).

Se um import viola essa direção, o desenho está errado — não o lint.

## Camadas

| Camada          | Responsabilidade                                                                      | Importa de                    | Depende de framework? |
| --------------- | ------------------------------------------------------------------------------------- | ----------------------------- | --------------------- |
| `domain/`       | Tipos puros: `models/`, `usecases/` (interfaces), `errors/`                           | nada                          | Não                   |
| `data/`         | `handlers/` que implementam os usecases contra `IHttpClient`                          | `domain`, `@shared`           | Não                   |
| `infra/`        | Adaptadores concretos: cliente HTTP, endpoints                                        | `@shared`                     | **Sim (adaptador)**   |
| `main/`         | _Composition root_: `factories/`, e (opcional) `serverActions/`, `queries/`, `redux/` | todas as internas             | **Sim (adaptador)**   |
| `presentation/` | UI. Recebe tudo por props/DI                                                          | `main` (via props), `@shared` | Sim                   |
| `@shared/`      | Contratos transversais (HTTP, cookie). TypeScript puro                                | nada                          | Não                   |

### Padrão de `presentation`

Por página/feature:

```
presentation/
  components/              # componentes GLOBAIS — usados por mais de um flow
    {Componente}/          # pasta MVVM + barrel — ver componentes-mvvm.md
      {Componente}.tsx        # ViewModel (export público)
      {Componente}.view.tsx   # View — JSX puro
      {Componente}.model.ts   # Model — estado + dados. Opcional (se houver estado)
      {Componente}.types.ts   # tipos próprios
      {Componente}.styles.ts  # opcional — quando o CSS cresce muito
      index.ts                # barrel — sempre
  hooks/                    # hooks GLOBAIS reutilizáveis (ex.: useDebounce) + barrel
  constants/                # constantes GLOBAIS — usadas por mais de um flow/componente
  flows/                    # cada flow em sua própria pasta (alias @flows)
    {flow}/                 # ex.: sale/ — a tela e tudo que é exclusivo dela
      {Flow}Page/            # a tela do flow, também pasta MVVM + barrel
      components/             # componentes LOCAIS — exclusivos deste flow
        {Componente}/          # mesma pasta MVVM + barrel
      hooks/                 # hooks LOCAIS do flow
      context/
      providers/
      constants/             # constantes LOCAIS — exclusivas deste flow
      assets/
```

- Um componente só sobe para `presentation/components/` quando é reaproveitado
  por **mais de um** flow. Nasce sempre dentro do `components/` local do flow;
  promover para global é uma decisão consciente, não o ponto de partida.
- Componente local não é importado por outro flow. Se isso acontecer, ou ele
  sobe para `presentation/components/`, ou o flow está mal recortado.
- Mesma lógica global/local vale para `constants/`: nasce perto de quem usa,
  só sobe para `presentation/constants/` quando é reaproveitada por mais de
  um flow ou componente.

## Os dois contratos que são a arquitetura

Estes são o coração portátil. Copie-os como estão — são interfaces puras, sem
dependência de runtime.

### 1. `IHttpClient` — a fronteira com o mundo externo

`data/` nunca conhece axios/fetch. Conhece só esta interface (`@shared/http`):

```ts
export interface IHttpClient<R = any> {
  request: <B>(data: HttpRequest<B>) => Promise<HttpResponse<R>>;
}

export type HttpRequest<B> = {
  url: string;
  method: HttpMethod; // POST | GET | PUT | DELETE | PATCH
  queryParams?: Record<string, unknown>;
  body?: B;
  headers?: Record<string, string>;
};

export type HttpResponse<T = any> = { statusCode: number; body: T };
```

Cada projeto escreve **um adaptador** que implementa `IHttpClient` com o cliente
HTTP que já usa (axios, fetch, undici…). Esse é o único ponto acoplado ao
runtime. Ver [checklist do adaptador](#o-que-cada-projeto-reimplementa).

```ts
type Result<T> = {
  statusError: { name: string; message: string }; // "not-error" quando ok
  response: T;
};
```

## Vocabulário canônico de CRUD

Toda operação padrão usa este vocabulário, **sem variação**. `{Entity}` é sempre
**singular** (`SearchPaymentConditionHandler`, nunca `...Conditions...`).

| Operação     | Verbo     | Handler                 | Usecase           | Método     | Factory                  |
| ------------ | --------- | ----------------------- | ------------------ | ---------- | ------------------------ |
| Listagem     | `search`  | `Search{Entity}Handler` | `ISearch{Entity}` | `search()` | `makeSearch{Entity}`     |
| Busca por ID | `get-one` | `GetOne{Entity}Handler` | `IGetOne{Entity}` | `getOne()` | `makeGetOne{Entity}(id)` |
| Criação      | `create`  | `Create{Entity}Handler` | `ICreate{Entity}` | `create()` | `makeCreate{Entity}`     |
| Atualização  | `update`  | `Update{Entity}Handler` | `IUpdate{Entity}` | `update()` | `makeUpdate{Entity}(id)` |
| Exclusão     | `delete`  | `Delete{Entity}Handler` | `IDelete{Entity}` | `delete()` | `makeDelete{Entity}(id)` |

Operações fora do CRUD (`archive`, `duplicate`, `restore`…) usam verbo custom no
mesmo formato: `ArchivePlanHandler`, `IArchivePlan`, `makeArchivePlan`.

**Sufixo `API`:** só existe quando há um _converter_ transformando o tipo da
resposta da API num tipo de domínio diferente (`I{Entity}ResponseAPI` → `I{Entity}`).

## Fluxo completo de uma integração

De dentro para fora — sempre nesta ordem:

1. **domain/models** — tipos da entidade
2. **domain/usecases** — interface (`ISearch{Entity}`)
3. **infra/endpoints** — a rota da API
4. **data/handlers** — implementação contra `IHttpClient`
5. **main/factories/handlers** — monta o handler injetando o `IHttpClient`
6. **main/factories** — `queries` ou `mutations` _(adaptador; framework)_
7. **main/factories/flows** — composition root que entrega tudo à `presentation`

## Convenções de naming

- **Named exports sempre.** Nunca `export default`.
- `useRef` → sufixo `Ref`.
- `camelCase` para vars/funções, `PascalCase` para componentes/tipos/interfaces,
  `ALL_CAPS` para constantes.
- Interfaces prefixadas com `I` (`IHttpClient`, `ISearchPlan`).
- Proibido no código-fonte: `any`, `console.log`, identificadores de 1 letra, `.then()` (use `async/await`).
- JSX condicional: ternário `? ... : null`, nunca `&&`.
- Ternários usados como valor de prop JSX → extrair para constante nomeada.
- **Componente = pasta MVVM com barrel.** Todo componente de `presentation` é
  uma pasta com `index.ts`, separando Model (estado/dados), ViewModel (adaptação)
  e View (JSX). Convenção completa em [componentes-mvvm.md](./componentes-mvvm.md).
- **Tipos do componente** → sempre em `{nome}.types.ts` (nunca inline no arquivo
  principal). Para não-componentes, a regra é mais frouxa: extrair tipos só
  quando começam a atrapalhar a leitura.
- **Estilização via Tailwind. `style={{}}` inline é proibido.** Todo estilo é
  classe utilitária Tailwind (combinada com as classes do design system, ex.
  `className="s-input flex-1"`). Única exceção: valor calculado em runtime que o
  utilitário não expressa — e mesmo aí, preferir CSS variable. CSS que não cabe
  em utilitário e se repete → classe no design system ou, em último caso,
  arquivo irmão `{nome}.styles.ts`. Detalhes em
  [componentes-mvvm.md](./componentes-mvvm.md#estilização-tailwind).
- **Ícones via `lucide-react`.** Proibido `<svg>` inline ou componente de ícone
  próprio. Importar pelo nome (`import { Search } from 'lucide-react'`) e usar na
  View. Ícones legados (`SolIcon`) estão em migração.
- **Formulários via `react-hook-form` + `zod`**, nunca `useState` por campo.
  Preferência _uncontrolled_ (`register`); _controlled_ (`Controller`) só como
  fallback quando o campo não pode ser uncontrolled. Schema em `{nome}.schema.ts`,
  `useForm` no Model. Detalhes em
  [componentes-mvvm.md](./componentes-mvvm.md#formulários-react-hook-form).
- **Evitar arquivos muito grandes.** Quando um componente cresce demais,
  quebrar em subcomponentes dentro da pasta local `components/` do próprio
  flow (ou ao lado do componente, se for um único subcomponente pequeno).
  Extrair por responsabilidade, não por tamanho arbitrário — cada
  subcomponente deve fazer sentido isolado, não ser um corte artificial só
  para reduzir linhas.
- **Proibido string solta no código** (`"pending"`, `"/api/users"`, mensagens
  de erro, etc.) — sempre constante ou enum nomeado. Constante usada por um
  único componente → arquivo irmão `{nome}.constants.ts`. Constante usada em
  mais de um lugar → `presentation/constants/` (global) ou `constants/` do
  flow (local), seguindo a mesma regra global/local dos componentes.

## Path aliases

Espelhe em `tsconfig.json` **e** na config de teste (ex. `jest.config`):

```jsonc
"@/*":         ["./*"],
"@shared/*":   ["src/@shared/*"],
"@domain/*":   ["src/domain/*"],
"@data/*":     ["src/data/*"],
"@infra/*":    ["src/infra/*"],
"@main/*":     ["src/main/*"],
"@components/*": ["src/presentation/components/*"],
"@hooks/*":    ["src/presentation/hooks/*"],
"@flows/*":    ["src/presentation/flows/*"]
```

## O que cada projeto reimplementa

O contrato acima porta 100%. Estes pontos são **adaptadores** — cada projeto
escreve o seu, conforme o próprio stack:

- [ ] **Adaptador `IHttpClient`** — implementação concreta com axios/fetch/etc.
- [ ] **Interceptors** — auth, refresh de token, tratamento de erro HTTP.
- [ ] **Store/estado global** — Redux, Zustand ou nada. Opcional.

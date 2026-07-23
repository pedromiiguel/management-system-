# Componentes — MVVM

Convenção de organização de **componentes de `presentation`**. Refina a seção
[Padrão de `presentation`](./arquiteture.md#padrão-de-presentation): todo
componente vira uma **pasta** com _barrel file_, e a lógica é separada da
renderização seguindo **MVVM** (Model · ViewModel · View).

> A regra de dependência da arquitetura continua valendo: o componente vive em
> `presentation` e só fala com `main` (via props/DI ou hooks de factory). MVVM é
> como recortamos o componente **por dentro** — não muda a direção das camadas.

## Regra única

**Nenhuma tipagem no arquivo principal e nenhuma regra de negócio na View.**

- Tipos → sempre em `{Componente}.types.ts`.
- Estado + acesso a dados (`main`) → `{Componente}.model.ts` (o **Model**).
- Adaptação Model → props de View → `{Componente}.tsx` (o **ViewModel**).
- JSX puro, sem regra → `{Componente}.view.tsx` (a **View**).

## Estrutura da pasta

Todo componente é uma pasta com o mesmo nome, sempre com **barrel** (`index.ts`):

```
CustomerModal/
  CustomerModal.types.ts    # tipos — SEMPRE que houver tipagem própria
  CustomerModal.schema.ts    # zod — só quando o componente tem formulário
  CustomerModal.model.ts     # Model — estado + dados (main) + form. SEM JSX
  CustomerModal.tsx          # ViewModel — cola Model ↔ View (export público)
  CustomerModal.view.tsx     # View — JSX puro, recebe tudo por props
  CustomerModal.styles.ts    # raro — só p/ CSS que o Tailwind não expressa
  index.ts                   # barrel — SEMPRE
```

**Extensão segue o conteúdo:** `.tsx` só quando o arquivo retorna JSX. `model` e
`types` não têm JSX → `.ts`. `view` e o ViewModel têm JSX → `.tsx`.

## Papéis (MVVM)

| Arquivo       | Papel         | Faz                                                                                 | Não faz                                  |
| ------------- | ------------- | ----------------------------------------------------------------------------------- | ---------------------------------------- |
| `.model.ts`   | **Model**     | Hook `use{Componente}Model`. Estado, queries/mutations de `main`, `useForm` (RHF), regra | JSX. Formatação de exibição.             |
| `.tsx`        | **ViewModel** | Consome o Model, adapta domínio → props de View (formata, monta rows, flags)        | Fetch direto. Markup além de `<View />`. |
| `.view.tsx`   | **View**      | Recebe props prontas e renderiza. `<form>` + `register`. Ícones lucide               | Chamar `main`. Regra de negócio.         |
| `.types.ts`   | Tipos         | `Props` do componente e `ViewProps`                                                  | Lógica.                                  |
| `.schema.ts`  | Validação     | `z.object({...})` + `z.infer`. Só quando há formulário (ver [Formulários](#formulários-react-hook-form)) | Lógica de UI.       |
| `.styles.ts`  | Estilos       | Raro — só CSS que o Tailwind não expressa (ver [Estilização](#estilização-tailwind)) | Substituir Tailwind. `style={{}}` inline. |
| `index.ts`    | Barrel        | Reexporta o componente e os tipos públicos                                           | Lógica.                                  |

Fluxo em runtime:

```
main (queries/mutations)
        │
   .model.ts  ── estado + dados de domínio
        │  (dados crus + ações)
   .tsx (ViewModel) ── formata, monta props
        │  (ViewProps prontas)
   .view.tsx  ── só renderiza
```

## Exemplo completo — `CustomerModal`

Antes: um arquivo com props inline, `useState`, query, mutation, formatação e JSX
tudo junto. Depois, dividido em MVVM.

### `CustomerModal.schema.ts` — validação do form (zod)

```ts
import { z } from 'zod';

export const customerFormSchema = z.object({
  name: z.string().trim().min(2, 'Informe ao menos 2 caracteres'),
});

export type CustomerFormInput = z.infer<typeof customerFormSchema>;
```

### `CustomerModal.types.ts`

```ts
import type { UseFormHandleSubmit, UseFormRegister } from 'react-hook-form';
import type { Customer } from '@/domain/models/sale';
import type { CustomerFormInput } from './CustomerModal.schema';

export type CustomerModalProps = {
  onPick: (customer: Customer) => void;
  onClose: () => void;
};

// Filtro de busca — form RHF sem validação (só lê o valor via watch).
export type CustomerFilterInput = {
  search: string;
};

export type CustomerRow = {
  key: string;
  onClick: () => void;
  cells: [string, string];
};

// Props já prontas para a View — nada aqui exige regra de negócio.
export type CustomerModalViewProps = {
  registerFilter: UseFormRegister<CustomerFilterInput>;
  rows: CustomerRow[];
  register: UseFormRegister<CustomerFormInput>;
  onSubmit: ReturnType<UseFormHandleSubmit<CustomerFormInput>>;
  canCreate: boolean;
  onClose: () => void;
};
```

### `CustomerModal.model.ts` — Model (estado + dados)

```ts
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { Customer } from '@/domain/models/sale';
import { useCreateCustomerMutation } from '@/main/factories/mutations/sale';
import { useSearchCustomersQuery } from '@/main/factories/queries/sale';
import { useToast } from '@/components/sol';
import { useDebounce } from '@/presentation/hooks';
import { apiErrorMessage } from '@/lib/api';
import { customerFormSchema, type CustomerFormInput } from './CustomerModal.schema';
import type { CustomerFilterInput } from './CustomerModal.types';

const SEARCH_DEBOUNCE_MS = 300;

export function useCustomerModalModel(onPick: (customer: Customer) => void) {
  const toast = useToast();

  // Filtro: input uncontrolled (register) + watch para ler o valor reativo.
  // O debounce evita disparar a query a cada tecla. Continua uncontrolled.
  const { register: registerFilter, watch } = useForm<CustomerFilterInput>({
    defaultValues: { search: '' },
  });
  const search = watch('search');
  const debouncedSearch = useDebounce(search, SEARCH_DEBOUNCE_MS);
  const { data: customers = [], refetch } = useSearchCustomersQuery(debouncedSearch);

  const createCustomer = useCreateCustomerMutation();

  // Criação: uncontrolled + validação zod.
  const { register, handleSubmit, reset, formState } = useForm<CustomerFormInput>({
    resolver: zodResolver(customerFormSchema),
    mode: 'onChange',
  });

  const submit = handleSubmit(({ name }) => {
    createCustomer.mutate(name, {
      onSuccess: (created) => {
        void refetch();
        reset();
        onPick({ ...created, openBalance: 0 });
      },
      onError: (error) => toast(apiErrorMessage(error), 'danger'),
    });
  });

  return { registerFilter, customers, register, submit, canCreate: formState.isValid };
}
```

### `CustomerModal.tsx` — ViewModel (cola Model ↔ View)

```tsx
import { formatBRL } from '@/lib/format';
import { useCustomerModalModel } from './CustomerModal.model';
import { CustomerModalView } from './CustomerModal.view';
import type { CustomerModalProps, CustomerRow } from './CustomerModal.types';

export function CustomerModal({ onPick, onClose }: CustomerModalProps) {
  const { registerFilter, customers, register, submit, canCreate } =
    useCustomerModalModel(onPick);

  const rows: CustomerRow[] = customers.map((customer) => ({
    key: customer.id,
    onClick: () => onPick(customer),
    cells: [customer.name, formatBRL(customer.openBalance)],
  }));

  return (
    <CustomerModalView
      registerFilter={registerFilter}
      rows={rows}
      register={register}
      onSubmit={submit}
      canCreate={canCreate}
      onClose={onClose}
    />
  );
}
```

### `CustomerModal.view.tsx` — View (JSX puro)

```tsx
import { Search } from 'lucide-react';
import { SBtn, SModal, STable } from '@/components/sol';
import type { CustomerModalViewProps } from './CustomerModal.types';

export function CustomerModalView({
  registerFilter,
  rows,
  register,
  onSubmit,
  canCreate,
  onClose,
}: CustomerModalViewProps) {
  return (
    <SModal title="Cliente do fiado (F8)" onClose={onClose} width={460}>
      <div className="s-input mb-2.5">
        <Search size={15} />
        <input autoFocus placeholder="Buscar cliente…" {...registerFilter('search')} />
      </div>

      <STable
        cols={['Nome', 'Em aberto']}
        widths="1fr 110px"
        align={[null, 'right']}
        dense
        emptyText="Nenhum cliente"
        rows={rows}
      />

      <div className="s-divider" />

      <form className="flex gap-2" onSubmit={onSubmit}>
        <div className="s-input flex-1">
          <input placeholder="Novo cliente — nome" {...register('name')} />
        </div>
        <SBtn ghost type="submit" disabled={!canCreate}>
          + Cadastrar
        </SBtn>
      </form>
    </SModal>
  );
}
```

### `index.ts` — barrel

```ts
export { CustomerModal } from './CustomerModal';
export type { CustomerModalProps } from './CustomerModal.types';
```

Quem importa continua fazendo `import { CustomerModal } from '.../CustomerModal'`
— a pasta e o barrel são transparentes para quem usa.

## Como decidir o que vai onde

- **Vai para o Model** se: usa `useState`/`useReducer`, chama `main`
  (queries/mutations), ou é regra que existiria mesmo sem tela.
- **Vai para o ViewModel** se: é _formatação para exibir_ (`formatBRL`), montar
  `rows`, calcular flags (`canCreate`), ou traduzir evento da View em ação do
  Model.
- **Vai para a View** se: é JSX ou estado puramente visual (foco, aberto/fechado
  de um tooltip). A View nunca sabe de onde os dados vieram.

## Estilização (Tailwind)

**Toda estilização é via classes Tailwind. `style={{}}` inline é proibido.**

```tsx
// ❌ nunca
<div style={{ display: 'flex', gap: 8 }}>
<div className="s-input" style={{ marginBottom: 10 }}>

// ✅ sempre
<div className="flex gap-2">
<div className="s-input mb-2.5">
```

- As classes do design system (`s-input`, `s-modal`, `s-divider`, `s-btn`…)
  continuam válidas — são componentes de UI, não estilo ad-hoc. Combine-as com
  utilitários Tailwind no mesmo `className` (`className="s-input flex-1"`).
- **Única exceção ao inline:** valor de estilo **calculado em runtime** que o
  Tailwind não expressa (ex.: `gridTemplateColumns` montado a partir de props).
  Mesmo aí, prefira uma **CSS variable** + classe Tailwind arbitrária antes de
  cair no `style`. Se usar `style`, que seja só a propriedade dinâmica — nunca
  layout estático (`flex`, `gap`, `margin`) que tem utilitário pronto.
- Estilo que não cabe em utilitário e se repete → classe no design system
  (CSS) ou, em último caso, `{Componente}.styles.ts`. Não é o caminho padrão.

## Ícones (lucide-react)

**Todo ícone vem de [`lucide-react`](https://lucide.dev). Não desenhar `<svg>`
inline nem manter ícones próprios em componentes.**

```tsx
// ❌ nunca — SVG à mão ou componente de ícone caseiro
<SolIcon name="search" size={15} />
<svg viewBox="0 0 20 20">…</svg>

// ✅ sempre — ícone nomeado do lucide, na View
import { Search } from 'lucide-react';
<Search size={15} />
```

- Importe o ícone **pelo nome** (`import { Search, Trash2 } from 'lucide-react'`).
  Herdam `currentColor`, então a cor vem do CSS/Tailwind do container.
- Ícone é UI → mora na **View**. O ViewModel/Model nunca importam `lucide-react`.
- Ícones legados (`SolIcon` e o `<svg>` do design system) estão em migração para
  o lucide; código novo já nasce com lucide.

## Formulários (React Hook Form)

**Todo campo de formulário passa pelo [`react-hook-form`](https://react-hook-form.com).
Nunca `useState` por campo.** A preferência é sempre _uncontrolled_ (`register`);
o _controlled_ (`Controller`) é o fallback para quando o campo não pode ser
uncontrolled. Validação por `zod` via `zodResolver`.

```tsx
// ❌ nunca — um useState por campo, validação na mão
const [name, setName] = useState('');
<input value={name} onChange={(e) => setName(e.target.value)} />

// ✅ preferencial — uncontrolled via register
<input {...register('name')} />

// ✅ fallback — controlled via Controller, quando não dá para ser uncontrolled
<Controller
  control={control}
  name="paymentMethod"
  render={({ field }) => <CustomSelect {...field} />}
/>
```

**Uncontrolled é o padrão. Só caia no `Controller` quando o campo não puder ser
uncontrolled** — tipicamente componentes de terceiros que só expõem
`value`/`onChange` e não encaminham `ref` (selects customizados, date pickers,
inputs com máscara).

Divisão nas camadas MVVM:

| Onde              | O quê                                                                 |
| ----------------- | --------------------------------------------------------------------- |
| `.schema.ts`      | `z.object({...})` + tipo inferido (`z.infer`). Fonte de verdade.       |
| `.model.ts`       | `useForm({ resolver: zodResolver(schema) })`. Expõe `register`, `submit = handleSubmit(...)`, `formState`. |
| `.tsx` (ViewModel)| Repassa `register`/`submit`/`errors` para a View.                     |
| `.view.tsx`       | `<form onSubmit={submit}>` + `<input {...register('campo')} />`.      |

- **`submit` já vem pronto do Model** (`handleSubmit(fn)`), a View só o liga no
  `<form onSubmit>`. A View não conhece `handleSubmit`.
- Botão de enviar é `type="submit"` + `disabled={!canCreate}`, onde `canCreate`
  vem de `formState.isValid` (use `mode: 'onChange'` no `useForm`).
- Depois de submeter com sucesso, o Model dá `reset()`.
- **Filtro/busca também é RHF — e continua uncontrolled.** Um input que dispara
  uma query a cada tecla (ex.: o `search` do `CustomerModal`) usa `register`
  (uncontrolled) e lê o valor reativo via `watch('search')` para alimentar a
  query. Não precisa virar controlled só por precisar do valor a cada mudança, e
  nunca usa `useState`. Como o filtro não valida nada, seu `useForm` dispensa
  `zodResolver` e schema — é a exceção à regra do `.schema.ts`.

## Barrel file — obrigatório

Toda pasta de componente **sempre** tem `index.ts`. Ele reexporta:

- o componente (o ViewModel — `export { CustomerModal }`);
- os tipos que fazem parte da API pública (`export type { CustomerModalProps }`).

Não reexporte `model`, `view` nem `types` internos: só o que é consumido de fora.

## Quando cada arquivo é opcional

| Arquivo       | Quando existe                                                            |
| ------------- | ------------------------------------------------------------------------ |
| `.types.ts`   | Sempre que o componente tem tipos próprios (quase sempre).               |
| `.model.ts`   | Sempre que há estado ou acesso a dados. Componente 100% visual não tem.  |
| `.view.tsx`   | Quando há model/adaptação (o `.tsx` é o ViewModel e a View é separada).  |
| `.tsx`        | Sempre (é o export público).                                            |
| `.schema.ts`  | Só quando o componente tem formulário (zod + RHF).                      |
| `.styles.ts`  | Raro. Só CSS que o Tailwind não cobre — não é o caminho padrão.         |
| `index.ts`    | Sempre.                                                                  |

Componente sem estado nenhum (puramente apresentacional) pode dispensar o
`.model.ts`: o ViewModel (`.tsx`) recebe props, adapta e entrega à View. Não crie
um Model vazio só para ter os quatro arquivos.

## Componente puramente apresentacional

Quando não há **nem estado, nem dados, nem adaptação** — o componente só recebe
props prontas e renderiza — ele colapsa em um único arquivo: o próprio
`{Nome}.tsx` **é** a View. Sem `.model`, sem `.view` separado.

```
ScanBox/
  ScanBox.tsx        # a View (recebe props e renderiza)
  ScanBox.types.ts   # props
  index.ts           # barrel
```

É o caso típico ao **quebrar uma página grande** (ex.: `SalePage`) em pedaços de
UI: cada pedaço (`ScanBox`, `PaymentTiles`, `CashPanel`…) é uma View pura; toda a
lógica continua no Model da página, que distribui props para os filhos.

**Props via `Pick` do ViewModel da página.** Como esses pedaços são locais e
recebem fatias do VM da página, tipe as props com `Pick` para não duplicar tipos
nem sair de sincronia:

```ts
// PaymentTiles.types.ts
import type { SalePageViewModel } from '../../SalePage/SalePage.model';

export type PaymentTilesProps = Pick<SalePageViewModel, 'payment' | 'onSelectPayment'>;
```

Na composição, a página espalha o VM inteiro para cada filho (`<PaymentTiles {...vm} />`);
cada um consome só a fatia que declarou no `Pick` — o excesso é ignorado.

## Ganho de teste

- **Model** testa em isolamento com `renderHook` — estado e chamadas a `main`,
  sem renderizar JSX.
- **View** testa como função pura de props — sem mockar `main`.
- **ViewModel** cobre a adaptação (ex.: `canCreate` vira `false` com nome curto).

## Onde isso mora

Vale para componentes **globais** (`presentation/components/`) e **locais** de um
flow (`presentation/flows/{flow}/components/`) — a regra global/local de
[arquiteture.md](./arquiteture.md#padrão-de-presentation) não muda. O que muda é
que, em ambos os casos, o componente é uma **pasta MVVM com barrel**, não um
arquivo solto.

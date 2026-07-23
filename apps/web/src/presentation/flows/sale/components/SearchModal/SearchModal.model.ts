import { useForm } from 'react-hook-form';
import type { Product } from '@/domain/models/sale';
import { useSearchProductsQuery } from '@/main/factories/queries/sale';
import { useDebounce } from '@/presentation/hooks';
import type { SearchFilterInput } from './SearchModal.types';

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_RESULTS_LIMIT = 8;

export function useSearchModalModel(initialQuery: string, onPick: (product: Product) => void) {
  const { register, watch, handleSubmit } = useForm<SearchFilterInput>({
    defaultValues: { search: initialQuery },
  });
  const search = watch('search');
  const debouncedSearch = useDebounce(search, SEARCH_DEBOUNCE_MS);
  const { data } = useSearchProductsQuery(debouncedSearch, SEARCH_RESULTS_LIMIT);
  const results = data?.items ?? [];

  // Enter no input seleciona o primeiro resultado.
  const submitFirst = handleSubmit(() => {
    const first = results[0];
    if (first) onPick(first);
  });

  return { register, search, results, submitFirst };
}

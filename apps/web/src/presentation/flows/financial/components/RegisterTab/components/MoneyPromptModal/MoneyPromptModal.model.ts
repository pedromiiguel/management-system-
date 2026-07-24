import { useState } from 'react';
import { parseMoney } from '@/lib/format';

export function useMoneyPromptModalModel() {
  const [raw, setRaw] = useState('');
  const value = parseMoney(raw);
  const valid = Number.isFinite(value) && value >= 0;
  return { raw, setRaw, value, valid };
}

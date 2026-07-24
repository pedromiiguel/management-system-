import { useMutation } from '@tanstack/react-query';
import type {
  CashMovementInput,
  CloseRegisterInput,
  ManualEntryInput,
  OpenRegisterInput,
  PayableInput,
  SettleReceivableInput,
} from '@/domain/models/financial';
import {
  makeCloseCashRegister,
  makeCreateCashMovement,
  makeCreateFinancialEntry,
  makeCreatePayable,
  makeOpenCashRegister,
  makePayPayable,
  makeSettleReceivable,
} from '@/main/factories/handlers/financial';

export function useOpenCashRegisterMutation() {
  return useMutation({ mutationFn: (input: OpenRegisterInput) => makeOpenCashRegister().open(input) });
}

export function useCreateCashMovementMutation() {
  return useMutation({ mutationFn: (input: CashMovementInput) => makeCreateCashMovement().create(input) });
}

export function useCloseCashRegisterMutation() {
  return useMutation({ mutationFn: (input: CloseRegisterInput) => makeCloseCashRegister().close(input) });
}

export function useSettleReceivableMutation() {
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SettleReceivableInput }) =>
      makeSettleReceivable().settle(id, input),
  });
}

export function useCreatePayableMutation() {
  return useMutation({ mutationFn: (input: PayableInput) => makeCreatePayable().create(input) });
}

export function usePayPayableMutation() {
  return useMutation({ mutationFn: (id: string) => makePayPayable().pay(id) });
}

export function useCreateFinancialEntryMutation() {
  return useMutation({ mutationFn: (input: ManualEntryInput) => makeCreateFinancialEntry().create(input) });
}

import { useCloseRegisterModalModel } from './CloseRegisterModal.model';
import { CloseRegisterModalView } from './CloseRegisterModal.view';
import type { CloseRegisterModalProps } from './CloseRegisterModal.types';

export function CloseRegisterModal({ expected, onDone, onClose }: CloseRegisterModalProps) {
  const { raw, setRaw, valid, difference, saving, submit } = useCloseRegisterModalModel(expected, onDone);

  return (
    <CloseRegisterModalView
      expected={expected}
      raw={raw}
      valid={valid}
      difference={difference}
      saving={saving}
      onChangeRaw={setRaw}
      onSubmit={submit}
      onClose={onClose}
    />
  );
}

import { PaymentMethod } from '@beverage/shared';
import { SBtn, STag } from '@/components/sol';
import { Screen } from '@/presentation/components/Screen';
import { CashPanel } from '../components/CashPanel';
import { CreditPanel } from '../components/CreditPanel';
import { PaymentTiles } from '../components/PaymentTiles';
import { SaleChargesCard } from '../components/SaleChargesCard';
import { SaleHotkeyStrip } from '../components/SaleHotkeyStrip';
import { SaleItemsCard } from '../components/SaleItemsCard';
import { SaleModals } from '../components/SaleModals';
import { SaleTotalCard } from '../components/SaleTotalCard';
import { ScanBox } from '../components/ScanBox';
import type { SalePageViewModel } from './SalePage.model';

export function SalePageView(vm: SalePageViewModel) {
  return (
    <Screen
      title="Frente de Caixa"
      topRight={
        <>
          {vm.saleTag ? <STag tone="accent">{vm.saleTag}</STag> : null}
          <STag tone="dim">Operador: {vm.operatorName ?? '—'}</STag>
        </>
      }
    >
      <div className="grid grid-cols-[1fr_332px] gap-4 h-full">
        {/* Coluna esquerda — scan + itens */}
        <div className="flex flex-col gap-3 min-w-0">
          <ScanBox {...vm} />
          <SaleItemsCard {...vm} />
          <SaleHotkeyStrip />
        </div>

        {/* Coluna direita — checkout */}
        <div className="flex flex-col gap-2.5">
          <SaleTotalCard {...vm} />
          <SaleChargesCard {...vm} />
          <PaymentTiles {...vm} />
          {vm.payment === PaymentMethod.CASH ? <CashPanel {...vm} /> : null}
          {vm.payment === PaymentMethod.CREDIT ? <CreditPanel {...vm} /> : null}
          <div className="flex-1" />
          <SBtn primary big kbd="F10" onClick={vm.onFinalize} disabled={vm.isCompletingSale}>
            {vm.isCompletingSale ? 'Finalizando…' : 'Finalizar venda'}
          </SBtn>
          <SBtn ghost danger kbd="Esc" onClick={vm.onRequestCancel}>
            Cancelar venda
          </SBtn>
        </div>
      </div>

      <SaleModals {...vm} />
    </Screen>
  );
}

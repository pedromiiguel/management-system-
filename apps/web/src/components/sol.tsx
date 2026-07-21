import { clsx } from 'clsx';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from 'react';

// ---------- Ícones do design (handoff hi-fi — SolIcon) ----------

export type IconName =
  | 'pdv'
  | 'produtos'
  | 'estoque'
  | 'financeiro'
  | 'relatorios'
  | 'config'
  | 'sun'
  | 'search'
  | 'scan'
  | 'trash';

export function SolIcon({ name, size = 17 }: { name: IconName; size?: number }) {
  const p = {
    width: size,
    height: size,
    viewBox: '0 0 20 20',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'pdv':
      return <svg {...p}><path d="M3 4v12M6.5 4v12M10 4v12M13 4v8M16.5 4v12" /></svg>;
    case 'produtos':
      return <svg {...p}><path d="M3 7l7-4 7 4v6l-7 4-7-4V7z" /><path d="M3 7l7 4 7-4M10 11v6" /></svg>;
    case 'estoque':
      return <svg {...p}><rect x="3" y="11" width="6" height="6" /><rect x="11" y="11" width="6" height="6" /><rect x="7" y="3" width="6" height="6" /></svg>;
    case 'financeiro':
      return <svg {...p}><circle cx="10" cy="10" r="7.5" /><path d="M10 6v8M12.4 7.6c-.5-.9-4.8-1.3-4.8.9 0 2.4 4.9 1.1 4.9 3.4 0 2-4.3 1.9-5 .8" /></svg>;
    case 'relatorios':
      return <svg {...p}><path d="M4 16V9M9 16V4M14 16v-5" /><path d="M2.5 17.5h15" /></svg>;
    case 'config':
      return <svg {...p}><path d="M3 6h14M3 14h14" /><circle cx="8" cy="6" r="1.8" fill="currentColor" stroke="none" /><circle cx="13" cy="14" r="1.8" fill="currentColor" stroke="none" /></svg>;
    case 'sun':
      return <svg {...p} strokeWidth={1.8}><circle cx="10" cy="10" r="3.6" /><path d="M10 2.2v2M10 15.8v2M2.2 10h2M15.8 10h2M4.5 4.5l1.4 1.4M14.1 14.1l1.4 1.4M15.5 4.5l-1.4 1.4M5.9 14.1l-1.4 1.4" /></svg>;
    case 'search':
      return <svg {...p}><circle cx="9" cy="9" r="5.5" /><path d="M13.2 13.2L17 17" /></svg>;
    case 'scan':
      return <svg {...p}><path d="M2.5 6V3.5H6M14 3.5h3.5V6M17.5 14v2.5H14M6 16.5H2.5V14" /><path d="M5.5 7v6M8 7v6M10.5 7v4M13 7v6" /></svg>;
    case 'trash':
      return <svg {...p}><path d="M4 5.5h12M7.5 5.5V4a1 1 0 011-1h3a1 1 0 011 1v1.5M8 9v5.5M12 9v5.5" /><path d="M5.5 5.5l.6 9.7a1.5 1.5 0 001.5 1.4h4.8a1.5 1.5 0 001.5-1.4l.6-9.7" /></svg>;
  }
}

// ---------- Primitivas ----------

export function SCard({
  children,
  pad = 16,
  style,
  className,
}: {
  children: ReactNode;
  pad?: number;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div className={clsx('s-card', className)} style={{ padding: pad, ...style }}>
      {children}
    </div>
  );
}

export function SBtn({
  children,
  primary,
  ghost,
  danger,
  big,
  kbd,
  icon,
  style,
  onClick,
  disabled,
  type = 'button',
}: {
  children: ReactNode;
  primary?: boolean;
  ghost?: boolean;
  danger?: boolean;
  big?: boolean;
  kbd?: string;
  icon?: IconName;
  style?: CSSProperties;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      className={clsx('s-btn', primary && 'is-primary', ghost && 'is-ghost', danger && 'is-danger', big && 'is-big')}
      style={style}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {icon ? <SolIcon name={icon} size={15} /> : null}
      <span>{children}</span>
      {kbd ? <SKbd light={primary}>{kbd}</SKbd> : null}
    </button>
  );
}

export function SIconBtn({
  icon,
  danger,
  title,
  onClick,
}: {
  icon: IconName;
  danger?: boolean;
  title?: string;
  onClick?: (e: MouseEvent) => void;
}) {
  return (
    <button
      className={clsx('s-icon-btn', danger && 'is-danger')}
      title={title}
      aria-label={title}
      onClick={onClick}
      type="button"
    >
      <SolIcon name={icon} size={15} />
    </button>
  );
}

export function SKbd({ children, light }: { children: ReactNode; light?: boolean }) {
  return <span className={clsx('s-kbd', light && 'is-light')}>{children}</span>;
}

export function STag({
  children,
  tone = 'ok',
}: {
  children: ReactNode;
  tone?: 'ok' | 'warn' | 'dim' | 'accent' | 'danger';
}) {
  return <span className={`s-tag is-${tone}`}>{children}</span>;
}

export function SChip({
  children,
  active,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button className={clsx('s-chip', active && 'is-active')} onClick={onClick} type="button">
      {children}
    </button>
  );
}

export interface STableProps {
  cols: ReactNode[];
  widths: string;
  rows: {
    key: string;
    cells: ReactNode[];
    highlight?: boolean;
    onClick?: () => void;
    testId?: string;
  }[];
  align?: (CSSProperties['textAlign'] | null)[];
  dense?: boolean;
  emptyText?: string;
}

export function STable({ cols, widths, rows, align, dense, emptyText }: STableProps) {
  return (
    <div className={clsx('s-table', dense && 'is-dense')}>
      <div className="s-tr s-th" style={{ gridTemplateColumns: widths }}>
        {cols.map((c, i) => (
          <div key={i} style={{ textAlign: align?.[i] ?? 'left' }}>{c}</div>
        ))}
      </div>
      {rows.length === 0 && (
        <div className="s-dim" style={{ padding: '14px 12px', fontSize: 13 }}>
          {emptyText ?? 'Nenhum registro'}
        </div>
      )}
      {rows.map((row) => (
        <div
          key={row.key}
          data-testid={row.testId}
          className={clsx('s-tr', row.highlight && 'is-hl', row.onClick && 'is-selectable')}
          style={{ gridTemplateColumns: widths }}
          onClick={row.onClick}
        >
          {row.cells.map((c, j) => (
            <div key={j} style={{ textAlign: align?.[j] ?? 'left' }}>{c}</div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function SStat({
  label,
  value,
  sub,
  accent,
  style,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: boolean;
  style?: CSSProperties;
}) {
  return (
    <SCard style={{ flex: 1, ...style }}>
      <div className="s-stat-label">{label}</div>
      <div className={clsx('s-stat-value', accent && 'is-accent')}>{value}</div>
      {sub ? <div className="s-dim" style={{ fontSize: 12.5 }}>{sub}</div> : null}
    </SCard>
  );
}

export function SBars({
  values,
  labels,
  height = 150,
  hl,
}: {
  values: number[];
  labels: string[];
  height?: number;
  hl?: number;
}) {
  const max = Math.max(...values, 1);
  return (
    <div className="s-bars" style={{ height }}>
      {values.map((v, i) => (
        <div key={i} className="s-bar-col">
          <div
            className={clsx('s-bar', i === hl && 'is-hl')}
            style={{ height: `${Math.max(4, (v / max) * 100)}%` }}
            title={String(v)}
          />
          <div className="s-bar-label">{labels[i]}</div>
        </div>
      ))}
    </div>
  );
}

export function SProgress({ pct, height = 10 }: { pct: number; height?: number }) {
  return (
    <div className="s-progress" style={{ height }}>
      <div className="s-progress-fill" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

export function SToggle({
  on,
  label,
  ariaLabel,
  onChange,
}: {
  on: boolean;
  label?: string;
  ariaLabel?: string;
  onChange?: (on: boolean) => void;
}) {
  return (
    <button
      className="s-toggle-wrap"
      onClick={() => onChange?.(!on)}
      type="button"
      aria-label={ariaLabel ?? label}
      aria-pressed={on}
    >
      <span className={clsx('s-toggle', on && 'is-on')}>
        <span className="s-knob" />
      </span>
      {label ? <span style={{ fontSize: 13.5 }}>{label}</span> : null}
    </button>
  );
}

export function SCheck({ on, onChange }: { on: boolean; onChange?: (on: boolean) => void }) {
  return (
    <button
      className={clsx('s-checkbox', on && 'is-on')}
      onClick={onChange ? () => onChange(!on) : undefined}
      type="button"
      style={onChange ? undefined : { cursor: 'default' }}
    >
      {on ? '✓' : ''}
    </button>
  );
}

export function SSeg<T extends string>({
  items,
  active,
  onChange,
}: {
  items: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="s-seg">
      {items.map((item) => (
        <button
          key={item.id}
          className={clsx('s-seg-item', item.id === active && 'is-active')}
          onClick={() => onChange(item.id)}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function SDre({
  op,
  label,
  value,
  strong,
  accent,
}: {
  op: string;
  label: string;
  value: ReactNode;
  strong?: boolean;
  accent?: boolean;
}) {
  return (
    <div className={clsx('s-dre', strong && 'is-strong', accent && 'is-result')}>
      <span className="s-dre-op">{op}</span>
      <span style={{ flex: 1 }}>{label}</span>
      <span className="s-dre-val">{value}</span>
    </div>
  );
}

// ---------- Modal ----------

export function SModal({
  title,
  onClose,
  children,
  width,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}) {
  const titleId = useId();
  return (
    <div className="s-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="s-modal"
        style={width ? { width } : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="s-modal-title" id={titleId}>{title}</div>
        {children}
      </div>
    </div>
  );
}

// ---------- Toast ----------

type ToastTone = 'info' | 'warn' | 'danger';
interface ToastState { message: string; tone: ToastTone }

const ToastContext = createContext<(message: string, tone?: ToastTone) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    setToast({ message, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div className={clsx('s-toast', toast.tone === 'warn' && 'is-warn', toast.tone === 'danger' && 'is-danger')}>
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

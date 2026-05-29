import '../styles/module.css';

interface ConfigField {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}

interface ConfigRowProps {
  fields: ConfigField[];
  balanceInfo?: { balanced: boolean; message: string };
}

export function ConfigRow({ fields, balanceInfo }: ConfigRowProps) {
  return (
    <div className="config-row">
      {fields.map((field) => (
        <div key={field.label} className="config-field">
          <div className="config-label">{field.label}</div>
          <input
            className="config-input"
            type="number"
            value={field.value}
            min={field.min ?? 1}
            max={field.max ?? 10}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v) && v >= (field.min ?? 1) && v <= (field.max ?? 10)) {
                field.onChange(v);
              }
            }}
          />
        </div>
      ))}
      {balanceInfo && (
        <div className={`balance-tag ${balanceInfo.balanced ? 'ok' : 'warn'}`}>
          {balanceInfo.message}
        </div>
      )}
    </div>
  );
}

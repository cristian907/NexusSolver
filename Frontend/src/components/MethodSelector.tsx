import '../styles/module.css';

interface MethodSelectorProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}

export function MethodSelector({ options, value, onChange, label }: MethodSelectorProps) {
  return (
    <div className="method-selector-wrap">
      <span className="method-selector-label">{label}</span>
      <select
        className="method-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

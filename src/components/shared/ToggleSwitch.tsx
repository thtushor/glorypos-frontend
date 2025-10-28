import React from 'react';

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (value: boolean) => void;
    label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  enabled,
  onChange,
  label,
  description,
  className,
  size = 'md',
}) => {
  const sizes = {
    sm: {
      switch: 'w-8 h-4',
      dot: 'h-3 w-3',
      translate: enabled ? 'translate-x-4' : 'translate-x-1',
    },
    md: {
      switch: 'w-11 h-6',
      dot: 'h-4 w-4',
      translate: enabled ? 'translate-x-6' : 'translate-x-1',
    },
    lg: {
      switch: 'w-14 h-7',
      dot: 'h-5 w-5',
      translate: enabled ? 'translate-x-8' : 'translate-x-1',
    },
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`
          relative inline-flex
          ${sizes[size].switch}
          items-center rounded-full
          transition-colors duration-200 ease-in-out
          focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-opacity-75
          ${enabled ? 'bg-brand-primary' : 'bg-gray-200'}
          ${enabled ? 'hover:bg-brand-primary/90' : 'hover:bg-gray-300'}
          ${className}
        `}
      >
        <span className="sr-only">{label}</span>
        <span
          className={`
            ${sizes[size].dot}
            ${sizes[size].translate}
            inline-block rounded-full
            bg-white shadow-lg
            transform transition-transform duration-200 ease-in-out
          `}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-sm font-medium text-gray-900">{label}</span>
          )}
          {description && (
            <span className="text-sm text-gray-500">{description}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default ToggleSwitch; 
import {
  InputHTMLAttributes,
  ComponentType,
  SVGProps,
  ReactNode,
  useState,
  ChangeEvent,
} from "react";
import { IconType } from "react-icons";
import { FaEye, FaEyeSlash } from "react-icons/fa";

interface InputWithIconProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  name?: string;
  icon?: IconType | ComponentType<SVGProps<SVGSVGElement>> | ReactNode;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  className?: string;
  buttonContainerClassName?: string;

  // NEW: LABEL SUPPORT
  label?: string;
  labelClassName?: string;
  hideLabelVisually?: boolean; // For screen readers only
}

const InputWithIcon: React.FC<InputWithIconProps> = ({
  icon: Icon,
  name,
  value,
  defaultValue,
  onChange,
  placeholder,
  type = "text",
  required = false,
  className = "",
  buttonContainerClassName = "",
  label,
  labelClassName = "block text-sm font-medium text-gray-700 mb-1",
  hideLabelVisually = false,
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputValue = value != null ? String(value) : undefined;
  const hasLabel = !!label;

  return (
    <div className={buttonContainerClassName}>
      {/* LABEL */}
      {hasLabel && (
        <label
          htmlFor={name}
          className={`${labelClassName} ${hideLabelVisually ? "sr-only" : ""}`}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        {/* ICON */}
        {Icon && (
          <div className="absolute z-30 border-r border-gray-200 inset-y-0 left-0 px-3 flex items-center pointer-events-none">
            {typeof Icon === "function" ? (
              <Icon className="w-[16px] h-[16px] text-gray-400" />
            ) : (
              Icon
            )}
          </div>
        )}

        {/* INPUT */}
        {type !== "textarea" ? (
          <input
            id={name}
            name={name}
            type={type === "password" && showPassword ? "text" : type}
            required={required}
            className={`appearance-none no-spinner disabled:bg-gray-50 disabled:border-gray-200 disabled:text-gray-400 disabled:placeholder-gray-300 disabled:cursor-not-allowed bg-white placeholder:text-gray-400 text-gray-700 relative block w-full ${
              Icon ? "pl-12" : "pl-2"
            } pr-10 py-2 border border-gray-200 rounded-[4px] focus:outline-none focus:ring-brand-primary focus:border-brand-primary focus:z-10 sm:text-sm ${className}`}
            placeholder={placeholder}
            value={inputValue}
            defaultValue={defaultValue}
            onChange={onChange as any}
            onWheel={(e) => e.currentTarget.blur()}
            {...rest}
          />
        ) : (
          <textarea
            id={name}
            name={name}
            required={required}
            className={`appearance-none disabled:bg-gray-50 disabled:border-gray-200 disabled:text-gray-400 disabled:placeholder-gray-300 disabled:cursor-not-allowed bg-white placeholder:text-gray-400 text-gray-700 relative block w-full pl-2 pr-10 py-2 border border-gray-200 rounded-[4px] focus:outline-none focus:ring-brand-primary focus:border-brand-primary focus:z-10 sm:text-sm ${className}`}
            placeholder={placeholder}
            value={inputValue}
            defaultValue={defaultValue}
            rows={3}
            onChange={onChange as any}
            {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        )}

        {/* PASSWORD TOGGLE */}
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute inset-y-0 right-0 px-3 flex items-center cursor-pointer text-gray-400 hover:text-gray-600"
          >
            {showPassword ? (
              <FaEyeSlash className="w-[16px] h-[16px]" />
            ) : (
              <FaEye className="w-[16px] h-[16px]" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default InputWithIcon;

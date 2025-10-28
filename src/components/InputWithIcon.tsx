import {
  InputHTMLAttributes,
  ComponentType,
  SVGProps,
  ReactNode,
  useState,
} from "react";
import { IconType } from "react-icons";
import { FaEye, FaEyeSlash } from "react-icons/fa";

interface InputWithIconProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: IconType | ComponentType<SVGProps<SVGSVGElement>> | ReactNode;
  name: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: any) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  className?: string;
  buttonContainerClassName?: string;
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
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={`relative ${buttonContainerClassName}`}>
      {Icon && (
        <div className="absolute z-30 border-r border-gray-200 inset-y-0 left-0 px-3 flex items-center pointer-events-none">
          {typeof Icon === "function" ? (
            <Icon className="w-[16px] h-[16px] text-gray-400" />
          ) : (
            Icon
          )}
        </div>
      )}

      {type !== "textarea" && (
        <input
          id={name}
          name={name}
          type={type === "password" && showPassword ? "text" : type}
          required={required}
          className={`appearance-none no-spinner disabled:bg-gray-50 disabled:border-gray-200 disabled:text-gray-400 disabled:placeholder-gray-300 disabled:cursor-not-allowed    bg-white placeholder:text-gray-400 text-gray-700 relative block w-full ${
            Icon ? "pl-12" : "pl-2"
          } pr-10 py-2 border border-gray-200 rounded-[4px] focus:outline-none focus:ring-brand-primary focus:border-brand-primary focus:z-10 sm:text-sm ${className}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          defaultValue={defaultValue}
          onWheel={(e) => e.currentTarget.blur()}
          {...props}
        />
      )}

      {type === "textarea" && (
        <textarea
          value={value}
          onChange={onChange}
          defaultValue={defaultValue}
          rows={3}
          className={`appearance-none disabled:bg-gray-50 disabled:border-gray-200 disabled:text-gray-400 disabled:placeholder-gray-300 disabled:cursor-not-allowed 
    bg-white placeholder:text-gray-400 text-gray-700 relative block w-full
    pl-2 pr-10 py-2 border border-gray-200 rounded-[4px] 
    focus:outline-none focus:ring-brand-primary focus:border-brand-primary focus:z-10 sm:text-sm ${className}`}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} // Ensure only valid textarea attributes are spread
        />
      )}

      {type === "password" && (
        <button
          type="button"
          onClick={togglePasswordVisibility}
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
  );
};

export default InputWithIcon;

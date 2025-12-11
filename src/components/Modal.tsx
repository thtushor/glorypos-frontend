import { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  titleContainerClassName?: string;
  useInnerModal?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  titleContainerClassName,
  className,
  useInnerModal = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${
        useInnerModal ? "p-0" : "p-4"
      }`}
    >
      <div
        className={` ${
          useInnerModal ? "" : "bg-white p-6 custom-scrollbar overflow-auto"
        }  rounded-lg  w-full sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl max-h-[90vh]  ${className}`}
      >
        <div
          className={`flex  items-center  ${
            !useInnerModal
              ? "mb-6 justify-between"
              : "mb-[-45px] mr-4 flex items-center justify-center pb-1 bg-white ml-auto w-[30px] h-[30px] relative z-[50] rounded-md"
          } ${titleContainerClassName}`}
        >
          {!useInnerModal && (
            <h2 className="text-xl font-semibold text-gray-800">
              {title || ""}
            </h2>
          )}
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        <div className="text-gray-700">{children}</div>
      </div>
    </div>
  );
};

export default Modal;

// src/components/ActionMenu.tsx
import { Menu, Transition } from "@headlessui/react";
import { Fragment, ReactNode } from "react";
import { FaEllipsisV } from "react-icons/fa";

interface Action {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  danger?: boolean;
  color?: string; // example: "blue", "green", "red", etc.
}

interface ActionMenuProps {
  isLargeData: boolean;
  actions: Action[];
}

const colorMap: Record<
  string,
  {
    bg: string;
    text: string;
    border: string;
    hoverBg: string;
    hoverBorder: string;
  }
> = {
  blue: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border border-blue-400",
    hoverBg: "hover:bg-blue-500",
    hoverBorder: "hover:border-blue-500",
  },
  green: {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border border-green-400",
    hoverBg: "hover:bg-green-500",
    hoverBorder: "hover:border-green-500",
  },
  yellow: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    border: "border border-yellow-400",
    hoverBg: "hover:bg-yellow-500",
    hoverBorder: "hover:border-yellow-500",
  },
  purple: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border border-purple-400",
    hoverBg: "hover:bg-purple-500",
    hoverBorder: "hover:border-purple-500",
  },
  orange: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    border: "border border-orange-400",
    hoverBg: "hover:bg-orange-500",
    hoverBorder: "hover:border-orange-500",
  },
  teal: {
    bg: "bg-teal-100",
    text: "text-teal-700",
    border: "border border-teal-400",
    hoverBg: "hover:bg-teal-500",
    hoverBorder: "hover:border-teal-500",
  },
  indigo: {
    bg: "bg-indigo-100",
    text: "text-indigo-700",
    border: "border border-indigo-400",
    hoverBg: "hover:bg-indigo-500",
    hoverBorder: "hover:border-indigo-500",
  },
  cyan: {
    bg: "bg-cyan-100",
    text: "text-cyan-700",
    border: "border border-cyan-400",
    hoverBg: "hover:bg-cyan-500",
    hoverBorder: "hover:border-cyan-500",
  },
  red: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border border-red-400",
    hoverBg: "hover:bg-red-500",
    hoverBorder: "hover:border-red-500",
  },
  gray: {
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border border-gray-400",
    hoverBg: "hover:bg-gray-500",
    hoverBorder: "hover:border-gray-500",
  },
};

const ActionMenu: React.FC<ActionMenuProps> = ({ isLargeData, actions }) => {
  return (
    <Menu as="div" className="relative inline-block">
      {/* 3-dot button */}
      <Menu.Button
        className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-opacity-75 transition-colors"
        aria-label="More actions"
      >
        <FaEllipsisV className="w-4 h-4 text-gray-600" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          static
          className={` 
            fixed inset-x-4 bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)]
            max-w-md mx-auto mb-4 rounded-t-lg shadow-xl 
           z-50 ${
             isLargeData ? "min-h-[200px]" : "min-h-[140px]"
           }  overflow-y-auto p-[6px] 
            sm:absolute sm:left-[-95px] sm:top-[-20px]  sm:w-[200px]
            sm:rounded-[10px] sm:shadow-xl bg-white 
             !border-2 !outline-none !border-gray-300
          `}
        >
          <div className="absolute top-[-10px] z-[50] right-[10px] w-[18px] h-[18px] bg-gray-600 rotate-45   sm:block hidden" />
          <div className="flex flex-col gap-[6px] ">
            {actions.map((action, idx) => {
              const base =
                colorMap[action.color || (action.danger ? "red" : "gray")];

              return (
                <Menu.Item key={idx}>
                  {() => (
                    <button
                      onClick={action.onClick}
                      className={`
            group flex w-full items-center gap-3 rounded-[4px] py-[5px] px-[7px]
            text-left text-[12px] font-medium transition-all duration-200
            ${base.bg} ${base.text} ${base.border}
            ${base.hoverBg} ${base.hoverBorder}
          `}
                    >
                      <span className="flex-shrink-0 transition-colors duration-200 group-hover:text-white">
                        {action.icon}
                      </span>
                      <span className="transition-colors duration-200 group-hover:text-white">
                        {action.label}
                      </span>
                    </button>
                  )}
                </Menu.Item>
              );
            })}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default ActionMenu;

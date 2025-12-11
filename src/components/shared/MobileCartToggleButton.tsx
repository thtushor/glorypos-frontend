import { FaShoppingCart } from "react-icons/fa";

// const variantStyle = {
//   primary: "bg-brand-primary text-white",
//   secondary: "bg-gray-200 text-gray-800",
// };

function MobileCartToggleButton({
  onClick,
  open,
  cartItemsCount,
  enableMobileCart = true,
}: {
  onClick: () => void;
  open: boolean;
  cartItemsCount: number;
  enableMobileCart?: boolean;
}) {
  return (
    <button
      onClick={() => onClick()}
      className={` bottom-4 right-4 bg-brand-primary text-white p-4 rounded-full shadow-lg ${
        open ? "hidden" : "flex"
      } items-center justify-center ${
        !enableMobileCart && "xl:hidden"
      } fixed z-50`}
    >
      <div className="relative">
        <FaShoppingCart className="w-6 h-6" />
        {cartItemsCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {cartItemsCount}
          </span>
        )}
      </div>
    </button>
  );
}

export default MobileCartToggleButton;

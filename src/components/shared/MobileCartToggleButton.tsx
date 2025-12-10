import { FaShoppingCart } from "react-icons/fa";

function MobileCartToggleButton({
  onClick,
  open,
  cartItemsCount,
}: {
  onClick: () => void;
  open: boolean;
  cartItemsCount: number;
}) {
  return (
    <button
      onClick={() => onClick()}
      className={`xl:hidden fixed bottom-4 right-4 bg-brand-primary text-white p-4 rounded-full shadow-lg ${
        open ? "hidden" : "flex"
      } items-center justify-center`}
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

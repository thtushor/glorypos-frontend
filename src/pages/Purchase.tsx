import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Purchase.css";

interface Product {
  id: number;
  name: string;
  price: number;
}

const Purchase: React.FC = () => {
  const [items] = useState<Product[]>([
    { id: 1, name: "Product 1", price: 99.99 },
    { id: 2, name: "Product 2", price: 149.99 },
    { id: 3, name: "Product 3", price: 199.99 },
  ]);
  const navigate = useNavigate();

  return (
    <div className="purchase-container">
      <nav className="purchase-nav">
        <button onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </nav>
      <div className="purchase-content">
        <h2>Available Products</h2>
        <div className="products-grid">
          {items.map((item) => (
            <div key={item.id} className="product-card">
              <h3>{item.name}</h3>
              <p>${item.price}</p>
              <button>Purchase</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Purchase;

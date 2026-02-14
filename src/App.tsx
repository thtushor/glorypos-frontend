import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const queryClient = new QueryClient();

import { SocketProvider } from "./context/SocketContext";

function App() {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SocketProvider>
            <AppRoutes />
          </SocketProvider>
        </AuthProvider>
      </QueryClientProvider>
    </Router>
  );
}

export default App;

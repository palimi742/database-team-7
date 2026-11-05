import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./css/index.css";
import App from "./App.jsx";
import { ShopProvider } from "./context/ShopContext.jsx";
import CustomerSessionCheck from "./components/auth/CustomerSessionCheck.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <StrictMode>
      <CustomerSessionCheck>
        <ShopProvider>
          <App />
        </ShopProvider>
      </CustomerSessionCheck>
    </StrictMode>
  </BrowserRouter>,
);

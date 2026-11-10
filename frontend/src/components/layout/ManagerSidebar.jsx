import home from "../../assets/admin-assets/home.svg";
import cube from "../../assets/admin-assets/cube.svg";
import coupon from "../../assets/admin-assets/coupon.svg";
import undo from "../../assets/admin-assets/undo.svg";
import employee_manage from "../../assets/admin-assets/employee-manage.svg";
import loyalty from "../../assets/admin-assets/loyalty.svg";
import finance_monitoring from "../../assets/admin-assets/finance-monitoring.svg";
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { logoutStaff } from "../../api.js";
import "../../css/layout/ManagerSidebar.css";

const MIN_WIDTH = 200;
const MAX_WIDTH = 360;
const WIDTH_KEY = "manager-sidebar-width";

function clampWidth(width) {
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width));
}

function ManagerSidebar() {
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  const sidebar = useRef(null);
  const drag = useRef(null);
  const [width, setWidth] = useState(() => {
    const saved = Number(localStorage.getItem(WIDTH_KEY));
    return saved > 0 ? clampWidth(saved) : 224;
  });

  useEffect(() => {
    const layout = sidebar.current.closest(".manager-theme");
    layout?.style.setProperty("--manager-sidebar-width", `${width}px`);
    localStorage.setItem(WIDTH_KEY, String(width));
    return () => layout?.style.removeProperty("--manager-sidebar-width");
  }, [width]);

  function resizeWithKeyboard(event) {
    const sizes = {
      ArrowLeft: width - 10,
      ArrowRight: width + 10,
      Home: MIN_WIDTH,
      End: MAX_WIDTH,
    };
    if (!Object.hasOwn(sizes, event.key)) return;
    event.preventDefault();
    setWidth(clampWidth(sizes[event.key]));
  }

  async function handleLogout() {
    setSigningOut(true);
    setError("");
    try {
      await logoutStaff();
      navigate("/login", { replace: true });
    } catch {
      setError("Unable to sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }
  return (
    <div className="manager-sidebar" ref={sidebar}>
      <h2>Freshmart</h2>
      <p>Manager</p>

      <ul>
        <li>
          <NavLink to="/manager" end>
            <img src={home} alt="" />
            Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/manager/products">
            <img src={cube} alt="" />
            Products
          </NavLink>
        </li>
        <li>
          <NavLink to="/manager-coupon-sales">
            <img src={coupon} alt="" />
            Coupons & Sales
          </NavLink>
        </li>
        <li>
          <NavLink to="/manager/returns">
            <img src={undo} alt="" />
            Returns
          </NavLink>
        </li>
        <li className="manager-sidebar-section">Reports</li>
        <li>
          <NavLink to="/manager/reports/employee-workload">
            <img src={employee_manage} alt="" />
            Employee Workload
          </NavLink>
        </li>
        <li>
          <NavLink to="/manager/reports/customer-loyalty">
            <img src={loyalty} alt="" />
            Customer Loyalty & Rewards
          </NavLink>
        </li>
        <li>
          <NavLink to="/manager/reports/sales-performance">
            <img src={finance_monitoring} alt="" />
            Sales Performance
          </NavLink>
        </li>
      </ul>
      {error && <p role="alert">{error}</p>}
      <button className="manager-logout" type="button" onClick={handleLogout} disabled={signingOut}>
        {signingOut ? "Signing out…" : "Logout"}
      </button>
      <div
        className="manager-sidebar-resize"
        role="separator"
        aria-label="Resize manager sidebar"
        aria-orientation="vertical"
        aria-valuemin={MIN_WIDTH}
        aria-valuemax={MAX_WIDTH}
        aria-valuenow={width}
        tabIndex={0}
        onKeyDown={resizeWithKeyboard}
        onPointerDown={(event) => {
          if (event.button !== 0 || !event.isPrimary) return;
          drag.current = { x: event.clientX, width };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId) && drag.current) {
            setWidth(clampWidth(drag.current.width + event.clientX - drag.current.x));
          }
        }}
        onLostPointerCapture={() => { drag.current = null; }}
      />
    </div>
  );
}

export default ManagerSidebar;

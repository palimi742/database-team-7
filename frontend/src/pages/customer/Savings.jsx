import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import "../../css/App.css";
import "../../css/customer/Coupon.css";

function Savings() {
  const navigate = useNavigate();
  const [clipping, setClipping] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [couponStatus, setCouponStatus] = useState("loading");
  const [clippedCoupons, setClippedCoupons] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCoupons() {
      try {
        const response = await fetch("/api/coupons");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load coupons.");
        }

        setCoupons(data);
        setCouponStatus("loaded");
      } catch (err) {
        setError(err.message);
        setCouponStatus("error");
      }
    }

    loadCoupons();
  }, []);

  useEffect(() => {
    async function loadClippedCoupons() {
      try {
        const customer = JSON.parse(sessionStorage.getItem("customer"));

        if (!customer) {
          return;
        }

        const response = await fetch(
          "/api/coupons/clipped",
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load clipped coupons.");
        }

        setClippedCoupons(data.map((coupon) => Number(coupon.CouponID)));
      } catch (err) {
        setError(err.message);
      }
    }

    loadClippedCoupons();
  }, []);

  async function clipCoupon(couponID) {
    if (clipping !== null) return;
    setClipping(couponID);
    setError("");
    try {
      const customer = JSON.parse(sessionStorage.getItem("customer"));

      if (!customer) {
        alert("Please log in to clip coupons.");
        return;
      }

      const response = await fetch("/api/coupons/clip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponID: couponID,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to clip coupon.");
      }

      setClippedCoupons((previous) => [...previous, Number(couponID)]);
    } catch (err) {
      setError(err.message);
    } finally {
      setClipping(null);
    }
  }

  function shopCoupon(coupon) {
    const category =
      coupon.CategoryID ??
      coupons.find(
        (offer) => Number(offer.CouponID) === Number(coupon.CouponID),
      )?.CategoryID;
    navigate(category ? `/browse?category=${category}` : "/browse");
  }

  return (
    <div className="browse-page">
      <Navbar />
      <div className="browse-container savings-page">
        <h1>Savings</h1>
        <p>Find coupons and keep your clipped offers in one place.</p>
        <Link to="/browse">Continue shopping →</Link>
        {error && <p role="alert">{error}</p>}
        <div className="coupons-container">
          <h2>Available Coupons</h2>

          {couponStatus === "loading" ? (
            <p role="status">Loading coupons…</p>
          ) : couponStatus === "error" ? null : coupons.length === 0 ? (
            <p>No active coupons right now</p>
          ) : (
            <div className="coupon-grid">
              {coupons.map((coupon) => (
                <div
                  className={`coupon-card ${clippedCoupons.includes(Number(coupon.CouponID)) ? "coupon-clipped" : ""}`}
                  key={coupon.CouponID}
                >
                  <div className="coupon-heading">
                    <h3>{coupon.CouponName}</h3>
                    <p>${Number(coupon.DiscountAmount).toFixed(2)} Off</p>
                  </div>

                  {clippedCoupons.includes(Number(coupon.CouponID)) && (
                    <span className="coupon-status">✓ Clipped</span>
                  )}
                  <button
                    onClick={() =>
                      clippedCoupons.includes(Number(coupon.CouponID))
                        ? shopCoupon(coupon)
                        : clipCoupon(coupon.CouponID)
                    }
                    disabled={clipping !== null}
                  >
                    {clippedCoupons.includes(Number(coupon.CouponID))
                      ? "Add items"
                      : clipping === coupon.CouponID
                        ? "Clipping…"
                        : "Clip coupon"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Savings;

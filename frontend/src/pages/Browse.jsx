import '../css/App.css'
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

function Browse(){
  const [coupons, setCoupons] = useState([]);
  const[search, setSearch] = useState(""); 
  const[products, setProducts] = useState([]);
  const [seasonalProducts, setSeasonalProducts] = useState([]);
  const [error, setError] = useState('');
  const [cart, setCart] = useState([]);
  const [clippedCoupons, setClippedCoupons] = useState([]);
  const [clippedCouponDetails, setClippedCouponDetails] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  useEffect(() => {
    fetch('/api/products')
    .then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to load products.');
      return data;
    })
    .then(data => setProducts(data))
    .catch(error => setError(error.message))

  }, []);


useEffect(() => {
  fetch('/api/categories')
    .then(async response => {
      const data = await response.json();

      if (!response.ok) {
        throw new Error('Unable to load categories.');
      }

      return data;
    })
    .then(data => setCategories(data))
    .catch(error => {
      console.error('Error loading categories:', error.message);
    });
}, []);


useEffect(() => {
    fetch('/api/seasonal-sales')
        .then(async response => {
            const data = await response.json();

            if (!response.ok) {
                throw new Error('Unable to load seasonal sales.');
            }

            return data;
        })
        .then(data => setSeasonalProducts(data))
        .catch(error => {
            console.error('Error loading seasonal sales:', error);
        });
}, []);

useEffect(() => {
    const customer = JSON.parse(localStorage.getItem('customer'));

    if (!customer) {
        return;
    }

    fetch(`/api/coupons/clipped/${customer.CustomerID}`)
        .then(async response => {
            const data = await response.json();

            if (!response.ok) {
                throw new Error('Unable to load clipped coupons.');
            }

            return data;
        })
        .then(data => {
            setClippedCouponDetails(data);
            setClippedCoupons(
                data.map(coupon => Number(coupon.CouponID))
            );
        })
        .catch(error => {
            console.error('Error loading clipped coupons:', error.message);
        });
    }, []);


  useEffect(() => {
    fetch('/api/coupons')
    .then(async response => {
      const data = await response.json();
      if(!response.ok){
        throw new Error('Unable to load coupons.');
      }
      return data;
    })
    .then(data => setCoupons(data))
    .catch(error => console.error(`Eror loading coupons:`, error.message));
  }, []);
  const filteredProducts = products.filter((product) => {
  const matchesSearch = product.InventoryName
    .toLowerCase()
    .includes(search.toLowerCase());

  const matchesCategory =
    selectedCategory === "All" ||
    Number(product.CategoryID) === Number(selectedCategory);

  return matchesSearch && matchesCategory;
});
  
function addToCart(product) {
    const sale = seasonalProducts.find(
        (item) =>
            Number(item.InventoryID) === Number(product.InventoryID)
    );

    let price = Number(product.Price);

    if (sale && sale.DiscountAmount !== null) {
        price = price - Number(sale.DiscountAmount);
    }

    const cartProduct = {
        ...product,
        Price: price
    };

    setCart([...cart, cartProduct]);
}

  function removefromCart(indexToRemove){
    setCart(prevItems => prevItems.filter((items, index) => index !== indexToRemove));
  }
  const subtotal = cart.reduce((total, product) => total + Number(product.Price), 0);

  async function clipCoupon(couponID) {
    const customer = JSON.parse(localStorage.getItem('customer'));

    if (!customer) {
        alert('Please log in to clip coupons.');
        return;
    }
    try {
    const response = await fetch('/api/coupons/clip', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            customerID: customer.CustomerID,
            couponID: couponID
        })
    });

    const data = await response.json();

    if (!response.ok) {
        alert(data.message);
        return;
    }
    setClippedCoupons(previous => [
      ...previous,
       Number(couponID)
      ]);
    const clippedCoupon = coupons.find(
    coupon => Number(coupon.CouponID) === Number(couponID)
    );

    if (clippedCoupon) {
      setClippedCouponDetails(previous => [
        clippedCoupon,
        ...previous
      ]);
    }
    alert(data.message);

} catch (error) {
    console.error('Failed to clip coupon:', error);
    alert('Couldnt clip coupon. Please try again.');
}
    
}
  return(
    <div className="browse-page">
      <Navbar/>
      <div className="browse-container">
        <h1>Hello!</h1>
        <p>Find everything you need for your groceries</p>
         <div className="coupons-container">
          <h2>Available Coupons</h2>
          {coupons.length === 0 ? (
              <p>No active coupons right now</p>
          ) : (
          <div className="coupon-grid">
            {coupons.map(coupon => ( 
              <div className="coupon-card" key={coupon.CouponID}>
                <h3>{coupon.CouponName}</h3>
                <p>${Number(coupon.DiscountAmount).toFixed(2)} off</p>
                <button onClick={() => clipCoupon(coupon.CouponID)} disabled={clippedCoupons.includes(Number(coupon.CouponID))}>
                    {clippedCoupons.includes(Number(coupon.CouponID))
                    ? 'Clipped!'
                    : 'Clip Coupon'}
                </button>

              </div>
            ))}
          </div>
          )}
        </div>

        <div className="coupon-container">
          <h2>My Clipped Coupons</h2>
          {clippedCouponDetails.length === 0 ? (
            <p>You havent clipped any coupons yet</p>
          ) : (
          <div className="coupon-grid">
            {clippedCouponDetails.map(coupon => (
              <div className="coupon-card" key={coupon.CouponID}>
                <h3>{coupon.CouponName}</h3>
                <p>
                  ${Number(coupon.DiscountAmount).toFixed(2)} off
                </p>
                <p> Clipped on: {' '} {new Date(coupon.ClippedAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
          )}
        </div>
        <input
          className="search-input"
          type = "text"
          placeholder='Search for Groceries'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="category-section">
          <h2>Shop by Category</h2>

          <div className="category-buttons">
            <button
              className={selectedCategory === "All" ? "category-btn active" : "category-btn"}
              onClick={() => setSelectedCategory("All")}
            >
              All
            </button>

            {categories.map((category) => (
              <button
                key={category.CategoryID}
                className={
                  Number(selectedCategory) === Number(category.CategoryID)
                    ? "category-btn active"
                    : "category-btn"
                }
                onClick={() => setSelectedCategory(String(category.CategoryID))}
              >
                {category.CategoryName}
              </button>
            ))}
          </div>
        </div>

        {error && <p role="alert">{error}</p>}
       

       
        <div className="product-grid">
            {filteredProducts.map((product) => {
                const sale = seasonalProducts.find(
                    (s) => Number(s.InventoryID) === Number(product.InventoryID)
                );

                return (
                    <div className="product-card" key={product.InventoryID}>
                        <h3>{product.InventoryName}</h3>

                        {sale && sale.DiscountAmount !== null ? (
                            <>
                                <p>
                                    <strong>
                                        ${(Number(product.Price) - Number(sale.DiscountAmount)).toFixed(2)}
                                    </strong>
                                    {' '}
                                    <del>${Number(product.Price).toFixed(2)}</del>
                                </p>
                                <p>Seasonal Sale!</p>
                            </>
                        ) : (
                            <p>${Number(product.Price).toFixed(2)}</p>
                        )}

                        <button onClick={() => addToCart(product)}>
                            Add to cart
                        </button>
                    </div>
                );
            })}
        </div>


        <div className="cart-container">
          <h2>Your Cart</h2>

          <p>Items in cart: {cart.length}</p>

          {cart.map((product, index) => (
            <div key={`${product.InventoryID}-${index}`}>
              <p>{product.InventoryName} - ${Number(product.Price).toFixed(2)}</p>
              <button className="remove-cart-button" onClick={() => removefromCart(index)}>Remove</button>
            </div>
          ))}
          <h3>Subtotal: ${subtotal.toFixed(2)}</h3>
          <button className="checkout-button" onClick={() => 
          {
           //NEED TO CONNECT THIS WITH RAQUELS PART!!!
          }}
          > Proceed to Checkout → </button>
        </div>
      </div>
    </div>
    
  );
}

export default Browse;

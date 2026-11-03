# FreshMart frontend

Run from the repository root with `npm run dev`. Build with `npm run build`.

## Source folders

- `src/pages/customer/`: browsing, savings, cart, checkout, orders, and loyalty pages.
- `src/pages/auth/`: customer signup/login and staff login pages.
- `src/pages/manager/`: manager dashboard, management pages, and reports.
- `src/pages/employee/`: employee dashboard and fulfillment.
- `src/components/layout/`: navbar, footer, and manager sidebar.
- `src/components/auth/`: password input and route/login guards.
- `src/components/cart/`: the Browse cart panel.
- `src/components/products/`: product modals and product shopping components.
- `src/components/checkout/`: checkout and order summary components.
- `src/components/orders/`: receipt and order history components.
- `src/context/`: shared shopping state.
- `src/css/`: global styles (`App.css` and `index.css`). Other CSS lives with its page or component group.
- `src/assets/`: images and icons.

`src/App.jsx` defines page routes. Moving source files does not change the URLs.
`src/api.js` provides shared API and formatting helpers.

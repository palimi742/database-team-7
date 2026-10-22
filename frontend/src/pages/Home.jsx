import "../css/Home.css";
import { useState, useEffect } from "react";

function Home() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) {
          throw new Error("Failed to fetch categories");
        }
        const data = await res.json();

        setCategories(data);
      } catch (err) {
        console.log(err.message)
      }
    }
    loadCategories();
  }, []);
  return (
    <div className="category-options">
      <button
        className={
          selectedCategory === null
            ? "category-button active"
            : "category-button"
        }
        onClick={() => setSelectedCategory(null)}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category.CategoryID}
          className={
            selectedCategory === category.CategoryID
              ? "category-button active"
              : "category-button"
          }
          onClick={() =>
            setSelectedCategory(category.CategoryID)
          }
        >
          {category.CategoryName}
        </button>
      ))}
    </div>
  );
}

export default Home;

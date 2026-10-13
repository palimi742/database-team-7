import "../css/Home.css";
import { useState } from "react";

const categories = [
  "All",
  "Fruits",
  "Vegetables",
  "Prepared",
  "Asian",
  "Marine",
  "Sweets",
];

function Home() {
  const [selectedCategory, setSelectedCategory] = useState("");
  //this is standard in react. checks for any updates the page when something changes
  return (
    //going to use buttons and have them seen as "radio options"
    //can only select one button at a time. each time a button is clicked. the state is updated
    //if button is clicked give a className else give normal styling
    <div className="category-options">
      {categories.map((category) => (
        <button
          key={category}
          className={
            selectedCategory === category
              ? "category-button active"
              : "category-button"
          }
          onClick={() => setSelectedCategory((currentCategory) => (
            currentCategory === category ? "" : category
      ))}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

export default Home;

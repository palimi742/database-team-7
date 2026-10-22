const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT CategoryID, CategoryName 
            FROM Category ORDER BY CategoryID`,
    );
    res.json(result[0]);
  } catch (err) {
    console.log("error fetching categories", err.message)
    res.status(500).json({
        error: "Could not load categories"
    })
  }
});

module.exports = router;

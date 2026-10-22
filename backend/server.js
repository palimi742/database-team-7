const express = require("express")
const app = express()
app.use(express.json())
require("dotenv").config()

const PORT = process.env.PORT || 3000

const categoriesRouter = require("./routes/categories")
app.use("/api/categories", categoriesRouter)

const productsRouter = require("./routes/inputProduct")
app.use("/api/products", productsRouter)

app.get("/", (req, res) => {
  res.send("Backend running...")
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`)
})
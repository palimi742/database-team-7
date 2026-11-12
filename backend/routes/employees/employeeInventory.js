import { Router } from "express";
import pool from "../../db.js";
import { requireStaff } from "../../auth/staffSession.js";

const router = Router();
router.use(requireStaff, (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
const statuses = ["All", "Out of stock", "Low", "Normal", "High"];
const stockCase = `CASE WHEN i.StockQuantity = 0 THEN 'Out of stock'
  WHEN i.StockQuantity < i.ReorderThreshold THEN 'Low'
  WHEN i.StockQuantity >= 75 THEN 'High' ELSE 'Normal' END`;

router.get("/categories", async (_req, res, next) => {
  try {
    const [categories] = await pool.query("SELECT CategoryID, CategoryName FROM Category ORDER BY CategoryName, CategoryID");
    res.json({ categories });
  } catch (error) { next(error); }
});

// Called only when the employee asks to generate a report (or opens the restock catalog).
router.get("/", async (req, res, next) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const status = req.query.status || "All";
  const categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;
  if (search.length > 100 || !statuses.includes(status) ||
      (categoryId !== null && (!Number.isSafeInteger(categoryId) || categoryId < 1))) {
    return res.status(400).json({ message: "Choose valid inventory filters." });
  }
  try {
    // One SELECT gives the rows and filtered summary a consistent snapshot.
    const [items] = await pool.query(
      `SELECT v.InventoryID, v.SKU, v.InventoryName, v.CategoryID,
              v.StockQuantity, v.ReorderThreshold, v.StockStatus,
              c.CategoryName, i.ImageURL, i.Price, i.TableUpdateTime
       FROM employee_inventory_stock_report v
       JOIN Inventory i ON i.InventoryID = v.InventoryID
       JOIN Category c ON c.CategoryID = v.CategoryID
       WHERE (v.InventoryName LIKE ? OR v.SKU LIKE ?)
         AND (? IS NULL OR v.CategoryID = ?)
         AND (? = 'All' OR v.StockStatus = ?)
       ORDER BY v.StockQuantity, v.InventoryName, v.InventoryID`,
      [`%${search}%`, `%${search}%`, categoryId, categoryId, status, status],
    );
    const summary = { TotalProducts: items.length, OutOfStock: 0, LowStock: 0, NormalStock: 0, HighStock: 0 };
    const keys = { "Out of stock": "OutOfStock", Low: "LowStock", Normal: "NormalStock", High: "HighStock" };
    for (const item of items) if (keys[item.StockStatus]) summary[keys[item.StockStatus]]++;
    res.json({ items, summary, generatedAt: new Date().toISOString(),
      filters: { search, status, categoryId },
      source: { view: "employee_inventory_stock_report", tables: ["Inventory", "Category"],
        rule: "Out of stock: 0. Low: below ReorderThreshold. High: at least 75 after excluding low stock. Otherwise Normal. Active products only." } });
  } catch (error) { next(error); }
});

router.get("/:id/source", async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ message: "Invalid product." });
  try {
    const [[record]] = await pool.query(
      `SELECT i.InventoryID, i.SKU, i.InventoryName, i.CategoryID, c.CategoryName,
              i.StockQuantity, i.ReorderThreshold, i.ImageURL, i.Price, i.IsActive,
              i.TableUpdateTime, ${stockCase} AS StockStatus
       FROM Inventory i JOIN Category c ON c.CategoryID = i.CategoryID WHERE i.InventoryID = ?`, [id],
    );
    if (!record) return res.status(404).json({ message: "This inventory record no longer exists." });
    res.json({ record, fetchedAt: new Date().toISOString() });
  } catch (error) { next(error); }
});

// Staff can still see stored pictures on older orders for archived products.
router.get("/:id/image", async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ message: "Invalid product." });
  try {
    const [[image]] = await pool.query("SELECT ContentType, ImageData FROM ProductImages WHERE InventoryID = ?", [id]);
    if (!image) return res.status(404).json({ message: "No stored product image." });
    res.set("Content-Type", image.ContentType);
    res.set("X-Content-Type-Options", "nosniff");
    res.send(image.ImageData);
  } catch (error) { next(error); }
});
export default router;
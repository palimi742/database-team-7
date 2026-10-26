import { Router } from "express"
import pool from "../db.js"
const router = Router()

router.get("/", async(req, res) => {
    try{
        const result = await pool.query(
            `SELECT CategoryID, CategoryName
            FROM Category`
        )
        res.json(result[0])
    } catch(err){
        console.log("failed to load categories", err.message)
        res.status(500).json({
            message: "Unable to load categories"
        })
    }
})

export default router
const pool = require("../db")
async function testConnection() {
    try{
        const result = await pool.query("SELECT 1 AS connected")
        console.log(result[0])
    }catch(err){
        console.log("Connection failed: ", err.message)
    }finally{
        await pool.end()
    }
}

testConnection()
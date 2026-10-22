
import express from 'express';
import pool from './db.js';
import cors from 'cors';

const app = express();
app.use(cors({
    origin: 'http://localhost:5173'
}));

app.use(express.json())

app.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1 AS test');
        res.send(`MySQL connected! Test result: ${rows[0].test}`);
    } catch (error) {
        console.error('Database connection failed:', error.message);
        res.status(500).send('Database connection failed.');
    }
});

app.post('/api/customers/signup', async (req,res) => {
    let connection = null;
    let transactionStarted = false;
    try{
        
    const {firstName, lastName, phoneNumber, customerAddress, username, password} = req.body;

    if(!firstName || !lastName || !phoneNumber || !customerAddress || !username || !password){
        return res.status(400).json({
            message: 'Please fill in all fields'
        
        });
    }
    connection = await pool.getConnection();
    await connection.beginTransaction();
    transactionStarted = true;


    const [existingUsers] = await connection.query(
        'SELECT CustomerAccountID FROM CustomerAccounts WHERE Username = ?',
        [username]
    );

    if(existingUsers.length > 0) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(409).json({
             message: 'Username is taken'
        });
    }

    const [customerResult] = await connection.query(
        'INSERT INTO Customer(FirstName, LastName, PhoneNumber, CustomerAddress) VALUES(?, ?, ?, ?)',
         [firstName, lastName, phoneNumber, customerAddress]
    );

    await connection.query(
         'INSERT INTO CustomerAccounts(CustomerID, Username, Password) VALUES(?,?,?)',
          [customerResult.insertId, username, password]
    );

    await connection.commit();
    transactionStarted = false;
    return res.status(201).json({
         message: 'Account created succesfully!'
    });
    }catch(error) {
        if(connection !=null && transactionStarted == true){
                await connection.rollback();
                transactionStarted = false;
        }
            console.error('Signup failed:', error.message);
            return res.status(500).json({
                 message: 'Something went wrong during signp.'
            });
        
    }finally{
        if(connection != null){
            connection.release();
        }
    }
});

app.post('/api/customers/login', async(req, res)=>{
    try{
        const{username, password} = req.body;
        if(!username || !password){
            return res.status(400).json({
                message: "Please enter both username and password"
            });
        }


        const [rows] = await pool.query(
            'SELECT ca.CustomerID, ca.Username, c.FirstName, c.LastName FROM CustomerAccounts AS ca JOIN Customer AS c ON ca.CustomerID = c.CustomerID WHERE ca.Username = ? AND ca.Password = ?',
            [username, password]

        )

        if(rows.length == 0){
            return res.status(401).json({
                message: "No such user is found"
            });
        }

        return res.status(200).json({
            message: "Logged in succesfully",
            customer: rows[0]
        });
            
    }catch(error){
        console.error("Login Failed", error.message);

        return res.status(500).json({
            message: "Something went wrong in Login"
        });
    }
});
app.get('/api/products', async (req,res) => {
    try{
        const[rows] = await pool.query('SELECT InventoryID, SKU, InventoryName, Price FROM Inventory')
        res.json(rows)
    }catch(error){
        console.error("Query Failed", error.message);

        return res.status(500).json({
            message: "Something went wrong with loading products"
        });
    }
});

app.get('/api/loyalty/:customerId', async(req, res) => {
    const customerId = req.params.customerId;

    const [rows] = await pool.query(
       'SELECT * from LoyaltyProgram WHERE CustomerID = ?',
        [customerId]
    )
    if(rows.length === 0){
        return res.json({ isEnrolled: false });
    }
    return res.json({
    isEnrolled: true,
    currentPoints: rows[0].CurrentPoints,
    totalPointsEarned: rows[0].TotalPointsEarned,
    totalPointsRedeemed: rows[0].TotalPointsRedeemed
    });
});

app.post('/api/loyalty/join', async(req,res) => {
    try{
    const {customerId} = req.body;
    if (!customerId) {
    return res.status(400).json({
        message: 'Customer ID is required'
    });
    }
    const[rows] = await pool.query(
        'SELECT LoyaltyProgramID FROM LoyaltyProgram WHERE CustomerID = ?',
        [customerId]
    );

    if (rows.length > 0) {
        return res.status(409).json({
            message: 'Customer is already enrolled in the loyalty program'
    });
    }

    await pool.query(
        `INSERT INTO LoyaltyProgram
        (CustomerID, CurrentPoints, DateJoined, TotalPointsEarned, TotalPointsRedeemed, LastActivityDate)
        VALUES (?, 0, NOW(), 0, 0, NOW())`,
        [customerId]
    );

    return res.status(201).json({
        message: 'Successfully joined the loyalty program!',
        isEnrolled: true,
        currentPoints: 0
    });
}
catch(error){
    console.error('Joining loyalty program failed:', error.message);
    return res.status(500).json({
        message: 'Something went wrong when u were joining Loyalty program'
    })
}
});

app.listen(3000, () => {
    console.log('FreshMart server is running on port 3000');
});

import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.post('/signup', async (req,res) => {
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

router.post('/login', async(req, res)=>{
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

export default router;

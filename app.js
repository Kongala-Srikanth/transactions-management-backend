const express = require('express')
const cors = require('cors')
const {v4:uuidv4} = require('uuid')
const {ObjectId, MongoClient, Double} = require('mongodb')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')


require('dotenv').config()

const app = express()

app.use(express.json())
app.use(cors())

let client
const databaseAndServerSetup = async () => {
    const dbUser = process.env.DB_USER;
    const dbPassword = process.env.DB_PASSWORD;
    const dbCluster = process.env.DB_CLUSTER;
    const dbName = process.env.DB_NAME;
    const url = `mongodb+srv://${dbUser}:${dbPassword}@${dbCluster}/${dbName}?retryWrites=true&w=majority`;    
    client = new MongoClient(url)

    try{
        await client.connect()
        console.log('Successfully Connected to MongoDB')

        const port = 3000
        app.listen(port, () => {
            console.log('Server is running at port:', port)
        })
    } catch (e) {
        console.log(`Error while connecting to MongoDB: ${e.message}`)
        process.exit(1)
    }
}

databaseAndServerSetup()

const middlewareJwtToken = (request, response, next) => {
    let jwtToken

    const authHeader = request.headers['authorization']

    if (authHeader !== undefined){
        jwtToken = authHeader.split(' ')[1]
    }

    if (jwtToken === undefined){
        response.status(401)
        response.send({errorMsg: 'Invalid JWT Token'})
    } else {
        jwt.verify(jwtToken, process.env.JWT_SECRET, async (error,payload) => {
            if (error){
                response.status(401)
                response.send({errorMsg: error})
            }else {
                request.userId = payload.userId
                next()
            }
        })
    }
}


// API-1 Creating New User Account

app.post('/register', async(request, response) => {
    const collection = client.db(process.env.DB_NAME).collection('users')
    const {username, email, password, balance} = request.body

    const checkUserInDB = await collection.find({email}).toArray()

    if (checkUserInDB.length === 0){
        const hashedPassword = await bcrypt.hash(password, 10)
    

        if (username !== undefined){
            await collection.insertOne({
                id: uuidv4(),
                username,
                email,
                password: hashedPassword,
                balance
            })

            response.status(201)
            response.send({message: 'User Successfully Registered'})
        } else {
            response.status(401)
            response.send({errorMsg: 'Please Enter Valid User Details'})
        }
    } else {
        response.status(401)
        response.send({errorMsg: 'User Already Exists'})
    }
    
})


// API-2 User Login

app.post('/login', async (request, response) => {
    const {email, password} = request.body
    const collection = client.db(process.env.DB_NAME).collection('users')

    const checkUserInDB = await collection.find({email}).toArray()

    if (checkUserInDB.length === 1){
        const verifyPassword = await bcrypt.compare(password, checkUserInDB[0].password)

        if (verifyPassword){
            const token = jwt.sign({userId: checkUserInDB[0]._id }, 'MY_SECRET_TOKEN')
            response.status(201)
            response.send({jwtToken: token, userId: checkUserInDB[0].id})
        } else {
            response.status(401)
            response.send({errorMsg: 'Incorrect Password'})
        }
    }
    else {
        response.status(401)
        response.send({errorMsg: "User Doesn't Exists"})
    }
}) 



// API-3 Create Transaction

app.post('/api/transactions', middlewareJwtToken, async (request, response) => {
    const { amount, transaction_type, user } = request.body;
    const collection = client.db(process.env.DB_NAME).collection('transactions');
    const usersCollection = client.db(process.env.DB_NAME).collection('users');
    const dateAndTime = new Date().toISOString();

    try {
        const findUser = await usersCollection.findOne({ id: user });
        if (!findUser) {
            return response.status(404).send({ errorMsg: 'User not found' });
        }

        const balance = findUser.balance || 0;

        if (transaction_type === 'DEPOSIT') {
            // Insert transaction and update balance
            await collection.insertOne({
                transaction_id: uuidv4(),
                amount,
                transaction_type,
                status: 'PENDING',
                user,
                timestamp: dateAndTime,
            });

            await usersCollection.updateOne(
                { id: user },
                { $set: { balance: balance + amount } }
            );

            return response.status(201).send({ message: 'Transaction successfully done' });
        }

        if (transaction_type === 'WITHDRAWAL') {
            // Check if balance is sufficient
            if (amount > balance) {
                return response.status(422).json({ errorMsg: 'Insufficient balance' });
            }

            // Insert transaction and update balance
            await collection.insertOne({
                transaction_id: uuidv4(),
                amount,
                transaction_type,
                status: 'PENDING',
                user,
                timestamp: dateAndTime,
            });

            await usersCollection.updateOne(
                { id: user },
                { $set: { balance: balance - amount } }
            );

            return response.status(201).send({ message: 'Transaction successfully done' });
        }

    } catch (e) {
        console.error(e);
        response.status(500).json({ errorMsg: 'Internal server error', error: e.message });
    }
});


// API-4 Get transactions from specific user based on user id

app.get('/api/transactions/:id', middlewareJwtToken, async (request, response) => {
    const {id} = request.params
    const collection = client.db(process.env.DB_NAME).collection('transactions')
    const findUserData = await collection.find({user:id}).toArray()

    try{
        if (findUserData.length >= 1){
            response.status(200).json({transactions:findUserData})
        }else{
            response.status(404).send({errorMsg: 'Data not found'})
        }
    }catch (e) {
        response.status(500).send({errorMsg: 'Something went wrong'})
    }
})



// API-5 Update the transaction status using transaction_id

app.put('/api/transactions/:id', middlewareJwtToken, async (request,response) => {
    const {id} = request.params
    const {status} = request.body
    const collection = client.db(process.env.DB_NAME).collection('transactions')
    const findUserData = await collection.find({transaction_id:id}).toArray()




    try{
        const userId = await collection.findOne({transaction_id:id})
        const usersCollection = client.db(process.env.DB_NAME).collection('users')
        const findUser = await usersCollection.find({id: userId.user}).toArray()
        if (findUser.length !== 0){
            if (findUserData.length === 1){
                await collection.updateOne({transaction_id: id},{$set:{status: status}})
                response.status(200).send({message: 'Successfully Status Updated'})
            }else{
                response.status(404).send({errorMsg: 'Data not found'})
            }
        }else{
            response.status(401).send({errorMsg: 'Unauthorized Person'})
        }
        
    }catch (e) {
        response.status(500).send({errorMsg: 'Something went wrong'})
    }
    
})


// API-6 Get a specific transaction details using transaction_id

app.get('/api/transaction/:id', middlewareJwtToken, async (request,response) => {
    const {id} = request.params
    const collection = client.db(process.env.DB_NAME).collection('transactions')
    const findUserData = await collection.find({transaction_id:id}).toArray()


    try{
        const userId = await collection.findOne({transaction_id:id})
        const usersCollection = client.db(process.env.DB_NAME).collection('users')
        const findUser = await usersCollection.find({id: userId.user}).toArray()
        if (findUser.length !== 0){
            if (findUserData.length !== 0){
                response.status(200).json(findUserData)
            }else{
                response.status(404).send({errorMsg: 'Data not found'})
            }
        }else{
            response.status(401).send({errorMsg: 'Unauthorized Person'})
        }
    }catch (e) {
        response.status(500).send({errorMsg: 'Something went wrong'})
    }
    
})

// API-7 Get account balance and username

app.get('/user/account', middlewareJwtToken, async (request, response) => {
    const {userId} = request
    const findUserId = new ObjectId(userId)
    const usersCollection = client.db(process.env.DB_NAME).collection('users')

    try{
        const findUser = await usersCollection.findOne({_id: findUserId})
        if (findUser !== undefined && findUser !== null){
            return response.status(200).json(findUser)
        }else {
            return response.status(404).send({errorMsg: 'User not found'})
        }
        
    }catch (e) {
        return response.status(500).send({errorMsg: 'Something went wrong'})
    }
})
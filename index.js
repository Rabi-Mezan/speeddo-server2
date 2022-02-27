const express = require('express')
const app = express()
const port = process.env.PORT || 5000
const cors = require('cors');
require('dotenv').config()
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId
var admin = require("firebase-admin");



// firebase admin init
var serviceAccount = require('./speeddo-49d51-firebase-adminsdk-gdj05-b70d646ff1.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});





app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.krqaw.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


// token verify
async function verifyToken(req, res, next) {
    if (req?.headers?.authorization?.startsWith('Bearer')) {
        const token = (req.headers.authorization.split('Bearer ')[1])
        try {
            const decodedUser = await admin.auth().verifyIdToken(token)
            req.decodedEmail = decodedUser.email;
        }
        catch {
        }
    }
    next();
}


async function run() {

    try {
        client.connect();

        const database = client.db('speeddo')
        const bikeCollection = database.collection('bikes');
        const ordersCollection = database.collection('orders')
        const usersCollection = database.collection('users')
        const wishlistCollection = database.collection('wishlist')


        // get bikes api
        app.get('/bikes', async (req, res) => {
            const result = await bikeCollection.find({}).toArray()
            res.send(result)
        })


        // get bike details api
        app.get('/details/:id', async (req, res) => {

            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await bikeCollection.findOne(query)
            res.send(result)
        })


        //get users api
        app.get('/users', async (req, res) => {
            const result = await usersCollection.find({}).toArray()
            res.send(result);
        })

        // orders post api
        app.post('/orders', async (req, res) => {
            const data = req.body;
            const result = await ordersCollection.insertOne(data)
            console.log(result);
            res.send(result)

        })


        //add wisthlists api
        app.post('/wishlist', async (req, res) => {
            const data = req.body;
            const result = await wishlistCollection.insertOne(data)
            res.json(result)
        })

        //user wishlist get api
        app.get('/mywishlist/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const result = await wishlistCollection.find(query).toArray()
            res.send(result)

        })

        // my orders api
        app.get('/myorders/:email', verifyToken, async (req, res) => {
            const email = req.params.email
            console.log(email, req.decodedEmail);
            if (req.decodedEmail === email) {
                const query = { email: email }
                const result = await ordersCollection.find(query).toArray();
                res.json(result)
            }
            else {
                res.status(401).json({ message: 'User Unauthorized!' })
            }
        })

        // post api for users
        app.post('/users', async (req, res) => {
            const user = req.body
            const result = await usersCollection.insertOne(user)
            res.send(result)
        })

        //cancel orders api
        app.delete('/myorders/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await ordersCollection.deleteOne(query)
            res.send(result)
        })



        //check admin api
        app.get('/users/:email', async (req, res) => {

            const email = req.params.email;
            const query = { email: email }
            let user = await usersCollection.findOne(query)
            let isAdmin = false
            if (user?.role === 'admin') {
                isAdmin = true
            }
            res.json({ admin: isAdmin })
        })

    }
    finally {

    }

}

run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('Hello from speeddo server!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
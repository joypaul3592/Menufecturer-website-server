const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config()



// middleware
app.use(cors());
app.use(express.json())






const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.jutxl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized Access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access ' })
        }
        req.decoded = decoded;
        next()
    });
}





async function run() {
    try {
        await client.connect();
        const productsCollection = client.db("ViticDB").collection("product");
        const usersCollection = client.db("ViticDB").collection("users");





        // Product post method
        app.post('/product', async (req, res) => {
            const product = req.body;
            await productsCollection.insertOne(product);
            res.send({ success: true, message: `SuccesFully Added ${product.name}` })

        })


        // Product get method
        app.get('/product', async (req, res) => {
            const products = await productsCollection.find().toArray()
            res.send({ success: true, data: products });

        })
        // product get For user
        app.get('/userProduct', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email === decodedEmail) {
                const query = { email: email }
                const products = await productsCollection.find(query).toArray()
                console.log(products);
                return res.send({ success: true, data: products });
            } else {
                return res.status(403).send({ message: 'Forbidden Access' })
            }

        })


        // delete user product
        app.delete('/userProduct/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: ObjectId(id) }
            const product = await productsCollection.deleteOne(query);
            res.send({ success: true, data: product });
        })


        // UPDATE USER AND CREATE TOKEN
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email }
            const option = { upsert: true }
            const updateDoc = {
                $set: user,
            };

            const result = await usersCollection.updateOne(filter, updateDoc, option)
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' });
            res.send({ success: true, data: result, token: token });
        })


        // GET all user
        app.get('/users', async (req, res) => {
            const users = await usersCollection.find().toArray()
            res.send(users)
        })



    } catch (error) {
        console.log(error);
    }
}
run().catch(console.dir);








app.get('/', (req, res) => {
    res.send('backend is fire')
})



app.listen(port, () => {
    console.log('app is listing Port: ', port);
})

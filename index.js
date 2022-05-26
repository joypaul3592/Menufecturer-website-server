const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


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
        const reviewCollection = client.db("ViticDB").collection("reviews");
        const userInfoCollection = client.db("ViticDB").collection("userInfo");
        const ordersCollection = client.db("ViticDB").collection("orders");
        const paymentsCollection = client.db("ViticDB").collection("payments");





        // Product post method
        app.post('/product', verifyJWT, async (req, res) => {
            const product = req.body;
            await productsCollection.insertOne(product);
            res.send({ success: true, message: `SuccesFully Added ${product.name}` })

        })


        // Update Product 
        app.put('/updateProduct/:id', async (req, res) => {
            const id = req.params.id;
            const stock = req.body;
            const filter = { _id: ObjectId(id) };
            const option = { upsert: true }
            const updateDoc = {
                $set: stock,
            };

            const result = await productsCollection.updateOne(filter, updateDoc, option)
            res.send({ success: true, updateData: result });
        })


        // Get Product method
        app.get('/product', async (req, res) => {
            const products = await productsCollection.find().toArray()
            res.send({ success: true, data: products });

        })



        // Find One Product By Id
        app.get('/productDtails/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const product = await productsCollection.findOne(query);
            res.send({ success: true, data: product });
        })


        // delete user product
        app.delete('/userProduct/:id', async (req, res) => {
            const id = req.params.id;
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
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, { expiresIn: '12h' });
            res.send({ success: true, data: result, token: token });
        })


        // GET all user
        app.get('/users', verifyJWT, async (req, res) => {
            const users = await usersCollection.find().toArray()
            res.send(users)
        })


        // make admin roal
        app.put('/user/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const requester = req.decoded.email;
            const requerstAccount = await usersCollection.findOne({ email: requester })
            if (requerstAccount.role === 'admin') {
                const filter = { email: email }
                const updateDoc = {
                    $set: { role: 'admin' },
                };
                const result = await usersCollection.updateOne(filter, updateDoc)
                res.send(result);
            } else {
                res.status(403).send({ message: 'Forbidden Access' })
            }
        })


        // get admin
        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await usersCollection.findOne({ email: email })
            const isAdmin = user.role === 'admin';

            res.send({ admin: isAdmin })
        })



        // Add Review
        app.post('/review', verifyJWT, async (req, res) => {
            const review = req.body;
            await reviewCollection.insertOne(review);
            res.send({ success: true })

        })

        // Get Review
        app.get('/review', async (req, res) => {
            const reviews = await reviewCollection.find().toArray();
            res.send({ success: true, data: reviews });

        })


        // Put User Info
        app.put('/userInfo/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const userInfo = req.body;
            const filter = { email: email }
            const option = { upsert: true }
            const updateDoc = {
                $set: userInfo,
            };
            const result = await userInfoCollection.updateOne(filter, updateDoc, option)

            res.send({ success: true, data: result });
        })


        // get userinfo
        app.get('/upUserInfo/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const userIn = await userInfoCollection.findOne(query);
            res.send({ success: true, data: userIn });
        })



        // Order Post Method
        app.post('/orders', verifyJWT, async (req, res) => {
            const product = req.body;
            await ordersCollection.insertOne(product);
            res.send({ success: true, message: `SuccesFully Added ${product.name}` })

        })

        // Get All Orders
        app.get('/orders', verifyJWT, async (req, res) => {
            const products = await ordersCollection.find().toArray();
            return res.send({ success: true, data: products });
        })

        // orders get For user
        app.get('/userProduct/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const decodedEmail = req.decoded.email;
            if (email === decodedEmail) {
                const query = { email: email }
                const products = await ordersCollection.find(query).toArray();
                return res.send({ success: true, data: products });
            } else {
                return res.status(403).send({ message: 'Forbidden Access' })
            }
        })


        // delete user Order
        app.delete('/userOrder/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const product = await ordersCollection.deleteOne(query);
            res.send({ success: true, data: product });
        })



        // Get user Order
        app.get('/orderProduct/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const product = await ordersCollection.findOne(query);
            res.send({ success: true, data: product });
        })

        // Patch Order
        app.patch('/upOrder/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            // console.log(payment);
            const filter = { _id: ObjectId(id) }
            const option = { upsert: true }
            const updateDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transsactionId,
                },
            };
            const result = await paymentsCollection.insertOne(payment)
            const updatedOrder = await ordersCollection.updateOne(filter, updateDoc, option)
            res.send(updateDoc);
        })



        // Patch Order
        app.put('/paidUpInfo/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const paidInfo = req.body;
            const filter = { _id: ObjectId(id) }
            const updateDoc = {
                $set: paidInfo,
            };
            const updatedPanding = await ordersCollection.updateOne(filter, updateDoc)
            res.send(updateDoc);
        })



        // Payment Stript
        app.post('/create-payment-intent', verifyJWT, async (req, res) => {
            const service = req.body;
            const price = service.price;
            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card'],
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });






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

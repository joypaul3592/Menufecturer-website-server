const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config()



// middleware
app.use(cors());
app.use(express.json())






const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.jutxl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });





async function run() {
    try {
        await client.connect();
        const productsCollection = client.db("ViticDB").collection("product");





        // Product post method
        app.post('/product', async (req, res) => {
            const product = req.body;
            console.log(product);

            await productsCollection.insertOne(product);

            res.send({ success: true, message: `SuccesFully Added ${product.name}` })

        })


        // Product get method
        app.get('/product', async (req, res) => {
            const products = await productsCollection.find().toArray()
            res.send({ success: true, data: products });

        })
        // product get For user
        app.get('/userProduct', async (req, res) => {
            const email = req.email;
            const products = await productsCollection.find(email).toArray()
            res.send({ success: true, data: products });

        })


        // delete user product
        app.delete('/userProduct/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: ObjectId(id) }
            const product = await productsCollection.deleteOne(query);
            res.send({ success: true, data: product });
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

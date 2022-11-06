const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;

//dotenv file k require na korle env file ta kaj korbe na
require('dotenv').config();

//middle wares
app.use(cors());
app.use(express.json());


//require the jsonwebtoken
const jwt = require('jsonwebtoken');

//node theke random bytes generate
//require('crypto').randomBytes(64).toString('hex')


//username: practiceProductCrudPaginationJWT
//password: Noa2WbXuHguyEkoE





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.axoxgat.mongodb.net/?retryWrites=true&w=majority`;

console.log(uri);

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
    console.log("Inside verifyJWT function: ", req.headers.authorization);

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({ message: "Unauthorized Access" })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (error, decoded) {
        if (error) {
            return res.status(403).send({ message: "Forbidden Access" })
        }

        req.decoded = decoded;
        next();
    })
}



async function run() {
    try {
        const productCollection = client.db('productCRUDPaginationJWT').collection('products');

        const allProductsCollection = client.db('productCRUDPaginationJWT').collection('allProducts');

        const usersCollection = client.db('productCRUDPaginationJWT').collection('registeredUsers');

        const ProductsByEmailCollection = client.db('productCRUDPaginationJWT').collection('productsByEmail');

        //send products to database (CRUD er Create Operation)
        app.post('/products', verifyJWT, async (req, res) => {
            const product = req.body;
            console.log(product);

            const result = await productCollection.insertOne(product);
            res.send(result);
            console.log(result);
        })









        //Products added by email er code starts

        //send products to database with user email(CRUD er Create Operation)
        app.post('/productsByEmail', async (req, res) => {
            const productInfo = req.body;
            console.log(productInfo);

            const result = await ProductsByEmailCollection.insertOne(productInfo);
            res.send(result)
        })


        //get all the products and also get the products by email from database with user email (CRUD er Create Operation). Email diye jei product gula add kora shei gula.. jodi http://localhost:5000/productsByEmail kori tahole shob gula products dibe r jodi http://localhost:5000/productsByEmail?email=faysal@gmail.com kori tahole faysal er order gula product gula dibe
        app.get('/productsByEmail', async (req, res) => {
            
            const email = req.query.email;
            console.log(email);
            
            let query = {};

            if(email){
                query = {
                    email: email
                }
            }
            const cursor = ProductsByEmailCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        })


         //delete single product from database and also from client side (CRUD er Delete Operation)
        app.delete('/productsByEmail/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            console.log("Trying to Delete Product ID", id)

            const query = { _id: ObjectId(id) };
            const result = await ProductsByEmailCollection.deleteOne(query);
            res.send(result);
            console.log(result);
        })

        //Products added by email er code ends












        //add all the registered users to the database from client side
        app.post('/registeredUsers', async (req, res) => {
            const registeredUsers = req.body;
            console.log(registeredUsers);

            const result = await usersCollection.insertOne(registeredUsers);
            res.send(result)
            //console.log(result);
        })


        //get all the added products from database (CRUD er Read Operation)
        // app.get('/products', async (req, res) => {
        //     const query = {};
        //     const cursor = productCollection.find(query);
        //     const products = await cursor.toArray();
        //     res.send(products);
        // })




        app.get('/products', verifyJWT, async (req, res) => {

            // console.log(req.headers.authorization)

            // const decoded = req.decoded;
            // console.log(" Decoded Inside Orders app.get API",decoded);

            const query = {};
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        })


        //get all the registered users from database (CRUD er Read Operation)
        app.get('/users', verifyJWT, async (req, res) => {
            const query = {};
            const cursor = usersCollection.find(query);
            const users = await cursor.toArray();
            res.send(users);
        })


        //get all the products and show it on the client side in the allProducts.js file.. All products are fetched from the allProducts collection on the productCRUDPaginationJWT database
        app.get('/allProducts', async (req, res) => {

            //codes for pagination
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            console.log(page, size);


            const query = {};
            const cursor = allProductsCollection.find(query);

            //client side theke page number and data size er hishebe server side er data load kora holo database theke
            // const allProducts = await cursor.toArray();
            const allProducts = await cursor.skip(page * size).limit(size).toArray();

            const count = await allProductsCollection.estimatedDocumentCount();
            res.send({ count, allProducts });
        })


        //delete single product from database and also from client side (CRUD er Delete Operation)
        app.delete('/products/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            console.log("Trying to Delete ID", id)

            const query = { _id: ObjectId(id) };
            const result = await productCollection.deleteOne(query);
            res.send(result);
            console.log(result);
        })

        //Update single product from client side.. It will also update on the server side (CRUD er Update Operation)
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productCollection.findOne(query);
            res.send(result);
        })

        app.put('/products/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const product = req.body;
            console.log(product);

            const option = { upsert: true };
            const updatedProduct = {
                $set: {
                    name: product.name,
                    photoURL: product.photoURL,
                    quantity: product.quantity
                }
            }

            const result = await productCollection.updateOne(filter, updatedProduct, option);
            res.send(result);
        })

        //delete a registered user based on id
        app.delete('/users/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            console.log("Trying to Delete The user ID: ", id)

            const query = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result);
            console.log(result);
        })



        //code for jwt token
        app.post('/jwt', async (req, res) => {

            const user = req.body;
            console.log("user from JWT", user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5d' });
            res.send({ token })
        })



        // get a name specific product data from database 
        app.get('/allProducts', async (req, res) => {
            //console.log("Search Name from client side: ", req.body);  
            console.log("Search Name from client side: ", req.query);

            // const decoded = req.decoded;
            // console.log("Products data Searched By Name: ", decoded);

            // if(decoded.name !== req.query.name){
            //     return res.status(403).send({message: "Forbidden Access"})
            // }


            // let query = {};
            // if(req.query.name){
            //     query={
            //         name: req.query.name
            //     }
            // }

            // const cursor = orderCollection.find(query);
            // const orders = await cursor.toArray();
            // res.send(orders);
        })


    }

    finally {

    }
}
run().catch(error => console.log(error))



app.get('/', (req, res) => {
    res.send('Products Project Server is running')
});

app.listen(port, () => {
    console.log('Products Project Server is running on port', port)
})
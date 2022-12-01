const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const jwt = require('jsonwebtoken');
require('dotenv').config()

const app = express();

const stripe = require("stripe")(process.env.STRIPE_ACCESS_KEY)
const port = process.env.PORT || 5000;

//middlewares
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yhghpmr.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



async function run(){
    try{
        const booksCollection = client.db('creativeBooks').collection('booksOption')
        const submittedCollection = client.db('creativeBooks').collection('submitted')
        const rolesCollection = client.db('creativeBooks').collection('roles')
        const usersCollection = client.db('creativeBooks').collection('users');
        const paymentsCollection = client.db('creativeBooks').collection('payments');
        const sellerCollection = client.db('creativeBooks').collection('sellers');
        const buyersCollection = client.db('creativeBooks').collection('buyers');
        const catagoryCollection = client.db('creativeBooks').collection('catagories');
        const productsCollection = client.db('creativeBooks').collection('products');


        
        app.get('/bookOptions',async(req,res)=>{
            const query = {};
            const options = await booksCollection.find(query).toArray();
            res.send(options);
        })
        app.get('/orders', async (req, res) => {
            const email = req.query.email;

            const query = {email:email};
            const options = await submittedCollection.find(query).toArray();
            res.send(options);
        })


        app.put("/login/:email", async (req, res) => {
            try {
                const email = req.params.email;

              
                const query = { email: email }
                const existingUser = await usersCollection.findOne(query)
              
                if (existingUser) {
                    const token = jwt.sign(
                        { email: email },
                        process.env.ACCESS_TOKEN,
                        { expiresIn: "1d" }
                    )
                    return res.send({ data: token  })
                }
                
                else {
                      
                const user = req.body;
                const filter = { email: email };
                const options = { upsert: true };
                const updateDoc = {
                    $set: user
                }
                const result = await usersCollection.updateOne(filter, updateDoc, options);

                // token generate 
                const token = jwt.sign(
                    { email: email },
                    process.env.ACCESS_TOKEN,
                    { expiresIn: "1d" }
                )
               return  res.send({ data: token   })

                }



            }
            catch (err) {
                console.log(err)
            }
        })


      

        app.get('/sellerProducts',async(req,res)=>{
            const email = req.query.email;
            const query = {
               sellerEmail: email

            }
            const result = await productsCollection.find(query).toArray()
            res.send(result)
        })

        app.get("/user/admin/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user.role === 'admin' });
        });

        // check seller
        app.get('/user/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            res.send({isSeller : user.role === 'seller'})
        })

        // Check buyer
        app.get('/user/buyer/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            res.send({isSeller : user.role === 'user'})
        })

        app.put('/verifyseller', async (req, res) => {
            const email = req.query.email;
            const filter = {
                email: email
            }
            const option = { upsert: true }
            const updateDoc = {
                $set: {
                    verifySeller: true,
                }
            }

            const result = await usersCollection.updateOne(filter, updateDoc, option)
            res.send(result)

        })

        app.get('/bookOptions/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) };
            const result = await submittedCollection.findOne(query);
            res.send(result)
        })
        app.delete('/bookOptions/:id',  async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(filter);
            res.send(result);
        })
        ////////////user part//////////////
        // app.get('/users', async (req, res) => {
        //     const query = {};
        //     const users = await usersCollection.find(query).toArray();
        //     res.send(users);
        // });
        ///user and buyer part
        app.delete('/users/:id',  async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        })
        app.get('/roles/seller', async (req, res) => {
            const query = {}
            const cursor = await sellerCollection.find(query).toArray()
            res.send(cursor)
        })
        app.get('/roles/buyer', async (req, res) => {
            const query = {}
            const cursor = await buyersCollection.find(query).toArray()
            res.send(cursor)
        })
        app.put('/advertise/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const option = { upsert: true };
            const updateDoc = {
                $set: {
                    advertise: 'true'
                }
            }
            const result = await productsCollection.updateOne(filter, updateDoc, option);

            res.send(result)
        })
        app.put('/product/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const option = { upsert: true };
            const updatedoc = {
                $set: {
                    status: 'sold',
                    advertise: 'false',
                }
            }
            const result = await productsCollection.updateOne(filter, updatedoc, option);
            res.send(result)
        })

        app.get('/catagories',async(req,res)=>{
            const query = {}
            const result = await catagoryCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/products',async(req,res)=>{
            const query = {}
            const result = await productsCollection.find(query).toArray()
            res.send(result)
        })
        app.get('/users',async(req,res)=>{
            const query = {}
            const result = await usersCollection.find(query).toArray()
            res.send(result)
        })
        app.get('/catagory/:id',async(req,res)=>{
            const id = req.params.id;
            const query = {catagoryId:id}
            const result = await productsCollection.find(query).toArray()
            res.send(result)
        })


    /////////submited part/////////////
    app.get('/submitted', async(req,res)=>{
        const email = req.query.email;
        const query = {email:email};
        const bookings = await submittedCollection.find(query).toArray();
        res.send(bookings);
    })
    // app.get("/roles/admin/:email", async (req, res) => {
    //     const email = req.params.email;
    //     const query = { email: email };
    //     const user = await rolesCollection.findOne(query);
    //     res.send({ isAdmin: user.role === 'admin' });
    // });
    //////////////product//////////
    app.post('/products', async(req,res)=>{
        const submit = req.body
        const result = await productsCollection.insertOne(submit)
        res.send(result)
    })
    

    app.post('/submitted', async(req,res)=>{
        const submit = req.body
        const result = await submittedCollection.insertOne(submit)
        res.send(result)
    })
    app.get('/roles', async (req, res) => {
        const query = {};
        const users = await rolesCollection.find(query).toArray();
        res.send(users);
    });
    app.post('/roles', async(req,res)=>{
        const submit = req.body
        const result = await rolesCollection.insertOne(submit)
        res.send(result)
    })
    app.delete('/roles/:id',  async (req, res) => {
        const id = req.params.id;
        const filter = { _id: ObjectId(id) };
        const result = await rolesCollection.deleteOne(filter);
        res.send(result);
    })
    /////////add product part////////
    app.post('/bookOptions', async (req, res) => {
        let services = req.body
        const query = await booksCollection.insertOne(services);
        res.send(query)
    });
    ///payment part////////////
        app.post('/create-payment-intent', async (req, res) => {
        
        const booking = req.body
            const price = booking.price
            console.log(price)
        const amount = price * 100
        
        const paymentIntent = await stripe.paymentIntents.create({
            currency: "usd",
            amount: amount,
            "payment_method_types": [
                "card"
            ]

        });
        res.send({
            clientSecret: paymentIntent.client_secret,
        })
    })
    app.post('/payments', async (req, res) =>{
        const payment = req.body;
        const result = await paymentsCollection.insertOne(payment);
        const id = payment.bookingId
        const filter = {_id: ObjectId(id)}
        const updatedDoc = {
            $set: {
                paid: true,
                transactionId: payment.transactionId
            }
        }
        const updatedResult = await booksCollection.updateOne(filter, updatedDoc)
        res.send(result);
    })

    ///////////////JWT PART/////////
    app.get('/jwt', async (req, res) => {
        const email = req.query.email;
        const query = { email: email };
        const user = await rolesCollection.findOne(query);
        if (user) {
            const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
            return res.send({ accessToken: token });
        }
        res.status(403).send({ accessToken: '' })
    });

    }
    finally{

    }
}
run().catch(console.log);

app.get('/',async(req,res)=>{
    res.send('BookStore Server is running')
})

app.listen(port,() => console.log(`BookStore server is running on ${port}`))
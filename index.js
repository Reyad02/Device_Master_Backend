const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
var cors = require('cors')
const app = express()
const port = process.env.PORT || 3000
// const jwt = require('jsonwebtoken');
// const SSLCommerzPayment = require('sslcommerz-lts')

app.use(express.json());
app.use(cors({
    origin: ['https://bus-ticket-pro.web.app', 'https://bus-ticket-pro.firebaseapp.com', 'http://localhost:5173']
}));

// const store_id = process.env.STORE_ID;
// const store_passwd = process.env.STORE_PASS;
// const is_live = false //true for live, false for sandbox


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dr6rgwa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        const database = client.db("device-master");
        const services = database.collection("services");
        // const order = database.collection("order");
        // const routes_way = database.collection("routes");

        app.get("/services", async (req, res) => {
            try {
                const result = await services.find().toArray();
                res.send(result);
            } catch(error){
                console.error(error);
                res.status(500).send({ message: "Error fetching services" });
            }
        })
   


        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    // console.log(`Example app listening on port ${port}`)
})
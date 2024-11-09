const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
var cors = require('cors')
const app = express()
const port = process.env.PORT || 3000
// const jwt = require('jsonwebtoken');
// const SSLCommerzPayment = require('sslcommerz-lts')

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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
        await client.connect();
        const database = client.db("device-master");
        const services = database.collection("services");
        const orders = database.collection("orders");
        const blogs = database.collection("blogs");
        // const routes_way = database.collection("routes");

        app.get("/services", async (req, res) => {
            try {
                const result = await services.find().toArray();
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: "Error fetching services" });
            }
        })

        app.get("/service/:id", async (req, res) => {
            const id = req.params.id;
            try {
                const result = await services.findOne({ _id: new ObjectId(id) });
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: "Error fetching services" });
            }
        })

        app.post("/order", async (req, res) => {
            try {
                const { name, email, phone, price, message, paymentStatus, service_name } = req.body;

                const result = await orders.insertOne({ name, email, phone, price, message, paymentStatus, service_name });
                const orderId = result.insertedId;

                const session = await stripe.checkout.sessions.create({
                    payment_method_types: ["card"],
                    success_url: `http://localhost:5173/success/${orderId}`,
                    cancel_url: 'http://localhost:5173/cancel',
                    line_items: [
                        {
                            price_data: {
                                currency: 'usd',
                                product_data: {
                                    name: service_name
                                },
                                unit_amount: parseInt(price.replace('$', '')) * 100,
                            },
                            quantity: 1,
                        },
                    ],
                    mode: 'payment',
                });

                res.json({ id: session.id });
            } catch (error) {
                console.log(error);
                res.status(500).send({ message: "Error processing order" });
            }
        });


        app.put("/payment/:id", async (req, res) => {
            const { id } = req.params;
            const { paymentStatus } = req.body;

            try {
                const result = await orders.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { paymentStatus: paymentStatus } }
                );

                if (result.modifiedCount > 0) {
                    res.status(200).send({ message: "Payment status updated successfully" });
                } else {
                    res.status(404).send({ message: "Order not found" });
                }
            } catch (error) {
                console.error("Error updating payment status:", error);
                res.status(500).send({ message: "Error updating payment status" });
            }
        });


        app.get("/blogs/:items/:page", async (req, res) => {
            const items = parseInt(req.params.items)
            const page = parseInt(req.params.page)
            try {
                const totalCount = await blogs.countDocuments();
                const result = await blogs.find().skip((page - 1) * items).limit(items).toArray();
                res.send({ result, totalCount });
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: "Error fetching services" });
            }
        })

        app.get("/blogs/:id", async (req, res) => {
            const id = req.params.id;
            try {
                const result = await blogs.findOne({ _id: new ObjectId(id) });
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: "Error fetching services" });
            }
        })

        app.put("/blog/:id", async (req, res) => {
            const id = req.params.id;
            const { username, email, comment, date } = req.body;
            const options = { upsert: true };
            try {
                const filter = { _id: new ObjectId(id) };
                const newComment = {
                    username: username,
                    email: email,
                    comment: comment,
                    date: date
                };
                const update = {
                    $push: {
                        comments: newComment
                    }
                }

                const result = await blogs.updateOne(filter, update, options);
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: "Error fetching services" });
            }
        })

        app.get("/order", async (req, res) => {
            try {
                const result = await orders.find({ paymentStatus: true }).toArray();
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: "Error fetching services" });
            }
        })

        app.post("/add_Service", async (req, res) => {
            const { serviceName, price, description, imgURL } = req.body;
            const doc = {
                service_name: serviceName,
                description: description,
                price: price,
                service_img: imgURL
            }
            const result = await services.insertOne(doc);
            res.send(result);
        })

        app.post("/add_blogs", async (req, res) => {
            const { title, description, tagsArray, imgURL } = req.body;
            const dateObj = new Date();
            const doc = {
                title: title,
                description: description,
                tags: tagsArray,
                img: imgURL,
                postDate: dateObj
            }
            const result = await blogs.insertOne(doc);
            res.send(result);
        })

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally { }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
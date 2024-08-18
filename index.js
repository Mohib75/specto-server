const express = require("express")
const cors = require("cors")
const jwt = require("jsonwebtoken")
const cookieParser = require("cookie-parser")
require("dotenv").config()
const { MongoClient, ServerApiVersion } = require("mongodb")
const app = express()
const port = process.env.PORT || 5000

const cookieOptions = {
	httpOnly: true,
	secure: process.env.NODE_ENV === "production",
	sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
}

// middleware
app.use(
	cors({
		origin: ["http://localhost:5173", "https://specto-152e7.web.app", "https://specto-152e7.firebaseapp.com"],
		credentials: true,
	})
)

app.use(express.json())
app.use(cookieParser())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gs81nyj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
})

// middlewares
const logger = (req, res, next) => {
	console.log("log: info", req.method, req.url)
	next()
}

async function run() {
	try {
		// Connect the client to the server	(optional starting in v4.7)
		// await client.connect()

		const productCollection = client.db("specto").collection("products")

		// auth related api
		//creating Token
		app.post("/jwt", logger, async (req, res) => {
			const user = req.body
			console.log("user for token", user)
			const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)

			res.cookie("token", token, cookieOptions).send({ success: true })
		})

		// logout
		app.post("/logout", async (req, res) => {
			const user = req.body
			console.log("logging out", user)
			res.clearCookie("token", { ...cookieOptions, maxAge: 0 }).send({ success: true })
		})

		// getting all products
		app.get("/products", async (req, res) => {
			const page = parseInt(req.query.page)
			const size = parseInt(req.query.size)
			const cursor = productCollection.find()
			const result = await cursor
				.skip(page * size)
				.limit(size)
				.toArray()
			res.send(result)
		})

		// getting total products
		app.get("/productCount", async (req, res) => {
			const count = await productCollection.estimatedDocumentCount()
			res.send({ count })
		})

		// Send a ping to confirm a successful connection
		// await client.db("admin").command({ ping: 1 })
		console.log("Pinged your deployment. You successfully connected to MongoDB!")
	} finally {
		// Ensures that the client will close when you finish/error
		// await client.close()
	}
}
run().catch(console.dir)

app.get("/", (req, res) => {
	res.send("Specto server is running")
})

app.listen(port, () => {
	console.log(`Specto Server is running on port: ${port}`)
})

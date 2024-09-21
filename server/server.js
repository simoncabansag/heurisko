import App from "./express-util.js"
import Router from "./router.js"

const PORT = process.env.PORT || 3500
const app = App()
const router = Router()
const whitelist = [
    "http://localhost:3000",
    "http://localhost:3500",
    "http://127.0.0.1:3000",
]

const credentials = (req, res, next) => {
    const origin = req.headers.origin
    const auth = req.headers.authorization
    if (whitelist.includes(origin)) {
        res.setHeader("Access-Control-Allow-Credentials", true)
    }
    if (whitelist.includes(auth)) {
        res.setHeader(
            "Access-Control-Allow-Headers",
            "Content-Type, Authorization"
        ) // remove this after development
    }

    // res.setHeader("Access-Control-Allow-Credentials", true) // remove this after development
    res.setHeader("Access-Control-Allow-Origin", "*") // remove this after development
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT") // remove this after developments
    next()
}

const cors = (req, res, next) => {
    const headers = {
        "Access-Control-Allow-Origin": "*", // check for security
        "Access-Control-Allow-Methods": "OPTIONS, POST, GET",
        "Access-Control-Allow-Headers": "Content-Type, Accept",
        // "Access-Control-Max-Age": 2592000, // Cache preflight response for 30 days
    }

    // Handle preflight OPTIONS request
    if (req.method === "OPTIONS") {
        res.writeHead(204, headers) // 204 No Content for successful preflight request
        res.end()
        return
    }
    const origin = req.headers.origin

    // Check if the request's origin is allowed
    if (whitelist.indexOf(origin) !== -1 || !origin) {
        headers["Access-Control-Allow-Origin"] = origin || "*" // Dynamically set the allowed origin
    } else {
        // If the origin is not in the whitelist, block the request
        res.writeHead(403, { "Content-Type": "text/plain" })
        res.end("CORS Error: Not allowed by CORS")
        console.error("CORS Error: Not allowed by CORS")
        return
    }

    // Set the headers for non-OPTIONS requests (e.g., GET, POST) after cors has been dealt with
    res.setHeader(
        "Access-Control-Allow-Origin",
        headers["Access-Control-Allow-Origin"]
    )
    res.setHeader(
        "Access-Control-Allow-Methods",
        headers["Access-Control-Allow-Methods"]
    )
    res.setHeader(
        "Access-Control-Allow-Headers",
        headers["Access-Control-Allow-Headers"]
    )

    next()
}

app.useAll(cors)
app.useAll(credentials) // inspect
console.log("CORS being used for all routes")
console.log("credentials being used for all routes")

// first middleware function calls next once finished
const mw1 = (req, res, next) => {
    console.log("mw1")
    next()
}

const mw2 = (req, res, next) => {
    console.log("mw2")
    next()
}

const controller = (req, res) => {
    console.log("controller")
    res.end("controller")
}

// applying middleware and controller to a route
app.get("/middleware", mw1, mw2, controller)

// testing out request and response decorator
// returns params and query strings from the URL as text
// http://localhost:3500/params/hi/simon?howareyou
app.get("/params/:id/:name", (req, res) => {
    res.end(JSON.stringify({ params: req.params, query: req.query }, null, 2))
})

// example of returning json and change status code at same time
// http://localhost:3500/response/123 => { "id": "123" }
app.get("/response/:id", (req, res) => {
    if (req.params.id === "123") {
        res.status(200).json(req.params)
        return
    }

    res.status(400).json({ message: "Invalid id" })
})

router.get("/users", (req, res) => {
    res.end("User route from router instance")
})

router.get("/admins", (req, res) => {
    res.end("Admins route")
})

router.useAll((req, res, next) => {
    console.log("middleware for router instance /admins and /users")
    next()
})

router.use("/users", (req, res, next) => {
    console.log("middleware for /users")
    next()
})

router.use("/admins", (req, res, next) => {
    console.log("middleware for /admins")
    next()
})

app.useRouter("", router)

app.use("/admins", (req, res, next) => {
    console.log("middleware for all admins routes")
    next()
})

app.get("/", (req, res, next) => {
    res.json("Hello World!") // this is better then res.end
    // console.log("") // this will print in terminal
})

// app.post("/test", (req, res) => console.log("test"))
// app.patch("/test", (req, res) => console.log("test"))
// app.put("/test", (req, res) => console.log("test"))
// app.del("/test", (req, res) => console.log("test"))

const start = async (req, res) => {
    app.run(PORT)
    console.log(`server is running on port ${PORT}`)
}

start()

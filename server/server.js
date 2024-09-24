import express from "express"
const app = express()
const PORT = process.env.PORT || 3500
const whitelist = [
    "http://localhost:3000",
    "http://localhost:3500",
    "http://127.0.0.1:3000",
]

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`)
    next()
})

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
app.use(cors)
console.log("CORS being used for all routes")

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

app.get("/middleware", mw1, mw2, controller)

app.get("/params/:id/:name", (req, res) => {
    res.end(JSON.stringify({ params: req.params, query: req.query }, null, 2))
})

app.get("/response/:id", (req, res) => {
    if (req.params.id === "123") {
        res.status(200).json(req.params)
        return
    }
    res.status(400).json({ message: "Invalid id" })
})

app.use("/admins", (req, res, next) => {
    console.log("middleware for all admins routes")
    next()
})

app.get("/", (req, res, next) => {
    res.json("Hello World!")
})

app.get("/test", (req, res) => {
    throw new Error("ERROR TEST")
})

app.listen(PORT, () => {
    console.log("server is running in port", PORT)
})

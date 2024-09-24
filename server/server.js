import express from "express"
const app = express()
const PORT = process.env.PORT || 3500

app.listen(PORT, () => {
    console.log("server is running in port", PORT)
})

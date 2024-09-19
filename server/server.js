import * as http from "http"

const PORT = process.env.PORT || 3500

http.createServer(function (req, res) {
    res.write("hello")
    res.end()
    console.log(`server is running on port ${PORT}`)
}).listen(PORT)

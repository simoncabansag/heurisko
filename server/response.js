// https://dev.to/wesleymreng7/creating-your-own-expressjs-from-scratch-part-3-treating-request-and-response-objects-4ecf

const ResponseDecorator = (req, res, next) => {
    // set the status and response in one line and return it
    res.status = (status) => {
        res.statusCode = status
        return res
    }

    // convert response into JSON
    res.json = (data) => {
        res.setHeader("Content-type", "application/json")
        res.end(JSON.stringify(data))
    }

    // send text to client!!!
    res.send = async (data) => {
        res.end(data)
    }

    res.render = async (templatePath, data) => {}

    next()
}

export default ResponseDecorator

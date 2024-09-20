// https://dev.to/wesleymreng7/creating-your-own-expressjs-from-scratch-part-3-treating-request-and-response-objects-4ecf
import * as reg from "./path-to-regexp.cjs" // rewrite match function soon

const RequestDecorator = (routes, req, res, next) => {
    // treating the URL to compare with existing routes and get params and sets and modifies the request param object
    const getParams = () => {
        const urlParams = req.url.split("/").slice(1)

        // remove querystrings from last parameter
        const [lastParam] = urlParams[urlParams.length - 1].split("?")
        urlParams.splice(urlParams.length - 1, 1)

        // joining all params without querystrings
        const allParams = [...urlParams, lastParam].join("/")

        // matching url pattern to get the params
        for (const path of routes) {
            const urlMatch = reg.match(path, {
                decode: decodeURIComponent,
            })
            const url = `/${allParams}/${req.method.toUpperCase()}`
            const found = urlMatch(url)
            if (found) {
                Object.keys(found.params).forEach((key) => {
                    req.params = {
                        ...req.params,
                        [key]: found.params[key],
                    }
                })
                break
            }
        }
    }

    // transforming the query stirng into an object and setting the req object param
    const getQuery = () => {
        const urlParams = req.url.split("/").slice(1)

        // Isolating query strings
        const [lastParam, queryString] =
            urlParams[urlParams.length - 1].split("?")
        let params = new URLSearchParams(queryString)
        let entries = params.entries()

        req.query = {
            ...req.query,
            ...Object.fromEntries(entries),
        }
    }

    getParams()
    getQuery()
    next()
}

export default RequestDecorator

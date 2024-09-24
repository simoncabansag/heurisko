// problem
// app.useAll((hi1, hi2, next, req, res, next, lol1, lol2, lol3) => {
// when using use, it adds to function array
// it should not matter what order the params are in the function
// as express-util will know what to rebind and reorder when function
// when function is ran
// problem is currentMiddlware

// https://dev.to/wesleymreng7/creating-your-own-expressjs-from-scratch-part-1-basics-methods-and-routing-a8
import * as http from "http"
import requestDecorator from "./request.js"
import responseDecorator from "./response.js"
// npm install path-to-regex
// import { match } from "https://cdn.jsdelivr.net/npm/path-to-regexp@8.1.0/dist/index.js"
import * as reg from "./path-to-regexp.cjs" // rewrite match function soon
import debug from "console"
import Router from "./router.js"

// main entry point for web app framework
const App = () => {
    const router = Router()
    const routes = new Map()
    let origReq, origRes
    const createMyServer = () =>
        // http.createServer(serverHandler.bind(this)) // same as below
        http.createServer((req, res) => serverHandler(req, res))

    // need to get the router handlers and combine them with existent routes
    const useRouter = (path, router) => {
        const routerRoutes = router.getRoutes()
        const middlewaresFromRouter = router.getMiddlewaresForAll()
        const existentHandlers = routes.get(path) || []
        routerRoutes.forEach((middlewares, key) => {
            routes.set(`${path + key}`, [
                ...existentHandlers,
                ...middlewaresFromRouter,
                ...middlewares,
            ])
        })
    }

    // defining http methods, specify handlers, param path and any number of handlers
    // each function retrieves the current handles for the specific method and path from the routes object, adds any new handlers, and sets the updated handlers back into the routes object
    // for /test/1/GET, path is /test/1/ and method is GET
    const get = (path, ...handlers) => {
        const currentHandlers = routes.get(`${path}/GET`) || []
        routes.set(`${path}/GET`, [...currentHandlers, ...handlers])
    }

    const post = (path, ...handlers) => {
        const currentHandlers = routes.get(`${path}/POST`) || []
        routes.set(`${path}/POST`, [...currentHandlers, ...handlers])
    }

    const put = (path, ...handlers) => {
        const currentHandlers = routes.get(`${path}/PUT`) || []
        routes.set(`${path}/PUT`, [...currentHandlers, ...handlers])
    }

    const patch = (path, ...handlers) => {
        const currentHandlers = routes.get(`${path}/PATCH`) || []
        routes.set(`${path}/PATCH`, [...currentHandlers, ...handlers])
    }

    const del = (path, ...handlers) => {
        const currentHandlers = routes.get(`${path}/DELETE`) || []
        routes.set(`${path}/DELETE`, [...currentHandlers, ...handlers])
    }

    // array to store middlewares that should be applied for all routes
    const middlewaresForAll = []

    // like express.use() to add middleware for a specified path independently of the used method
    const use = (path, ...middlewares) => {
        // console.log(...middlewares)

        const possiblePaths = [
            path + "/GET",
            path + "/POST",
            path + "/PUT",
            path + "/PATCH",
            path + "/DELETE",
        ]
        possiblePaths.forEach((route) => {
            const middlewaresAndControllers = routes.get(route) || []

            if (middlewaresAndControllers.length) {
                // console.log(middlewaresAndControllers)
                // console.log(routes)

                routes.set(route, [
                    ...middlewares,
                    ...middlewaresAndControllers,
                ])
            }
        })
        // console.log(routes)
    }

    const useAll = (...middlewares) => {
        const wrapped = middlewares.map((middleware) => {
            return function (req, res, next) {
                middleware(req, res, next)
                // console.log("TEST")
            }
        })
        // console.log(...middlewares)

        // this already makes it so that it runs on all routes
        // middlewaresForAll.push(...middlewares)
        middlewaresForAll.push(...wrapped)
        // console.log("hi", middlewaresForAll[0])
    }

    // routing system to work well sanitize URL needed
    const sanitizeUrl = (url, method) => {
        // from "https://quotes.toscrape.com/page/2/" to [ '', 'quotes.toscrape.com', 'page', '2', '' ]
        const urlParams = url.split("/").slice(1)

        // removes querystrings from last param, e.g. http.site.com/page.html?param1=[...]... (from '?')
        const [lastParam] = urlParams[urlParams.length - 1].split("?")
        urlParams.splice(urlParams.length - 1, 1)

        // create the final URL
        const allParams = [...urlParams, lastParam].join("/")
        const sanitizedUrl = `/${allParams}/${method.toUpperCase()}`

        return sanitizedUrl
    }

    // console.log(sanitizeUrl("https://quotes.toscrape.com/page/2/", "del"))
    // require path-to-regexp
    // helper function, iterates through the routes checking if the URL matches with one of our current roles
    const matchUrl = (sanitizedUrl) => {
        for (const path of routes.keys()) {
            const urlMatch = reg.match(path, {
                decode: decodeURIComponent,
            })

            const found = urlMatch(sanitizedUrl)

            if (found) {
                return path
            }
        }
    }

    // function invokeCallback(err = null, req, res, callback) {
    //     if (typeof callback !== "function") {
    //         console.error("Provided callback is not a function!")
    //         console.log(typeof callback)
    //         return
    //     }

    //     const next = (error = null) => {
    //         if (error) {
    //             console.error("next called with error", error)
    //         } else {
    //             console.log("next called succesffully")
    //         }
    //     }
    // }

    // dispatch a chain of functions
    const dispatchChain = (...args) => {
        // console.log(middlewares) // object
        // console.log(middlewares.length)
        // before checking invoking

        const err = args.find(
            (err) =>
                err instanceof Error ||
                typeof err === "string" ||
                typeof err === "undefined"
        )
        const req = args.find((req) => req instanceof http.IncomingMessage)
        const res = args.find((res) => res instanceof http.ServerResponse)
        const middlewares = args.find(
            (m) => Array.isArray(m) && m.some((f) => typeof f === "function")
        )
        return invokeMiddlewares(err, req, res, middlewares)
    }

    // middle ware handler, responsible to execute and remove function from the middleware array until there is no more left to execute
    //middle ware pattern
    const invokeMiddlewares = async (err, req, res, middlewares) => {
        // console.log(middlewares.toString())

        // next is ultimately called when middlewares is in third option
        if (!middlewares.length) return
        const currentMiddleware = middlewares[0]

        // const next = async (error = null) => {
        //     if (error) {
        //         console.error("next called with error", error)
        //     } else {
        //         console.log("next called!")
        //     }
        //     await invokeMiddlewares(error, req, res, middlewares.slice(1))
        // }

        // if (typeof err !== undefined) {
        //     currentMiddleware(err, req, res, next)
        // } else {
        //     currentMiddleware(req, res, next)
        // }

        // const args = [req, res, nextMiddleware]

        return currentMiddleware(req, res, async (err) => {
            await invokeMiddlewares(err, req, res, middlewares.slice(1))
        })
    }

    const serverHandler = async (req, res) => {
        // console.log(middlewaresForAll[0])
        // const test = matchParams(middlewaresForAll[0])
        // console.log(test)
        // console.log(...middlewaresForAll)
        // console.log("hi " + test)

        // const func = (param1, param2, param3) => {}

        // const hi = introspectFunction(middlewaresForAll)
        // hi("hello", 23, { something: "hi" })

        const sanitizedUrl = sanitizeUrl(req.url, req.method)
        const match = matchUrl(sanitizedUrl)

        if (match || req.method === "OPTIONS") {
            const middlewaresAndControllers = match ? routes.get(match) : []
            // console.log(middlewaresAndControllers)
            // res.statusCode = 200
            // res.end("Found")
            // await dispatchChain(req, res, [...middlewaresAndControllers])
            const err = undefined

            await dispatchChain(err, req, res, [
                requestDecorator.bind(null, routes.keys()),
                responseDecorator,
                ...middlewaresForAll,
                ...middlewaresAndControllers,
            ])
            // await handle.bind(
            //     req,
            //     res,
            //     dispatchChain(err, req, res, [
            //         requestDecorator.bind(null, routes.keys()),
            //         responseDecorator,
            //         ...middlewaresForAll,
            //         ...middlewaresAndControllers,
            //     ])
            // )
            // handle(req, res, function(err) {
            //     ...middlewaresForAll
            // })
        } else {
            res.statusCode = 500
            res.end("Server Error")
        }
    }

    function handle(req, res, callback) {
        var done =
            callback ||
            finalHandler(req, res, {
                onerror: logerror.bind(this),
            })
        this.handle(req, res, done)
    }

    function logerror(err) {
        console.error(err.stack || err.toString())
    }

    // https://github.com/pillarjs/finalhandler/blob/master/index.js
    function headersSent(res) {
        return typeof res.headersSent !== "boolean"
            ? Boolean(res._header)
            : res.headersSent
    }

    function getErrorStatusCode(err) {
        // check err.status
        if (
            typeof err.status === "number" &&
            err.status >= 400 &&
            err.status < 600
        ) {
            return err.status
        }

        // check err.statusCode
        if (
            typeof err.statusCode === "number" &&
            err.statusCode >= 400 &&
            err.statusCode < 600
        ) {
            return err.statusCode
        }

        return undefined
    }

    function getResponseStatusCode(res) {
        var status = res.statusCode

        // default status code to 500 if outside valid range
        if (typeof status !== "number" || status < 400 || status > 599) {
            status = 500
        }

        return status
    }

    function getErrorMessage(err, status, env) {
        var msg

        if (env !== "production") {
            // use err.stack, which typically includes err.message
            msg = err.stack

            // fallback to err.toString() when possible
            if (!msg && typeof err.toString === "function") {
                msg = err.toString()
            }
        }

        return msg || statuses.message[status]
    }

    //https://github.com/pillarjs/finalhandler/blob/master/index.js
    function finalHandler(req, res, options) {
        var opts = options || {}
        var onerror = opts.onerror

        return function (err) {
            var headers
            var msg
            var status

            //ignore 404 on inflight response
            if (!err && headersSent()) {
                debug("cannot 404 after headers sent")
                return
            }

            // if unhandled
            if (err) {
                status = getErrorStatusCode(err)

                if (status === undefined) {
                    status = getResponseStatusCode(err)
                } else {
                    headers = getErrorHandlers(err)
                }
                msg = getErrorMessage(err, status, env)
            } else {
                // not found
                status = 404
                msg = `Cannot ${req.method} encodeUrl(getResourceName(req))}` // fix this
            }
            debug("default %s", status)

            // schedule onerror callback
            if (err && onerror) {
                defer(onerror, err, req, res)
            }

            // cannot actually respond
            if (headersSent(res)) {
                debug("cannot %d after headers sent", status)
                if (req.socket) {
                    req.socket.destroy()
                }
                return
            }

            send(req, res, status, headers, msg)
        }
    }

    const run = (port) => {
        const server = createMyServer()
        server.listen(port)
    }

    return {
        run,
        get,
        post,
        patch,
        put,
        del,
        use,
        useAll,
        useRouter,
    }
}

export default App

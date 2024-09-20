// https://dev.to/wesleymreng7/creating-your-own-expressjs-from-scratch-part-1-basics-methods-and-routing-a8
import * as http from "http"
import requestDecorator from "./request.js"
import responseDecorator from "./response.js"
// npm install path-to-regex
// import { match } from "https://cdn.jsdelivr.net/npm/path-to-regexp@8.1.0/dist/index.js"
import * as reg from "./path-to-regexp.cjs" // rewrite match function soon

// main entry point for web app framework
const App = () => {
    const routes = new Map()
    const createMyServer = () => http.createServer(serverHandler.bind(this))

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
                routes.set(route, [
                    ...middlewares,
                    ...middlewaresAndControllers,
                ])
            }
        })
    }

    // way to add middleware to teh middleware store
    const useAll = (...middlewares) => {
        middlewaresForAll.push(...middlewares)
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

    const match1 = (url) => {
        const http =
            /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi
        const nonHttp =
            /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi

        const regexHttp = new RegExp(http)
        const regexNonHttp = new RegExp(nonHttp)

        if (url.match(regexNonHttp)) {
            return true
        } else if (url.match(regexHttp)) {
            return true
        } else {
            return false
        }
    }
    // require path-to-regexp
    // helper function, iterates through the routes checking if the URL matches with one of our current roles
    const matchUrl = (sanitizedUrl) => {
        for (const path of routes.keys()) {
            const urlMatch = reg.match(path, {
                decode: decodeURIComponent,
            })

            console.log(urlMatch)

            const found = urlMatch(sanitizedUrl)

            if (found) {
                return path
            }
        }
    }

    // dispatch a chain of functions
    const dispatchChain = (req, res, middlewares) => {
        return invokeMiddlewares(req, res, middlewares)
    }

    // middle ware handler, responsible to execute and remove function from the middleware array until there is no more left to execute
    //middle ware pattern
    const invokeMiddlewares = async (req, res, middlewares) => {
        if (!middlewares.length) return
        const currentMiddleware = middlewares[0]
        return currentMiddleware(req, res, async () => {
            await invokeMiddlewares(req, res, middlewares.slice(1))
        })
    }

    const serverHandler = async (req, res) => {
        const sanitizedUrl = sanitizeUrl(req.url, req.method)

        const match = matchUrl(sanitizedUrl)

        if (match) {
            const middlewaresAndControllers = routes.get(match)
            // console.log(middlewaresAndControllers)
            // res.statusCode = 200
            // res.end("Found")
            // await dispatchChain(req, res, [...middlewaresAndControllers])
            await dispatchChain(req, res, [
                requestDecorator.bind(null, routes.keys()),
                responseDecorator,
                ...middlewaresForAll,
                ...middlewaresAndControllers,
            ])
        } else {
            res.statusCode = 404
            res.end("Not Found")
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

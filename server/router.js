// https://dev.to/wesleymreng7/creating-your-own-expressjs-from-scratch-part-4-modular-router-and-global-middlewares-560m
const Router = () => {
    const routes = new Map()
    const middlewaresForAll = []

    const getRoutes = () => {
        return routes
    }

    const getMiddlewaresForAll = () => {
        return middlewaresForAll
    }

    const useAll = (...middllewares) => {
        middlewaresForAll.push(...middllewares)
    }

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

    return {
        get,
        post,
        put,
        patch,
        del,
        use,
        useAll,
        getRoutes,
        getMiddlewaresForAll,
    }
}

export default Router

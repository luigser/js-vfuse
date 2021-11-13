const _ = require('underscore')
module.exports = {
    combine : (result, new_results) => {
        if(_.isArray(result) && _.isArray(new_results)) return [...result, ...new_results]
        else if(_.isString(result) && _.isString(new_results)) return result + new_results
        else if(_.isObject(result) && _.isObject(new_results)) return {...result, ...new_results}
        else if(_.isMap(result) && _.isMap(new result)) new Map([...result, ...new_results])
        else return false
    },

    convert : (results) => {
        if(results.has)
            return Array.from(results, ([key, value]) => ({ key, value }))
        else
            return results
    }
}

const _ = require('underscore')
module.exports = {
    combine : (result, new_results) => {
        if(_.isArray(result) && _.isArray(new_results)) return [...result, ...new_results]
        else if(_.isString(result) && _.isString(new_results)) return result + new_results
        else if(_.isNumber(result) && _.isNumber(new_results)) return result + new_results
        else if(_.isObject(result) && _.isObject(new_results)) return {...result, ...new_results}
        else if(_.isMap(result) && _.isMap(new result)) return new Map([...result, ...new_results])
        else{
            result.push(new_results)
            return result
        }
    },

    convert : (results) => {
        if(results.has)
            return Array.from(results, ([key, value]) => ({ key, value }))
        else
            return results
    }
}

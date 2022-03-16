const _ = require('underscore')
module.exports = {
    combine : (result, new_results) => {
        try {
            if (new_results.error) return new_results
            if (_.isArray(result) && _.isArray(new_results)) return [...result, ...new_results]
            else if (_.isString(result) && _.isString(new_results)) return result + new_results
            else if (/*parseFloat(result).toFixed(100) !== 'NaN' &&*/ parseFloat(new_results).toFixed(100) !== 'NaN') return new_results//result + new_results
            else if (!_.isArray(result) && _.isObject(result) && _.isObject(new_results)) return {...result, ...new_results}
            else if (_.isMap(result) && _.isMap(new result)) return new Map([...result, ...new_results])
            else if(result === null){
                return new_results
            }else{
                result.push(new_results)
                return result
            }
        }catch(e){
            return {error : e.message}
        }
    },

    convert : (results) => {
        if(results.has)
            return Array.from(results, ([key, value]) => ({ key, value }))
        else
            return results
    }
}


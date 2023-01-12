const { parentPort } = require('worker_threads')
const fetch = require('node-fetch')

const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor

const VFuseAPICaller = {
    addJob : (func, deps, input, group) => {
        const promise = new Promise( (resolve, reject) => {
            parentPort.onmessage = (e) => {
                const {action} = e.data
                if (action === 'VFuse:runtime') {
                    const {func} = e.data.data
                    if(func === 'addJob')
                        resolve(e.data.data.job_id)
                    parentPort.onmessage.onmessage = onmessage
                }
            }
        })

        parentPort.postMessage({
            action: 'VFuse:worker',
            todo: {
                func: 'addJob',
                params: JSON.stringify({
                    name: func.name,
                    func: func.toString(),
                    input: input,
                    group: group,
                    deps: deps
                })
            }
        })

        return promise
    },

    getDataFromUrl : (url, start, end) => {
        const promise = new  Promise( (resolve, reject) => {
            parentPort.onmessage = (e) => {
               /* const {action} = e.data
                if (action === 'VFuse:runtime') {
                    const {func} = e.data.data
                    if(func === 'getDataFromUrl')
                        resolve(e.data.data.content)
                    parentPort.onmessage = onmessage
                    console.log(`getDataFromUrl time : ${performance.now() - s} ms`)
                }*/
                try {
                    let headers = {}
                    if (start !== undefined && end !== undefined) {
                        headers = {
                            'range': `bytes=${start}-${end}`,
                        }
                    }
                    const s = performance.now()
                    fetch(url, {
                        headers: headers,
                        method: "GET",
                        mode: "cors",
                    })
                        .then(response => {
                            response.bodyUsed = false
                            resolve(response.text())
                            console.log(`getDataFromUrl time : ${performance.now() - s} ms`)
                        })
                        .catch(error => reject({error: error}))
                }catch (e){
                    console.log(e)
                    reject({error : e})
                }
            }
        })

        parentPort.postMessage({
            action: 'VFuse:worker',
            todo: {
                func: 'getDataFromUrl',
                params: JSON.stringify({
                    url : url,
                    start : start,
                    end : end,
                    //type : type
                })
            }
        })

        return promise
    },

    saveData : (data, json) => {
        const promise = new  Promise( (resolve, reject) => {
            parentPort.onmessage = (e) => {
                const {action} = e.data
                if (action === 'VFuse:runtime') {
                    const {func} = e.data.data
                    if(func === 'saveData')
                        resolve(e.data.data.cid)
                    parentPort.onmessage = onmessage
                }
            }
        })

        parentPort.postMessage({
            action: 'VFuse:worker',
            todo: {
                func: 'saveData',
                params: JSON.stringify({
                    data : data,
                    json : json
                })
            }
        })

        return promise
    },

    getData : (cid) => {
        const promise = new  Promise( (resolve, reject) => {
            parentPort.onmessage = (e) => {
                const {action} = e.data
                if (action === 'VFuse:runtime') {
                    const {func} = e.data.data
                    if(func === 'getData')
                        resolve(e.data.data.content)
                    parentPort.onmessage = onmessage
                }
            }
        })

        parentPort.postMessage({
            action: 'VFuse:worker',
            todo: {
                func: 'getData',
                params: JSON.stringify({
                    cid : cid,
                })
            }
        })

        return promise
    },

    setRepeating : (job_id) => {
        const promise = new  Promise( (resolve, reject) => {
            parentPort.onmessage = (e) => {
                const {action} = e.data
                if (action === 'VFuse:runtime') {
                    const {func} = e.data.data
                    if(func === 'setRepeating')
                        resolve(e.data.data.result)
                    parentPort.onmessage = onmessage
                }
            }
        })

        parentPort.postMessage({
            action: 'VFuse:worker',
            todo: {
                func: 'setRepeating',
                params: JSON.stringify({
                    job_id : job_id,
                })
            }
        })

        return promise
    },
    addToGroup : (job_id, group) => {
        const promise = new  Promise( (resolve, reject) => {
            parentPort.onmessage = (e) => {
                const {action} = e.data
                if (action === 'VFuse:runtime') {
                    const {func} = e.data.data
                    if(func === 'addToGroup')
                        resolve(e.data.data.result)
                    parentPort.onmessage = onmessage
                }
            }
        })

        parentPort.postMessage({
            action: 'VFuse:worker',
            todo: {
                func: 'addToGroup',
                params: JSON.stringify({
                    job_id : job_id,
                    group: group
                })
            }
        })

        return promise
    },
    setJobReturnType : (job_id, type) => {
        const promise = new  Promise( (resolve, reject) => {
            parentPort.onmessage = (e) => {
                const {action} = e.data
                if (action === 'VFuse:runtime') {
                    const {func} = e.data.data
                    if(func === 'setJobReturnType')
                        resolve(e.data.data.result)
                    parentPort.onmessage = onmessage
                }
            }
        })

        parentPort.postMessage({
            action: 'VFuse:worker',
            todo: {
                func: 'setJobReturnType',
                params: JSON.stringify({
                    job_id : job_id,
                    type: type
                })
            }
        })

        return promise
    }
}

const convert = (results) => {
    if(results instanceof Map)
        return Array.from(results, ([key, value]) => ({ key, value }))
    else
        return results
}

function escape (key, val) {
    if (typeof(val)!="string") return val
    //return encodeURIComponent(val)
    return val
        .replace(/[\\]/g, '\\\\')
        .replace(/[\/]/g, '\\/')
        .replace(/[\b]/g, '\\b')
        .replace(/[\f]/g, '\\f')
        .replace(/[\n]/g, '\\n')
        .replace(/[\r]/g, '\\r')
        .replace(/[\t]/g, '\\t')
        .replace(/["]/g, '\\"')
        .replace(/\\'/g, "\\'")
}

const onmessage = async function (e) {
    const {action, job} = e.data

    switch (action) {
        case 'init':
            parentPort.postMessage({
                action: 'initialized'
            })
            break
        case 'load':
            try {
                parentPort.postMessage({
                    action: 'loaded',
                    results
                })
            } catch (err) {
                console.log(err)
                parentPort.postMessage({
                    action: 'loaded',
                    results: {error: err}
                })
            }
            break
        case 'exec':
            try {
                let input
                if(!job.inline){
                    if(typeof job.data !== 'string' && typeof job.data !== 'number') {
                        input = JSON.stringify(job.data, escape)
                        job.code += `\nlet input = JSON.parse(\`${input}\`)\nreturn ${job.name}(input)`//backticks
                    }else{
                        job.code +=  typeof job.data !== 'number' ? `\nreturn ${job.name}(\`${job.data}\`)` :  `\nreturn ${job.name}(${job.data})`
                    }
                }else{
                    input = JSON.stringify(job.data, escape)
                    if(input)
                        job.code = `\nlet input = JSON.parse(\`${input}\`)\n`+ job.code
                }
                let F = new AsyncFunction('', job.code )
                let start = performance.now()
                let results = await(F(VFuse = VFuseAPICaller))
                let executionTime = performance.now() - start
                parentPort.postMessage({
                    action: 'return',
                    results : convert(results),
                    executionTime : executionTime
                })
                input = null
                results = null
            } catch (err) {
                console.log(err)
                parentPort.postMessage({
                    action: 'return',
                    results: {error: {
                            message : err.message,
                            code : job.code
                        }}
                })
            }
            break
        case 'running':
            parentPort.postMessage({
                action: 'running',
                status: self.running
            })
            break
    }
}

parentPort.onmessage = onmessage
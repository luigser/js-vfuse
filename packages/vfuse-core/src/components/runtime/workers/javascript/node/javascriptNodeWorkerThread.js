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
        const s = performance.now()
        const promise = new  Promise( (resolve, reject) => {
            parentPort.onmessage = (e) => {
                const {action} = e.data
                if (action === 'VFuse:runtime') {
                    const {func} = e.data.data
                    if(func === 'getDataFromUrl')
                        resolve(e.data.data.content)
                    parentPort.onmessage = onmessage
                    console.log(`getDataFromUrl time : ${performance.now() - s} ms`)
                }
                /*try {
                    let headers = {}
                    if (start !== undefined && end !== undefined) {
                        headers = {
                            'range': `bytes=${start}-${end}`,
                        }
                    }
                    fetch(url, {
                        headers: headers,
                        method: "GET",
                        mode: "cors",
                    })
                        .then(response => {
                            console.log(`getDataFromUrl time : ${performance.now() - s} ms`)
                            resolve(response.text())
                        })
                        .catch(error => reject({error: error}))
                }catch (e){
                    console.log(e)
                    reject({error : e})
                }*/
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
                    type : type
                })
            }
        })

        return promise
    },

    saveOnNetwork : (data, json) => {
        const promise = new  Promise( (resolve, reject) => {
            parentPort.onmessage = (e) => {
                const {action} = e.data
                if (action === 'VFuse:runtime') {
                    const {func} = e.data.data
                    if(func === 'saveOnNetwork')
                        resolve(e.data.data.cid)
                    parentPort.onmessage = onmessage
                }
            }
        })

        parentPort.postMessage({
            action: 'VFuse:worker',
            todo: {
                func: 'saveOnNetwork',
                params: JSON.stringify({
                    data : data,
                    json : json
                })
            }
        })

        return promise
    },

    getFromNetwork : (cid) => {
        const promise = new  Promise( (resolve, reject) => {
            parentPort.onmessage = (e) => {
                const {action} = e.data
                if (action === 'VFuse:runtime') {
                    const {func} = e.data.data
                    if(func === 'getFromNetwork')
                        resolve(e.data.data.content)
                    parentPort.onmessage = onmessage
                }
            }
        })

        parentPort.postMessage({
            action: 'VFuse:worker',
            todo: {
                func: 'getFromNetwork',
                params: JSON.stringify({
                    cid : cid,
                })
            }
        })

        return promise
    },

    setEndlessJob : (job_id) => {
        const promise = new  Promise( (resolve, reject) => {
            parentPort.onmessage = (e) => {
                const {action} = e.data
                if (action === 'VFuse:runtime') {
                    const {func} = e.data.data
                    if(func === 'setEndlessJob')
                        resolve(e.data.data.result)
                    parentPort.onmessage = onmessage
                }
            }
        })

        parentPort.postMessage({
            action: 'VFuse:worker',
            todo: {
                func: 'setEndlessJob',
                params: JSON.stringify({
                    job_id : job_id,
                })
            }
        })

        return promise
    },
    addJobToGroup : (job_id, group) => {
        const promise = new  Promise( (resolve, reject) => {
            parentPort.onmessage = (e) => {
                const {action} = e.data
                if (action === 'VFuse:runtime') {
                    const {func} = e.data.data
                    if(func === 'addJobToGroup')
                        resolve(e.data.data.result)
                    parentPort.onmessage = onmessage
                }
            }
        })

        parentPort.postMessage({
            action: 'VFuse:worker',
            todo: {
                func: 'addJobToGroup',
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
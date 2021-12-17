const worker_code = () => {

    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor

    const VFuse = {
        addJob : (func, deps, input, group) => {
           const promise = new  Promise( (resolve, reject) => {
               self.onmessage = (e) => {
                   const {action} = e.data
                   if (action === 'VFuse:runtime') {
                       const {func} = e.data.data
                       if(func === 'addJob')
                           resolve(e.data.data.job_id)
                       self.onmessage = onmessage
                   }
               }
           })

           self.postMessage({
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

        getDataFromUrl : (url, start, end, type) => {
            const promise = new  Promise( (resolve, reject) => {
                self.onmessage = (e) => {
                    const {action} = e.data
                    if (action === 'VFuse:runtime') {
                        const {func} = e.data.data
                        if(func === 'getDataFromUrl')
                            resolve(e.data.data.content)
                        self.onmessage = onmessage
                    }
                }
            })

            self.postMessage({
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

        saveOnNetwork : (data) => {
            const promise = new  Promise( (resolve, reject) => {
                self.onmessage = (e) => {
                    const {action} = e.data
                    if (action === 'VFuse:runtime') {
                        const {func} = e.data.data
                        if(func === 'saveOnNetwork')
                            resolve(e.data.data.cid)
                        self.onmessage = onmessage
                    }
                }
            })

            self.postMessage({
                action: 'VFuse:worker',
                todo: {
                    func: 'saveOnNetwork',
                    params: JSON.stringify({
                        data : data,
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
        const {action, job, packages} = e.data

        switch (action) {
            case 'init':
                self.postMessage({
                    action: 'initialized'
                })
                break
            case 'load':
                try {
                    let results = null
                    if (packages && packages.length > 0) {
                        packages.map(package => {
                            //do something
                        })
                    }

                    self.postMessage({
                        action: 'loaded',
                        results
                    })
                } catch (err) {
                    console.log(err)
                    self.postMessage({
                        action: 'loaded',
                        results: {error: err}
                    })
                }
                break
            case 'exec':
                try {
                    if(!job.inline){
                        if(typeof job.data !== 'string' && typeof job.data !== 'number') {
                            let input = JSON.stringify(job.data, escape)
                            job.code += `\nlet input = JSON.parse(\`${input}\`)\nreturn ${job.name}(input)`//backticks
                        }else{
                            job.code +=  typeof job.data !== 'number' ? `\nreturn ${job.name}(\`${job.data}\`)` :  `\nreturn ${job.name}(${job.data})`
                        }
                    }
                    let F = new AsyncFunction('', job.code )
                    let start = performance.now()
                    let results = await(F())
                    let executionTime = performance.now() - start
                    self.postMessage({
                        action: 'return',
                        results : convert(results),
                        executionTime : executionTime
                    })
                } catch (err) {
                    //console.log(err)
                    self.postMessage({
                        action: 'return',
                        results: {error: {
                            message : err.message,
                            code : job.code
                        }}
                    })
                }
                break
        }
    }

    self.onmessage = onmessage
}

let code = worker_code.toString()
code = code.substring(code.indexOf("{")+1, code.lastIndexOf("}"))

let blob = new Blob([code], {type: "application/javascript"})
let worker_script = URL.createObjectURL(blob)

module.exports = worker_script

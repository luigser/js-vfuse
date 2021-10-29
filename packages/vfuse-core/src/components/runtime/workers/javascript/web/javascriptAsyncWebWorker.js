const worker_code = () => {

    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor

    const VFuse = {
        addJob : (func, deps, input) => {
           const promise = new  Promise( (resolve, reject) => {
               self.onmessage = (e) => {
                   const {action} = e.data;
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
                       deps: deps
                   })
               }
           })

           return promise
        },

        getDataFromUrl : (url, start, end, type) => {
            const promise = new  Promise( (resolve, reject) => {
                self.onmessage = (e) => {
                    const {action} = e.data;
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

        /*saveWorkflow : () => {
            const promise = new  Promise( (resolve, reject) => {
                self.onmessage = (e) => {
                    const {action} = e.data;
                    if (action === 'VFuse:runtime') {
                        const {func} = e.data.data
                        if(func === 'saveWorkflow')
                            resolve(e.data.data.workflow_id)
                        self.onmessage = onmessage
                    }
                }
            })

            self.postMessage({
                action: 'VFuse:worker',
                todo: {
                    func: 'saveWorkflow',
                    params: JSON.stringify({
                    })
                }
            })

            return promise
        },
        submitWorkflow: () => {
            const promise = new  Promise( (resolve, reject) => {
                self.onmessage = (e) => {
                    const {action} = e.data;
                    if (action === 'VFuse:runtime') {
                        const {func} = e.data.data
                        if(func === 'submitWorkflow')
                            resolve(e.data.data.job_id)
                        self.onmessage = onmessage
                    }
                }
            })

            self.postMessage({
                action: 'VFuse:worker',
                todo: {
                    func: 'submitWorkflow',
                    params: JSON.stringify({
                    })
                }
            })

            return promise
        }*/
    }

    const convert = (results) => {
        if(results instanceof Map)
            return Array.from(results, ([key, value]) => ({ key, value }))
        else
            return results
    }

    const onmessage = async function (e) {
        const {action, job, packages} = e.data;

        switch (action) {
            case 'init':
                self.postMessage({
                    action: 'initialized'
                });
                break;
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
                    });
                } catch (err) {
                    console.log(err)
                    self.postMessage({
                        action: 'loaded',
                        results: {error: err}
                    });
                }
                break;
            case 'exec':
                try {
                    //let F = new AsyncFunction('', '(async() => {' + job.code + '})()');
                    if(!job.inline){
                        //job.code += 'return ' + job.name + "(" + job.data + ")"
                        if(typeof job.data !== 'string') {
                            let input = JSON.stringify(job.data)
                            job.code += '\nlet input = JSON.parse(\'' + input + '\')\n' +
                                'return ' + job.name + "(input)"
                        }else{
                            job.code += '\nreturn ' + job.name + "('" + job.data + "')"
                        }
                        //console.log('code : %s', job.code)
                    }
                    let F = new AsyncFunction('', job.code );
                    let results = await(F());
                    /*console.log(results)
                    console.log('**********************************\n\n')*/
                    self.postMessage({
                        action: 'return',
                        results : convert(results)
                    });
                } catch (err) {
                    //console.log(err)
                    self.postMessage({
                        action: 'return',
                        results: {error: err.message}
                    });
                }
                break;
        }
    }

    self.onmessage = onmessage
}

let code = worker_code.toString();
code = code.substring(code.indexOf("{")+1, code.lastIndexOf("}"));

let blob = new Blob([code], {type: "application/javascript"});
let worker_script = URL.createObjectURL(blob);

module.exports = worker_script;

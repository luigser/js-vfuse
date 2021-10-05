const worker_code = () => {

    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor

    const VFuse = {
        addJob : (func, data, deps) => {
            self.postMessage({
                action : 'VFuse:worker',
                todo: {
                    func : 'addJob',
                    params: JSON.stringify({
                        func: func.toString(),
                        data: data,
                        deps: deps
                    })
                }
            })

            return self.onmessage
        }
    }

    self.onmessage = async function (e) {
        return new Promise(async (resolve, reject) => {
            const {action, job, packages} = e.data;

            switch (action) {
                case 'init':
                    self.postMessage({
                        action: 'initialized'
                    });
                    resolve(e.data)
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
                        resolve(e.data)
                    } catch (err) {
                        console.log(err)
                        self.postMessage({
                            action: 'loaded',
                            results: {error: err}
                        });
                        resolve(e.data)
                    }
                    break;
                case 'exec':
                    try {
                        debugger
                        let F = new AsyncFunction('', job.code);
                        let results = await(F());
                        self.postMessage({
                            action: 'return',
                            results
                        });
                        resolve(e.data)
                    } catch (err) {
                        console.log(err)
                        self.postMessage({
                            action: 'return',
                            results: {error: err}
                        });
                        resolve(e.data)
                    }
                    break;
                case 'VFuse:runtime':
                    const {action} = e.data
                    resolve(e.data)
                    break
            }
        })
    }
}

let code = worker_code.toString();
code = code.substring(code.indexOf("{")+1, code.lastIndexOf("}"));

let blob = new Blob([code], {type: "application/javascript"});
let worker_script = URL.createObjectURL(blob);

module.exports = worker_script;

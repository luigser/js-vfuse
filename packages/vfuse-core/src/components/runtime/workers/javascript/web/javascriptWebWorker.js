const worker_code = () => {

    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor

    const VFuse = {
        resolve : null,
        addJob : (func, data, deps) => {
            return new Promise( (resolve, reject) => {
                self.postMessage({
                    action: 'VFuse:worker',
                    todo: {
                        func: 'addJob',
                        params: JSON.stringify({
                            func: func.toString(),
                            data: data,
                            deps: deps
                        })
                    }
                })

                VFuse.resolve = resolve

                /*self.onmessage = (e) => {
                    const {action} = e.data;
                    if(action === 'VFuse:runtime') {
                        resolve(e.data)
                    }
                }*/
            })
        }
    }

    self.onmessage = async function (e) {
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
                    debugger
                    let F = new AsyncFunction('', job.code);
                    let results = await(F());
                    self.postMessage({
                        action: 'return',
                        results
                    });
                } catch (err) {
                    console.log(err)
                    self.postMessage({
                        action: 'return',
                        results: {error: err}
                    });
                }
                break;
            case 'VFuse:runtime':
                return VFuse.resolve(e.data)
        }
    }

    self.onmessage = onmessage
}

let code = worker_code.toString();
code = code.substring(code.indexOf("{")+1, code.lastIndexOf("}"));

let blob = new Blob([code], {type: "application/javascript"});
let worker_script = URL.createObjectURL(blob);

module.exports = worker_script;

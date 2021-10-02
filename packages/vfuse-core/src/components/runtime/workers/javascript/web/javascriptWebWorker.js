const worker_code = () => {

    const VFuse = {
        addJob : (func, data, deps) => {
            self.postMessage({
                action : 'VFuse',
                todo: {
                    func : 'addJob',
                    params: JSON.stringify({
                        func: func.toString(),
                        data: data,
                        deps: deps
                    })
                }
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
                    if(packages && packages.length > 0){
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
                        results: { error : err}
                    });
                }
                break;
            case 'exec':
                try {
                    debugger
                    let F = new Function(job.code);
                    let results = (F());
                    self.postMessage({
                        action: 'return',
                        results
                    });
                } catch (err) {
                    console.log(err)
                    self.postMessage({
                        action: 'return',
                        results: { error : err}
                    });
                }
                break;
        }
    }
}

let code = worker_code.toString();
code = code.substring(code.indexOf("{")+1, code.lastIndexOf("}"));

let blob = new Blob([code], {type: "application/javascript"});
let worker_script = URL.createObjectURL(blob);

module.exports = worker_script;

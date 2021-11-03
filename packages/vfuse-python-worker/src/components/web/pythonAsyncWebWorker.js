const worker_code = () => {
    languagePluginUrl = 'https://cdn.jsdelivr.net/pyodide/v0.18.1/full/';
    importScripts('https://cdn.jsdelivr.net/pyodide/v0.18.1/full/pyodide.js');

    const JSVFuse = {
        addJob: (code, name, deps, input) => {
            const promise = new Promise((resolve, reject) => {
                self.onmessage = (e) => {
                    const {action} = e.data;
                    if (action === 'VFuse:runtime') {
                        const {func} = e.data.data
                        if (func === 'addJob')
                            resolve(e.data.data.job_id)
                        self.onmessage = onmessage
                    }
                }
            })
            debugger
            self.postMessage({
                action: 'VFuse:worker',
                todo: {
                    func: 'addJob',
                    params: JSON.stringify({

                        name: name,
                        func: code.toString(),
                        input: input && typeof(input) !== 'string' ? input.toJs() : input,
                        deps: deps.toJs()
                    })
                }
            })

            return promise
        },

        getDataFromUrl: (url, start, end, type) => {
            const promise = new Promise((resolve, reject) => {
                self.onmessage = (e) => {
                    const {action} = e.data;
                    if (action === 'VFuse:runtime') {
                        const {func} = e.data.data
                        if (func === 'getDataFromUrl')
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
                        url: url,
                        start: start,
                        end: end,
                        type: type
                    })
                }
            })

            return promise
        }
    }

    self.installDill = "async def installDill():\n" +
        "    import micropip\n" +
        "    await micropip.install('marshall')\n" +
        "installDill()"

    self.PythonVFuse = "from js import JSVFuse\n" +
        "import cloudpickle\n" +
        "class VFuse:\n" +
        "    @staticmethod\n" +
        "    async def addJob(func, deps, input = None):\n" +
        "        func_source = cloudpickle.dumps(func)\n" +
        "        return await JSVFuse.addJob(func_source, func.__name__, deps, input)\n"
        "    @staticmethod\n" +
        "    async def getDataFromUrl(url, start  = None, end  = None, type = None):\n" +
        "        return await JSVFuse.getDataFromUrl(url, start, end, type)\n"
        "    @staticmethod\n" +
        "    async def execute(func, data = None):\n" +
        "        func_caller = cloudpickle.load(func)\n" +
        "        return await func_caller(data)\n" +

    function parseLog(log) {
        return log
            .split(/\r?\n/)
            .slice(-4)
            .join('\n');
    }

    const onmessage = async function (e) {
        const {action, job} = e.data;

        switch (action) {
            case 'init':
                globalThis.JSVFuse = JSVFuse
                languagePluginLoader
                    .then(async () => {
                        try{
                            //await self.pyodide.runPythonAsync(self.installDill)
                            await self.pyodide.runPythonAsync(self.PythonVFuse)
                            self.postMessage({
                                action: 'initialized'
                            })
                        }catch (e) {
                            self.postMessage({
                                action: 'initialized',
                                error : e.message
                            });

                        }
                    })
                    .catch(err => {
                        self.postMessage({
                            action: 'error',
                            results: err.message
                        });
                    });
                break;
            case 'load':
                let packages =  ['numpy', 'cloudpickle']//[...'numpy', ...'cloudpickle', ...e.data.packages]
                self.pyodide
                    .loadPackage(packages)
                    .then(() => {
                        self.postMessage({
                            action: 'loaded'
                        });
                    })
                    .catch(err => {
                        self.postMessage({
                            action: 'error',
                            results: err.message
                        });
                    });
                break;
            case 'exec':
                try {
                    debugger
                    if(job.inline)
                       await self.pyodide.runPythonAsync(self.PythonVFuse)
                    self.pyodide.globals.function_to_run = job.code
                    self.pyodide.globals.input = job.data
                    //let async_execution_code = `async def main():\n   ${job.code.replaceAll('\n', '\t\n')}\nmain()`
                    let results = await self.pyodide.runPythonAsync(!job.inline ?  'VFuse.execute(function_to_run, input)' : job.code)
                    self.postMessage(
                        {
                            action: 'return',
                            results: results
                        });
                } catch (err) {
                    self.postMessage({
                        action: 'error',
                        results: {
                            error: {
                                message : err.message,
                                code : job.code
                            }}
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

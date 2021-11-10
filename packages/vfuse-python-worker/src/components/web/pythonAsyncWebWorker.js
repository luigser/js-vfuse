const worker_code = () => {
    languagePluginUrl = 'https://cdn.jsdelivr.net/pyodide/v0.18.1/full/';
    importScripts('https://cdn.jsdelivr.net/pyodide/v0.18.1/full/pyodide.js');

    const JSVFuse = {
        addJob: (code, name, deps, group, input) => {
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
            self.postMessage({
                action: 'VFuse:worker',
                todo: {
                    func: 'addJob',
                    params: JSON.stringify({
                        name: name,
                        func: code.toJs(),
                        input: input && typeof(input) !== 'string' ? input.toJs() : input,
                        deps: deps.toJs(),
                        group: group && typeof(group) !== 'string' ? group.toJs() : group,
                        packages : self.packages.toJs()
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

    /*"        #if type(result) != str:\n" +
    "        #    result = result.to_py()\n" +*/

    self.PythonVFuse = "from js import JSVFuse\n" +
        "import cloudpickle\n" +
        "import micropip\n" +
        "class VFuse:\n" +
        "    @staticmethod\n" +
        "    async def addJob(func, deps, input = None, group = None):\n" +
        "        func_source = cloudpickle.dumps(func)\n" +
        "        return await JSVFuse.addJob(func_source, func.__name__, deps, group, input)\n" +
        "    @staticmethod\n" +
        "    async def getDataFromUrl(url, start = None, end = None, type = None):\n" +
        "        return await JSVFuse.getDataFromUrl(url, start, end, type)\n" +
        "    @staticmethod\n" +
        "    def execute(func, data = None):\n" +
        "        code = bytes(func.to_py().values())\n" +
        "        if type(data) != str:\n" +
        "            data = data.to_py()\n" +
        "        func_caller = cloudpickle.loads(code)\n" +
        "        return func_caller(data)\n"

    function parseLog(log) {
        return log
            .split(/\r?\n/)
            .slice(-4)
            .join('\n');
    }

    const convert = (results) => {
        if(results instanceof Map)
            return Array.from(results, ([key, value]) => ({ key, value }))
        else
            return results
    }

    const onmessage = async function (e) {
        const {action, job} = e.data;

        switch (action) {
            case 'init':
                globalThis.JSVFuse = JSVFuse
                languagePluginLoader
                    .then(async () => {
                        try{
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
                await self.pyodide.loadPackagesFromImports(self.PythonVFuse)
                await self.pyodide.runPythonAsync(self.PythonVFuse)
                self.postMessage({
                    action: 'loaded'
                });
                /*let packages =  ['numpy', 'cloudpickle']//[...'numpy', ...'cloudpickle', ...e.data.packages]
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
                    });*/
                break;
            case 'exec':
                try {
                    self.pyodide.globals.function_to_run = job.code
                    self.pyodide.globals.input = job.data
                    if(job.inline) {//todo clear prev python code by calling init and load
                        await self.pyodide.loadPackagesFromImports(job.code)
                        self.packages = await self.pyodide.pyodide_py.find_imports(job.code)
                    }
                    else {
                        self.pyodide.loadPackagesFromImports(job.packages)
                    }
                    let results = await self.pyodide.runPythonAsync(!job.inline ?  `VFuse.execute(function_to_run, input)` : job.code)
                    self.postMessage(
                        {
                            action: 'return',
                            results: results && typeof(results)!="string" ? convert(results.toJs()) : results
                        });
                } catch (err) {
                    self.postMessage({
                        action: 'return',
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

const worker_code = () => {
    languagePluginUrl = 'https://cdn.jsdelivr.net/pyodide/v0.18.1/full/';
    importScripts('https://cdn.jsdelivr.net/pyodide/v0.18.1/full/pyodide.js');

    const JSVFuse = {
        addJob: (code, name, deps, input, group) => {
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
                        input: input && typeof(input) !== 'string' && typeof(input) !== 'number' ? input.toJs() : input,
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
        },

        saveOnNetwork : (data, json) => {
            const promise = new  Promise( (resolve, reject) => {
                self.onmessage = (e) => {
                    const {action} = e.data;
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
                        data : typeof(data) !== 'string' ? data.toJs() : data,
                        json: json
                    })
                }
            })

            return promise
        },

        getFromNetwork : (cid) => {
            const promise = new  Promise( (resolve, reject) => {
                self.onmessage = (e) => {
                    const {action} = e.data
                    if (action === 'VFuse:runtime') {
                        const {func} = e.data.data
                        if(func === 'getFromNetwork')
                            resolve(e.data.data.content)
                        self.onmessage = onmessage
                    }
                }
            })

            self.postMessage({
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
                self.onmessage = (e) => {
                    const {action} = e.data
                    if (action === 'VFuse:runtime') {
                        const {func} = e.data.data
                        if(func === 'setEndlessJob')
                            resolve(e.data.data.result)
                        self.onmessage = onmessage
                    }
                }
            })

            self.postMessage({
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
                self.onmessage = (e) => {
                    const {action} = e.data
                    if (action === 'VFuse:runtime') {
                        const {func} = e.data.data
                        if(func === 'addJobToGroup')
                            resolve(e.data.data.result)
                        self.onmessage = onmessage
                    }
                }
            })

            self.postMessage({
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
                self.onmessage = (e) => {
                    const {action} = e.data
                    if (action === 'VFuse:runtime') {
                        const {func} = e.data.data
                        if(func === 'setJobReturnType')
                            resolve(e.data.data.result)
                        self.onmessage = onmessage
                    }
                }
            })

            self.postMessage({
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
        },
    }

    /*"        #if type(result) != str:\n" +
    "        #    result = result.to_py()\n" +*/

    self.PythonVFuseUtils =
        "class Map(dict):\n" +
        "    def __init__(self, *args, **kwargs):\n" +
        "        super(Map, self).__init__(*args)\n" +
        "        for arg in args:\n" +
        "            if isinstance(arg, dict):\n" +
        "                for k, v in arg.iteritems():\n" +
        "                    self[k] = v\n" +
        "    def __getattr__(self, attr):\n" +
        "        return self.get(attr)\n" +
        "    def __setattr__(self, key, value):\n" +
        "        self.__setitem__(key, value)\n" +
        "    def __setitem__(self, key, value):\n" +
        "        super(Map, self).__setitem__(key, value)\n" +
        "        self.__dict__.update({key: value})\n" +
        "    def __delattr__(self, item):\n" +
        "        self.__delitem__(item)\n" +
        "    def __delitem__(self, key):\n" +
        "        super(Map, self).__delitem__(key)\n" +
        "        del self.__dict__[key]\n" +
        "CONSTANTS = Map()\n" +
        "JOB = Map()\n" +
        "RETURN_TYPES = Map()\n" +
        "RETURN_TYPES.INTEGER = 'INTEGER'\n" +
        "RETURN_TYPES.ARRAY = 'ARRAY'\n" +
        "RETURN_TYPES.OBJECT = 'OBJECT'\n" +
        "JOB.RETURN_TYPES = RETURN_TYPES\n"+
        "CONSTANTS.JOB = JOB\n"

    self.PythonVFuse = "from js import JSVFuse\n" +
        "import cloudpickle\n" +
        "import micropip\n" +
        "class VFuse:\n" +
        "    Constants = CONSTANTS\n" +
        "    @staticmethod\n" +
        "    async def addJob(func, deps, input = None, group = None):\n" +
        "        func_source = cloudpickle.dumps(func)\n" +
        "        return await JSVFuse.addJob(func_source, func.__name__, deps, input, group)\n" +
        "    @staticmethod\n" +
        "    async def getDataFromUrl(url, start = None, end = None, type = None):\n" +
        "        return await JSVFuse.getDataFromUrl(url, start, end, type)\n" +
        "    @staticmethod\n" +
        "    async def saveOnNetwork(data, json = True):\n" +
        "        return await JSVFuse.saveOnNetwork(data, json)\n" +
        "    @staticmethod\n" +
        "    async def getFromNetwork(cid):\n" +
        "        return await JSVFuse.getFromNetwork(cid)\n" +
        "    @staticmethod\n" +
        "    async def setEndlessJob(job_id):\n" +
        "        return await JSVFuse.setEndlessJob(job_id)\n" +
        "    @staticmethod\n" +
        "    async def addJobToGroup(job_id, group):\n" +
        "        return await JSVFuse.addJobToGroup(job_id, group)\n" +
        "    @staticmethod\n" +
        "    def execute(func, data = None):\n" +
        "        code = bytes(func.to_py().values())\n" +
        "        if type(data) != str and type(data) != int and type(data) != float:\n" +
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
                await self.pyodide.loadPackagesFromImports(self.PythonVFuseUtils)
                await self.pyodide.runPythonAsync(self.PythonVFuseUtils)
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
                    let start = performance.now()
                    let results = await self.pyodide.runPythonAsync(!job.inline ?  `VFuse.execute(function_to_run, input)` : job.code)
                    let executionTime = performance.now() - start
                    self.postMessage(
                        {
                            action: 'return',
                            results: results && typeof(results)!="string" && typeof(results)!="number" ? convert(results.toJs()) : results,
                            executionTime : executionTime
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

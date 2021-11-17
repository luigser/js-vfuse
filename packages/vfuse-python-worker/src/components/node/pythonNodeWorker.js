//https://github.com/gabrielfreire/neuralnet.js/tree/wasm-nodejs
const path = require('path')

class PythonNodeWorker {
    constructor(runtime) {
        this.runtime = runtime
        this.pyodide = null
        this.packages = []
    }

    convert(results){
        return results.has ? Array.from(results, ([key, value]) => ({ key, value })) : results
    }

    async run(job){
        try {
            this.pyodide.globals.function_to_run = job.code
            this.pyodide.globals.input = job.data
            if(job.inline) {//todo clear prev python code by calling init and load
                await this.pyodide.loadPackagesFromImports(job.code)
                this.packages = await this.pyodide.pyodide_py.find_imports(job.code)
            }
            else {
                this.pyodide.loadPackagesFromImports(job.packages)
            }
            let results = await this.pyodide.runPythonAsync(!job.inline ?  `VFuse.execute(function_to_run, input)` : job.code)

            return{
                    action: 'return',
                    results: results && typeof(results)!="string" ? this.convert(results.toJs()) : results
                }
        }catch (e) {
            return {
                action: 'return',
                results: {
                    error: {
                        message : e.message,
                        code : job.code
                    }}
            }
        }
    }

    async init()
    {
        this.JSVFuse = {
            addJob : async(func, name, deps, input, group) =>  await this.runtime.addJob(
                name,
                func.toJs(),
                input && typeof(input) !== 'string' ? input.toJs() : input,
                deps.toJs(),
                group && typeof(group) !== 'string' ? group.toJs() : group,
                this.packages.toJs()
            ),
            getDataFromUrl : async (url, start, end, type) => await this.runtime.getDataFromUrl(url, start, end, type),
            saveOnNetwork : async (data) => await this.runtime.saveOnNetwork(typeof(data) !== 'string' ? data.toJs() : data)
        }
        globalThis.JSVFuse = this.JSVFuse

        //let pyodide = await import("pyodide/pyodide.js");
        //let dir = path.join(__dirname, '..', 'pyodide')
        this.pyodide = await pyodide.loadPyodide({
                indexURL: 'file:///../pyodide/'//'file:///' + dir,
            })
    }

    async load(){
        this.PythonVFuse = "from js import JSVFuse\n" +
            "import cloudpickle\n" +
            "import micropip\n" +
            "class VFuse:\n" +
            "    @staticmethod\n" +
            "    async def addJob(func, deps, input = None, group = None):\n" +
            "        func_source = cloudpickle.dumps(func)\n" +
            "        return await JSVFuse.addJob(func_source, func.__name__, deps, input, group)\n" +
            "    @staticmethod\n" +
            "    async def getDataFromUrl(url, start = None, end = None, type = None):\n" +
            "        return await JSVFuse.getDataFromUrl(url, start, end, type)\n" +
            "    @staticmethod\n" +
            "    async def saveOnNetwork(data):\n" +
            "        return await JSVFuse.saveOnNetwork(data)\n" +
            "    @staticmethod\n" +
            "    def execute(func, data = None):\n" +
            "        code = bytes(func.to_py().values())\n" +
            "        if type(data) != str:\n" +
            "            data = data.to_py()\n" +
            "        func_caller = cloudpickle.loads(code)\n" +
            "        return func_caller(data)\n"
        await this.pyodide.loadPackagesFromImports(this.PythonVFuse)
        await this.pyodide.runPythonAsync(this.PythonVFuse)
    }
}

module.exports = PythonNodeWorker

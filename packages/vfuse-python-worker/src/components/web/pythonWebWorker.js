const worker_code = () => {
    languagePluginUrl = 'https://cdn.jsdelivr.net/pyodide/v0.16.1/full/';
    importScripts('https://cdn.jsdelivr.net/pyodide/v0.16.1/full/pyodide.js');

    const VFuse = {
        python_import : 'from js import VFuse',
        addJob: (func, deps, input) => {
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

                        name: func.__name__,
                        func: func.toString(),
                        input: input,
                        deps: deps
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

    self.run_code =
"import sys, io, traceback\n\
namespace = {}\n\
def run_code(code):\n\
  out = io.StringIO()\n\
  oldout = sys.stdout\n\
  olderr = sys.stderr\n\
  sys.stdout = sys.stderr = out\n\
  try:\n\
      exec(code, namespace)\n\
  except:\n\
      traceback.print_exc()\n\
  sys.stdout = oldout\n\
  sys.stderr = olderr\n\
  return out.getvalue()"

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
                globalThis.VFuse = VFuse
                languagePluginLoader
                    .then(async () => {
                        try{
                            await self.pyodide.runPythonAsync(/*self.run_code*/VFuse.python_import)
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
                let packages = [...'numpy', ...e.data.packages]
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
                    self.pyodide.globals.function_to_run = job.code;
                    self.pyodide.globals.input = job.data
                    let results = await self.pyodide.runPythonAsync(!job.inline ? 'function_to_run(input)' : job.code)
                    self.postMessage(
                        {
                            action: 'return',
                            results
                        });
                    /*self.pyodide
                        .runPythonAsync('run_code(code_to_run)')
                        .then(results => {
                            self.postMessage(
                                {
                                    action: 'return',
                                    results
                                });
                        })
                        .catch(err => {
                            self.postMessage({
                                action: 'error',
                                results: {
                                    error: {
                                        message : err.message
                                            .split(/\r?\n/)
                                            .slice(-2)
                                            .join('\n'),
                                        code : job.code
                                    }}
                            });
                        });*/
                } catch (err) {
                    self.postMessage({
                        action: 'error',
                        results: {error: {
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

const worker_code = () => {
    languagePluginUrl = 'https://cdn.jsdelivr.net/pyodide/v0.16.1/full/';
    importScripts('https://cdn.jsdelivr.net/pyodide/v0.16.1/full/pyodide.js');

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

    self.onmessage = async function (e) {
        const {action, job} = e.data;

        switch (action) {
            case 'init':
                languagePluginLoader
                    .then(() => {
                        self.pyodide.runPythonAsync(self.run_code).then(() => {
                            self.postMessage({
                                action: 'initialized'
                            });
                        })
                    })
                    .catch(err => {
                        self.postMessage({
                            action: 'error',
                            results: err.message
                        });
                    });
                break;
            case 'load':
                let packages = [['numpy'], ...e.data.packages]
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
                    self.pyodide.globals.code_to_run = job.code;
                    //await self.pyodide.loadPackagesFromImports(job.code);
                    self.pyodide
                        //.runPythonAsync(job.code)
                        .runPythonAsync('run_code(code_to_run)')
                        .then(results => {
                            self.postMessage({action: 'return', results});
                        })
                        .catch(err => {
                            self.postMessage({
                                action: 'error',
                                results: err.message
                                    .split(/\r?\n/)
                                    .slice(-2)
                                    .join('\n')
                            });
                        });
                } catch (err) {
                    self.postMessage({
                        action: 'error',
                        results: parseLog(err.message)
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

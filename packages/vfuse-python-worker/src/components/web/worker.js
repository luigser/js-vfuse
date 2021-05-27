const WebWorkerScript = String.raw`
self.languagePluginUrl = 'https://cdn.jsdelivr.net/pyodide/v0.16.1/full/';
//self.languagePluginUrl = 'http://localhost:3000/pyodide/';
importScripts('https://cdn.jsdelivr.net/pyodide/v0.16.1/full/pyodide.js');
//importScripts('http://localhost:3000/pyodide/pyodide.js');

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
self.onmessage = async function(e) {
  const { action, job } = e.data;
  if (action === 'init') {
    languagePluginLoader
      .then(() => {
        self.pyodide.runPythonAsync(self.run_code).then(()=> {
          self.postMessage({
          action: 'initialized'
        });})
      })
      .catch(err => {
        self.postMessage({
          action: 'error',
          results: err.message
        });
      });
  } else if (action === 'load' && e.data.packages) {
    self.pyodide
      .loadPackage(e.data.packages)
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
  } else if (action === 'exec') {
    try {
      self.pyodide.globals.code_to_run = job.code;
      //await self.pyodide.loadPackagesFromImports(job.code);
      self.pyodide
        //.runPythonAsync(job.code)
        .runPythonAsync('run_code(code_to_run)')
        .then(results => {
          self.postMessage({ action: 'return', results });
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
  }
};
`

module.exports = WebWorkerScript
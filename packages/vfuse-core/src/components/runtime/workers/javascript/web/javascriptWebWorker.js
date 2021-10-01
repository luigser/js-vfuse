const worker_code = () => {

    self.onmessage = async function (e) {
        const {action, job} = e.data;

        switch (action) {
            case 'init':

                self.postMessage({
                    action: 'initialized'
                });

                break;
            case 'load':
                self.postMessage({
                    action: 'loaded'
                });
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
                        action: 'error',
                        results: err.message
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

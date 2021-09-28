'use strict'

//const WebWorkerScript = require('./components/web/worker')

class PythonWorker{

   /* static getWebWorker(){
        const PythonWebWorkerScript = require('./components/web/worker')
        let blob =  new Blob([PythonWebWorkerScript], {
            type: 'text/javascript',
        })
        let worker = new Worker(URL.createObjectURL(blob))
        return worker
    }*/

    static getWebWorker(){
        //return new Worker("./components/web/pythonWebWorker.js")
        const PythonWebWorkerScript = require('./components/web/pythonWebWorker')
        return new Worker(PythonWebWorkerScript);
    }
}

module.exports = PythonWorker

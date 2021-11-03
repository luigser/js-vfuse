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

        from js import VFuse
class VFuse:
    async def addJob(func, deps, input):
        return await window.postMessage(func, deps, input)

    async def getDataFromUrl(url, start, end, type):
        return await window.postMessage()
    }*/

    constructor() {}
    getDefaultPackages(){
        return []
    }

    getWebWorker(){
        //return new Worker("./components/web/pythonWebWorker.js")
        const PythonWebWorkerScript = require('./components/web/pythonAsyncWebWorker')
        return new Worker(PythonWebWorkerScript);
    }
}

module.exports = PythonWorker

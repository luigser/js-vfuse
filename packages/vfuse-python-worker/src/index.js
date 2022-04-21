'use strict'

class PythonWorker{

    constructor() {}

    getDefaultPackages(){
        return []
    }

    getNodeWorker(runtime){
        const PythonNodeWorker = require('./components/node/pythonNodeWorker')
        return new PythonNodeWorker(runtime)

    }

    getWebWorker(){
        //return new Worker("./components/web/pythonWebWorker.js")
        const PythonWebWorkerScript = require('./components/web/pythonAsyncWebWorkerV20')
        return new Worker(PythonWebWorkerScript);
    }

    static getLanguage(){
        return 'python'
    }
}

module.exports = PythonWorker

'use strict'

class JavascriptNodeRuntime{

    constructor(runtime) {
        const JavascriptNodeWorkerRuntime = require('./nodeWorkerRuntime')
        return new JavascriptNodeWorkerRuntime(runtime)
    }
    getDefaultPackages(){
        return []
    }

    static getLanguage = () => 'javascript'

}

module.exports = JavascriptNodeRuntime

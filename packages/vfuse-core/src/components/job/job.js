'use strict'
const Constants = require("../constants");

class Job{
    //decomment in build
    /*static SATUS = {
        WAITING : 0,//due to dependencies
        READY: 1,//no dependences and ready to be executed
        COMPLETED: 2,//results are available
        ERROR: 3//something wrong during the execution
    }*/

    constructor(id, name, code, data = [], dependencies = [], group = '', language, packages = []) {
        this.id = id
        this.status = Constants.JOB.STATUS.WAITING
        this.initialStatus = Constants.JOB.STATUS.WAITING
        this.name = name
        this.code = code
        this.data = data
        this.dependencies = dependencies
        this.group = group
        this.language = language
        this.results = null//[]
        this.packages = packages
        this.reward = 0
        this.executionTime = 0
        this.executorPeerId = null
        this.type = Constants.JOB.TYPE.EXECUTOR
    }
}

module.exports = Job

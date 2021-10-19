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

    constructor(id, name, code, data, dependencies) {
        this.id = id
        this.status = Constants.JOB_SATUS.WAITING
        this.name = name
        this.code = code
        this.data = data
        this.dependencies = dependencies
        this.results = []
    }
}

module.exports = Job

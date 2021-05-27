'use strict'

class Job{
    static SATUS = {
        WAITING : 0,
        READY: 1,
        COMPLETED: 2,
        ERROR: 3
    }

    constructor(code, data, dependencies) {
        this.status = Job.SATUS.WAITING
        this.code = code
        this.data = data
        this.dependencies = dependencies
        this.result = null
    }
}

module.exports = Job
'use strict'

class Workflow{
    constructor() {
        this.jobs = []
    }

    addJob(job){
        this.jobs.push(job)
    }
}
module.exports = Workflow
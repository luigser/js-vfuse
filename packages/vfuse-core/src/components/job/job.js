'use strict'

class Job{
    constructor(func, data, dependencies) {
        this.function = func
        this.data = data
        this.dependencies = dependencies
    }
}

module.exports = Job
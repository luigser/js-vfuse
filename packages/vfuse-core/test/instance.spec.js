'use strict'
//This solve Buffer Unreferenced in the browser instance
global.Buffer = global.Buffer || require('buffer').Buffer;
const chai = require('chai')
const dirtyChai = require('dirty-chai')
const chaiHttp = require('chai-http');
const expect = chai.expect
chai.use(dirtyChai)
chai.use(chaiHttp);

const VFuse = require('../src')
const PythonWorker = require('../../vfuse-python-worker/src')
const Job = require('../src/components/job/job')
const Workflow = require('../src/components/job/workflow')

const options = {
    id: null,
    discoveryCallback : () => {},
    connectionCallback: () => {},
    getMessageFromProtocolCallback : () => {},
    bootstrapNodes : null,
    packages: []
}


describe('Create with no new profile and python worker',  () => {
    it('create and run code in local runtime', async () => {
        //Set worker in the browser context (do not do it before)
        options.worker = PythonWorker.getWebWorker()
        const node = await VFuse.create(options)

        expect(node).to.exist()
        console.log('PROFILE ID: %s', node.profile.id)

        let job = new Job(
            `import numpy as np 
a = [[2, 0], [0, 2]]
b = [[4, 1], [2, 2]]
c = np.dot(a, b)
print(c)`,
            null,
            null
        )

        let workflow = new Workflow([job])
        node.addWorkflow(workflow)
        await node.runWorkflows()
        console.log(workflow)
        expect(job.result).to.exist()

        /*const response = await chai.request('https://ipfs.io/ipfs').get('/' + node.profile.id)
        console.log(response.body)
        expect(response).to.have.status(200);*/
    }).timeout(30000)
})


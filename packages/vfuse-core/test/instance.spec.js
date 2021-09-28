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

const options = {
    peerId : "QmRHLmg8VaJTsRAzM98fYrw5RKcf4hQoJpY9jrF2YZVFuS",
    discoveryCallback : () => {},
    connectionCallback: () => {},
    getMessageFromProtocolCallback : () => {},
    bootstrapNodes : null,
    packages: []
}


/*describe('Create with new profile and python worker',  () => {
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
        await node.runAllWokflows()
        console.log(workflow)
        expect(job.result).to.exist()

        //const response = await chai.request('https://ipfs.io/ipfs').get('/' + node.profile.id)
        //console.log(response.body)
        //expect(response).to.have.status(200);
    }).timeout(30000)
})*/

//New profile
/*describe('Create  new profile and python worker',  () => {
    it('create new profilee', async () => {
        //Set worker in the browser context (do not do it before)
        options.worker = PythonWorker.getWebWorker()
        const node = await VFuse.create(options)

        expect(node).to.exist()
        console.log('PROFILE ID: %s', node.profile.id)

    }).timeout(30000)
})*/

describe('Get profile',  () => {
    it('getting existing profile', async () => {
        options.profileId = "QmeE1i8ft3ARk9KssYqeXKRTCAckUfB3kF3WijACaWxFLs"
        //Set worker in the browser context (do not do it before)
        options.worker = PythonWorker.getWebWorker()
        const node = await VFuse.create(options)
        expect(node).to.exist()
        console.log('PROFILE ID: %s', node.identityManager.id)

    }).timeout(30000)
})
/*
describe('Check profile update',  () => {
    it('Get profile and update', async () => {
        options.profileId = "QmeE1i8ft3ARk9KssYqeXKRTCAckUfB3kF3WijACaWxFLs"
        //options.identity = {
        //    PeerID: 'QmRHLmg8VaJTsRAzM98fYrw5RKcf4hQoJpY9jrF2YZVFuS',
        //    publicKey: 'CAASpgIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCYBH7eems357Oo2edlwWYTnSOBZgyD/JhCgOWizO+bFP2PMZr98ZYkGOjhACi/3n7LoPf6sJxYBsYeAijR2TGhCkMHEDeMaxfkIUxGqTei3eIsi6F2pnGKZZBoy/u/mldjZehwwXLbC+YwZXW/OdZBKU5IvIkN8QvotbSWUoysw +DGsrpgvmhM2ES8FLPPH2SJGznE7lm6ng8xkWHjg303ZQiXaJCKhRdC2oF1rStV+1b/aeHSoOZfLymHGDx44bgMXBOtgbHosIUWXY6Et63d4IJNjvZ7/+I/HuIINRW1r6e/qlZdaqRKJExS8rqZqrEPNlVDwppCCU1tdcO6LMhLAgMBAAE=',
//
        //}
        options.worker = PythonWorker.getWebWorker()

        const node = await VFuse.create(options)
        expect(node).to.exist()

        let id = await node.net.ipfs.id()

        //console.log("IPFS PeerID: %s", id)
        console.log("Profile ID: %s",node.profile.id)

        console.log('PROFILE WORKFLOWS BEFORE UPDATE')
        console.log(node.profile.workflows)

        const workflow = await node.createWorkflow();
        console.log('WORKFLOW CREATION')
        console.log(node.profile.workflows)
        //expect(node.profile.workflows).to.have.lengthOf(2)

        await node.addJob(
            workflow,
            `import numpy as np
a = [[2, 0], [0, 2]]
b = [[4, 1], [2, 2]]
c = np.dot(a, b)
print(c)`,
            [],
            []
        )

        console.log('JOB ADDED')
        console.log(node.profile.workflows)
        expect(node.profile.workflows[workflow].jobs).to.have.lengthOf(1)

    }).timeout(30000)
})

*/

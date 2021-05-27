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
    id: null,
    discoveryCallback : () => {},
    connectionCallback: () => {},
    getMessageFromProtocolCallback : () => {},
    bootstrapNodes : null,
    packages: []
}


describe('Create with no new profile and python worker',  () => {
    it('create', async () => {
        //Set worker in the browser context (do not do it before)
        options.worker = PythonWorker.getWebWorker()
        const node = await VFuse.create(options)
        expect(node).to.exist()
        console.log('PROFILE ID: %s', node.profile.id)

        /*const response = await chai.request('https://ipfs.io/ipfs').get('/' + node.profile.id)
        console.log(response.body)
        expect(response).to.have.status(200);*/
    }).timeout(10000)
})

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

const options = {
    id: null,
    discoveryCallback : () => {},
    connectionCallback: () => {},
    getMessageFromProtocolCallback : () => {},
    bootstrapNodes : null,
    packages: null
}


describe('Create with no id',  () => {
    it('create', async () => {
        const node = await VFuse.create(options)
        expect(node).to.exist()
        console.log('PROFILE ID: ')

        /*const response = await chai.request('https://ipfs.io/ipfs').get('/' + node.profile.id)
        console.log(response.body)
        expect(response).to.have.status(200);*/
    })
})
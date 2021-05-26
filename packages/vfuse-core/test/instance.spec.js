'use strict'
//This solve Buffer Unreferenced in the browser instance
global.Buffer = global.Buffer || require('buffer').Buffer;

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const VFuse = require('../src')

const options = {
    id: null,
    discoveryCallback : () => {},
    connectionCallback: () => {},
    getMessageFromProtocolCallback : () => {},
    bootstrapNodes : null,
    packages: null
}


describe('instances',  () => {
    it('create', async () => {
        const node = await VFuse.create(options)
        expect(node).to.exist()
        console.log({node})
    })
})
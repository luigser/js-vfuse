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

/*describe('Create with profile and python worker',  () => {
    it('create and run code in local runtime', async () => {
        options.profileId = "QmcaF94B9rHX4Gr1F9EZEue4Kx19L6DaHVB7tthAw7b2Bo"
        options.identity = {
            PeerID: "QmcNCn1m7TQ8E8C4VcbMaddXULyiCgfVXYvMvsYHZXpcJ1",
            PrivKey: "CAASpgkwggSiAgEAAoIBAQCFxeBcNkBvHay7hD6Zxxd/mQuttV02eQ+vOS7ecEEHvKfaoQ2ppFuOirhQp/fxc1m0rHGofDC7YnILmEDIL3GB4bOzRahBKI0BC8DfrJvdI8HMBmfMxHbEKwOCaWYG8XeZKzmqCT+z1IoxFbD1ro06Nlj96QyI58+g7BnqIVO2VwxHECmJ7kC3lXMZn2IF9X84Gftneorgcwn5kgHnqQp41YlC5rq5yHuNk/YD/R3PLfxhSyJgizx0zyZqrktGcEIImQsDcR9CggNHr/dTSbVQpw+ch+ScBCEALpoUPc07b/U4raugsJ5xBNnegVHkeFqnD0M1eWVrSVY1MQiNbyvxAgMBAAECggEALk/4QdRicFWktHKvPYvovbsdiPEOKUq2PGKesFHKocQVlKJHWaDWNb4e24WbWFMoDl3ZJ4x/TpBhjVQTsXqDYITkMr995bkFQARyrL1UZLX5ZQoeq4yk1XtSxrZ4pRS55CRL3WtAS6DciuvIjPX2XN3t51Hkjg07G6pBuoX5NlnccYEO7WujP+aobDIN0P8DgKnH3zIyY2DB516nkQVi1vkN+2d2WTRKdrXGmDgnUh2H9pR5BWAjUXF78eFQdoatnEf5bjSjNAwnsGExew8ZcpMDNjwFkvXcRK1K70wnYRdw/J4EyJllgCmwSKJ8D3nVy3FS6tqnnEIhV9R+4TFRJQKBgQD7PK7j+uoYF51PKC8ynQKEu32RPkh6AAERbmYB68oNXWWd8ke4e8m0H+09o/Vye1wl3B2Hoehkos4GIoqC1xuNkBbAWSC51bN7et6JrnGuoPzCQa3V09qmQG6lwnKQ1NZUuGKbY0t4oX+S9TP3qnsJOCIzou7kIW5UaK/0llaLtwKBgQCITxw/rMB5xwVTmqqkbOZtF4MZ04L+BxOYv+E3iKNnnVnQ+ah0ln3ra8xSsVlxPU/P0R59YHGeZ+a7FJiab5a7RlxWwjXu1Tz4sRX2ezbdhKkY6KGfUTv7JLzVV0yK80RtmlWWAQ009RdDQILWWevtjZShw6ZEau3MN2DsuflVlwKBgHX0EqREnH19MMUGN8qKfrE0mYqEdGCa+eVmMIw8WJuXuurB4jxSGevwhWDIRqdeFXBM/Kw+Lq545UNqGh+9wFjhSl06OywkkeSqVirL9OGpAaJuVaArm98sJwa52TH4SzxxaRJNNxTGte+YIbLonmVAroYRvBjtPTByChJKNw3XAoGAacH3iO/f5pwj5dn6y9gycDHt5fvVhoK3EazOcOfy4FGVfi42JT8eM6pPvVkcrF+FrRfzMBPEE8NJoZ05SZmKuYK94hKNBeEsjUfYYoT27KghCtJzk8jTYOgAGwbAvI5CaUd1YA0w0gXXJrbGzMi35HgU+e1y82KDXg8ZhJJGgcECgYAF72/d4s+3LILRDp8xZWme1kxjOiox0I69VuV2kJ/MnF0t4DD814045GudFvT/QcpWQySDXT9Mb62ChQ38NwuN7bJv87UratjOgPBDt76mvV22xf1nym94yKEovWnLGgHTX9lR6LBahQ2NN4qj+zEOmbVY/vNJGa8KyBuVvjGUNQ=="
        }
        //Set worker in the browser context (do not do it before)
        options.worker = PythonWorker.getWebWorker()
        const node = await VFuse.create(options)

        expect(node).to.exist()
        console.log('PROFILE ID: %s', node.profile.id)

    }).timeout(30000)
})*/



describe('Check profile update',  () => {
    it('Get profile and update', async () => {
        options.profileId = "QmcaF94B9rHX4Gr1F9EZEue4Kx19L6DaHVB7tthAw7b2Bo"
        options.identity = {
            PeerID: "QmcNCn1m7TQ8E8C4VcbMaddXULyiCgfVXYvMvsYHZXpcJ1",
            PrivKey: "CAASpgkwggSiAgEAAoIBAQCFxeBcNkBvHay7hD6Zxxd/mQuttV02eQ+vOS7ecEEHvKfaoQ2ppFuOirhQp/fxc1m0rHGofDC7YnILmEDIL3GB4bOzRahBKI0BC8DfrJvdI8HMBmfMxHbEKwOCaWYG8XeZKzmqCT+z1IoxFbD1ro06Nlj96QyI58+g7BnqIVO2VwxHECmJ7kC3lXMZn2IF9X84Gftneorgcwn5kgHnqQp41YlC5rq5yHuNk/YD/R3PLfxhSyJgizx0zyZqrktGcEIImQsDcR9CggNHr/dTSbVQpw+ch+ScBCEALpoUPc07b/U4raugsJ5xBNnegVHkeFqnD0M1eWVrSVY1MQiNbyvxAgMBAAECggEALk/4QdRicFWktHKvPYvovbsdiPEOKUq2PGKesFHKocQVlKJHWaDWNb4e24WbWFMoDl3ZJ4x/TpBhjVQTsXqDYITkMr995bkFQARyrL1UZLX5ZQoeq4yk1XtSxrZ4pRS55CRL3WtAS6DciuvIjPX2XN3t51Hkjg07G6pBuoX5NlnccYEO7WujP+aobDIN0P8DgKnH3zIyY2DB516nkQVi1vkN+2d2WTRKdrXGmDgnUh2H9pR5BWAjUXF78eFQdoatnEf5bjSjNAwnsGExew8ZcpMDNjwFkvXcRK1K70wnYRdw/J4EyJllgCmwSKJ8D3nVy3FS6tqnnEIhV9R+4TFRJQKBgQD7PK7j+uoYF51PKC8ynQKEu32RPkh6AAERbmYB68oNXWWd8ke4e8m0H+09o/Vye1wl3B2Hoehkos4GIoqC1xuNkBbAWSC51bN7et6JrnGuoPzCQa3V09qmQG6lwnKQ1NZUuGKbY0t4oX+S9TP3qnsJOCIzou7kIW5UaK/0llaLtwKBgQCITxw/rMB5xwVTmqqkbOZtF4MZ04L+BxOYv+E3iKNnnVnQ+ah0ln3ra8xSsVlxPU/P0R59YHGeZ+a7FJiab5a7RlxWwjXu1Tz4sRX2ezbdhKkY6KGfUTv7JLzVV0yK80RtmlWWAQ009RdDQILWWevtjZShw6ZEau3MN2DsuflVlwKBgHX0EqREnH19MMUGN8qKfrE0mYqEdGCa+eVmMIw8WJuXuurB4jxSGevwhWDIRqdeFXBM/Kw+Lq545UNqGh+9wFjhSl06OywkkeSqVirL9OGpAaJuVaArm98sJwa52TH4SzxxaRJNNxTGte+YIbLonmVAroYRvBjtPTByChJKNw3XAoGAacH3iO/f5pwj5dn6y9gycDHt5fvVhoK3EazOcOfy4FGVfi42JT8eM6pPvVkcrF+FrRfzMBPEE8NJoZ05SZmKuYK94hKNBeEsjUfYYoT27KghCtJzk8jTYOgAGwbAvI5CaUd1YA0w0gXXJrbGzMi35HgU+e1y82KDXg8ZhJJGgcECgYAF72/d4s+3LILRDp8xZWme1kxjOiox0I69VuV2kJ/MnF0t4DD814045GudFvT/QcpWQySDXT9Mb62ChQ38NwuN7bJv87UratjOgPBDt76mvV22xf1nym94yKEovWnLGgHTX9lR6LBahQ2NN4qj+zEOmbVY/vNJGa8KyBuVvjGUNQ=="
        }
        options.worker = PythonWorker.getWebWorker()

        const node = await VFuse.create(options)
        expect(node).to.exist()
        console.log("PeerID: %s",node.net.libp2p.peerId)
        console.log("Profile ID: %s",node.profile.id)

        console.log('PROFILE WORKFLOWS BEFORE UPDATE')
        console.log(node.profile.workflows)

        const workflow = await node.createWorkflow();
        console.log('WORKFLOW CREATION')
        console.log(node.profile.workflows)
        expect(node.profile.workflows).to.have.lengthOf(2)

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


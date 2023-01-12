import "../build/vfuse-web-bundle.js";

let workflow_code = `
async function map(data){
    let mapped = new Map()
    let input = await VFuse.getDataFromUrl("https://raw.githubusercontent.com/bwhite/dv_hadoop_tests/master/python-streaming/word_count/input/4300.txt")
    input.split(/\\W+/).map(word => {
        if(word !== "")
            mapped.set(word, mapped.has(word) ? mapped.get(word) + 1 : 1)
    })
    return mapped
}

function reduce(data){
    let result = new Map()
    for(let d of data)
        result.set(d.key, result.has(d.key) ? result.get(d.key) + d.value : d.value)

    let max = result.entries().next()
    for(let [key, value] of result.entries()) {
        if(value > max.value)
            max = result.get(key)
    }
    return max
}

for(let i = 0; i < 8; i++){
    await VFuse.addJob(map, [], null)
}

await VFuse.addJob(reduce, ['^map'])//wait for all reduce results and call combine
`

async function init() {
    let ready = false
    let workflow = null

    let options = {
        localStorage: true,
        computation: true,
        maintainRunningState: false,
        preferences: {
            MAX_CONCURRENT_JOBS: 2
        },
        ipfs: {
            config: {
                Addresses: {
                    Swarm: ['/ip4/127.0.0.1/tcp/2001/ws/p2p-webrtc-star/']
                },
                Bootstrap: ['/ip4/127.0.0.1/tcp/4003/ws/p2p/12D3KooWBFJGaj82urm2UzQhvsAxeKRWLS54FwH9xcaPcMf9HcuH']
            }
        },
        ipfsClusterApi : {host: '127.0.0.1', port: '9094', protocol: 'http'}
    }
    try {
        let node = await VFuse.create(options)
        node.addListener(VFuse.Constants.EVENTS.WORKFLOW_COMPLETED, function (workflow) {
            console.log(`Workflow ${workflow.id} completes execution`)
        })

        node.addListener(VFuse.Constants.EVENTS.NODE_STATUS, async function(data){
            if(data.status){
                console.log({data})
                ready = true
            }
        })

        document.addEventListener("start", async () => {
            if(ready) {
                console.log("The start event was triggered")
                try {
                    let wid = localStorage.getItem('wid')
                    if (wid === 'undefined') {
                        workflow = await node.saveWorkflow('Test workflow', null, workflow_code, VFuse.Constants.PROGRAMMING_LANGUAGE.JAVASCRIPT)
                        localStorage.setItem('wid', workflow.id)
                    }else{
                        workflow = await node.getWorkflow(wid)
                    }
                    console.log(workflow)
                    await node.submitWorkflow(workflow.id)
                }catch (e) {
                    console.log(e)
                }
            }else{
                alert("VFuse node is not started yet !!!")
            }
        });

        document.addEventListener("stop", async () => {
            if(ready) {
                console.log("The stop event was triggered")
                try {
                    if (workflow) {
                        await node.stopWorkflow(workflow.id)
                    }else{
                       alert('There is not published workflows')
                    }
                }catch (e) {
                    console.log(e)
                }
            }else{
                alert("VFuse node is not started yet !!!")
            }
        })
    }catch (e) {
        console.log(e)
    }
}

init()


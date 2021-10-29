let input = await VFuse.getDataFromUrl("https://raw.githubusercontent.com/bwhite/dv_hadoop_tests/master/python-streaming/word_count/input/4300.txt")

function map(data){
    let mapped = new Map()
    data.map(d => d.split(/\W+/).map(word => mapped.set(word, mapped.has(word) ? mapped.get(word) + 1 : 1)))
    return mapped
}

function reduce(data){
    let result = new Map()
    for(let d of data)
        result.set(d.key, result.has(d.key) ? result.get(d.key) + d.value : d.value)
    return result
}

function getMaxOccurenceWord(data){
    let max = data[0]
    for(let entry of data){
        if(entry.value > max.value)
            max = entry
    }
    return max
}

input = input.toString().replace(/'/g, "").split("\n")
let chunck = Math.floor(input.length / 100), r = 0
for (; r < input.length; r += chunck){
    await VFuse.addJob(map, [], input.slice(r, r + chunck))
}

let diff = input.length - r
if( diff > 0){
    await VFuse.addJob(map, [], input.slice(r, r + diff))
}


let combine_job_id = await VFuse.addJob(reduce, ['map'])//wait for all reduce results and call combine
await VFuse.addJob(getMaxOccurenceWord, [combine_job_id])

let input = await VFuse.getDataFromUrl("https://raw.githubusercontent.com/bwhite/dv_hadoop_tests/master/python-streaming/word_count/input/4300.txt")

function map(data){
    let tokens = []
    data.map(d => d.split(/\W+/).map(word => tokens.push({ word : word , count : 1 })))
    return tokens
}

function reduce(data){
    let reduced = new Map()
    data.map( entry => reduced.set(entry.word, reduced.has(entry.word) ? reduced.get(entry.word) + 1 : 1))
    return reduced
}

function combine(data){
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

input = input.toString().split("\n")
let reduced_results = []
let chunck = Math.floor(input.length / 100)
let r = 0
for (; r < input.length; r += chunck){
    let mapped = await VFuse.addJob(map, [], input.slice(r, r + chunck))
    let reduced = await VFuse.addJob(reduce, [mapped])
    reduced_results.push(mapped)
}

let diff = input.length - r
if( diff > 0){
    let mapped = await VFuse.addJob(map, [], input.slice(r, r + diff))
    let reduced = await VFuse.addJob(reduce, [mapped])
}


let combine_job_id = await VFuse.addJob(combine, ['reduce'])//wait for all reduce results and call combine
await VFuse.addJob(getMaxOccurenceWord, [combine_job_id])

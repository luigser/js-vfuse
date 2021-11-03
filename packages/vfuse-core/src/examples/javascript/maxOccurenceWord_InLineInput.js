let input = "Contrary to popular belief, Lorem Ipsum is not simply random text.\n" +
    "It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old.\n" +
    "Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur,\n" +
    "from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source.\n" +
    " Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of \"de Finibus Bonorum et Malorum\" (The Extremes of Good and Evil) by Cicero,\n" +
    " written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum," +
    "\"Lorem ipsum dolor sit amet..\", comes from a line in section 1.10.32."
function map(data){
    let tokens = []
    data.split(/\W+/).map(word => tokens.push({ word : word , count : 1 }))
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

input = input.split("\n")
let reduced_results = []
for (let row in input){
    let mapped = await VFuse.addJob(map, [], input[row])
    let reduced = await VFuse.addJob(reduce, [mapped])
    reduced_results.push(mapped)
}

let combine_job_id = await VFuse.addJob(combine, ['reduce'])//wait for all reduce results and call combine
await VFuse.addJob(getMaxOccurenceWord, [combine_job_id])


async function map(data){
    let mapped = new Map()
    let input = await VFuse.getDataFromUrl("https://172.16.149.100/wordcount1-64.txt")
    input.split(/\W+/).map(word => {
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

for(let i = 0; i < 64; i++){
    VFuse.addJob(map, [], null)
}

await VFuse.addJob(reduce, ['^map'])//wait for all reduce results and call combine


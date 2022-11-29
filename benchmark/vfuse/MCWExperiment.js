async function map(index){
    let mapped = new Map()
    let input = await VFuse.getDataFromUrl(`https://raw.githubusercontent.com/giusdam/data/main/wordcount${index}-64.txt`)
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

    let max = result.entries().next().value
    for(let value of result.entries()) {
        if(value[1] > max[1])
            max = value
    }
    return max
}

for(let i = 0; i < 64; i++){
    await VFuse.addJob(map, [], i)
}

await VFuse.addJob(reduce, ['^map'])//wait for all reduce results and call combine

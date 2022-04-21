async def map(data):
    from pyodide.http import pyfetch
    url = data[0] + "wordcount" + str(data[1]) + ".txt"
    print(url)
    file = await pyfetch(url)
    string = await file.string()
    result = {}
    for w in string.split(' '):
        if not w:
            continue
        elif w in result:
            result[w] = result[w] + 1
        else:
            result[w] = 1
    print(result)
    return result

def reduce(data):
    result = {}
    for map in data:
        for key in map:
            if key in result:
                result[key] = result[key] + map[key]
            else:
                result[key] = map[key]
    return result

def getMaxWordOccurence(data):
    #get first element
    max = next(iter(data))
    for key in data:
        if data[key] > data[max]:
            max = key
    return {max : data[max]}

baseurl = "https://172.16.149.100/"

for i in range(1,3):
    data = list([baseurl, i])
    await VFuse.addJob(map, [], data, 'map')

reduce_job_id = await VFuse.addJob(reduce,['map'], [])
await VFuse.addJob(getMaxWordOccurence, [reduce_job_id])

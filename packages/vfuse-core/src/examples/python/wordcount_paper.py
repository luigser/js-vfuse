async def map(data):
    from pyodide.http import pyfetch
    url = data[0] + "wordcount" + str(data[1]) + ".txt"
    print(url)
    file = await pyfetch(url)
    content = await file.string()
    result = {}
    for w in content.split(' '):
        if not w:
            continue
        elif w in result:
            result[w] = result[w] + 1
        else:
            result[w] = 1
    return result

def reduce(data):
    result = {}
    for d in data:
        if d['key'] in result:
            result[d['key']] = result[d['key']] + d['value']
        else:
            result[d['key']] = d['value']
    return result

def getMaxWordOccurence(data):
   max = data[0]
   for d in data:
       if d['value'] > max['value']:
           max = d
   return max

baseurl = "https://172.16.149.100/"

for i in range(1,3):
    data = list([baseurl, i])
    await VFuse.addJob(map, [], data, 'map')

reduce_job_id = await VFuse.addJob(reduce,['map'], [])
await VFuse.addJob(getMaxWordOccurence, [reduce_job_id])

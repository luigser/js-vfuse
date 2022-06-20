async def map(data):
    from pyodide.http import pyfetch
    url = "https://raw.githubusercontent.com/giusdam/data/main/wordcount1-64.txt"
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

    max_key = next(iter(result))
    max = result[max_key]

    for key in result:
        if result[key] > max:
            max = result[key]
            max_key = key
    r2 = {}
    r2[max_key] = max
    return r2

baseurl = "https://172.16.149.100/"

for i in range(0,16):
    await VFuse.addJob(map, [])

#await VFuse.addJob(reduce,['map'], [])
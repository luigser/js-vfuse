import math

input = await VFuse.getDataFromUrl("https://raw.githubusercontent.com/bwhite/dv_hadoop_tests/master/python-streaming/word_count/input/4300.txt")

def map(data):
    result = {}
    for w in data.split(' '):
        if w in result:
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
            max = data
    return max

input = input.splitlines()
chunk = math.floor(len(input) / 100)
for i in range(len(input)):
    map_job_id = await VFuse.addJob(map, [], input[i:i + chunk])

diff = len(input) - input
if diff > 0:
    map_job_id = await VFuse.addJob(map, [], input[i:i + diff])

reduce_job_id = await VFuse.addJob(reduce,['map'])
await VFuse.addJob(getMaxWordOccurence, [reduce_job_id])

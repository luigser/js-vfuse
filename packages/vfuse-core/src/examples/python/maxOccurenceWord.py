import math
#scikit-learn
#tensorflow
input = await VFuse.getDataFromUrl("https://raw.githubusercontent.com/bwhite/dv_hadoop_tests/master/python-streaming/word_count/input/4300.txt")

def map(data):
    result = {}
    for row in data:
        for word in row.split(' '):
            if word in result:
                result[word] = result[word] + 1
            else:
                result[word] = 1
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

input = input.splitlines()
chunk = math.floor(len(input) / 10)
i = 0

while i < len(input):
    map_job_id = await VFuse.addJob(map, [], input[i:i + chunk])
    i = i + chunk

diff = len(input) - i
if diff > 0:
    map_job_id = await VFuse.addJob(map, [], input[i:i + diff])

reduce_job_id = await VFuse.addJob(reduce,['map'])
await VFuse.addJob(getMaxWordOccurence, [reduce_job_id])

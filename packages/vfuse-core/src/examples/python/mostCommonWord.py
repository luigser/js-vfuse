import math
import numpy

input = await VFuse.getDataFromUrl("https://raw.githubusercontent.com/bwhite/dv_hadoop_tests/master/python-streaming/word_count/input/4300.txt")

def map(data):
    result = {}
    for row in data:
        for word in row.split(' '):
            if word in result:
                if word != '':
                   result[word] = result[word] + 1
            else:
                result[word] = 1
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

input = input.splitlines()
input = numpy.array(input)
input = numpy.array_split(input, 10)
for chunk in input:
   await VFuse.addJob(map, [], list(chunk), 'map')



reduce_job_id = await VFuse.addJob(reduce,['map'], [])
await VFuse.addJob(getMaxWordOccurence, [reduce_job_id])

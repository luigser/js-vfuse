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
    for d in data:
        if d['key'] in result:
            result[d['key']] = result[d['key']] + d['key']
        else:
            result[d['key']] = d['key']
    return result

def getMaxWordOccurence(data):
   max = data[0]
   for d in data:
       if d['value'] > max['value']:
           max = d
   return d

input = input.splitlines()
input = numpy.array(input)
input = numpy.array_split(input, 1)
for chunk in input:
   await VFuse.addJob(map, [], list(chunk), 'map')


reduce_job_id = await VFuse.addJob(reduce,['map'], [])
await VFuse.addJob(getMaxWordOccurence, [reduce_job_id])

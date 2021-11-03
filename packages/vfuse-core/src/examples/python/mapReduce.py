input = """I'm learning Python.
I refer to TechBeamers.com tutorials.
It is the most popular site for Python programmers."""

def map(data):
    result = {}
    for w in data.split(' '):
        if w in result:
            d[w] = d[w] + 1
        else:
            d[w] = 1
    return result

def reduce(data):
    result = {}
    for k, v in data.items():
        if k in result:
            result[k] = result[k] + v
        else:
            result[k] = v
    return result

for x in input.splitlines():
   job_id = await VFuse.addJob(map, [], x)
   await VFuse.addJob(reduce, [job_id])

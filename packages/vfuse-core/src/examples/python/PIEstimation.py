def monteCarloPiPart(n):
    import random
    count = 0
    for i in range(n):
        x=random.random()
        y=random.random()
        # if it is within the unit circle
        if x*x + y*y <= 1:
            count=count+1
    return count

def estimatePi(data):
    n = len(data) * 10000
    return sum(data)/(n*1.0)*4

jid = await VFuse.addJob(monteCarloPiPart, [], 10000)
await VFuse.setRepeating(jid)
jid = await VFuse.addJob(estimatePi, [jid])
await VFuse.setRepeating(jid)

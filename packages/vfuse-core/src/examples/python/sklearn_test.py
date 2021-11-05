import numpy as np
import sklearn

X = np.arange(5).reshape(5, 1)

async def train(data):
    #await micropip.install('scikit-learn')
    from sklearn import datasets
    iris = datasets.load_iris()
    digits = datasets.load_digits()
    return digits.data

await VFuse.addJob(train, [], X)

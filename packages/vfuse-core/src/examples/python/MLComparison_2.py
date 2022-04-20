from sklearn import model_selection
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
from sklearn.naive_bayes import GaussianNB
from sklearn.svm import SVC
import sklearn
from io import StringIO
import numpy
string = await VFuse.getDataFromUrl (
"https://raw.githubusercontent.com/jbrownlee/Datasets/master/pima-indians-diabetes.data.csv")
data = numpy.loadtxt(StringIO(string), delimiter=",")

def eval(input):
    name = input[0]
    model = input[1]
    data = numpy.array(input[2])
    X = data[:,0:8]
    Y = data[:,8]
    kfold = model_selection.KFold(n_splits=10, random_state=7)
    res = sklearn.model_selection.cross_val_score(model, X, Y, cv=kfold, scoring='accuracy')
    mod_res = "%s %f %f" % (name, res.mean(), res.std())
    return model_res

def compare(data):
    max = data[0]
    for value in data:
        val = value.split()
        if val[1] > max: max = val[1]
    return max

models = dict()
models['LDA'] = LinearDiscriminantAnalysis()
models['KNN'] = KNeighborsClassifier()
models['CART'] = DecisionTreeClassifier()
models['SVM'] = SVC(max_iter=1000)
models['NB'] = GaussianNB()

for name, model in models.items():
    await VFuse.addJob(eval, [], [name, model, data])

await VFuse.addJob(compare, ['eval'])

from sklearn import model_selection
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
from sklearn.naive_bayes import GaussianNB
from sklearn.svm import SVC
from io import StringIO
import numpy

string = await VFuse.getDataFromUrl("https://raw.githubusercontent.com/jbrownlee/Datasets/master/pima-indians-diabetes.data.csv")
f = StringIO(string)
datanp = numpy.loadtxt(f, delimiter=",")
models = ['LDA', 'KNN', 'CART', 'NB', 'SVC']

def eval(input):
    model = input[0]
    data = numpy.array(input[1])
    X = data[:,0:8]
    Y = data[:,8]
    kfold = model_selection.KFold(n_splits=10, random_state=7, shuffle=True)
    if model == 'LR':
            cv_results = model_selection.cross_val_score(LogisticRegression(max_iter=1000), X, Y, cv=kfold, scoring='accuracy')
    elif model == 'LDA':
            cv_results = model_selection.cross_val_score(LinearDiscriminantAnalysis(), X, Y, cv=kfold, scoring='accuracy')
    elif model == 'KNN':
            cv_results = model_selection.cross_val_score(KNeighborsClassifier(), X, Y, cv=kfold, scoring='accuracy')
    elif model == 'CART':
            cv_results = model_selection.cross_val_score(DecisionTreeClassifier(), X, Y, cv=kfold, scoring='accuracy')
    elif model == 'NB':
            cv_results = model_selection.cross_val_score(GaussianNB(), X, Y, cv=kfold, scoring='accuracy')
    elif model == 'SVC':
            cv_results = model_selection.cross_val_score(SVC(max_iter=1000), X, Y, cv=kfold, scoring='accuracy')

    model_results = [model, cv_results.mean(), cv_results.std()]
    print(model_results)
    return model_results

def compare(data):
    # await VFuse.saveOnNetwork(data)
    print(data)
    i = 1
    max = data[i]
    while i < len(data):
        if data[i] > max:
            data[i]
        i += 3
    return max

result = []
for model in models:
    input = [model, datanp]
    model_res = await VFuse.addJob(eval, [], input)
    result.append(model_res)

await VFuse.addJob(compare, ['eval'], [])

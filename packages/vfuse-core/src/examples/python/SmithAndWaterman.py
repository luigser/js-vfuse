import numpy

def similarity_func(char):
    a = char[0]
    b = char[1]
    return match if a == b else mismatch

def fill_matrix(string):
    first_chain = string[0]
    second_chain = string[1]
    matrix = numpy.zeros((len(first_chain)+1, len(second_chain)+1))
    max_val = 0
    max_val_i = len(first_chain)
    max_val_j = len(second_chain)

    for i in range(0, len(first_chain)):
        for j in range(0, len(second_chain)):
            match = matrix[i][j] + similarity_func([first_chain[i], second_chain[j]])
            delete = matrix[i+1][j] + gap
            insert = matrix[i][j+1] + gap
            matrix[i+1][j+1] = max(match, delete, insert, 0)
            if matrix[i+1][j+1] >= max_val:
                max_val = matrix[i+1][j+1]
                max_val_i = i+1
                max_val_j = j+1

    return [max_val, max_val_i, max_val_j, matrix]

def trace_back(data):
    chain = data[0]
    values = data[1]

    first_chain = chain[0]
    second_chain = chain[1]

    max_val = values[0]
    max_val_i = values[1]
    max_val_j = values[2]
    matrix = values[3]

    alignment_a = ''
    alignment_b = ''
    i = max_val_i
    j = max_val_j
    value = max_val

    while (i >= 0 or j >= 0) and value != 0:
        if i >= 0 and j >= 0 and matrix[i][j] == matrix[i-1][j-1] + similarity_func((first_chain[i-1], second_chain[j-1])):
            alignment_a = first_chain[i-1] + alignment_a
            alignment_b = second_chain[j-1] + alignment_b
            i -= 1
            j -= 1
        elif i >= 0 and matrix[i][j] == matrix[i-1][j] + gap:
            alignment_a = first_chain[i-1] + alignment_a
            alignment_b = '_' + alignment_b
            i -= 1
        else:
            alignment_a = '_' + alignment_a
            alignment_b = second_chain[j-1] + alignment_b
            j -= 1

        value = matrix[i][j]

    return [alignment_a, alignment_b]

def smith_waterman(pair):
    string_to_compare = pair[0]
    data_to_compare = numpy.array(pair[1])
    max_score = 0
    max_string = ''
    max_alignments = ''
    for string in data_to_compare:
        values = fill_matrix([string_to_compare, string])
        alignments = trace_back([[string_to_compare, string], values])
        matrix = values[3]
        score = values[0]
        if score > max_score:
            max_score = score
            max_string = string
            max_alignments = alignments

    return [max_score, max_string, max_alignments]

def compare(data):
    i = 0
    max = 0
    while i < len(data):
        if data[i] > max:
            max = data[i]
        i += 3
    return max

data = await VFuse.getDataFromUrl("https://raw.githubusercontent.com/giusdam/data/main/dna.txt")

string_to_compare = 'AGTACTACAAGGGTCAACCATAACCACAGCACTAGTTATCTCTACTTGACAAAAACTGGCCCCAATAGCC'

match = 1
gap = -1
mismatch = -1

jobs_n = 10

max_ = []
data = data.split()
data = numpy.array(data)
splitted = numpy.array_split(data, jobs_n)
splitted = numpy.array(splitted)
for job in splitted:
    val = await VFuse.addJob(smith_waterman, [], [string_to_compare, list(job)])
    max_.append(val)


await VFuse.addJob(compare, ['smith_waterman'])

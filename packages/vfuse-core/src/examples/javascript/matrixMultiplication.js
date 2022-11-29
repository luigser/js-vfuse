const matrix1 = [ [1,2],[3,4],[5,6] ]
const matrix2 = [ [1,2,3],[4,5,6] ]

function calculateElement(input){
    let row = input[0]
    let col = input[1]
    let indexes = input[2]
    let result = 0
    for(let i=0; i < row.length; i++)
        result += (row[i] * col[i])
    return {result : result, indexes : indexes}
}

function assembleFinalMatrix(input){
    let matrix = Array(input.length)
    for(let ele of input)
        matrix[ele.row] = ele.result
    return matrix
}

function assembleRow(input){
    let row = []
    for(let ele of input)
        row.push(ele.result)
    console.log({ row : input[0].indexes.row, result: row } )
    return { row : input[0].indexes.row, result: row }
}

for(let i=0; i < matrix1.length;i++){
    let row_multiply_jobs = []
    for(let k=0; k < matrix2[0].length; k++)
    {
        let col = []
        for(let j=0; j < matrix2.length; j++){
            col.push(matrix2[j][k])
        }
        let job_id = await VFuse.addJob(calculateElement, [], [matrix1[i], col, { row: i, col: k}], 'matrix_element')
        row_multiply_jobs.push(job_id)
    }
    await VFuse.addJob(assembleRow, row_multiply_jobs, [], 'matrix_row')
}

await VFuse.addJob(assembleFinalMatrix, ['assembleRow'], [])
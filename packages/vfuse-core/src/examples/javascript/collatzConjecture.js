function collatzSequence(input){
    if(!input) return 0
    let {number, sequence} = input
    console.log(number)
    if(number === 1) {
        sequence.push(1);
        return {sequence : sequence};
    } else if(number % 2 === 0) {
        sequence.push(number);
        return collatzSequence({number : parseInt(number / 2), sequence : sequence});
    } else {
        sequence.push(number);
        return collatzSequence({number : 3 * number + 1, sequence : sequence});
    }
}

function tryNumber(){
    let desiredMaxLength = 19
    let randomNumber = '';
    for (var i = 0; i < desiredMaxLength; i++) {
        randomNumber += Math.floor(Math.random() * 10);
    }
    return {number : parseInt(randomNumber), sequence : []}
}

let try_job_id = await VFuse.addJob(tryNumber, [])
await VFuse.setEndlessJob(try_job_id)
let sequence_job_id = await VFuse.addJob(collatzSequence, [try_job_id])
await VFuse.setEndlessJob(sequence_job_id)
function getPoints(interval){
    let rand_x, rand_y, origin_dist, pi
    let circle_points = 0, square_points = 0

    for(let i =0; i < (interval * interval); i++){
        rand_x = (Math.random()* interval) / interval
        rand_y = (Math.random()* interval) / interval
        origin_dist = rand_x * rand_x + rand_y * rand_y
        square_points++
        if(origin_dist < 1)
            circle_points++
    }

    return {square_points : square_points, circle_points : circle_points}
}

function estimatePi(data){
    if(!data) return 0
    let circle_points = 0, square_points = 0
    for(let d of data){
        for(let points of d){
            if(point.square_points && point.circle_points){
                square_points += points.square_points
                circle_points += points.circle_points
            }
        }
    }

    pi = parseFloat((4 * circle_points) / square_points).toFixed(100)

    return pi
}

let job_id = await VFuse.addJob(getPoints, [], 1000)
await VFuse.setRepeating(job_id)

job_id = await VFuse.addJob(estimatePi, ['getPoints'])
await VFuse.setRepeating(job_id)


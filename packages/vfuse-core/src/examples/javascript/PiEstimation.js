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
    let circle_points = 0, square_points = 0
    for(let points of data){
        square_points += points.square_points
        circle_points += points.circle_points
    }

    pi = parseFloat((4 * circle_points) / square_points).toFixed(100)

    return pi
}

let interval = 10000
let step = 1000
for(let i = step; i <= interval; i+=step)
    await VFuse.addJob(getPoints, [], step)


await VFuse.addJob(estimatePi, ['getPoints'])

function GA(input){
    console.log({input})
    let {island, target, mutationRate, generations} = input
    function random(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);

        // The maximum is exclusive and the minimum is inclusive
        return Math.floor(Math.random() * (max - min)) + min;
    }

    function generateLetter() {
        const ele_list="AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz  "
        const code = random(0, 54);
        return ele_list[code];
    }

    function generateMember(){
        let member = '';

        for (let i = 0; i < target.length; i++) {
            member +=  generateLetter();
        }
        return member
    }

    function fitness(member) {
        let matches = 0;
        for (let i = 0; i < member.length; i += 1) {
            if (member[i] === target[i]) {
                matches += 1;
            }
        }
        return matches / target.length;
    }

    function crossover(partner1, partner2) {
        let child = generateMember()
        const midpoint = random(0, target.length);
        child = child.split('');

        for (let i = 0; i < target.length; i += 1) {
            if (i > midpoint) {
                child[i] = partner2[i];
            } else {
                child[i] = partner1[i];
            }
        }

        return child.join('');;
    }

    function mutate(member, mutationRate) {
        for (let i = 0; i < member.length; i += 1) {
            // If below predefined mutation rate,
            // generate a new random letter on this position.
            if (Math.random() < mutationRate) {
                member = member.split('');
                member[i] = generateLetter();
                member = member.join('')
            }
        }
    }


    function selectMembersForMating() {
        const matingPool = [];

        island.forEach((m) => {
            // The fitter he/she is, the more often will be present in the mating pool
            // i.e. increasing the chances of selection
            // If fitness == 0, add just one member
            const f = Math.floor(fitness(m) * 100) || 1;

            for (let i = 0; i < f; i += 1) {
                matingPool.push(m);
            }
        });

        return matingPool;
    }

    function reproduce(matingPool) {
        for (let i = 0; i <  island.length; i += 1) {
            // Pick 2 random members/parent from the mating pool
            const parentA = matingPool[random(0, matingPool.length)];
            const parentB = matingPool[random(0, matingPool.length)];

            // Perform crossover
            const child = crossover(parentA, parentB);

            // Perform mutation
            mutate(child, mutationRate);

            island[i] = child;
        }
    }

    function evolve(generations) {
        for (let i = 0; i < generations; i += 1) {
            const pool = selectMembersForMating();
            reproduce(pool);
        }
    }

    evolve(generations)

    return {
        island : island,
        target : target,
        mutationRate : mutationRate,
        generations : generations
    }
}

function mergePopulations(inputs){
    let island = []
    inputs.map(input => [...island, ...input.island])
    return {
        island : island,
        target : inputs[0].target,
        mutationRate : inputs[0].mutationRate,
        generations : inputs[0].generations
    }
}

function evaluate(island){
    //const membersKeys = island//island.map((m) => m.join(''));
    const perfectCandidatesNum = island.filter((w) => w === target);
    console.log(`${perfectCandidatesNum ? perfectCandidatesNum.length : 0} member(s) typed "${target}"`);
    return `${perfectCandidatesNum ? perfectCandidatesNum.length : 0} member(s) typed "${target}"`
}


function random(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);

    // The maximum is exclusive and the minimum is inclusive
    return Math.floor(Math.random() * (max - min)) + min;
}

function generateLetter() {
    const ele_list="AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz  "
    const code = random(0, 54);
    return ele_list[code];
}

function generateMember(target){
    let member = '';

    for (let i = 0; i < target.length; i++) {
        member += generateLetter();
    }
    return member
}

// Init function
async function generate(populationSize, target, mutationRate, generations) {
    // Create a population and evolve for N generations
    let population = [];
    for (let i = 0; i < populationSize; i += 1) {
        population.push(generateMember(target));
    }
    //console.log(population)
    let ga_job_ids = []
    let chunk = populationSize / 10
    for(let islands = 0; islands < 10; islands++){
        //GA(population.slice((islands * chunk, (islands + 1) * chunk)), target, mutationRate, generations)
        let job_id = await VFuse.addJob(GA, [], {
            island : population.slice((islands * chunk, (islands + 1) * chunk)),
            target : target,
            mutationRate : mutationRate,
            generations : generations
        })
        ga_job_ids.push(job_id)
    }

    let merge_job_ids = []
    for(let i = 0; i < ga_job_ids.length; i += 2 ){
        let job_id = await VFuse.addJob(mergePopulations, [ga_job_ids[i], ga_job_ids[i+1]])
        merge_job_ids.push(job_id)
    }

    for(let i = 0; i < merge_job_ids.length; i++){
        let job_id = await VFuse.addJob(GA, [merge_job_ids[i]], null, 'last')
    }
    let job_id = await VFuse.addJob(mergePopulations, ['last'])
    job_id = await VFuse.addJob(GA, [job_id])
    await VFuse.addJob(evaluate, [job_id])
}

await generate(10000, 'VFuse Parallel Genetic Algorithm', 0.05, 10);


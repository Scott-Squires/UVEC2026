from job import job
from dataclasses import dataclass

@dataclass
class day_params:
    jobs: list[job]
    numVehicles: int

#Returns the dataclass day_params (defined above) for all jobs specified in the input
def parse_test(testFilename: str) -> day_params:
    params = day_params(jobs=[], numVehicles=0)

    with open(testFilename, "r") as file:
        #read first line as the number of vehicles and remove it
        params.numVehicles = int(next(file).strip())

        #make and add a job for each line listed in the test input
        for line in file:
            currJob = job(arrivalTime=0, xCoord=0, yCoord=0, completionTime=0)

            lineSegments = line.strip().split(' ')

            arrivalTimeStamp = lineSegments[0]
            arrivalTimeStampSplit = arrivalTimeStamp.split(':')
            currJob.arrivalTime = int(arrivalTimeStampSplit[0])*60 + int(arrivalTimeStampSplit[1])

            i = 1
            while (i + 2 < len(lineSegments)):
                print(f'working on {lineSegments[i]} and {lineSegments[i+1]}')
                dist = lineSegments[i]
                dir = lineSegments[i+1]

                match dir:
                    case "W":
                        currJob.xCoord -= int(dist)
                    case "E":
                        currJob.xCoord += int(dist)
                    case "S":
                        currJob.yCoord -= int(dist)
                    case "N":
                        currJob.yCoord += int(dist)

                i += 2;

            currJob.completionTime = lineSegments[i]
            params.jobs.append(currJob)
                
    return params
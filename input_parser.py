from job import Job
from dataclasses import dataclass

@dataclass
class day_params:
    jobs: list[Job]
    numVehicles: int

#Returns the dataclass day_params (defined above) for all jobs in the input.
#file is anything you can loop over line by line, e.g. sys.stdin or an open file.
#currently returns without error checking / tolerance for bad input
def parse_input(file) -> day_params:
    params = day_params(jobs=[], numVehicles=0)

    #read first line as the number of vehicles and remove it
    params.numVehicles = int(next(file).strip())

    #make and add a job for each line listed in the test input
    for line in file:
        lineSegments = line.strip().split(' ')

        arrivalTimeStamp = lineSegments[0]
        arrivalTimeStampSplit = arrivalTimeStamp.split(':')
        arrivalTime = int(arrivalTimeStampSplit[0])*60 + int(arrivalTimeStampSplit[1])

        xCoord = 0
        yCoord = 0
        i = 1
        while (i + 2 < len(lineSegments)):
            dist = lineSegments[i]
            dir = lineSegments[i+1]

            match dir:
                case "W":
                    xCoord -= int(dist)
                case "E":
                    xCoord += int(dist)
                case "S":
                    yCoord -= int(dist)
                case "N":
                    yCoord += int(dist)

            i += 2;

        completionTime = int(lineSegments[i])
        params.jobs.append(Job(arrivalTime, xCoord, yCoord, completionTime))
        params.jobs.sort()

    return params
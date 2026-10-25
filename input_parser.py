import sys
from job import Job
from dataclasses import dataclass

@dataclass
class day_params:
    jobs: list[Job]
    numVehicles: int

#Returns the dataclass day_params (defined above) for all jobs in the input.
#file is anything you can loop over line by line, e.g. sys.stdin or an open file.
#Bad lines are skipped with a warning on stderr instead of crashing.
def parse_input(file) -> day_params:
    params = day_params(jobs=[], numVehicles=0)

    #read first line as the number of vehicles and remove it
    firstLine = next(file, "").strip()
    if not firstLine.isdigit():
        raise ValueError("the first line must be the number of vehicles")
    params.numVehicles = int(firstLine)

    #make and add a job for each line listed in the test input
    for line in file:
        if line.strip() == "":
            continue # blank line
        try:
            params.jobs.append(parse_job(line))
        except ValueError as e:
            print(f"Skipping line '{line.strip()}': {e}", file=sys.stderr)

    params.jobs.sort() # by call time; calls at the same time keep their input order
    return params

#One call, e.g. "10:45 15 N 20 W 45" or "16:02 4 E 15". Raises ValueError if anything is wrong.
def parse_job(line) -> Job:
    lineSegments = line.split() # split() also handles double spaces and tabs
    if len(lineSegments) not in (4, 6):
        raise ValueError("expected a time, one or two distances with directions, and a duration")

    arrivalTimeStamp = lineSegments[0]
    arrivalTimeStampSplit = arrivalTimeStamp.split(':')
    hours, minutes = int(arrivalTimeStampSplit[0]), int(arrivalTimeStampSplit[1])
    if not (0 <= hours <= 23 and 0 <= minutes <= 59):
        raise ValueError(f"'{arrivalTimeStamp}' isn't a time of day")
    arrivalTime = hours*60 + minutes

    xCoord = 0
    yCoord = 0
    axesSeen = []
    i = 1
    while (i + 2 < len(lineSegments)):
        dist = int(lineSegments[i])
        dir = lineSegments[i+1].upper() # accept n, e, s, w too
        if dist < 0:
            raise ValueError("distances can't be negative")

        match dir:
            case "W":
                xCoord -= dist
            case "E":
                xCoord += dist
            case "S":
                yCoord -= dist
            case "N":
                yCoord += dist
            case _:
                raise ValueError(f"'{lineSegments[i+1]}' isn't N, S, E or W")

        axis = "east/west" if dir in ("E", "W") else "north/south"
        if axis in axesSeen:
            raise ValueError(f"{axis} given twice")
        axesSeen.append(axis)

        i += 2

    completionTime = int(lineSegments[i])
    if completionTime < 0:
        raise ValueError("duration can't be negative")

    return Job(arrivalTime, xCoord, yCoord, completionTime)

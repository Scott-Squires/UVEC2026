import heapq # only for single threaded
import itertools
import sys
from enum import IntEnum

from input_parser import parse_input
from job import format_time, format_driving_instruction
from vehicle import Vehicle


class EVENT_PRIORITY(IntEnum):
    ARRIVE_AT_BASE = 0
    FINISH_JOB = 1
    ARRIVE_JOB = 2 # leaving to another job
    START_DRIVING = 3
    CALL = 4


def Distance(pos1, pos2):
    # Manhattan distance between two points
    return abs(pos1[0] - pos2[0]) + abs(pos1[1] - pos2[1])

def PickBestCar (job, vehicles):
    # Takes a job and a list of vehicles.
    # Returns the vehicle that can reach the job soonest, and the time it can start moving towards the job.
    bestCar = None
    bestStart = None
    bestArrival = None
    for car in vehicles:
        start = max(job.arrivalTime, car.busy_until) # can't leave before the call, or before its current job is done
        arrival = start + Distance(car.get_position(job.arrivalTime), job.position)
        if bestCar == None or arrival < bestArrival: # strict <, so ties go to the lowest id
            bestCar = car
            bestStart = start
            bestArrival = arrival
    return bestCar, bestStart


counter = itertools.count() # next(counter) gives 0, 1, 2 ... so no two events tie in the queue

def ProcessJobForCar (job, car : Vehicle, time_car_can_start_job, timeline):
    # Check car queue size
    # if 0, add events to timeline
    # if not 0, add event and info to car queue
    if car.get_queued_jobs_length() == 0:
        heapq.heappush(timeline, (time_car_can_start_job, EVENT_PRIORITY.START_DRIVING, next(counter), car, job))
        arrivalTime = time_car_can_start_job + Distance(car.get_position(time_car_can_start_job), job.position)
        heapq.heappush(timeline, (arrivalTime, EVENT_PRIORITY.ARRIVE_JOB, next(counter), car, job))
        car.busy_until = arrivalTime + job.completionTime
    else:
        pass #TODO:

def main():
    #Parse input from stdin, e.g. python3 main.py < tests/01_brief_sample.txt
    dayParams = parse_input(sys.stdin)

    #list of cars
    cars = [Vehicle(i) for i in range(dayParams.numVehicles)]

    # timeline touple format
    # (time, priority, seq, car_id|(none for call), job_id)
    timeline = []

    #queue jobs
    for job in dayParams.jobs:
        heapq.heappush(timeline, (job.arrivalTime, EVENT_PRIORITY.CALL, next(counter), None, job))

    while timeline:
        time, event_priority, _, car, job = heapq.heappop(timeline)
        time_24h = format_time(time)
        car_id = car.vehicle_id if car else None # calls have no car yet
        match event_priority:
            case EVENT_PRIORITY.CALL:
                car_for_job, time_car_can_start_job = PickBestCar(job, cars)
                ProcessJobForCar(job, car_for_job, time_car_can_start_job, timeline)


            case EVENT_PRIORITY.START_DRIVING:
                print(f"Vehicle {car_id}: {time_24h} Start route to job")
                car_pos = car.get_position(time)
                driving_instructions = format_driving_instruction(car_pos[0], car_pos[1], job.position[0], job.position[1])
                print(f"Vehicle {car_id}: {time_24h} {driving_instructions}")


            case EVENT_PRIORITY.ARRIVE_JOB:
                print(f"Vehicle {car_id}: {time_24h} Start job")

            case EVENT_PRIORITY.FINISH_JOB:
                print(f"Vehicle {car_id}: {time_24h} Finish job")
                # Call function that checks car queue,
                # if nothing
                if car.get_queued_jobs_length() == 0:
                    print(f"Vehicle {car_id}: {time_24h} Start route to base")
                    # TODO: enqueue in timeline the arrive at base event
                else:
                    pass
                    # dequeue




            case EVENT_PRIORITY.ARRIVE_AT_BASE:
                print(f"Vehicle {car_id}: {time_24h} Arrive at base")




if __name__ == "__main__":
    main()

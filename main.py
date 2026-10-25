import vehicle
import job
import heapq # only for single threaded
from enum import Enum
from parsetests import parse_test

class CAR_STATE(Enum):
    AT_BASE = 1
    START_JOB = 2
    TO_JOB = 3 # leaving to another job
    TO_BASE = 4

class EVENT_PRIORITY(Enum):
    ARRIVE_AT_BASE = 0
    FINISH_JOB = 1
    ARRIVE_JOB = 2 # leaving to another job
    CALL = 3


def Distance(pos1, pos2):
    # Manhatten distance between two points
    abs(pos1[0] - pos2[0] + pos1[1] - pos2[1])

def PickBestCar (job, vehicles):
    # Takes a job and a list of vehicles. 
    # Returns the best vehicle for the job and the time it can start moving towards the job.
    bestCar = None
    bestTime = None
    for car in vehicles:
        carTime = (0 if job.arrivalTime > car.nextAvailableTime else car.nextAvailableTime - job.arrivalTime) + Distance(car.get_position(job.arrivalTime), job.position)
        if bestCar == None or carTime < bestTime:
            bestCar = car
            bestTime = carTime
    return bestCar, bestTime


def initializeCars (num):
    return 


def ProcessJobForCar (job, car_for_job, time_car_can_start_job, timeline):
    None

global_counter: int = 0 # Ensures no ties when removing from the queue.

def main():
    #Parse input
    dayParams = parse_test("tests/test1.txt")

    #list of cars
    cars = [vehicle() for _ in range(dayParams.numVehicles)]

    # timeline touple format
    # (time, priority, seq, car_state|none, car_id|(none for call), job_id)
    timeline = []

    #queue jobs
    for job in dayParams.jobs:
        heapq.heappush(timeline, (job.arrivalTime, EVENT_PRIORITY.CALL, global_counter, None, None, job))
        global_counter += 1

    while timeline.size() != 0:
        time, event_priority, _, car_state, car, job = heapq.heappop(timeline)
        match event_priority:
            case EVENT_PRIORITY.CALL:
                car_for_job, time_car_can_start_job = PickBestCar(job, cars)
                ProcessJobForCar(job, car_for_job, time_car_can_start_job, timeline)
            case _:
                # CAR event, Print out the correct text string
                pass


def process_next_job():
    # takes a queue of jobs
    # list of vehicles
    # outputs: which vehicle # should go to the



# if __main__:
#     main()

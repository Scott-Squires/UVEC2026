import heapq # only for single threaded
import itertools
import sys
from enum import IntEnum

from input_parser import parse_input
from job import BASE_X, BASE_Y, format_time, format_driving_instruction
from vehicle import CAR_STATE, Vehicle


class EVENT_PRIORITY(IntEnum):
    ARRIVE_AT_BASE = 0
    FINISH_JOB = 1
    ARRIVE_JOB = 2
    CALL = 3


def Distance(pos1, pos2):
    # Manhattan distance between two points
    return abs(pos1[0] - pos2[0]) + abs(pos1[1] - pos2[1])

def PickBestCar (job, vehicles):
    # Takes a job and a list of vehicles.
    # Returns the vehicle that can reach the job soonest, and when it would arrive.
    bestCar = None
    bestArrival = None
    for car in vehicles:
        if car.is_busy():
            # sets off once its last lined-up job is done, from where that job is
            start = car.busy_until
            startPos = (car.last_x, car.last_y)
        else:
            # free (at base or driving home): sets off now, from where it is now
            start = job.arrivalTime
            startPos = car.get_position(job.arrivalTime)
        arrival = start + Distance(startPos, job.position)
        if bestCar == None or arrival < bestArrival: # strict <, so ties go to the lowest id
            bestCar = car
            bestArrival = arrival
    return bestCar, bestArrival


counter = itertools.count() # next(counter) gives 0, 1, 2 ... so no two events tie in the queue

def ProcessJobForCar (job, car : Vehicle, arrivalTime, timeline):
    # Busy car: line the job up, it drives there straight after its current job
    # Free car: it sets off now
    if car.is_busy():
        car.queued_jobs.append(job)
    else:
        StartDriving(car, job, job.arrivalTime, timeline)
    # When and where this car will be free next
    car.busy_until = arrivalTime + job.completionTime
    car.last_x, car.last_y = job.position

def StartDriving (car : Vehicle, job, time, timeline):
    # Car sets off for the job now: print its route and schedule its arrival
    startPos = car.get_position(time)
    car.state = CAR_STATE.TO_JOB
    print(f"Vehicle {car.vehicle_id}: {format_time(time)} Start route to job")
    driving_instructions = format_driving_instruction(startPos[0], startPos[1], job.position[0], job.position[1])
    print(f"Vehicle {car.vehicle_id}: {format_time(time)} {driving_instructions}")
    arrivalTime = time + Distance(startPos, job.position)
    heapq.heappush(timeline, (arrivalTime, EVENT_PRIORITY.ARRIVE_JOB, next(counter), car, job))

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
                car_for_job, arrivalTime = PickBestCar(job, cars)
                ProcessJobForCar(job, car_for_job, arrivalTime, timeline)

            case EVENT_PRIORITY.ARRIVE_JOB:
                print(f"Vehicle {car_id}: {time_24h} Start job")
                car.state = CAR_STATE.ON_JOB
                car.x_coord, car.y_coord = job.position
                heapq.heappush(timeline, (time + job.completionTime, EVENT_PRIORITY.FINISH_JOB, next(counter), car, job))

            case EVENT_PRIORITY.FINISH_JOB:
                print(f"Vehicle {car_id}: {time_24h} Finish job")
                # Call function that checks car queue,
                # if nothing
                if car.get_queued_jobs_length() == 0:
                    if job.position == (BASE_X, BASE_Y):
                        car.state = CAR_STATE.AT_BASE # job was at base, so it's already home
                    else:
                        print(f"Vehicle {car_id}: {time_24h} Start route to base")
                        driving_instructions = format_driving_instruction(car.x_coord, car.y_coord, BASE_X, BASE_Y)
                        print(f"Vehicle {car_id}: {time_24h} {driving_instructions}")
                        car.state = CAR_STATE.TO_BASE
                        car.left_at = time
                        homeTime = time + Distance(job.position, (BASE_X, BASE_Y))
                        heapq.heappush(timeline, (homeTime, EVENT_PRIORITY.ARRIVE_AT_BASE, next(counter), car, job))
                else:
                    # chaining: drive straight to the next lined-up job, no trip home
                    StartDriving(car, car.dequeue_job(), time, timeline)

            case EVENT_PRIORITY.ARRIVE_AT_BASE:
                print(f"Vehicle {car_id}: {time_24h} Arrive at base")
                car.state = CAR_STATE.AT_BASE
                car.x_coord, car.y_coord = BASE_X, BASE_Y




if __name__ == "__main__":
    main()

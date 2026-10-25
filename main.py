import vehicle
import job
import heapq # only for single threaded
from enum import IntEnum
from parsetests import parse_test


class EVENT_PRIORITY(IntEnum):
    ARRIVE_AT_BASE = 0
    FINISH_JOB = 1
    ARRIVE_JOB = 2 # leaving to another job
    START_DRIVING = 3
    CALL = 4

def format_driving_instruction(
    from_x: int, from_y: int, to_x: int, to_y: int
) -> str:
    """Generate a driving instruction between two coordinates."""
    dx = to_x - from_x
    dy = to_y - from_y
    parts = []

    if dy > 0:
        parts.append(f"{dy} minutes north")
    elif dy < 0:
        parts.append(f"{-dy} minutes south")

    if dx > 0:
        parts.append(f"{dx} minutes east")
    elif dx < 0:
        parts.append(f"{-dx} minutes west")

    if not parts:
        return "Already at destination"

    return "Drive " + " and ".join(parts)

def Distance(pos1, pos2):
    # Manhatten distance between two points
    return abs(pos1[0] - pos2[0] + pos1[1] - pos2[1])

def PickBestCar (job, vehicles):
    # Takes a job and a list of vehicles. 
    # Returns the best vehicle for the job and the time it can start moving towards the job in minutes from now.
    bestCar = None
    bestTime = None
    for car in vehicles:
        carTime = (0 if job.arrivalTime > car.nextAvailableTime else car.nextAvailableTime - job.arrivalTime) + Distance(car.get_position(job.arrivalTime), job.position)
        if bestCar == None or carTime < bestTime:
            bestCar = car
            bestTime = carTime
    return bestCar, bestTime


global_counter: int = 0 # Ensures no ties when removing from the queue.

def ProcessJobForCar (job, car : vehicle, time_car_can_start_job, timeline):
    # Check car queue size
    # if 0, add events to timeline
    # if not 0, add event and info to car queue
    car.lastAvailablePosition = job.position
    car.nextAvailableTime = time_car_can_start_job + Distance(car.lastAvailablePosition, job.position) + job.completionTime
    if car.get_queued_jobs_length() == 0:
        car.enqueue_job(job)
        add_car_event_to_timeline(car, timeline, time_car_can_start_job)
    else:
        car.enqueue_job(job)

def main():
    global global_counter
    #Parse input
    dayParams = parse_test("./tests/01_brief_sample.txt")

    #list of cars
    cars = [vehicle.Vehicle(i) for i in range(dayParams.numVehicles)]

    # timeline touple format
    # (time, priority, seq, car_id|(none for call), job_id)
    timeline = []

    #queue jobs
    for job in dayParams.jobs:
        heapq.heappush(timeline, (job.arrivalTime, EVENT_PRIORITY.CALL, global_counter, None, job))
        global_counter += 1

    while len(timeline) != 0:
        time, event_priority, _, car, job = heapq.heappop(timeline)
        time_24h = minutes_to_24h_string(time)
        match event_priority:
            case EVENT_PRIORITY.CALL:
                car_for_job, time_car_can_start_job = PickBestCar(job, cars)
                ProcessJobForCar(job, car_for_job, time_car_can_start_job + time, timeline)

            case EVENT_PRIORITY.START_DRIVING:
                print(f"Vehicle {car.vehicle_id}: {time_24h} Start route to job")
                car_pos = car.get_position(time)
                driving_instructions = format_driving_instruction(car_pos[0], car_pos[1], job.position[0], job.position[1])
                print(f"Vehicle {car.vehicle_id}: {time_24h} {driving_instructions}")


            case EVENT_PRIORITY.ARRIVE_JOB:
                print(f"Vehicle {car.vehicle_id}: {time_24h} Start job")
                car.state = vehicle.CAR_STATE.START_JOB

            case EVENT_PRIORITY.FINISH_JOB:
                print(f"Vehicle {car.vehicle_id}: {time_24h} Finish job")
                # Call function that checks car queue,
                # if nothing
                if car.get_queued_jobs_length() == 0:
                    print(f"Vehicle {car.vehicle_id}: {time_24h} Start route to base")
                    car.state = vehicle.CAR_STATE.TO_BASE
                    baseArrivalTime = time + Distance(car.get_position(time), (0,0))
                    heapq.heappush(timeline, (baseArrivalTime, EVENT_PRIORITY.ARRIVE_AT_BASE, global_counter, car, job))
                    global_counter += 1
                else:
                    add_car_event_to_timeline(car, timeline, time)

            case EVENT_PRIORITY.ARRIVE_AT_BASE:
                print(f"Vehicle {car.vehicle_id}: {time_24h} Arrive at base")
                car.state = vehicle.CAR_STATE.AT_BASE




def add_car_event_to_timeline(car, timeline, time):
    global global_counter
    job = car.dequeue_job()
    car.state = vehicle.CAR_STATE.TO_JOB

    heapq.heappush(timeline, (time, EVENT_PRIORITY.START_DRIVING, global_counter, car, job))
    global_counter += 1

    time_arrive_at_job_site = time + Distance(car.get_position(time), job.position) #is car position good here?
    heapq.heappush(timeline, (time_arrive_at_job_site, EVENT_PRIORITY.ARRIVE_JOB, global_counter, car, job))
    global_counter += 1

    time_finish_job = time_arrive_at_job_site + job.completionTime
    heapq.heappush(timeline, (time_finish_job, EVENT_PRIORITY.FINISH_JOB, global_counter, car, job))
    global_counter += 1

    car.lastJobPosition = job.position
    # takes a queue of jobs
    # list of vehicles
    # outputs: which vehicle # should go to the
    #
    # ARRIVE_AT_BASE = 0
    # FINISH_JOB = 1
    # ARRIVE_JOB = 2 # leaving to another job
    # START_DRIVING = 3
    # CALL = 4

def minutes_to_24h_string(minutes: int) -> str:
    """Converts minutes elapsed since midnight into a 24-hour formatted string (HH:MM)."""
    hours = (minutes // 60) % 24
    mins = minutes % 60
    return f"{hours:02d}:{mins:02d}"


if __name__ == "__main__":
    main()
import vehicle
import job

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
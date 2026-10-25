from job import job
import heapq

class Vehicle: 
    queuedJobs: list[job]
    lastJobPosition: tuple[int, int] #west is negative, east is positive #south is negative, north is positive
    nextAvailableTime: int
    state: Status
    timeLeavingToBase: int

    def __init__(self):
        self.queuedJobs = []
        self.lastJobPosition = (0,0)
        self.nextAvailableTime = 0
        self.state = AT_BASE
          

    def GetPosition (self, time):
        #local helper function
        def sign (num):
                if num == 0:
                    return 0
                elif num > 0:
                    return 1
                else:
                    return -1
            
        if self.state == TO_BASE:
            distanceTravelled = time - self.timeLeavingToBase
            if distanceTravelled <= abs(self.lastJobPosition[1]): #Still traveling north/south
                return (self.lastJobPosition[0], sign(self.lastJobPosition[1]) * abs(self.lastJobPosition[1])-distanceTravelled)
            elif distanceTravelled <= abs(self.lastJobPosition[0]) + abs(self.lastJobPosition[1]): #Travelling west/east
                return (sign(self.lastJobPosition[0])*(abs(self.lastJobPosition[0])-distanceTravelled+abs(self.lastJobPosition[1])), 0)
            else:
                return (0,0)
        else:
            return self.lastJobPosition
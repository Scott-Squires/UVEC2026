from dataclasses import dataclass

@dataclass
class job:
    arrivalTime: int #kept as minutes since the start of the day (midnight)
    xCoord: int #west is negative, east is positive
    yCoord: int #south is negative, north is positive
    completionTime: int #time to complete the job

    def __init__ (self, arrivalTime: int, xCoord: int, yCoord: int, completionTime: int):
        self.arrivalTime = arrivalTime
        self.xCoord = xCoord
        self.yCoord = yCoord
        self.completionTime = completionTime
 

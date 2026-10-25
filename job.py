from dataclasses import dataclass

@dataclass
class job:
    arrivalTime: int #kept as minutes since the start of the day (midnight)
    xCoord: int #west is negative, east is positive
    yCoord: int #south is negative, north is positive
    completionTime: int #time to complete the job

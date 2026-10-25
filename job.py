from dataclasses import dataclass

@dataclass
class job:
    arrivalTime: int #kept as minutes since the start of the day (midnight)
    position: tuple[int, int] #west is negative, east is positive #south is negative, north is positive
    completionTime: int #time to complete the job
    id: int #job identifier number

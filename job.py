from dataclasses import dataclass

BASE_X = 0
BASE_Y = 0
MINUTES_PER_DAY = 24 * 60

@dataclass
class Job:
    arrivalTime: int #kept as minutes since the start of the day (midnight)
    position: tuple[int, int] #west is negative, east is positive #south is negative, north is positive
    completionTime: int #time to complete the job
    id: int #job identifier number

    def __init__ (self, arrivalTime: int, xCoord: int, yCoord: int, completionTime: int):
        self.arrivalTime = arrivalTime
        self.position = (xCoord, yCoord)
        self.xCoord = xCoord
        self.yCoord = yCoord
        self.completionTime = completionTime
        self.id = -1

    def __lt__(self, other: "Job") -> bool:
        return self.arrivalTime < other.arrivalTime

#travel time between two points = blocks north/south + blocks east/west (1 block = 1 minute)
def calculate_travel_time(
    x1: int, y1: int, x2: int, y2: int
) -> int:
    """Calculate Manhattan travel time in minutes."""
    return abs(x1 - x2) + abs(y1 - y2)


def format_time(minutes: int) -> str:
    """Format elapsed minutes as a clock time."""
    days = minutes // MINUTES_PER_DAY
    minutes = minutes % MINUTES_PER_DAY

    clock = f"{minutes // 60:02d}:{minutes % 60:02d}"

    if days > 0:
        clock += f" (+{days}d)"

    return clock

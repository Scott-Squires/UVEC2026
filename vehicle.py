"""Vehicle state and position tracking."""

from collections import deque
from enum import Enum

from job import BASE_X, BASE_Y, Job

class CAR_STATE(Enum):
    AT_BASE = 1
    START_JOB = 2
    TO_JOB = 3 # leaving to another job
    TO_BASE = 4

class Vehicle:
    """One emergency vehicle and the jobs lined up for it."""

    def __init__(self, id) -> None:
        self.vehicle_id =  id
        self.nextAvailableTime = 0
        self.nextAvailablePosition = (0,0)
        self.timeLeavingToBase = 0
        self.lastJobPosition = (0,0)
        self.currentJobID = -1

        # Jobs assigned to this car that it hasn't finished yet
        self.pending_jobs = 0

        self.state = CAR_STATE.AT_BASE

        # Last place the vehicle stood still (a finished job, or base)
        self.x_coord = BASE_X
        self.y_coord = BASE_Y

        # Time it left (x_coord, y_coord); only used while driving home
        self.left_at = 0

        # Jobs lined up for this vehicle that it hasn't started yet
        self.queued_jobs: deque[Job] = deque()

        # Job it is driving to or working on
        self.current_job: Job | None = None

        # Forecast: when its last lined-up job finishes, and where that job is
        self.busy_until = 0
        self.last_x = BASE_X
        self.last_y = BASE_Y

        # Goes up on every new drive; used to skip stale ARRIVE_BASE events
        self.trip = 0

    def dequeue_job(self):
        return self.queued_jobs.popleft()

    def enqueue_job(self, job):
        self.queued_jobs.append(job)

    def is_busy(self) -> bool:
        """Return True while driving to or working on a job."""
        return self.state in (CAR_STATE.TO_JOB, CAR_STATE.ON_JOB)

    def get_position (self, time):
        #local helper function
        def sign (num):
                if num == 0:
                    return 0
                elif num > 0:
                    return 1
                else:
                    return -1

            
        if self.state == CAR_STATE.TO_BASE:
            distanceTravelled = time - self.timeLeavingToBase
            if distanceTravelled <= abs(self.lastJobPosition[1]): #Still traveling north/south
                return (self.lastJobPosition[0], sign(self.lastJobPosition[1])
                         * (abs(self.lastJobPosition[1])-distanceTravelled))
            elif distanceTravelled <= abs(self.lastJobPosition[0]) + abs(self.lastJobPosition[1]): #Travelling west/east
                return (sign(self.lastJobPosition[0])
                        *(abs(self.lastJobPosition[0])-distanceTravelled+abs(self.lastJobPosition[1])), 0)
            else:
                return (0,0)
        else:
            return self.lastJobPosition

    def get_queued_jobs_length (self):
        return len(self.queued_jobs)

    def set_state(self, state):
        self.state = state

    def __repr__(self) -> str:
        return (
            f"Vehicle({self.vehicle_id}, {self.state}, "
            f"at ({self.x_coord}, {self.y_coord}), "
            f"queued={len(self.queued_jobs)})"
        )

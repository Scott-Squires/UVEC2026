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

    def __init__(self, vehicle_id: int) -> None:
        self.vehicle_id = vehicle_id
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

    def is_busy(self) -> bool:
        """Return True while driving to or working on a job."""
        return self.state in (TO_JOB, ON_JOB)

    def get_position(self, time: int) -> tuple[int, int]:
        """Return the vehicle's coordinates at the given time.

        The vehicle only moves between fixed points while driving home.
        It drives the north/south leg first, then east/west, matching
        format_driving_instruction.
        """
        if self.state != TO_BASE:
            return (self.x_coord, self.y_coord)

        minutes_driven = time - self.left_at
        x = self.x_coord
        y = self.y_coord

        # North/south leg
        step = min(minutes_driven, abs(BASE_Y - y))
        y += step if BASE_Y > y else -step
        minutes_driven -= step

        # East/west leg
        step = min(minutes_driven, abs(BASE_X - x))
        x += step if BASE_X > x else -step

        return (x, y)

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

# UVEC 2026 — Emergency Vehicle Scheduler

## The problem

A city has a small fleet of emergency vehicles, all starting at one base. Calls come in through the day. Each call has:

- a **time**
- a **location** on the city grid (blocks north/south and east/west of base)
- a **duration** (how long the job takes once a vehicle gets there)

The city is a perfect grid, so vehicles only drive north/south/east/west, and each intersection takes 1 minute to cross.

## What we're solving

Decide **which vehicle answers each call and when**, then print a timestamped schedule for every vehicle.

The goal is to **get help to every incident as fast as possible**.

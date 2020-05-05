# IP Address ManagER
---
IPAMER was created to help an ISP manage the assignment of static IP addresses for customers. It's built for front-line people who have little or no knowledge of IPs, subnet masks, gateways, prefixes, etc.

IPAMER can also be used to manually track other IP ranges.


# Disclaimer
---
IPAMER is functional, but currently in alpha and may have issues, inefficient code or non-working code.


# Requirements and Setup
---
(this section is a work in progress)
MongoDB
Node.js

Listens on port 8080


# Workflow
---
## Intial setup should be done by network personnel
Create a customer named Reserved (TODO: a later version should do this automatically)
Create a Site (this is optional)
Create a Prefix

## non-technical personnel
Create a Customer
Assign an IP to the Customer
-- either by finding and selecting a Customer, then clicking the 'ASSIGN ADDRESS' button within the Customer context
-- or by finding and selecting a Prefix from the Prefix page, then looking for an IP with a status of 'Available', then clicking the Assign Customer Action


# API
---
We've started an extremely basic API at /api


# Contributing
---
Pull requests are welcomed; but we're amateur coders with little knowledge of Github workflows. Please be patient with us.


# About
---
This project is developed by Jason Creviston
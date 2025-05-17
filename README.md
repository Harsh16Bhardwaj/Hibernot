# @nightsWatch/hibernot

A planned NPM package to prevent database hibernation in free-tier cloud services like Supabase and MongoDB Atlas by sending periodic API pings.

## The Problem

Free-tier cloud databases (e.g., Supabase, MongoDB Atlas) hibernate after inactivity (e.g., 15m–7d), pausing compute resources to save costs. This causes 5–30s wakeup delays when an API call hits the database, leading to:

- **User Experience Issues**: Slow responses for the first request after inactivity (e.g., app loading delays).
- **API Failures**: Timeouts or connection errors if wakeup exceeds client timeouts (e.g., 10s HTTP requests).
- **Development Complexity**: Programmers must implement retries or caching, increasing app complexity.

This impacts application programmers, especially on low-traffic apps (e.g., prototypes, side projects), where hibernation is common on free tiers, degrading performance and reliability.

## What We’re Thinking of Building

**Hibernot** aims to keep databases active by periodically pinging their APIs, preventing hibernation for Node.js apps.

### Wishful Features

- **Periodic Pinging**: Send lightweight queries (e.g., `SELECT 1` for Supabase, `db.ping()` for MongoDB) at configurable intervals (e.g., every 5–15m).
- **Traffic-Based Scheduling**: Adjust ping frequency based on app traffic to minimize unnecessary requests.
- **Multi-Database Support**: Target Supabase, MongoDB Atlas, and potentially others (e.g., PlanetScale).
- **Low Resource Usage**: Optimize pings to respect API rate limits and avoid extra costs.
- **Simple Setup**: Easy integration with minimal configuration for Node.js apps.

## Current Status

This package is in the **planning phase**. We’re refining the concept and seeking community input before development. No code exists yet, but we’re committed to solving the hibernation problem for budget-conscious developers.

## Contributing

Help us shape **Hibernot**! Share ideas or suggestions on GitHub:

1. Visit [github.com/codestreak/hibernot](https://github.com/codestreak/hibernot) (repo coming soon).
2. Open an issue to propose features, databases, or use cases.
3. Suggest via [GitHub Discussions](https://github.com/codestreak/hibernot/discussions) (once live).

### Ideas We’d Love

- Strategies for traffic-based ping intervals.
- Additional database support (e.g., Neon, Firebase).
- Ways to monitor ping success/failure.
- Rate limit handling techniques.

## License

MIT License (planned). Details will be added upon release.

---
**Hibernot** is a project in the planning phase. We’re refining the concept and seeking community input before development. No code exists yet, but we’re committed to solving the hibernation problem for budget-conscious developers. Stay tuned for updates and contributions! 🚀🚀🚀🚀

Let’s keep databases awake and apps responsive!

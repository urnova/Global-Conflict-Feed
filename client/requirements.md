## Packages
date-fns | Used for formatting relative timestamps (e.g., "2 minutes ago") in the live feed
framer-motion | Used for layout animations so new news items smoothly push older items down

## Notes
- The application forces a dark "intelligence/terminal" aesthetic.
- The `use-news` hook connects to the `/ws` endpoint automatically to listen for live updates.
- Real-time updates optimistically update the TanStack Query cache.

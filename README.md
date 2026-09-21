## Jellyfish
A web third party client for jellyfin with integration with Seerr 

## Current Progress
Video playback and library integration have been implemented. The Seerr integration is in progress and includes a secured server-side proxy for deployments where direct browser access is blocked by CORS.

## Seerr proxy configuration

The proxy blocks private and reserved network destinations by default. Production deployments must set `SEERR_PROXY_ALLOWED_ORIGINS` to the exact Seerr origin or origins they expect to use. Trusted self-hosted deployments that need to reach a LAN-hosted Seerr instance can explicitly set `SEERR_PROXY_ALLOW_PRIVATE_NETWORKS=true`. See `.env.example` for the available settings and the explicit unlisted-origin escape hatch.

if you want to try it out you can use the online version at [Jellyfish](https://jellyfish.kollod.dev) or deploy yourself using npm.

# DISCITRACK

Static student behavior tracking demo built with HTML, CSS, and JavaScript.

## Deploy with Cloudflare Pages

Connect this GitHub repository to Cloudflare Pages with these build settings:

- Framework preset: None
- Build command: leave blank
- Build output directory: `/` (repository root)

The site entry point is `index.html`.

## Demo limitations

This version stores accounts and violation records in browser `localStorage`. Data does not sync between browsers or devices. The demo administrator credentials are part of the client-side code, so the admin login is for demonstration only and does not protect real student records. Use a server-side authentication and database service before storing real student information.

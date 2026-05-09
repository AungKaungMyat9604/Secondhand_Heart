# Deployment notes (dev → prod)

## Backend (Laravel)
- Configure `.env`:
  - `APP_ENV=production`
  - `APP_DEBUG=false`
  - `APP_KEY` set
  - DB credentials (MySQL in production)
- Run:
  - `php artisan migrate --force`
  - `php artisan storage:link`

## Frontend (React)
- Set `VITE_API_BASE_URL` to your backend base URL before building.
- Build:
  - `npm run build`
- Serve `frontend/dist/` via your web server or static hosting.

## Apache/XAMPP (high-level)
- Point Apache to Laravel `backend/public` for the backend.
- Configure a separate vhost (or static folder) for the frontend build output.


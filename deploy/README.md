# Deploy VT Eating on Raspberry Pi

This guide walks through deploying VT Eating on a Raspberry Pi with Docker and making it accessible globally via Cloudflare Tunnel.

## Prerequisites

- Raspberry Pi 4 (4GB+) or Pi 5
- Raspberry Pi OS (64-bit) or Ubuntu
- Docker and Docker Compose installed
- A domain name (for Cloudflare Tunnel) or use ngrok for temporary access

## 1. Install Docker on the Pi

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in for group changes to take effect
```

## 2. Clone the Repository

```bash
cd ~
git clone <your-repo-url> VTEating
cd VTEating
```

## 3. Configure Environment

```bash
cp .env.example .env
nano .env  # or use your preferred editor
```

Fill in all values:

| Variable | Example | Notes |
|----------|---------|-------|
| `POSTGRES_PASSWORD` | `$(openssl rand -base64 24)` | Strong password for the database |
| `JWT_SECRET` | `$(openssl rand -base64 32)` | Generate with the command shown |
| `ADMIN_EMAILS` | `yourname@vt.edu` | Comma-separated admin emails |
| `STRIPE_SECRET_KEY` | `sk_live_xxx` | From [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_xxx` | Same source |
| `STRIPE_WEBHOOK_SECRET` | `whsec_xxx` | After adding webhook (step 6) |
| `RESEND_API_KEY` | (optional) | For OTP emails |
| `FROM_EMAIL` | (optional) | e.g. `VT Eating <noreply@yourdomain.com>` |

## 4. Build and Start

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

This will:
- Start PostgreSQL and persist data in a Docker volume
- Build and start the Next.js app
- Run `prisma db push` on startup to ensure the database schema is in sync

Check logs:
```bash
docker compose -f docker-compose.prod.yml logs -f app
```

The app will be available at **http://localhost:3000** on the Pi.

## 5. Make It Globally Accessible

### Option A: Cloudflare Tunnel (recommended)

1. [Add your domain to Cloudflare](https://dash.cloudflare.com/)
2. Install cloudflared on the Pi:

```bash
# For 64-bit ARM (Pi 4/5)
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 -o cloudflared
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/

# Or install via package manager if available
# sudo apt install cloudflared
```

3. Authenticate and create a tunnel:

```bash
cloudflared tunnel login
cloudflared tunnel create vteating
cloudflared tunnel route dns vteating vteating.yourdomain.com
```

4. Run the tunnel (or set up as a service for auto-start):

```bash
cloudflared tunnel run vteating --url http://localhost:3000
```

### Option B: systemd service for Cloudflare Tunnel (auto-start on boot)

Create `/etc/systemd/system/cloudflared-vteating.service`:

```ini
[Unit]
Description=Cloudflare Tunnel for VT Eating
After=network.target docker.service

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/cloudflared tunnel run vteating --url http://localhost:3000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable cloudflared-vteating
sudo systemctl start cloudflared-vteating
```

### Option C: ngrok (quick test, URL changes each restart)

```bash
ngrok http 3000
```

Use the provided HTTPS URL and update Stripe webhooks accordingly.

## 6. Configure Stripe Webhook

In the [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks):

1. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
2. Select the events your app needs (e.g. `payment_intent.succeeded`, `payment_intent.payment_failed`)
3. Copy the **Signing secret** (`whsec_...`) into your `.env` as `STRIPE_WEBHOOK_SECRET`
4. Restart the app: `docker compose -f docker-compose.prod.yml restart app`

## 7. Useful Commands

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f

# Restart app
docker compose -f docker-compose.prod.yml restart app

# Stop everything
docker compose -f docker-compose.prod.yml down

# Rebuild after code changes
docker compose -f docker-compose.prod.yml up -d --build
```

## Pi-Specific Tips

- **Swap**: If you have limited RAM, add swap: `sudo dphys-swapfile setup && sudo dphys-swapfile swapon`
- **Storage**: Use an SSD via USB for better performance than SD card
- **Temperature**: Monitor with `vcgencmd measure_temp`; add a heatsink/fan if needed

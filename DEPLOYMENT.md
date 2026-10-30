# Ethiopost Marketing Command Center - Team & Production Deployment Guide

This guide explains how to make the **Ethiopost Marketing Command Center** live and accessible for your team, whether within your local Ethiopost office network (Intranet/LAN) or deployed to a cloud server with custom domain and HTTPS.

---

## 1. Instant Access for Your Office Team (LAN / Intranet)

The application is already running and configured to accept connections from all network interfaces (`0.0.0.0`).

### Team URLs:
* **Host Computer (Your Machine)**: [http://localhost:3050/](http://localhost:3050/)
* **Colleagues on Ethiopost Office Network / Wi-Fi**: **`http://172.20.18.151:3050/`**

### Windows Firewall Configuration (If colleagues cannot connect):
If a colleague's browser times out connecting to `http://172.20.18.151:3050/`, open **PowerShell as Administrator** on this machine and run this one command to allow inbound TCP traffic on port 3050:

```powershell
New-NetFirewallRule -DisplayName "Ethiopost Marketing Command Center" -Direction Inbound -LocalPort 3050 -Protocol TCP -Action Allow
```

---

## 2. One-Click Windows Startup

A startup script `start-production.bat` is included in the project directory:
* Double-click `start-production.bat` anytime to start the server.
* To make it start automatically when Windows boots:
  1. Press `Win + R`, type `shell:startup` and press Enter.
  2. Right-click `start-production.bat`, select **Create shortcut**, and paste the shortcut into the Startup folder.

---

## 3. Docker Deployment (Linux Server / VM / Synology / On-Premise)

If Ethiopost has an internal Linux server or on-premise VM:

1. Clone or copy this directory to the server:
   ```bash
   scp -r ethiopost-command-center user@server-ip:/opt/
   ```
2. Navigate to the folder:
   ```bash
   cd /opt/ethiopost-command-center
   ```
3. Start the container in detached mode:
   ```bash
   docker compose up -d
   ```
4. Access via your server IP or internal DNS (e.g., `http://marketing.ethiopost.internal:3050/`).
5. All database records persist safely in the `./data` directory on the host.

---

## 4. Cloud Hosting (Render / Railway / Fly.io / DigitalOcean)

Because this platform has **zero external npm dependencies** (pure Node.js 24 with native `node:sqlite`), it deploys cleanly in under 2 minutes to any cloud provider:

### Option A: Render (Free / Low Cost)
1. Push repository to GitHub or GitLab.
2. In [Render.com](https://render.com), click **New Web Service** and connect the repository.
3. Configure settings:
   * **Runtime**: `Node`
   * **Build Command**: *(leave empty)*
   * **Start Command**: `node server.js`
   * **Environment Variable**: `PORT=3050`
4. Attach a persistent disk mounted to `/app/data` (to preserve SQLite database across restarts).
5. Render generates a live, secure HTTPS link (e.g. `https://ethiopost-marketing.onrender.com`).

### Option B: Railway
1. In [Railway.app](https://railway.app), create a new project from your repo.
2. Under **Settings**, add a Volume mounted to `/app/data`.
3. Railway automatically generates an SSL domain.

---

## 5. Instant Secure Worldwide Tunnel (Cloudflare Tunnel)

To share the app with remote team members outside the office network **right now without opening router ports**:

1. Install Cloudflare Tunnel (`cloudflared`):
   ```powershell
   winget install --id Cloudflare.cloudflared
   ```
2. Run a quick tunnel:
   ```bash
   cloudflared tunnel --url http://localhost:3050
   ```
3. Cloudflare gives you a live `https://<random-subdomain>.trycloudflare.com` URL that anyone on your team can open securely from anywhere in the world!

---

## 6. Multi-User Team Roles & Collaboration

The platform includes all **10 official Ethiopost marketing roles**:
* Marketing & Communication Manager (`Dawit Tadesse`)
* Marketing Operations Manager (`Tigist Haile`)
* Campaign Supervisor (`Almaz Bekele`)
* Digital Marketing Supervisor (`Kirubel Misrak`)
* Pricing Supervisor (`Yonas Mulugeta`)
* Market Analyst (`Bethlehem Girma`)
* Marketing Officer (`Hanna Tadesse`)
* Marketing Approver (`Ermias Sahle`)
* Senior Management and Executives (`Dr. Sefere Alemu`)
* System Administrator (`Abebe Kebede`)

### Switching Active Role:
* Click on the **User Profile Chip** at the bottom of the left sidebar to open the role selector and switch sessions.
* Or visit **Team & Access** in the sidebar to review the full staff directory and switch accounts.
* All actions (creating campaigns, booking ad placements, and signing off on approvals) will automatically register under the selected team member.

---

## 7. Database Backups

The SQLite database file is stored at:
```
data/ethiopost.db
```
To create a backup:
* Simply copy `data/ethiopost.db` to a backup folder or Google Drive/OneDrive.
* SQLite WAL mode ensures transactional consistency even during active use.

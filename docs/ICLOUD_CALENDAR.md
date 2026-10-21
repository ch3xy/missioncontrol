# Private iCloud calendars

How to show iCloud calendars in mission control **without sharing them publicly**.

mission control is frontend-only and cannot hold an Apple ID password, and iCloud does not allow
browser requests from other origins (CORS). A sync job on arrow-pi therefore pulls the calendars via
CalDAV and writes one `.ics` file per calendar. A second step adds each calendar's name and color and
publishes it under a readable file name. Caddy serves these files next to mission control, so the
browser reads them same-origin.

```text
iCloud (CalDAV, private) ──vdirsyncer, every 15 min──▶ ~/.local/share/vdirsyncer/calendars/<id>.ics
                         ──publish-calendars.py (name, color)──▶ /home/pi/apps/calendars/<name>.ics
                                                        │ mounted read-only into the caddy container
mission control ──GET /missioncontrol/calendars/<name>.ics──▶ Caddy (same-origin, no CORS)
```

The Apple ID credentials only exist on the Pi. Nothing is written back to iCloud.

## 1. App-specific password

1. Sign in at <https://account.apple.com> → **Sign-In and Security** → **App-Specific Passwords**.
2. Create a password, e.g. named `arrow-pi vdirsyncer`.

It only grants CalDAV/CardDAV access (not the whole Apple account) and can be revoked there at any
time. The normal Apple ID password does not work for CalDAV when two-factor authentication is on.

## 2. vdirsyncer on the Pi

```bash
sudo apt install vdirsyncer
mkdir -p ~/.config/vdirsyncer ~/.local/share/vdirsyncer/calendars /home/pi/apps/calendars
# Paste the app-specific password, then Ctrl-D
cat > ~/.config/vdirsyncer/icloud-password
chmod 600 ~/.config/vdirsyncer/icloud-password
```

`~/.config/vdirsyncer/config`:

```ini
[general]
status_path = "/home/pi/.local/share/vdirsyncer/status/"

[pair icloud]
a = "icloud_remote"
b = "icloud_local"
collections = ["from a"]
conflict_resolution = "a wins"

[storage icloud_remote]
type = "caldav"
url = "https://caldav.icloud.com/"
username = "your-apple-id@example.com"
password.fetch = ["command", "cat", "/home/pi/.config/vdirsyncer/icloud-password"]
read_only = true
# Only what the agenda shows: from yesterday to one year ahead. Recurring series that started
# earlier are still included, because CalDAV matches them by their occurrences.
start_date = "datetime.now() - timedelta(days=1)"
end_date = "datetime.now() + timedelta(days=365)"

[storage icloud_local]
type = "singlefile"
path = "/home/pi/.local/share/vdirsyncer/calendars/%s.ics"
```

- `read_only = true` on the iCloud side: vdirsyncer never changes anything in iCloud.
- Every iCloud calendar becomes one file, named by its iCloud collection ID (often a UUID). These
  files are not served; step 3 publishes them under readable names.

First run:

```bash
vdirsyncer discover icloud   # answer "y" to create the local collections
vdirsyncer sync
ls ~/.local/share/vdirsyncer/calendars   # one .ics file per calendar
```

## 3. Name and color

vdirsyncer's `singlefile` storage keeps no calendar metadata, so the files have neither the calendar's
name nor its color. `publish-calendars.py` (pi-ops, `stacks/apps/bin`, deployed to
`/home/pi/apps/bin` by `deploy-stack.sh`) fills that gap:

1. It reads the Apple ID from the vdirsyncer config (storage `icloud_remote`) and asks iCloud via
   CalDAV for every calendar's display name and color. Nothing is written to iCloud.
2. It writes each synced calendar to `/home/pi/apps/calendars/<name>.ics`, e.g. `familienkalender.ics`
   (lowercase, umlauts as `ae`/`oe`/`ue`), with `X-WR-CALNAME` and `X-APPLE-CALENDAR-COLOR` added.
3. It deletes published files whose calendar no longer exists and prints the published file names.

The vdirsyncer files stay untouched: vdirsyncer copies calendar properties into every event, so an
added color would look like a local change on each sync.

Sync and publish every 15 minutes (`crontab -e`):

```cron
*/15 * * * * /usr/bin/vdirsyncer -v WARNING sync >> /home/pi/.local/share/vdirsyncer/sync.log 2>&1; /usr/bin/python3 /home/pi/apps/bin/publish-calendars.py > /dev/null 2>> /home/pi/.local/share/vdirsyncer/sync.log
```

Run `vdirsyncer discover icloud` again after adding a calendar in iCloud. Renaming a calendar in iCloud
renames its published file, so update the URL in mission control.

## 4. Caddy (pi-ops)

The Caddy setup lives in the `pi-ops` repository (`stacks/apps`). Two changes, applied there:

`stacks/apps/docker-compose.yml`, service `caddy`, `volumes`:

```yaml
# iCloud calendars synced by vdirsyncer (docs in missioncontrol/docs/ICLOUD_CALENDAR.md)
- ./calendars:/srv/calendars:ro
```

`./calendars` is relative to the stack directory on the Pi. If it does not resolve to
`/home/pi/apps/calendars`, use that absolute path.

`stacks/apps/proxy/Caddyfile`, next to `handle_path /missioncontrol/*`:

```caddy
	# Calendars synced from iCloud by vdirsyncer. A missing file is a 404, not the index.html fallback.
	handle_path /missioncontrol/calendars/* {
		root * /srv/calendars
		header Cache-Control "no-cache"
		file_server
	}
```

Caddy sorts `handle_path` blocks by path length, so this one takes precedence over
`/missioncontrol/*`. Then reload or recreate the container (`docker compose up -d caddy`).

The calendars get their own directory instead of `/home/pi/apps/missioncontrol`, because the deploy
script syncs the build into that directory with rsync and would delete foreign files.

Check: `curl -I http://arrow.local/missioncontrol/calendars/work.ics` returns `200`.

## 5. mission control

Settings → **Kalenderquelle** = `ICS-URL`, **Kalender-Quell-URLs**, one per line:

```text
/missioncontrol/calendars/work.ics
/missioncontrol/calendars/private.ics
```

Appointments of all calendars are merged and sorted. Each appointment shows its calendar's name and
color (from `X-WR-CALNAME` and `X-APPLE-CALENDAR-COLOR`, or RFC 7986 `NAME` and `COLOR`). If one file is missing or broken, the others are
still shown together with a warning.

For local development, `npm run start` forwards `/missioncontrol/calendars` to the server
(`CALENDARS_TARGET`, default `http://arrow.local`), so the same paths work on `localhost:4200`.

## Privacy

- The `.ics` files can be read by anyone who can reach mission control on the server, without login.
  That is fine inside the home network or VPN. If `arrow.local` is ever reachable from outside, protect
  `/missioncontrol/calendars/*` (e.g. with Caddy `basic_auth`) or remove the route.
- `publish-calendars.py` reads the same password file and only sends it to iCloud.
- The password file stays on the Pi (`chmod 600`) and is never part of a repository.
- To revoke access, delete the app-specific password in the Apple account.

## Recurring events and time zones

mission control expands recurring events itself (with [ical.js](https://github.com/kewisch/ical.js)):

- `RRULE` (daily, weekly, monthly such as "every 2nd Tuesday", yearly; `INTERVAL`, `COUNT`, `UNTIL`)
  and `RDATE` produce one appointment per occurrence, from today up to one year ahead.
- `EXDATE` removes deleted occurrences; a moved or changed single occurrence (`RECURRENCE-ID`)
  replaces the regular one.
- Times with `TZID` are converted with the `VTIMEZONE` that iCloud and vdirsyncer put into the file,
  so a weekly 09:00 meeting stays at 09:00 across daylight saving time changes.

## Limitations

- Single (non-recurring) events are shown as delivered; the sync window above keeps past ones out.
- Cancelled occurrences that iCloud keeps as `STATUS:CANCELLED` (instead of an `EXDATE`) are still shown.

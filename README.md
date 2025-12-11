# DiscordStatusStalker

⚠️ **AI-GENERATED PLUGIN** - This plugin was created by an AI assistant and may contain limitations or unexpected behavior.

A BetterDiscord plugin that tracks per-user status and voice channel changes with right-click user menu integration, inline log viewer, and alerts when tracked users share a VC.

---

## ⚠️ IMPORTANT ETHICAL NOTICE

### Consent & Privacy

**DO NOT USE THIS PLUGIN WITHOUT THE EXPLICIT CONSENT OF THE USERS YOU ARE TRACKING.**

This plugin logs status changes and voice channel activities of specified users. Before using this:

- **Obtain written consent** from each user you intend to track
- **Be transparent** about what data is being collected
- **Explain the purpose** of tracking
- **Allow users to opt-out** at any time
- **Comply with Discord's Terms of Service** - Violating Discord ToS may result in account termination
- **Respect privacy laws** in your jurisdiction (GDPR, CCPA, etc.)

### Legal Disclaimer

Users of this plugin are solely responsible for:
- Obtaining proper consent from tracked individuals
- Complying with all applicable laws and regulations
- Adhering to Discord's Terms of Service
- Any consequences resulting from unauthorized surveillance

**The author assumes NO liability for misuse of this plugin.**

---

## Features

- ✅ Per-user status tracking (online, idle, dnd, invisible)
- ✅ Voice channel activity logging (join, leave, switch)
- ✅ Right-click context menu integration on user profiles
- ✅ Inline log viewer with timestamps
- ✅ Alerts when multiple tracked users join the same voice channel
- ✅ JSON export functionality for logs
- ✅ Log clearing and management
- ✅ Persistent data storage

---

## Installation

### Requirements

- BetterDiscord plugin loader
- Discord client

### Setup

1. Download the plugin file
2. Place it in your BetterDiscord plugins folder:
   - **Windows**: `%appdata%/BetterDiscord/plugins/`
   - **Mac**: `~/Library/Application Support/BetterDiscord/plugins/`
   - **Linux**: `~/.config/BetterDiscord/plugins/`
3. Enable the plugin in BetterDiscord settings
4. Restart Discord or use BetterDiscord's reload function

---

## Usage

### Adding Tracked Users

1. Open BetterDiscord settings
2. Find "DiscordStatusStalker" in the plugins list
3. Paste user IDs into the textarea (one per line)
4. Right-click any user to toggle tracking or view logs

### Viewing Logs

- **In-app**: Right-click a user → "View StatusVC logs"
- **Export**: Use the "Export all logs as JSON" button in settings
- **Clear logs**: Select a user and click "Clear logs for selected user"

### Understanding Log Format

Logs are timestamped and include:
- Status changes (e.g., "user changed status to online")
- Voice channel joins/leaves
- Voice channel switches
- Multi-user VC alerts

---

## Plugin Architecture

### Core Components

| Component | Purpose |
|-----------|----------|
| **PresenceStore** | Tracks user status changes |
| **VoiceStateStore** | Monitors voice channel activity |
| **Dispatcher** | Listens to Discord events |
| **ContextMenu** | Provides right-click menu options |
| **Data API** | Stores settings and logs locally |

### Storage

- **Settings**: Tracked user IDs, selected user
- **Logs**: Up to 2000 entries per user (auto-truncated)
- **Format**: JSON stored in BetterDiscord's local database

---

## Support

### ⚠️ Limited Support Notice

**This plugin is AI-generated and maintenance is limited.** Be aware:

- Discord API changes may break the plugin
- BetterDiscord updates may cause compatibility issues
- Bug fixes are not guaranteed
- Feature requests may not be implemented


### Troubleshooting

If the plugin stops working:

1. Check if Discord has released a major update
2. Verify BetterDiscord is fully updated
3. Reload the plugin
4. If still broken, consider using an older version
5. Check the GitHub repository for known issues

---

## Security & Privacy

### What This Plugin Collects

- Discord user IDs
- Online status states
- Voice channel IDs and names
- Timestamp data

### Where Data Is Stored

- **Locally only** - on your machine via BetterDiscord's data API
- **Not uploaded** to servers or third parties
- **You control** what data is logged

### Recommendations

- Store only necessary user IDs
- Regularly review and export logs
- Clear old logs to minimize data exposure
- Do not share exported JSON files containing user data

---

## Technical Details

### Module Dependencies

- `UserStore` - User information lookup
- `PresenceStore` - Status tracking
- `VoiceStateStore` - Voice state monitoring
- `ChannelStore` - Channel information
- `Dispatcher` - Event subscription system
- `ContextMenu` - Context menu patching

### Event Listeners

- `VOICE_STATE_UPDATES` - Bulk voice state changes
- `VOICE_STATE_UPDATE` - Individual voice state changes
- `PresenceStore change listener` - Status updates

### VC Pair Detection

When tracked users join the same voice channel:
1. Plugin detects the shared channel
2. Creates a unique pair identifier (to avoid duplicate alerts)
3. Triggers modal alert with channel information
4. Logs the event for both users

---

## Changelog

### Version 4.5.0

- Initial release
- Status and voice channel tracking
- Context menu integration
- VC pair detection and alerts
- Log viewer and export functionality
- AI-generated with ethical guidelines

---

## License

This plugin is provided as-is. Use at your own risk and with proper consent.

---

## Disclaimer

**By using this plugin, you acknowledge that:**

1. You have obtained explicit consent from all tracked users
2. You will not use this plugin for unauthorized surveillance
3. You understand the legal implications in your jurisdiction
4. You accept all responsibility for your actions
5. The plugin creator assumes no liability for misuse

---

## Need Help?

If the plugin breaks:

- Check GitHub issues
- Review the code for obvious conflicts
- Disable and re-enable the plugin
- Try using an older version

**Note**: As this is an AI-generated project, community support is minimal. You are largely responsible for troubleshooting and finding solutions.

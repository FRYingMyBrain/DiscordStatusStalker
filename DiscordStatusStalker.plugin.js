/**
 * @name StatusVCMonitorContext
 * @author FryingMyBrain
 * @version 4.5.0
 * @description Track per-user status & VC changes, with right-click user menu toggle (guilds + DMs), inline log viewer, and alerts when tracked users share a VC.
 */

const PLUGIN_NAME = "StatusVCMonitorContext";

module.exports = class StatusVCMonitorContext {
    constructor() {
        this.settings = this.loadSettings(); // { trackedUsers: { [userId]: true }, selectedUser: "" }
        this.prevStatus = {};
        this.prevVoiceChannelId = {};
        this.logs = this.loadLogs();
        this._settingsPanelForceUpdate = null;
        this.cmUnpatches = [];

        // channelId -> Set<userId> for tracked users currently in that VC
        this.channelOccupants = {};
        // Set of "channelId:userIdA:userIdB" (sorted pair) to avoid repeat alerts
        this.activePairAlerts = new Set();
    }

    /* ===== settings & logs ===== */

    loadSettings() {
        const stored = BdApi.Data.load(PLUGIN_NAME, "settings") || {};
        if (!stored.trackedUsers) stored.trackedUsers = {};
        if (!stored.selectedUser) stored.selectedUser = "";
        return stored;
    }

    saveSettings() {
        BdApi.Data.save(PLUGIN_NAME, "settings", this.settings);
    }

    loadLogs() {
        const data = BdApi.Data.load(PLUGIN_NAME, "logData") || {};
        for (const k in data) {
            if (!Array.isArray(data[k])) data[k] = [];
        }
        return data;
    }

    saveLogs() {
        BdApi.Data.save(PLUGIN_NAME, "logData", this.logs);
    }

    isTracked(userId) {
        return !!this.settings.trackedUsers[userId];
    }

    setTracked(userId, value) {
        if (value) {
            this.settings.trackedUsers[userId] = true;
        } else {
            delete this.settings.trackedUsers[userId];
            delete this.prevStatus[userId];
            delete this.prevVoiceChannelId[userId];
            delete this.logs[userId];
            if (this.settings.selectedUser === userId) {
                this.settings.selectedUser = "";
            }
        }
        this.saveSettings();
        this.saveLogs();
        this.refreshSettingsPanel();
    }

    log(userId, line, showToast = false) {
        const timestamp = new Date().toISOString();
        const full = `[${timestamp}] ${line}`;
        console.log(`[${PLUGIN_NAME}] ${full}`);

        if (!this.logs[userId]) this.logs[userId] = [];
        this.logs[userId].push(full);
        if (this.logs[userId].length > 2000) {
            this.logs[userId].splice(0, this.logs[userId].length - 2000);
        }
        this.saveLogs();

        if (showToast) BdApi.UI.showToast(line, { type: "info", timeout: 4000 });
        this.refreshSettingsPanel();
    }

    getLogText(userId) {
        if (!userId) return "No user selected.";
        if (!this.logs[userId] || this.logs[userId].length === 0)
            return "No events logged yet for this user.";
        return this.logs[userId].join("\n");
    }

    clearLogsFor(userId) {
        if (!userId) return;
        this.logs[userId] = [];
        this.saveLogs();
        this.refreshSettingsPanel();
    }

    exportLogsJSON() {
        const payload = JSON.stringify(this.logs, null, 2);
        BdApi.Native.clipboard.copy(payload);
        BdApi.UI.showToast("StatusVC logs copied to clipboard as JSON.", { type: "success" });
    }

    /* ===== modules ===== */

    getModules() {
        const Webpack = BdApi.Webpack;
        const getModule = Webpack.getModule;
        const Filters = Webpack.Filters;

        this.UserStore = getModule(m => m.getUser && m.getCurrentUser);
        this.PresenceStore = getModule(m => m.getStatus && m.getState);
        this.Dispatcher = getModule(m => m.subscribe && m.dispatch && m.unsubscribe);

        this.VoiceStateStore =
            getModule(Filters.byStoreName("VoiceStateStore")) ||
            getModule(m => m.getUserVoiceChannelId || m.getVoiceStateForUser);

        this.ChannelStore =
            getModule(Filters.byStoreName("ChannelStore")) ||
            getModule(m => m.getChannel && m.hasChannel);

        this.ContextMenu = BdApi.ContextMenu;
    }

    /* ===== context menu (guilds + DMs) with inline viewer ===== */

    patchUserContextMenu() {
        if (!this.ContextMenu) return;
        const ContextMenu = this.ContextMenu;
        const React = BdApi.React;

        const unpatch = ContextMenu.patch("user-context", (retVal, props) => {
            try {
                const user = props.user;
                if (!user) return retVal;

                const userId = user.id;
                const tracked = this.isTracked(userId);

                if (!retVal?.props?.children) return retVal;
                const children = retVal.props.children;

                const toggleItem = ContextMenu.buildItem({
                    type: "button",
                    id: "statusvc-monitor-toggle",
                    label: tracked ? "Disable StatusVC logging" : "Enable StatusVC logging",
                    action: () => {
                        this.setTracked(userId, !tracked);
                        const label = !tracked ? "Enabled" : "Disabled";
                        BdApi.UI.showToast(
                            `${label} logging for ${user.username} (${userId})`,
                            { type: "success" }
                        );
                    }
                });

                const viewItem = ContextMenu.buildItem({
                    type: "button",
                    id: "statusvc-monitor-viewlog",
                    label: "View StatusVC logs",
                    action: () => {
                        const content = this.getLogText(userId);
                        BdApi.UI.showConfirmationModal(
                            `Status/VC log for ${user.username}`,
                            React.createElement(
                                "div",
                                {
                                    style: {
                                        maxHeight: "400px",
                                        maxWidth: "700px",
                                        overflowY: "auto",
                                        whiteSpace: "pre-wrap",
                                        fontFamily: "monospace",
                                        fontSize: "12px",
                                        padding: "4px",
                                        backgroundColor: "var(--background-secondary)"
                                    }
                                },
                                content
                            ),
                            {
                                confirmText: "Close",
                                cancelText: "Copy JSON",
                                onCancel: () => {
                                    const payload = JSON.stringify(this.logs[userId] || [], null, 2);
                                    BdApi.Native.clipboard.copy(payload);
                                    BdApi.UI.showToast(
                                        "This user's log copied as JSON.",
                                        { type: "success" }
                                    );
                                }
                            }
                        );
                    }
                });

                children.push(toggleItem, viewItem);
                return retVal;
            } catch (e) {
                console.error(`${PLUGIN_NAME}: user-context patch error`, e);
                return retVal;
            }
        });

        this.cmUnpatches.push(unpatch);
    }

    unpatchContextMenus() {
        for (const fn of this.cmUnpatches) {
            try { fn(); } catch {}
        }
        this.cmUnpatches = [];
    }

    /* ===== VC pair detection & alert ===== */

    updateChannelOccupantsFor(userId, oldChannelId, newChannelId) {
        // Remove from old
        if (oldChannelId && this.channelOccupants[oldChannelId]) {
            this.channelOccupants[oldChannelId].delete(userId);
            if (this.channelOccupants[oldChannelId].size === 0) {
                delete this.channelOccupants[oldChannelId];
            }
        }
        // Add to new
        if (newChannelId) {
            if (!this.channelOccupants[newChannelId]) {
                this.channelOccupants[newChannelId] = new Set();
            }
            this.channelOccupants[newChannelId].add(userId);
        }
    }

    checkTrackedPairsInVC(channelId) {
        const occupants = this.channelOccupants[channelId];
        if (!occupants || occupants.size < 2) return;

        const userIds = Array.from(occupants);
        const channel = this.ChannelStore?.getChannel(channelId);
        const channelName = channel?.name || channelId;

        for (let i = 0; i < userIds.length; i++) {
            for (let j = i + 1; j < userIds.length; j++) {
                const a = userIds[i];
                const b = userIds[j];

                // Only consider if both are tracked (defensive, though they should be)
                if (!this.isTracked(a) || !this.isTracked(b)) continue;

                const pairKey = `${channelId}:${[a, b].sort().join(":")}`;
                if (this.activePairAlerts.has(pairKey)) continue;
                this.activePairAlerts.add(pairKey);

                const userA = this.UserStore.getUser(a);
                const userB = this.UserStore.getUser(b);
                const nameA = userA?.username || a;
                const nameB = userB?.username || b;

                const lineForA = `${nameA} is in VC "${channelName}" with ${nameB}`;
                const lineForB = `${nameB} is in VC "${channelName}" with ${nameA}`;

                this.log(a, lineForA, true);
                this.log(b, lineForB, true);

                // Persistent red alert until closed
                const React = BdApi.React;
                BdApi.UI.showConfirmationModal(
                    "Tracked users together in VC",
                    React.createElement(
                        "div",
                        {
                            style: {
                                color: "var(--text-normal)",
                                fontSize: "14px"
                            }
                        },
                        React.createElement(
                            "div",
                            {
                                style: {
                                    marginBottom: "6px",
                                    fontWeight: "bold",
                                    color: "#ff5555"
                                }
                            },
                            "Alert: tracked users are in the same voice channel."
                        ),
                        React.createElement(
                            "div",
                            null,
                            `${nameA} and ${nameB} are in VC "${channelName}".`
                        ),
                        React.createElement(
                            "div",
                            { style: { marginTop: "4px", fontSize: "12px", opacity: 0.7 } },
                            "A log entry was added for both users."
                        )
                    ),
                    {
                        confirmText: "Close",
                        danger: true
                    }
                );
            }
        }
    }

    /* ===== settings panel (bulk view/export) ===== */

    getSettingsPanel() {
        const React = BdApi.React;
        const plugin = this;

        class Panel extends React.PureComponent {
            constructor(props) {
                super(props);
                plugin._settingsPanelForceUpdate = () => this.forceUpdate();
            }
            componentWillUnmount() {
                if (plugin._settingsPanelForceUpdate === this.forceUpdate)
                    plugin._settingsPanelForceUpdate = null;
            }
            render() {
                const trackedUsers = Object.keys(plugin.settings.trackedUsers);
                const selectedUser = plugin.settings.selectedUser;

                return React.createElement(
                    "div",
                    { style: { padding: "10px" } },
                    React.createElement(
                        "div",
                        { style: { marginBottom: "6px" } },
                        "Right-click a user anywhere and pick "View StatusVC logs" to open a popup."
                    ),
                    React.createElement(
                        "div",
                        { style: { marginBottom: "8px", fontWeight: "bold" } },
                        "Tracked user IDs (one per line):"
                    ),
                    React.createElement(
                        "textarea",
                        {
                            style: {
                                width: "100%",
                                height: "80px",
                                boxSizing: "border-box",
                                resize: "vertical"
                            },
                            value: trackedUsers.join("\n"),
                            placeholder: "Paste user IDs here, each on its own line.",
                            onChange: (e) => {
                                const lines = e.target.value
                                    .split("\n")
                                    .map(s => s.trim())
                                    .filter(Boolean);
                                const newMap = {};
                                for (const id of lines) newMap[id] = true;
                                plugin.settings.trackedUsers = newMap;
                                plugin.saveSettings();
                                this.forceUpdate();
                            }
                        }
                    ),
                    React.createElement(
                        "div",
                        { style: { display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" } },
                        React.createElement(
                            "button",
                            {
                                className: "bd-button",
                                onClick: () => plugin.exportLogsJSON()
                            },
                            "Export all logs as JSON (to clipboard)"
                        ),
                        React.createElement(
                            "button",
                            {
                                className: "bd-button",
                                onClick: () => {
                                    if (!selectedUser) return;
                                    BdApi.UI.showConfirmationModal(
                                        "Clear logs",
                                        `Clear all logs for user ID ${selectedUser}?`,
                                        {
                                            confirmText: "Clear",
                                            danger: true,
                                            onConfirm: () => plugin.clearLogsFor(selectedUser)
                                        }
                                    );
                                }
                            },
                            "Clear logs for selected user"
                        )
                    ),
                    React.createElement(
                        "div",
                        { style: { marginTop: "12px", fontWeight: "bold" } },
                        "Select user to view logs:"
                    ),
                    React.createElement(
                        "select",
                        {
                            style: { width: "100%", marginTop: "4px", marginBottom: "10px" },
                            value: selectedUser,
                            onChange: (e) =>

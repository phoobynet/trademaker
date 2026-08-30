# Running Codex on the MS-02 Ultra with tmux

## Purpose

`tmux` keeps a terminal session running on the MS-02 Ultra when an SSH client
disconnects. Codex, development servers, and test watchers continue running
after the laptop closes because the processes belong to the tmux session on
the MS-02, not to the laptop terminal.

`tmux` survives an SSH or network disconnection. It does not survive an MS-02
reboot, shutdown, or power failure.

## Install tmux

On Ubuntu or Debian:

```bash
sudo apt update
sudo apt install tmux
tmux -V
```

## Daily Codex workflow

Connect to the MS-02:

```bash
ssh ms02
```

Create a named tmux session:

```bash
tmux new-session -s trademaker
```

Inside the session, open the repository and start Codex:

```bash
cd ~/projects/trademaker
codex \
  --sandbox workspace-write \
  --ask-for-approval on-request \
  -c approvals_reviewer=auto_review
```

Use `/goal` inside Codex for an approved, measurable implementation goal. A
goal should state the outcome, constraints, and verification commands.

Detach from tmux without stopping Codex:

```text
Press Ctrl-b, release both keys, then press d.
```

The laptop can now disconnect or close. To return later:

```bash
ssh ms02
tmux attach-session -t trademaker
```

If another stale client is still attached, detach it and take over:

```bash
tmux attach-session -d -t trademaker
```

## Session commands

Run these commands from an ordinary shell outside tmux:

```bash
tmux list-sessions
tmux new-session -s trademaker
tmux attach-session -t trademaker
tmux rename-session -t old-name new-name
tmux kill-session -t trademaker
```

`tmux kill-session` terminates every process in that session. Use it only when
the work is finished or the processes should be stopped.

## Keyboard controls

Most controls start with the tmux prefix: press `Ctrl-b`, release it, and then
press the command key.

| Keys                   | Action                                |
| ---------------------- | ------------------------------------- |
| `Ctrl-b d`             | Detach and leave the session running  |
| `Ctrl-b c`             | Create a new window                   |
| `Ctrl-b ,`             | Rename the current window             |
| `Ctrl-b n`             | Select the next window                |
| `Ctrl-b p`             | Select the previous window            |
| `Ctrl-b 1`             | Select window 1                       |
| `Ctrl-b w`             | Display the window chooser            |
| `Ctrl-b %`             | Split the current window vertically   |
| `Ctrl-b "`             | Split the current window horizontally |
| `Ctrl-b` plus an arrow | Move to another pane                  |
| `Ctrl-b [`             | Enter scroll and copy mode            |
| `q`                    | Leave scroll and copy mode            |

Typing `exit` closes the current pane. Closing the final pane ends the tmux
session.

## Suggested TradeMaker layout

Use separate tmux windows so one process cannot obscure another:

| Window  | Purpose                                 |
| ------- | --------------------------------------- |
| `codex` | Interactive Codex CLI session           |
| `dev`   | Vite development server                 |
| `tests` | Unit-test or Playwright commands        |
| `shell` | Git inspection and ordinary maintenance |

Create and name each window with `Ctrl-b c`, followed by `Ctrl-b ,`.

To make the Vite development server reachable over the private LAN:

```bash
pnpm dev --host 0.0.0.0
```

Do not forward this port to the public internet. Reach it through the private
LAN or VPN and restrict it with the MS-02 firewall.

## Recommended configuration

Create `~/.tmux.conf` on the MS-02 with:

```tmux
set -g mouse on
set -g history-limit 100000
set -g status-interval 5
set -g base-index 1
setw -g pane-base-index 1
```

Reload the configuration without restarting existing sessions:

```bash
tmux source-file ~/.tmux.conf
```

Mouse support enables scrolling, pane selection, and pane resizing in terminals
that pass mouse events through SSH.

## Inspecting output

To save recent output from the `codex` window without attaching:

```bash
tmux capture-pane \
  -p \
  -t trademaker:codex \
  -S -1000 \
  > codex-session.log
```

This captures the latest 1,000 lines. The window must have been named `codex`.
Do not commit logs that contain credentials, private research data, or machine
paths.

## Approvals and unattended work

`tmux` keeps Codex running, but it does not answer Codex approval requests. The
recommended Codex command uses workspace-write sandboxing and automatic review
for eligible requests. Codex can still pause when a decision is unsafe,
ambiguous, destructive, or outside the approved scope.

Do not run Codex with `--yolo` or
`--dangerously-bypass-approvals-and-sandbox` on the general-purpose MS-02 host.
If unrestricted commands are ever necessary, isolate the repository and its
credentials inside a dedicated development container first.

## Reboots and recovery

Before deliberately rebooting the MS-02:

1. Attach to the session.
2. Ask Codex for a status summary.
3. Commit or preserve intentional changes.
4. Stop development servers cleanly.
5. Exit Codex and the tmux session.
6. Reboot the machine.
7. Create a new tmux session and resume from the repository state.

For tasks that must start automatically after a reboot, use a dedicated
`systemd` service and `codex exec`. Keep tmux for interactive development,
observation, and steering.

## Troubleshooting

### No tmux sessions are listed

```bash
tmux list-sessions
```

If the command reports that no server is running, the session ended or the
machine rebooted. Inspect the repository and start a new session.

### The session is already attached

```bash
tmux attach-session -d -t trademaker
```

This disconnects the stale client and attaches the current terminal.

### The terminal display is corrupted

Detach and reconnect first. If necessary, run this inside the affected pane:

```bash
reset
```

### Codex is waiting

Attach to the `trademaker` session and inspect the prompt. Codex may need an
approval, clarification, or new instruction. A waiting process is not a tmux
failure.

### SSH disconnected unexpectedly

Reconnect and attach again:

```bash
ssh ms02
tmux attach-session -t trademaker
```

The processes should still be running unless the MS-02 itself restarted or the
tmux session was explicitly terminated.

## Security boundary

The tmux session runs with the permissions of the Linux user that created it.
Anyone who can access that user account can normally inspect or control the
session. Protect the MS-02 with SSH keys, a private LAN or VPN, a firewall,
regular updates, and an unprivileged development account. Keep provider keys
and Codex credentials out of the repository.

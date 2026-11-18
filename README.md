# Reduced Motion for Zen

A [Sine](https://github.com/CosmoCreeper/Sine) mod for Zen Browser. Some of Zen's animations keep playing when reduced motion is on. While it's on, this mod turns them off:

- Switching spaces happens instantly instead of sliding
- The compact mode sidebar and toolbar show and hide without sliding
- The download animation is skipped

When reduced motion is off, Zen animates like normal. It follows the system setting live, so it works well over Remote Desktop, where Windows turns animations off for the session.

It works through Zen's own settings (`zen.workspaces.switch-animation-duration`, `zen.view.compact.animate-sidebar`, `zen.downloads.download-animation`), plus a small stylesheet for the compact mode hover slide. Your previous values come back when reduced motion turns off or the mod is removed. Each one can be turned off in the mod's settings.

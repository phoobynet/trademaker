# TradeMaker

## Development requirements

- Node.js 24.x
- pnpm 11.11.0

## Workbench visual language

The browser workbench uses daisyUI semantic surfaces and content colours so
the compact trading shell stays legible in its `dark` default theme and its
controller-selected `light` theme. Interface type uses the local system font
stack, while the installed Lucide Vue icons support plain-language control
labels rather than replacing them.

Permanent layout values use purpose-based names. For example,
`--workspace-taskbar-height` defines the reserved bottom taskbar track while
the dominant middle track remains available for the docking canvas.

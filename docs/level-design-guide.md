# Level Design Guide

## SVG Level Format

Our game uses SVG files for level design, allowing designers to create levels visually in any SVG editor like Adobe Illustrator, Inkscape, or even web-based editors.

## Canvas Setup
- **Width**: 1600px (can be larger for longer levels)
- **Height**: 800px
- **ViewBox**: `0 0 1600 800` (maintains aspect ratio)

## Element Types and Classes

### Platforms
Use `<rect>` elements with the following classes:
- `platform` - Basic solid platform
- `platform moving` - Moving platform (add `data-speed="2"` for movement speed)
- `platform ice` - Slippery ice platform
- `platform breakable` - Platform that breaks when jumped on

Example:
```xml
<rect class="platform" x="200" y="600" width="150" height="20" fill="#95a5a6"/>
<rect class="platform moving" x="800" y="350" width="100" height="20" fill="#3498db" data-speed="2"/>
```

### Player Start
Use `<circle>` with class `player-start`:
```xml
<circle class="player-start" cx="100" cy="500" r="16" fill="#4ecdc4" opacity="0.5"/>
```

### Collectibles
Use `<circle>` elements:
- `collectible-coin` - Basic coin (10 points)
- `collectible-gem` - Gem (25 points)
- `collectible-star` - Star (50 points)

Example:
```xml
<circle class="collectible-coin" cx="275" cy="580" r="12" fill="#ffd700"/>
<circle class="collectible-gem" cx="460" cy="470" r="10" fill="#9c27b0"/>
<circle class="collectible-star" cx="620" cy="270" r="15" fill="#ffeb3b"/>
```

### Enemies
Use `<circle>` elements:
- `enemy-goomba` - Walking enemy
- `enemy-spike` - Stationary spike
- `enemy-flying` - Flying enemy

Add `data-patrol="100"` for patrol distance:
```xml
<circle class="enemy-goomba" cx="500" cy="700" r="16" fill="#8b4513" data-patrol="100"/>
```

### Background
Use `<rect>` covering the full canvas:
```xml
<rect class="background" fill="#1a1a2e" data-stars="true" width="100%" height="100%"/>
```

## Design Tips

1. **Layering**: Place background first, then platforms, then collectibles/enemies
2. **Naming**: Use descriptive IDs for complex elements
3. **Testing**: Use the game's debug mode to verify positioning
4. **Performance**: Avoid overly complex paths or too many small elements

## Workflow

1. Create SVG in your preferred editor
2. Export/save as SVG
3. Place in `/public/levels/`
4. Update level list in `LevelManager.ts`
5. Test in game

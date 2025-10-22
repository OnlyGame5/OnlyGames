# Minimap Update Fix

## Problem
The minimap wasn't updating when rooms became accessible (doors unlocked, puzzles completed, etc.). It only updated when the player moved or rotated.

## Root Cause
The minimap's `shouldRedraw()` method only checked for:
- Player position changes
- Player rotation changes

It **did not check** for changes in room/hallway accessibility states.

## Solution

### 1. Added Accessibility State Tracking
```javascript
// In constructor
this.lastAccessibilityState = {};
this.accessibilityCheckInterval = 500; // Check every 500ms
this.lastAccessibilityCheck = 0;
```

### 2. Created `checkAccessibilityChanged()` Method
This method:
- Checks all rooms (room0-4) for accessibility changes
- Checks all hallways for accessibility changes  
- Compares current state to last known state
- Logs when accessibility changes are detected
- Returns `true` if any changes detected

### 3. Integrated into `shouldRedraw()`
Now checks three conditions:
1. ✅ Player position changed
2. ✅ Player rotation changed
3. ✅ **Room accessibility changed** (NEW)

### 4. Added Public `forceRedraw()` Method
For manual redraw requests:
```javascript
minimap.forceRedraw(); // Force immediate redraw
```

## How It Works

### Automatic Detection (Every 500ms)
1. Minimap checks current accessibility of all rooms/hallways
2. Compares to last known state
3. If different → triggers redraw
4. Updates stored state

### Manual Trigger (Immediate)
```javascript
// In main.js when Room 2 completes
if (minimap) {
  minimap.forceRedraw();
}
```

## Performance Impact

- **Negligible**: Accessibility checks run max 2x per second (500ms interval)
- **Efficient**: Only redraws if accessibility actually changed
- **Throttled**: Respects existing 50ms redraw interval

## Testing

### Test Scenarios:
1. ✅ Complete Room 1 puzzle → Room 2 should turn green
2. ✅ Complete Room 2 puzzle → Room 3 should turn green  
3. ✅ Unlock door in Room 0 → Hallway should turn green
4. ✅ Solve any puzzle → Affected areas update within 500ms

### Console Output:
When accessibility changes, you'll see:
```
Room accessibility changed: room2 = true
Hallway accessibility changed: hubToRoom2 = true
Minimap: Forced redraw requested
```

## Files Modified
1. `src/minimap.js` - Added accessibility tracking and checking
2. `src/main.js` - Updated to use `forceRedraw()` method

## Benefits
- ✅ Minimap auto-updates when rooms unlock
- ✅ No manual redraw calls needed throughout codebase
- ✅ Consistent behavior across all room transitions
- ✅ Performance-friendly (throttled checks)
- ✅ Better player feedback (see progress on minimap)

---
**Date Fixed**: $(date)
**Issue**: Minimap not updating on room unlock
**Status**: ✅ Fixed


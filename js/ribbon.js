/**
 * Morphing Ribbon Background
 *
 * A solid filled ribbon where all lines follow ONE spine curve with perpendicular
 * offsets. The ribbon is FILLED (opaque) so when it folds over itself,
 * front sections cover back sections - creating true 3D fabric appearance.
 */

'use strict';

// ============================================================================
// SIMPLEX NOISE IMPLEMENTATION
// ============================================================================

class SimplexNoise {
  constructor(seed = Math.random()) {
    this.p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      this.p[i] = i;
    }

    const random = this._createSeededRandom(seed);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [this.p[i], this.p[j]] = [this.p[j], this.p[i]];
    }

    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);
    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
  }

  _createSeededRandom(seed) {
    return function() {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };
  }

  noise3D(x, y, z) {
    const grad3 = [
      [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
      [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
      [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
    ];

    const F3 = 1.0 / 3.0;
    const G3 = 1.0 / 6.0;

    const s = (x + y + z) * F3;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const k = Math.floor(z + s);

    const t = (i + j + k) * G3;
    const X0 = i - t;
    const Y0 = j - t;
    const Z0 = k - t;
    const x0 = x - X0;
    const y0 = y - Y0;
    const z0 = z - Z0;

    let i1, j1, k1, i2, j2, k2;

    if (x0 >= y0) {
      if (y0 >= z0) {
        i1=1; j1=0; k1=0; i2=1; j2=1; k2=0;
      } else if (x0 >= z0) {
        i1=1; j1=0; k1=0; i2=1; j2=0; k2=1;
      } else {
        i1=0; j1=0; k1=1; i2=1; j2=0; k2=1;
      }
    } else {
      if (y0 < z0) {
        i1=0; j1=0; k1=1; i2=0; j2=1; k2=1;
      } else if (x0 < z0) {
        i1=0; j1=1; k1=0; i2=0; j2=1; k2=1;
      } else {
        i1=0; j1=1; k1=0; i2=1; j2=1; k2=0;
      }
    }

    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2.0 * G3;
    const y2 = y0 - j2 + 2.0 * G3;
    const z2 = z0 - k2 + 2.0 * G3;
    const x3 = x0 - 1.0 + 3.0 * G3;
    const y3 = y0 - 1.0 + 3.0 * G3;
    const z3 = z0 - 1.0 + 3.0 * G3;

    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;

    const gi0 = this.permMod12[ii + this.perm[jj + this.perm[kk]]];
    const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1 + this.perm[kk + k1]]];
    const gi2 = this.permMod12[ii + i2 + this.perm[jj + j2 + this.perm[kk + k2]]];
    const gi3 = this.permMod12[ii + 1 + this.perm[jj + 1 + this.perm[kk + 1]]];

    let t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
    let n0 = 0;
    if (t0 >= 0) {
      t0 *= t0;
      n0 = t0 * t0 * (grad3[gi0][0]*x0 + grad3[gi0][1]*y0 + grad3[gi0][2]*z0);
    }

    let t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
    let n1 = 0;
    if (t1 >= 0) {
      t1 *= t1;
      n1 = t1 * t1 * (grad3[gi1][0]*x1 + grad3[gi1][1]*y1 + grad3[gi1][2]*z1);
    }

    let t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
    let n2 = 0;
    if (t2 >= 0) {
      t2 *= t2;
      n2 = t2 * t2 * (grad3[gi2][0]*x2 + grad3[gi2][1]*y2 + grad3[gi2][2]*z2);
    }

    let t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
    let n3 = 0;
    if (t3 >= 0) {
      t3 *= t3;
      n3 = t3 * t3 * (grad3[gi3][0]*x3 + grad3[gi3][1]*y3 + grad3[gi3][2]*z3);
    }

    return 32.0 * (n0 + n1 + n2 + n3);
  }
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  lineCount: 40,            // Dense lines for solid ribbon look
  pointsPerLine: 250,       // Points for smooth curves

  // Timing
  drawDuration: 1800,       // ms per line to draw
  eraseDuration: 1400,      // ms per line to erase
  staggerDelay: 60,         // ms between each line starting
  holdDuration: 3000,       // ms to hold before morphing

  // Ribbon shape
  baseSpacing: 3.0,         // Spacing between lines
  twistAmplitude: 1.8,      // How much spacing varies (3D fold effect)
  twistNoiseScale: 0.002,   // Lower = smoother, longer folds

  // Appearance
  lineWidth: 1.0,
  lineOpacity: 0.6,
  fillColor: '#f8f7f4',     // Same as background - makes ribbon opaque
  backgroundColor: '#f8f7f4'
};

// ============================================================================
// DIRECTION - Defines the ribbon's spine curve
// ============================================================================

class Direction {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    // Random wave characteristics
    this.seed = Math.random() * 1000;
    this.amplitude = 100 + Math.random() * 120;
    this.noiseScale = 0.001 + Math.random() * 0.0015;
    this.centerY = 0.35 + Math.random() * 0.3;

    // Secondary wave for more organic feel
    this.secondarySeed = Math.random() * 1000;
    this.secondaryAmplitude = 40 + Math.random() * 50;
    this.secondaryNoiseScale = 0.002 + Math.random() * 0.002;

    // Tertiary for fine detail
    this.tertiarySeed = Math.random() * 1000;
    this.tertiaryAmplitude = 15 + Math.random() * 20;
    this.tertiaryNoiseScale = 0.005 + Math.random() * 0.003;
  }

  /**
   * Generate the ribbon's CENTER SPINE
   */
  generateSpine(noise, time) {
    const points = [];
    const startX = -this.width * 0.2;
    const endX = this.width * 1.2;

    for (let i = 0; i <= CONFIG.pointsPerLine; i++) {
      const t = i / CONFIG.pointsPerLine;
      const x = startX + t * (endX - startX);

      // Primary wave - large flowing motion
      const primaryNoise = noise.noise3D(
        x * this.noiseScale,
        this.seed,
        time * 0.2
      );

      // Secondary wave - medium variation
      const secondaryNoise = noise.noise3D(
        x * this.secondaryNoiseScale,
        this.secondarySeed,
        time * 0.15
      );

      // Tertiary wave - fine detail
      const tertiaryNoise = noise.noise3D(
        x * this.tertiaryNoiseScale,
        this.tertiarySeed,
        time * 0.1
      );

      const y = this.centerY * this.height +
                primaryNoise * this.amplitude +
                secondaryNoise * this.secondaryAmplitude +
                tertiaryNoise * this.tertiaryAmplitude;

      points.push({ x, y });
    }

    return points;
  }

  /**
   * Generate all line curves from spine at once
   * Returns array of line point arrays
   */
  generateAllLines(spine, noise, time) {
    const allLines = [];
    const centerIndex = (CONFIG.lineCount - 1) / 2;

    for (let lineIdx = 0; lineIdx < CONFIG.lineCount; lineIdx++) {
      const baseOffset = (lineIdx - centerIndex) * CONFIG.baseSpacing;
      const linePoints = [];

      for (let i = 0; i < spine.length; i++) {
        const point = spine[i];

        // Calculate tangent
        let tangentX, tangentY;
        if (i === 0) {
          tangentX = spine[1].x - spine[0].x;
          tangentY = spine[1].y - spine[0].y;
        } else if (i === spine.length - 1) {
          tangentX = spine[i].x - spine[i-1].x;
          tangentY = spine[i].y - spine[i-1].y;
        } else {
          tangentX = spine[i+1].x - spine[i-1].x;
          tangentY = spine[i+1].y - spine[i-1].y;
        }

        // Normalize
        const len = Math.sqrt(tangentX * tangentX + tangentY * tangentY);
        if (len > 0) {
          tangentX /= len;
          tangentY /= len;
        }

        // Perpendicular
        const perpX = -tangentY;
        const perpY = tangentX;

        // 3D twist variation
        const twistNoise = noise.noise3D(
          point.x * CONFIG.twistNoiseScale,
          lineIdx * 0.05,
          time * 0.1
        );

        // Dynamic offset - creates fold/spread effect
        const dynamicOffset = baseOffset * (0.6 + twistNoise * CONFIG.twistAmplitude * 0.4);

        linePoints.push({
          x: point.x + perpX * dynamicOffset,
          y: point.y + perpY * dynamicOffset
        });
      }

      allLines.push(linePoints);
    }

    return allLines;
  }
}

// ============================================================================
// RIBBON - Solid filled ribbon with line texture
// ============================================================================

const RibbonState = {
  DRAWING: 'drawing',
  HOLDING: 'holding',
  MORPHING: 'morphing'
};

class Ribbon {
  constructor(width, height, noise) {
    this.width = width;
    this.height = height;
    this.noise = noise;
    this.time = 0;

    // Current state
    this.state = RibbonState.DRAWING;
    this.direction = new Direction(width, height);
    this.lines = [];  // Current line curves

    // Animation progress
    this.drawProgress = 0;       // 0-1 how much is drawn (during DRAWING)
    this.lineDrawProgress = [];  // Per-line draw progress
    this.currentDrawLine = 0;    // Which line is currently drawing

    // Morph state
    this.oldLines = null;
    this.newLines = null;
    this.morphProgress = [];     // Per-line morph progress
    this.currentMorphLine = 0;

    this.stateStartTime = 0;
    this.lastLineStartTime = 0;

    // Initialize
    this._generateLines();
    for (let i = 0; i < CONFIG.lineCount; i++) {
      this.lineDrawProgress.push(0);
      this.morphProgress.push({ erase: 0, draw: 0 });
    }
  }

  _generateLines() {
    const spine = this.direction.generateSpine(this.noise, this.time);
    this.lines = this.direction.generateAllLines(spine, this.noise, this.time);
  }

  update(timestamp) {
    if (this.stateStartTime === 0) {
      this.stateStartTime = timestamp;
      this.lastLineStartTime = timestamp;
    }

    const elapsed = timestamp - this.stateStartTime;

    switch (this.state) {
      case RibbonState.DRAWING:
        this._updateDrawing(timestamp);
        break;

      case RibbonState.HOLDING:
        if (elapsed >= CONFIG.holdDuration) {
          this._startMorph(timestamp);
        }
        break;

      case RibbonState.MORPHING:
        this._updateMorphing(timestamp);
        break;
    }

    this.time += 0.002;
  }

  _updateDrawing(timestamp) {
    // Update current line progress
    const lineElapsed = timestamp - this.lastLineStartTime;
    const progress = Math.min(1, lineElapsed / CONFIG.drawDuration);

    if (this.currentDrawLine < CONFIG.lineCount) {
      this.lineDrawProgress[this.currentDrawLine] = progress;

      // When line finishes, move to next
      if (progress >= 1) {
        this.currentDrawLine++;
        this.lastLineStartTime = timestamp;
      }
    }

    // Check if all lines drawn
    if (this.currentDrawLine >= CONFIG.lineCount) {
      this.state = RibbonState.HOLDING;
      this.stateStartTime = timestamp;
    }
  }

  _startMorph(timestamp) {
    this.state = RibbonState.MORPHING;
    this.stateStartTime = timestamp;
    this.lastLineStartTime = timestamp;

    // Save old lines, generate new direction
    this.oldLines = this.lines;
    this.direction = new Direction(this.width, this.height);
    const newSpine = this.direction.generateSpine(this.noise, this.time);
    this.newLines = this.direction.generateAllLines(newSpine, this.noise, this.time);

    // Reset morph progress
    this.currentMorphLine = 0;
    for (let i = 0; i < CONFIG.lineCount; i++) {
      this.morphProgress[i] = { erase: 0, draw: 0 };
    }
  }

  _updateMorphing(timestamp) {
    // Stagger the morph start for each line
    for (let i = 0; i < CONFIG.lineCount; i++) {
      const lineStartTime = this.stateStartTime + i * CONFIG.staggerDelay;

      if (timestamp >= lineStartTime) {
        const lineElapsed = timestamp - lineStartTime;

        // Erase and draw happen simultaneously
        this.morphProgress[i].erase = Math.min(1, lineElapsed / CONFIG.eraseDuration);
        this.morphProgress[i].draw = Math.min(1, lineElapsed / CONFIG.drawDuration);
      }
    }

    // Check if all morphs complete
    const allDone = this.morphProgress.every(p => p.erase >= 1 && p.draw >= 1);
    if (allDone) {
      this.lines = this.newLines;
      this.oldLines = null;
      this.newLines = null;
      this.state = RibbonState.HOLDING;
      this.stateStartTime = timestamp;

      // Reset line draw progress for next morph
      for (let i = 0; i < CONFIG.lineCount; i++) {
        this.lineDrawProgress[i] = 1;
      }
    }
  }

  draw(ctx) {
    switch (this.state) {
      case RibbonState.DRAWING:
        this._drawInitial(ctx);
        break;

      case RibbonState.HOLDING:
        this._drawFull(ctx);
        break;

      case RibbonState.MORPHING:
        this._drawMorphing(ctx);
        break;
    }
  }

  /**
   * Draw the ribbon with filled sections between lines
   * This creates the solid opaque appearance
   */
  _drawFilledRibbon(ctx, lines, startT = 0, endT = 1) {
    if (!lines || lines.length < 2) return;

    const startIdx = Math.floor(startT * (lines[0].length - 1));
    const endIdx = Math.ceil(endT * (lines[0].length - 1));

    if (endIdx <= startIdx) return;

    // First: draw filled polygons between adjacent lines (creates solid fill)
    ctx.fillStyle = CONFIG.fillColor;

    for (let i = 0; i < lines.length - 1; i++) {
      const line1 = lines[i];
      const line2 = lines[i + 1];

      ctx.beginPath();

      // Forward along line1
      ctx.moveTo(line1[startIdx].x, line1[startIdx].y);
      for (let j = startIdx + 1; j <= endIdx && j < line1.length; j++) {
        ctx.lineTo(line1[j].x, line1[j].y);
      }

      // Backward along line2
      for (let j = Math.min(endIdx, line2.length - 1); j >= startIdx; j--) {
        ctx.lineTo(line2[j].x, line2[j].y);
      }

      ctx.closePath();
      ctx.fill();
    }

    // Second: draw all line strokes on top
    ctx.strokeStyle = `rgba(40, 40, 40, ${CONFIG.lineOpacity})`;
    ctx.lineWidth = CONFIG.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      ctx.beginPath();
      ctx.moveTo(line[startIdx].x, line[startIdx].y);

      for (let j = startIdx + 1; j <= endIdx && j < line.length; j++) {
        ctx.lineTo(line[j].x, line[j].y);
      }

      ctx.stroke();
    }
  }

  _drawInitial(ctx) {
    // Draw lines that are complete
    const completeLines = this.lines.slice(0, this.currentDrawLine);
    if (completeLines.length > 0) {
      this._drawFilledRibbon(ctx, completeLines);
    }

    // Draw current line in progress
    if (this.currentDrawLine < CONFIG.lineCount) {
      const progress = this.lineDrawProgress[this.currentDrawLine];
      if (progress > 0) {
        const currentLine = this.lines[this.currentDrawLine];
        const endIdx = Math.floor(progress * (currentLine.length - 1));

        // If we have previous lines, fill between last complete and current
        if (completeLines.length > 0) {
          const prevLine = completeLines[completeLines.length - 1];
          ctx.fillStyle = CONFIG.fillColor;
          ctx.beginPath();
          ctx.moveTo(prevLine[0].x, prevLine[0].y);
          for (let j = 1; j <= endIdx && j < prevLine.length; j++) {
            ctx.lineTo(prevLine[j].x, prevLine[j].y);
          }
          for (let j = Math.min(endIdx, currentLine.length - 1); j >= 0; j--) {
            ctx.lineTo(currentLine[j].x, currentLine[j].y);
          }
          ctx.closePath();
          ctx.fill();
        }

        // Draw current line stroke
        ctx.strokeStyle = `rgba(40, 40, 40, ${CONFIG.lineOpacity})`;
        ctx.lineWidth = CONFIG.lineWidth;
        ctx.beginPath();
        ctx.moveTo(currentLine[0].x, currentLine[0].y);
        for (let j = 1; j <= endIdx && j < currentLine.length; j++) {
          ctx.lineTo(currentLine[j].x, currentLine[j].y);
        }
        ctx.stroke();
      }
    }
  }

  _drawFull(ctx) {
    this._drawFilledRibbon(ctx, this.lines);
  }

  _drawMorphing(ctx) {
    // During morph, draw both old (erasing) and new (drawing) ribbons
    // The new ribbon draws on top, gradually replacing old

    // Draw old ribbon (portions still visible)
    if (this.oldLines) {
      for (let i = 0; i < this.oldLines.length; i++) {
        const eraseProgress = this.morphProgress[i].erase;
        if (eraseProgress < 1) {
          // Draw remaining portion of old line
          const line = this.oldLines[i];
          const startIdx = Math.floor(eraseProgress * (line.length - 1));

          // Fill with next line if exists
          if (i < this.oldLines.length - 1) {
            const nextLine = this.oldLines[i + 1];
            const nextErase = this.morphProgress[i + 1].erase;
            const nextStartIdx = Math.floor(nextErase * (nextLine.length - 1));

            ctx.fillStyle = CONFIG.fillColor;
            ctx.beginPath();
            ctx.moveTo(line[startIdx].x, line[startIdx].y);
            for (let j = startIdx + 1; j < line.length; j++) {
              ctx.lineTo(line[j].x, line[j].y);
            }
            for (let j = nextLine.length - 1; j >= nextStartIdx; j--) {
              ctx.lineTo(nextLine[j].x, nextLine[j].y);
            }
            ctx.closePath();
            ctx.fill();
          }

          // Stroke
          ctx.strokeStyle = `rgba(40, 40, 40, ${CONFIG.lineOpacity})`;
          ctx.lineWidth = CONFIG.lineWidth;
          ctx.beginPath();
          ctx.moveTo(line[startIdx].x, line[startIdx].y);
          for (let j = startIdx + 1; j < line.length; j++) {
            ctx.lineTo(line[j].x, line[j].y);
          }
          ctx.stroke();
        }
      }
    }

    // Draw new ribbon (portions already drawn)
    if (this.newLines) {
      for (let i = 0; i < this.newLines.length; i++) {
        const drawProgress = this.morphProgress[i].draw;
        if (drawProgress > 0) {
          const line = this.newLines[i];
          const endIdx = Math.floor(drawProgress * (line.length - 1));

          // Fill with next line if exists and has progress
          if (i < this.newLines.length - 1) {
            const nextLine = this.newLines[i + 1];
            const nextDraw = this.morphProgress[i + 1].draw;
            const nextEndIdx = Math.floor(nextDraw * (nextLine.length - 1));

            if (nextDraw > 0) {
              ctx.fillStyle = CONFIG.fillColor;
              ctx.beginPath();
              ctx.moveTo(line[0].x, line[0].y);
              for (let j = 1; j <= endIdx && j < line.length; j++) {
                ctx.lineTo(line[j].x, line[j].y);
              }
              for (let j = Math.min(endIdx, nextEndIdx, nextLine.length - 1); j >= 0; j--) {
                ctx.lineTo(nextLine[j].x, nextLine[j].y);
              }
              ctx.closePath();
              ctx.fill();
            }
          }

          // Stroke
          ctx.strokeStyle = `rgba(40, 40, 40, ${CONFIG.lineOpacity})`;
          ctx.lineWidth = CONFIG.lineWidth;
          ctx.beginPath();
          ctx.moveTo(line[0].x, line[0].y);
          for (let j = 1; j <= endIdx && j < line.length; j++) {
            ctx.lineTo(line[j].x, line[j].y);
          }
          ctx.stroke();
        }
      }
    }
  }
}

// ============================================================================
// RIBBON MANAGER
// ============================================================================

class RibbonManager {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error('Canvas not found:', canvasId);
      return;
    }

    this.ctx = this.canvas.getContext('2d');
    this.noise = new SimplexNoise();
    this.ribbon = null;
    this.animationId = null;

    this.setupCanvas();
    this.init();
    this.animate(performance.now());

    window.addEventListener('resize', () => {
      this.setupCanvas();
      this.init();
    });
  }

  setupCanvas() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.width = width;
    this.height = height;
  }

  init() {
    this.ribbon = new Ribbon(this.width, this.height, this.noise);
  }

  animate(timestamp) {
    // Clear with background
    this.ctx.fillStyle = CONFIG.backgroundColor;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Update and draw
    this.ribbon.update(timestamp);
    this.ribbon.draw(this.ctx);

    this.animationId = requestAnimationFrame(t => this.animate(t));
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.ribbonManager = new RibbonManager('ribbon-canvas');
  });
} else {
  window.ribbonManager = new RibbonManager('ribbon-canvas');
}

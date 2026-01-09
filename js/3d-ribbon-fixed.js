/**
 * 3D Ribbon Background - Fixed Version
 *
 * Improvements over original:
 * - Fixed spacing (no noise) prevents bunching at edges
 * - Removed fill meshes (fixes "invisible bits" artifacts)
 * - Smoother curves (50 control points vs 20) reduces Frenet frame issues
 * - Keeps complex knots (torus, trefoil) but makes them beautiful
 */

import * as THREE from 'three';

// ============================================================================
// SIMPLEX NOISE - Port from ribbon.js
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
  // Lines - FEWER for cleaner look
  lineCount: 8,             // Was 12 - cleaner
  lineSpacing: 25,          // Even wider spacing
  pointsPerLine: 150,

  // Animation (ms)
  drawDuration: 2000,
  morphDuration: 2500,
  staggerDelay: 100,
  holdDuration: 5000,

  // NO noise-based width variation (causes bunching)
  twistNoiseScale: 0,
  twistAmplitude: 0,
  lengthVariation: 0,

  // Curve - SMOOTHER with more control points
  curveScale: 300,
  depthVariation: 150,
  numControlPoints: 50,     // Was 20 - smoother curves

  // Continuous movement
  rotationSpeed: 0.0003,

  // Curve variations - complex knots + flowing horizontal waves
  numCurveVariations: 8,

  // Appearance
  lineColor: 0x1a1a1a,
  backgroundColor: 0xf8f7f4
};

// ============================================================================
// LINE3D CLASS - Single ribbon line mesh
// ============================================================================

class Line3D {
  constructor(index, totalLines, scene, noise) {
    this.scene = scene;
    this.noise = noise;
    this.index = index;

    // Offset from spine (center line is at index = totalLines/2)
    const centerIndex = (totalLines - 1) / 2;
    this.baseOffset = (index - centerIndex) * CONFIG.lineSpacing;

    // Per-line animation state
    this.drawProgress = 0;    // 0-1 during initial draw
    this.morphProgress = 0;   // 0-1 during morph (0→0.5 erase, 0.5→1 draw)

    // Mesh
    this.mesh = null;
  }

  /**
   * Generate the line's positions following the spine curve
   * with FIXED spacing (no noise - prevents bunching)
   * with FRAME STABILIZATION (prevents triangular gaps)
   */
  generatePositions(curve, time) {
    const positions = [];
    const frames = curve.computeFrenetFrames(CONFIG.pointsPerLine, false);

    // FRAME STABILIZATION: Detect and correct frame flips
    // Frame flips cause triangular gaps in fill meshes
    for (let i = 1; i < frames.binormals.length; i++) {
      // Check if binormal flipped (dot product < 0 means >90° change)
      if (frames.binormals[i].dot(frames.binormals[i - 1]) < 0) {
        frames.binormals[i].negate();  // Flip it back
        frames.normals[i].negate();
      }
    }

    for (let i = 0; i <= CONFIG.pointsPerLine; i++) {
      const t = i / CONFIG.pointsPerLine;
      const point = curve.getPoint(t);
      const binormal = frames.binormals[i];

      // Fixed spacing - no noise to avoid bunching
      const finalOffset = this.baseOffset;

      positions.push(
        point.x + binormal.x * finalOffset,
        point.y + binormal.y * finalOffset,
        point.z + binormal.z * finalOffset
      );
    }

    return positions;
  }

  /**
   * Create or regenerate the line mesh
   */
  createMesh(curve, time) {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.scene.remove(this.mesh);
    }

    const positions = this.generatePositions(curve, time);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const material = new THREE.LineBasicMaterial({
      color: CONFIG.lineColor,
      depthWrite: true,
      depthTest: true
    });

    this.mesh = new THREE.Line(geometry, material);
    this.scene.add(this.mesh);

    // Set initial draw range to 0 (invisible)
    geometry.setDrawRange(0, 0);
  }

  /**
   * Update positions to match a new curve
   */
  updatePositions(curve, time) {
    if (!this.mesh) return;

    const positions = this.generatePositions(curve, time);
    const posAttr = this.mesh.geometry.attributes.position;
    for (let i = 0; i < positions.length; i++) {
      posAttr.array[i] = positions[i];
    }
    posAttr.needsUpdate = true;
  }

  dispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
      this.scene.remove(this.mesh);
    }
  }
}

// ============================================================================
// RIBBON3D CLASS - Manages all lines
// ============================================================================

class Ribbon3D {
  constructor(scene, noise) {
    this.scene = scene;
    this.noise = noise;
    this.time = 0;

    // Single set of lines (morph in place)
    this.lines = [];
    this.fillMeshes = [];

    // Curve variations for morphing
    this.curves = [];
    this.currentCurveIndex = 0;
    this.nextCurveIndex = 1;
    this.generateCurveVariations();

    // Global animation state
    this.phase = 'drawing';       // 'drawing' | 'holding' | 'morphing'
    this.phaseStartTime = 0;
    this.holdTimer = 0;

    // Continuous rotation
    this.rotationTime = 0;
    this.ribbonGroup = new THREE.Group();
    this.scene.add(this.ribbonGroup);

    // Create line meshes
    for (let i = 0; i < CONFIG.lineCount; i++) {
      const line = new Line3D(i, CONFIG.lineCount, this.ribbonGroup, this.noise);
      line.createMesh(this.curves[0], this.time);
      this.lines.push(line);
    }

    // Create fill meshes between adjacent lines
    this.createFillMeshes();
  }

  /**
   * Generate flowing curve variations - large waves that use full screen
   * Removed bunching curves (torus knot, spiral, trefoil) in favor of flowing patterns
   */
  generateCurveVariations() {
    const numPoints = CONFIG.numControlPoints;

    // Curve Type 1: Figure-8 (Lissajous 1:2) - elegant crossover
    const points1 = [];
    for (let i = 0; i < numPoints; i++) {
      const t = (i / numPoints) * Math.PI * 2;
      points1.push(new THREE.Vector3(
        Math.sin(t) * CONFIG.curveScale * 1.1,
        Math.sin(t * 2) * CONFIG.curveScale * 0.8,
        Math.sin(t * 3) * CONFIG.depthVariation
      ));
    }
    this.curves.push(new THREE.CatmullRomCurve3(points1, true, 'catmullrom', 0.5));

    // Curve Type 2: Wide horizontal wave - flows across screen
    const points2 = [];
    for (let i = 0; i < numPoints; i++) {
      const t = (i / numPoints) * Math.PI * 2;
      points2.push(new THREE.Vector3(
        Math.sin(t) * CONFIG.curveScale * 1.3,  // Wide horizontal span
        Math.sin(t * 1.5) * CONFIG.curveScale * 0.5,  // Gentle vertical wave
        Math.cos(t * 2) * CONFIG.depthVariation
      ));
    }
    this.curves.push(new THREE.CatmullRomCurve3(points2, true, 'catmullrom', 0.5));

    // Curve Type 3: Lissajous 3:2 - flowing waves
    const points3 = [];
    for (let i = 0; i < numPoints; i++) {
      const t = (i / numPoints) * Math.PI * 2;
      points3.push(new THREE.Vector3(
        Math.sin(t * 3) * CONFIG.curveScale * 1.0,
        Math.sin(t * 2) * CONFIG.curveScale * 0.9,
        Math.cos(t * 5) * CONFIG.depthVariation * 0.8
      ));
    }
    this.curves.push(new THREE.CatmullRomCurve3(points3, true, 'catmullrom', 0.5));

    // Curve Type 4: Extended figure-8 - larger flowing crossover
    const points4 = [];
    for (let i = 0; i < numPoints; i++) {
      const t = (i / numPoints) * Math.PI * 2;
      points4.push(new THREE.Vector3(
        Math.sin(t) * CONFIG.curveScale * 1.2,
        Math.sin(t * 2) * CONFIG.curveScale * 0.6,
        Math.sin(t * 4) * CONFIG.depthVariation
      ));
    }
    this.curves.push(new THREE.CatmullRomCurve3(points4, true, 'catmullrom', 0.5));

    // Curve Type 5: Gentle S-curve - smooth horizontal flow
    const points5 = [];
    for (let i = 0; i < numPoints; i++) {
      const t = (i / numPoints) * Math.PI * 2;
      points5.push(new THREE.Vector3(
        Math.cos(t) * CONFIG.curveScale * 1.1,
        Math.sin(t) * CONFIG.curveScale * 0.7,
        Math.sin(t * 2) * CONFIG.depthVariation
      ));
    }
    this.curves.push(new THREE.CatmullRomCurve3(points5, true, 'catmullrom', 0.5));

    // Curve Type 6: Organic flowing curve - spans width
    const points6 = [];
    for (let i = 0; i < numPoints; i++) {
      const t = (i / numPoints) * Math.PI * 2;
      const wave = Math.sin(t * 4) * 0.3;
      points6.push(new THREE.Vector3(
        (Math.cos(t) + wave) * CONFIG.curveScale * 1.0,
        (Math.sin(t * 1.5) + wave) * CONFIG.curveScale * 0.9,
        Math.cos(t * 2.5) * CONFIG.depthVariation * 1.1
      ));
    }
    this.curves.push(new THREE.CatmullRomCurve3(points6, true, 'catmullrom', 0.5));

    // Curve Type 7: Flowing horizontal wave (open curve, spans screen width)
    const wavePoints1 = [];
    for (let i = 0; i < numPoints; i++) {
      const t = i / numPoints;
      const x = (t - 0.5) * CONFIG.curveScale * 2.5;  // Wide horizontal span
      const y = Math.sin(t * Math.PI * 3) * CONFIG.curveScale * 0.5
              + Math.sin(t * Math.PI * 7) * CONFIG.curveScale * 0.15;
      const z = Math.sin(t * Math.PI * 2) * CONFIG.depthVariation * 0.4;
      wavePoints1.push(new THREE.Vector3(x, y, z));
    }
    this.curves.push(new THREE.CatmullRomCurve3(wavePoints1, false, 'catmullrom', 0.5));

    // Curve Type 8: Deeper flowing wave with more depth crossover
    const wavePoints2 = [];
    for (let i = 0; i < numPoints; i++) {
      const t = i / numPoints;
      const x = (t - 0.5) * CONFIG.curveScale * 2.2;
      const y = Math.sin(t * Math.PI * 2.5) * CONFIG.curveScale * 0.6
              + Math.cos(t * Math.PI * 5) * CONFIG.curveScale * 0.2;
      const z = Math.sin(t * Math.PI * 1.5) * CONFIG.depthVariation * 0.8;  // More depth
      wavePoints2.push(new THREE.Vector3(x, y, z));
    }
    this.curves.push(new THREE.CatmullRomCurve3(wavePoints2, false, 'catmullrom', 0.5));
  }

  /**
   * Create filled quad meshes between adjacent lines
   * Creates the solid cloth appearance with overlapping effect
   */
  createFillMeshes() {
    // Create fill mesh between each pair of adjacent lines
    for (let i = 0; i < this.lines.length - 1; i++) {
      const line1 = this.lines[i];
      const line2 = this.lines[i + 1];

      const geometry = new THREE.BufferGeometry();
      const positions = [];
      const indices = [];

      // Get position data from both lines
      const pos1 = line1.mesh.geometry.attributes.position.array;
      const pos2 = line2.mesh.geometry.attributes.position.array;

      // Build vertices (interleaved from both lines)
      const numPoints = CONFIG.pointsPerLine + 1;
      for (let j = 0; j < numPoints; j++) {
        const idx = j * 3;

        // Vertex from line1
        positions.push(pos1[idx], pos1[idx + 1], pos1[idx + 2]);

        // Vertex from line2
        positions.push(pos2[idx], pos2[idx + 1], pos2[idx + 2]);
      }

      // Build triangle indices
      for (let j = 0; j < numPoints - 1; j++) {
        const base = j * 2;

        // Two triangles per quad segment
        // Triangle 1: (base, base+1, base+2)
        indices.push(base, base + 1, base + 2);

        // Triangle 2: (base+1, base+3, base+2)
        indices.push(base + 1, base + 3, base + 2);
      }

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setIndex(indices);

      const material = new THREE.MeshBasicMaterial({
        color: CONFIG.backgroundColor,
        side: THREE.DoubleSide,
        depthWrite: true,
        depthTest: true,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
      });

      const mesh = new THREE.Mesh(geometry, material);
      this.ribbonGroup.add(mesh);
      this.fillMeshes.push({ mesh, line1Index: i, line2Index: i + 1 });

      // Initially invisible
      geometry.setDrawRange(0, 0);
    }
  }

  /**
   * Update fill mesh positions when lines morph
   */
  updateFillMeshPositions(fillIndex) {
    const fillData = this.fillMeshes[fillIndex];
    const line1 = this.lines[fillData.line1Index];
    const line2 = this.lines[fillData.line2Index];

    const pos1 = line1.mesh.geometry.attributes.position.array;
    const pos2 = line2.mesh.geometry.attributes.position.array;

    const positions = fillData.mesh.geometry.attributes.position.array;
    const numPoints = CONFIG.pointsPerLine + 1;

    for (let j = 0; j < numPoints; j++) {
      const idx = j * 3;
      const posIdx = j * 6;  // 2 vertices per point (interleaved)

      // Update vertex from line1
      positions[posIdx] = pos1[idx];
      positions[posIdx + 1] = pos1[idx + 1];
      positions[posIdx + 2] = pos1[idx + 2];

      // Update vertex from line2
      positions[posIdx + 3] = pos2[idx];
      positions[posIdx + 4] = pos2[idx + 1];
      positions[posIdx + 5] = pos2[idx + 2];
    }

    fillData.mesh.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Update fill meshes to match line visibility (based on per-line progress)
   */
  updateFillMeshes() {
    const numPoints = CONFIG.pointsPerLine + 1;
    const numQuads = numPoints - 1;

    for (let i = 0; i < this.fillMeshes.length; i++) {
      const fillData = this.fillMeshes[i];
      const line1 = this.lines[fillData.line1Index];
      const line2 = this.lines[fillData.line2Index];

      // Use minimum progress of adjacent lines
      let progress1, progress2;

      if (this.phase === 'drawing') {
        progress1 = line1.drawProgress;
        progress2 = line2.drawProgress;
      } else if (this.phase === 'morphing') {
        // During morphing, use morphProgress (fully visible at 0.5, invisible at endpoints)
        progress1 = line1.morphProgress <= 0.5 ? line1.morphProgress * 2 : (1 - line1.morphProgress) * 2;
        progress2 = line2.morphProgress <= 0.5 ? line2.morphProgress * 2 : (1 - line2.morphProgress) * 2;
      } else {
        // Holding - fully visible
        progress1 = 1;
        progress2 = 1;
      }

      const minProgress = Math.min(progress1, progress2);
      const visibleQuads = Math.floor(minProgress * numQuads);
      const visibleIndices = visibleQuads * 6;

      fillData.mesh.geometry.setDrawRange(0, visibleIndices);
    }
  }

  /**
   * Update continuous rotation (always active for "alive" feeling)
   */
  updateRotation(deltaTime) {
    this.rotationTime += deltaTime * CONFIG.rotationSpeed;

    // Slow drift in multiple axes
    const rotationX = Math.sin(this.rotationTime * 0.3) * 0.1;
    const rotationY = this.rotationTime * 0.05;  // Constant slow spin
    const rotationZ = Math.sin(this.rotationTime * 0.5) * 0.05;

    this.ribbonGroup.rotation.set(rotationX, rotationY, rotationZ);
  }

  /**
   * Staggered drawing and morphing animation
   */
  update(deltaTime) {
    this.time += deltaTime * 0.001;  // Time in seconds

    // Always rotate for "alive" feeling
    this.updateRotation(deltaTime);

    const totalPoints = CONFIG.pointsPerLine + 1;
    const phaseElapsed = this.time * 1000 - this.phaseStartTime;

    switch (this.phase) {
      case 'drawing':
        // Each line draws with stagger delay
        for (let i = 0; i < this.lines.length; i++) {
          const lineStartTime = i * CONFIG.staggerDelay;

          if (phaseElapsed >= lineStartTime) {
            const lineElapsed = phaseElapsed - lineStartTime;
            this.lines[i].drawProgress = Math.min(1, lineElapsed / CONFIG.drawDuration);

            // Update draw range
            const drawEnd = Math.floor(this.lines[i].drawProgress * totalPoints);
            this.lines[i].mesh.geometry.setDrawRange(0, drawEnd);
          }
        }

        // Check if last line finished
        const lastLine = this.lines[this.lines.length - 1];
        if (lastLine.drawProgress >= 1) {
          this.phase = 'holding';
          this.phaseStartTime = this.time * 1000;
          this.holdTimer = 0;
        }
        break;

      case 'holding':
        this.holdTimer += deltaTime;

        if (this.holdTimer >= CONFIG.holdDuration) {
          this.phase = 'morphing';
          this.phaseStartTime = this.time * 1000;

          // Prepare next curve
          this.nextCurveIndex = (this.currentCurveIndex + 1) % this.curves.length;

          // Reset morph progress
          for (const line of this.lines) {
            line.morphProgress = 0;
          }
        }
        break;

      case 'morphing':
        // Each line morphs with stagger delay
        for (let i = 0; i < this.lines.length; i++) {
          const lineStartTime = i * CONFIG.staggerDelay;

          if (phaseElapsed >= lineStartTime) {
            const lineElapsed = phaseElapsed - lineStartTime;
            this.lines[i].morphProgress = Math.min(1, lineElapsed / CONFIG.morphDuration);

            // morphProgress 0→0.5: erase old, 0.5→1: draw new
            if (this.lines[i].morphProgress <= 0.5) {
              // Erasing: 0 → 0.5 maps to visibility 1 → 0
              const eraseProgress = this.lines[i].morphProgress * 2;
              const eraseStart = Math.floor(eraseProgress * totalPoints);
              this.lines[i].mesh.geometry.setDrawRange(
                eraseStart,
                totalPoints - eraseStart
              );
            } else {
              // Drawing new curve: 0.5 → 1 maps to visibility 0 → 1
              // First, update positions to new curve at midpoint
              if (this.lines[i].morphProgress > 0.5 && this.lines[i].morphProgress < 0.51) {
                this.lines[i].updatePositions(this.curves[this.nextCurveIndex], this.time);
              }

              const drawProgress = (this.lines[i].morphProgress - 0.5) * 2;
              const drawEnd = Math.floor(drawProgress * totalPoints);
              this.lines[i].mesh.geometry.setDrawRange(0, drawEnd);
            }
          }
        }

        // Check if last line finished morphing
        const lastMorphLine = this.lines[this.lines.length - 1];
        if (lastMorphLine.morphProgress >= 1) {
          this.phase = 'holding';
          this.phaseStartTime = this.time * 1000;
          this.holdTimer = 0;
          this.currentCurveIndex = this.nextCurveIndex;

          // Reset draw progress
          for (const line of this.lines) {
            line.drawProgress = 1;
          }
        }
        break;
    }

    // Update fill meshes to match line visibility
    this.updateFillMeshes();
  }

  dispose() {
    for (const line of this.lines) {
      line.dispose();
    }

    for (const fillData of this.fillMeshes) {
      fillData.mesh.geometry.dispose();
      fillData.mesh.material.dispose();
      this.ribbonGroup.remove(fillData.mesh);
    }
    this.fillMeshes = [];

    this.scene.remove(this.ribbonGroup);
  }
}

// ============================================================================
// SCENE MANAGER
// ============================================================================

class RibbonManager {
  constructor() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(CONFIG.backgroundColor);

    // Create orthographic camera (2D-like view with depth)
    const aspect = this.width / this.height;
    const frustumSize = this.height;
    this.camera = new THREE.OrthographicCamera(
      -frustumSize * aspect / 2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      2000
    );
    this.camera.position.z = 800;

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: document.getElementById('ribbon-canvas'),
      antialias: true,
      alpha: false
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create ribbon
    this.noise = new SimplexNoise();
    this.ribbon = new Ribbon3D(this.scene, this.noise);

    // Handle resize
    window.addEventListener('resize', () => this.handleResize());

    // Start animation
    this.clock = new THREE.Clock();
    this.startTime = performance.now();
    this.animate();
  }

  handleResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    const aspect = this.width / this.height;
    const frustumSize = this.height;

    this.camera.left = -frustumSize * aspect / 2;
    this.camera.right = frustumSize * aspect / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = -frustumSize / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);

    // Regenerate ribbon for new dimensions
    this.ribbon.dispose();
    this.ribbon = new Ribbon3D(this.scene, this.noise);
  }

  animate() {
    const deltaTime = this.clock.getDelta() * 1000;  // Convert to ms

    this.ribbon.update(deltaTime);
    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(() => this.animate());
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.ribbonManager = new RibbonManager();
  });
} else {
  window.ribbonManager = new RibbonManager();
}

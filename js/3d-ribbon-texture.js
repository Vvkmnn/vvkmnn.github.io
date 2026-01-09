/**
 * 3D Ribbon Background - Texture-Based Approach
 *
 * Inspired by Codrops tutorials (https://tympanus.net/codrops/2021/11/29/animated-3d-ribbons-with-three-js/)
 * - Single ribbon mesh (not multiple lines)
 * - Striped texture with alphaTest for gaps
 * - ShaderMaterial with uProgress for draw effect
 * - Cleaner architecture, no Frenet frame issues
 */

import * as THREE from 'three';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Ribbon geometry
  ribbonWidth: 200,           // Total width of ribbon
  stripeCount: 8,             // Number of visible stripes
  stripeWidth: 0.15,          // Width of each stripe (0-1 of texture)
  pointsPerCurve: 150,

  // Animation (ms)
  drawDuration: 2000,
  morphDuration: 2500,
  holdDuration: 5000,

  // Curve parameters
  curveScale: 300,
  depthVariation: 150,
  numControlPoints: 50,       // Smooth curves
  numCurveVariations: 8,

  // Continuous movement
  rotationSpeed: 0.0003,

  // Appearance
  stripeColor: 0x1a1a1a,
  backgroundColor: 0xf8f7f4
};

// ============================================================================
// SHADER MATERIAL WITH PROGRESSIVE DRAW
// ============================================================================

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uProgress;
  uniform vec3 uColor;
  uniform float uStripeCount;

  varying vec2 vUv;

  void main() {
    // Progressive draw based on curve position
    if (vUv.y > uProgress) {
      discard;
    }

    // Shader-based stripes (more reliable than canvas texture)
    float stripe = fract(vUv.x * uStripeCount);
    if (stripe > 0.12) {  // ~12% stripe width, ~88% gap - creates line-like appearance
      discard;
    }

    gl_FragColor = vec4(uColor, 1.0);
  }
`;

// ============================================================================
// RIBBON MESH CLASS
// ============================================================================

class RibbonMesh {
  constructor(scene, curve) {
    this.scene = scene;
    this.curve = curve;

    // Animation state
    this.drawProgress = 0;
    this.morphProgress = 0;

    // Create material with shader-based stripes (no texture needed)
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uProgress: { value: 0.01 },  // Start with tiny visible portion
        uColor: { value: new THREE.Color(CONFIG.stripeColor) },
        uStripeCount: { value: CONFIG.stripeCount }
      },
      side: THREE.DoubleSide,
      depthWrite: true,
      depthTest: true
    });

    // Create geometry
    this.createGeometry(curve);
  }

  /**
   * Create ribbon geometry from curve
   * Custom ribbon geometry (not TubeGeometry) for proper UV mapping
   */
  createGeometry(curve) {
    const segments = CONFIG.pointsPerCurve;
    const positions = [];
    const uvs = [];
    const indices = [];

    // Get Frenet frames for the curve
    const frames = curve.computeFrenetFrames(segments, false);

    // Build vertices along the curve
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = curve.getPoint(t);
      const binormal = frames.binormals[i];

      // Create two vertices (left and right edge of ribbon)
      const halfWidth = CONFIG.ribbonWidth / 2;

      // Left vertex
      positions.push(
        point.x - binormal.x * halfWidth,
        point.y - binormal.y * halfWidth,
        point.z - binormal.z * halfWidth
      );

      // Right vertex
      positions.push(
        point.x + binormal.x * halfWidth,
        point.y + binormal.y * halfWidth,
        point.z + binormal.z * halfWidth
      );

      // UVs - map along the curve
      uvs.push(0, t);  // Left edge
      uvs.push(1, t);  // Right edge
    }

    // Build triangle indices
    for (let i = 0; i < segments; i++) {
      const base = i * 2;

      // Two triangles per segment
      indices.push(base, base + 1, base + 2);
      indices.push(base + 1, base + 3, base + 2);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);

    // Create or update mesh
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.scene.remove(this.mesh);
    }

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.mesh);
  }

  /**
   * Update geometry to follow a new curve
   */
  updateGeometry(curve) {
    const segments = CONFIG.pointsPerCurve;
    const frames = curve.computeFrenetFrames(segments, false);
    const posAttr = this.mesh.geometry.attributes.position;

    let posIndex = 0;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = curve.getPoint(t);
      const binormal = frames.binormals[i];

      const halfWidth = CONFIG.ribbonWidth / 2;

      // Update left vertex
      posAttr.array[posIndex++] = point.x - binormal.x * halfWidth;
      posAttr.array[posIndex++] = point.y - binormal.y * halfWidth;
      posAttr.array[posIndex++] = point.z - binormal.z * halfWidth;

      // Update right vertex
      posAttr.array[posIndex++] = point.x + binormal.x * halfWidth;
      posAttr.array[posIndex++] = point.y + binormal.y * halfWidth;
      posAttr.array[posIndex++] = point.z + binormal.z * halfWidth;
    }

    posAttr.needsUpdate = true;
  }

  /**
   * Update shader progress uniform
   */
  setProgress(progress) {
    this.material.uniforms.uProgress.value = progress;
  }

  dispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.scene.remove(this.mesh);
    }
    this.material.dispose();
  }
}

// ============================================================================
// RIBBON MANAGER - Handles animation and curve morphing
// ============================================================================

class Ribbon3D {
  constructor(scene) {
    this.scene = scene;
    this.time = 0;

    // Curve variations
    this.curves = [];
    this.currentCurveIndex = 0;
    this.nextCurveIndex = 1;
    this.generateCurveVariations();

    // Animation state
    this.phase = 'drawing';
    this.phaseStartTime = 0;
    this.holdTimer = 0;

    // Continuous rotation
    this.rotationTime = 0;
    this.ribbonGroup = new THREE.Group();
    this.scene.add(this.ribbonGroup);

    // Create ribbon mesh
    this.ribbon = new RibbonMesh(this.ribbonGroup, this.curves[0]);
  }

  /**
   * Generate diverse curve variations
   */
  generateCurveVariations() {
    const numPoints = CONFIG.numControlPoints;

    // Curve Type 1: Figure-8 (Lissajous 1:2)
    const points1 = [];
    for (let i = 0; i < numPoints; i++) {
      const t = (i / numPoints) * Math.PI * 2;
      points1.push(new THREE.Vector3(
        Math.sin(t) * CONFIG.curveScale,
        Math.sin(t * 2) * CONFIG.curveScale * 0.7,
        Math.sin(t * 3) * CONFIG.depthVariation
      ));
    }
    this.curves.push(new THREE.CatmullRomCurve3(points1, true, 'catmullrom', 0.5));

    // Curve Type 2: Torus Knot (2,3)
    const points2 = [];
    for (let i = 0; i < numPoints; i++) {
      const t = (i / numPoints) * Math.PI * 4;
      const r = 0.5 + 0.2 * Math.cos(3 * t);
      points2.push(new THREE.Vector3(
        r * Math.cos(2 * t) * CONFIG.curveScale,
        r * Math.sin(2 * t) * CONFIG.curveScale,
        Math.sin(3 * t) * CONFIG.depthVariation
      ));
    }
    this.curves.push(new THREE.CatmullRomCurve3(points2, true, 'catmullrom', 0.5));

    // Curve Type 3: Lissajous 3:2
    const points3 = [];
    for (let i = 0; i < numPoints; i++) {
      const t = (i / numPoints) * Math.PI * 2;
      points3.push(new THREE.Vector3(
        Math.sin(t * 3) * CONFIG.curveScale * 0.9,
        Math.sin(t * 2) * CONFIG.curveScale * 0.8,
        Math.cos(t * 5) * CONFIG.depthVariation * 0.8
      ));
    }
    this.curves.push(new THREE.CatmullRomCurve3(points3, true, 'catmullrom', 0.5));

    // Curve Type 4: Spiral with varying radius
    const points4 = [];
    for (let i = 0; i < numPoints; i++) {
      const t = (i / numPoints) * Math.PI * 2;
      const radius = CONFIG.curveScale * (0.7 + 0.3 * Math.sin(t * 2));
      points4.push(new THREE.Vector3(
        radius * Math.cos(t),
        radius * Math.sin(t),
        Math.sin(t * 4) * CONFIG.depthVariation
      ));
    }
    this.curves.push(new THREE.CatmullRomCurve3(points4, true, 'catmullrom', 0.5));

    // Curve Type 5: Trefoil knot-like
    const points5 = [];
    for (let i = 0; i < numPoints; i++) {
      const t = (i / numPoints) * Math.PI * 2;
      points5.push(new THREE.Vector3(
        Math.sin(t) * (CONFIG.curveScale + Math.cos(t * 3) * 100),
        Math.cos(t) * (CONFIG.curveScale + Math.cos(t * 3) * 100),
        Math.sin(t * 3) * CONFIG.depthVariation
      ));
    }
    this.curves.push(new THREE.CatmullRomCurve3(points5, true, 'catmullrom', 0.5));

    // Curve Type 6: Organic flowing curve
    const points6 = [];
    for (let i = 0; i < numPoints; i++) {
      const t = (i / numPoints) * Math.PI * 2;
      const wave = Math.sin(t * 4) * 0.3;
      points6.push(new THREE.Vector3(
        (Math.cos(t) + wave) * CONFIG.curveScale * 0.9,
        (Math.sin(t * 1.5) + wave) * CONFIG.curveScale * 0.85,
        Math.cos(t * 2.5) * CONFIG.depthVariation * 1.1
      ));
    }
    this.curves.push(new THREE.CatmullRomCurve3(points6, true, 'catmullrom', 0.5));

    // Curve Type 7: Flowing horizontal wave (open curve, spans screen width)
    const wavePoints1 = [];
    for (let i = 0; i < numPoints; i++) {
      const t = i / numPoints;
      const x = (t - 0.5) * CONFIG.curveScale * 2.5;
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
      const z = Math.sin(t * Math.PI * 1.5) * CONFIG.depthVariation * 0.8;
      wavePoints2.push(new THREE.Vector3(x, y, z));
    }
    this.curves.push(new THREE.CatmullRomCurve3(wavePoints2, false, 'catmullrom', 0.5));
  }

  /**
   * Update continuous rotation
   */
  updateRotation(deltaTime) {
    this.rotationTime += deltaTime * CONFIG.rotationSpeed;

    const rotationX = Math.sin(this.rotationTime * 0.3) * 0.1;
    const rotationY = this.rotationTime * 0.05;
    const rotationZ = Math.sin(this.rotationTime * 0.5) * 0.05;

    this.ribbonGroup.rotation.set(rotationX, rotationY, rotationZ);
  }

  /**
   * Animation loop
   */
  update(deltaTime) {
    this.time += deltaTime * 0.001;

    // Always rotate
    this.updateRotation(deltaTime);

    const phaseElapsed = this.time * 1000 - this.phaseStartTime;

    switch (this.phase) {
      case 'drawing':
        // Draw the ribbon progressively
        this.ribbon.drawProgress = Math.min(1, phaseElapsed / CONFIG.drawDuration);
        this.ribbon.setProgress(this.ribbon.drawProgress);

        if (this.ribbon.drawProgress >= 1) {
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
          this.nextCurveIndex = (this.currentCurveIndex + 1) % this.curves.length;
          this.ribbon.morphProgress = 0;
        }
        break;

      case 'morphing':
        // Morph: 0→0.5 erase, 0.5→1 draw new
        this.ribbon.morphProgress = Math.min(1, phaseElapsed / CONFIG.morphDuration);

        if (this.ribbon.morphProgress <= 0.5) {
          // Erasing: progress goes from 1 → 0
          const eraseProgress = 1 - (this.ribbon.morphProgress * 2);
          this.ribbon.setProgress(eraseProgress);
        } else {
          // Update geometry at midpoint
          if (this.ribbon.morphProgress > 0.5 && this.ribbon.morphProgress < 0.51) {
            this.ribbon.updateGeometry(this.curves[this.nextCurveIndex]);
          }

          // Drawing new: progress goes from 0 → 1
          const drawProgress = (this.ribbon.morphProgress - 0.5) * 2;
          this.ribbon.setProgress(drawProgress);
        }

        if (this.ribbon.morphProgress >= 1) {
          this.phase = 'holding';
          this.phaseStartTime = this.time * 1000;
          this.holdTimer = 0;
          this.currentCurveIndex = this.nextCurveIndex;
        }
        break;
    }
  }

  dispose() {
    this.ribbon.dispose();
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

    // Create camera
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
    this.ribbon = new Ribbon3D(this.scene);

    // Handle resize
    window.addEventListener('resize', () => this.handleResize());

    // Start animation
    this.clock = new THREE.Clock();
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

    // Regenerate ribbon
    this.ribbon.dispose();
    this.ribbon = new Ribbon3D(this.scene);
  }

  animate() {
    const deltaTime = this.clock.getDelta() * 1000;

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

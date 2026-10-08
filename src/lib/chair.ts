import * as THREE from 'three';
import {
  findBase,
  findBaseColor,
  findBaseOn,
  findColor,
  type BaseOnOption,
  type BaseColorOption,
  type ChairConfig
} from './config';

const SEAT_HEIGHT = 0.43;
const SHELL_W = 0.5;
const SHELL_D = 0.5;

/** Parametric bucket-seat shell: squircle outline, bowl seat, curved back. */
function createShellGeometry(segments = 48): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const n = 4; // superellipse exponent

  for (let j = 0; j <= segments; j++) {
    for (let i = 0; i <= segments; i++) {
      const u = (i / segments) * 2 - 1; // left → right
      const v = (j / segments) * 2 - 1; // back → front

      // Map the square grid onto a rounded outline
      const m = Math.max(Math.abs(u), Math.abs(v));
      const r = Math.pow(Math.pow(Math.abs(u), n) + Math.pow(Math.abs(v), n), 1 / n) || 1;
      const k = m / r;
      const x = u * k;
      const z = v * k;

      const back = Math.max(0, (-z - 0.05) / 0.95); // 0 on seat → 1 at top of back
      const bowl = 0.03 * (x * x + z * z);
      const backRise = 0.34 * Math.pow(back, 1.7);
      const wrap = 0.06 * x * x * back; // back curls around the sitter
      const lean = 0.11 * Math.pow(back, 1.7);

      positions.push(
        x * (SHELL_W / 2),
        bowl + backRise + wrap,
        z * (SHELL_D / 2) - lean
      );
    }
  }

  const row = segments + 1;
  for (let j = 0; j < segments; j++) {
    for (let i = 0; i < segments; i++) {
      const a = j * row + i;
      const b = a + 1;
      const c = a + row;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

const UP = new THREE.Vector3(0, 1, 0);

function rodBetween(a: THREE.Vector3, b: THREE.Vector3, radius: number, mat: THREE.Material) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, dir.length(), 16), mat);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(UP, dir.clone().normalize());
  mesh.castShadow = true;
  return mesh;
}

/** Legs splay from under the shell to the floor. Returns the 4 foot points too. */
function legPoints() {
  const top = [
    new THREE.Vector3(-0.15, SEAT_HEIGHT - 0.01, 0.15),
    new THREE.Vector3(0.15, SEAT_HEIGHT - 0.01, 0.15),
    new THREE.Vector3(-0.15, SEAT_HEIGHT - 0.01, -0.12),
    new THREE.Vector3(0.15, SEAT_HEIGHT - 0.01, -0.12)
  ];
  const foot = top.map(
    (p) => new THREE.Vector3(p.x * 1.55, 0.005, p.z * 1.7 + (p.z < 0 ? -0.02 : 0.02))
  );
  return { top, foot };
}

function createBaseMaterial(finish: BaseColorOption): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: finish.hex,
    metalness: finish.metalness,
    roughness: finish.roughness
  });
}

function addGlides(
  group: THREE.Group,
  points: THREE.Vector3[],
  option: BaseOnOption
): void {
  const material = new THREE.MeshStandardMaterial({
    color: option.color,
    roughness: option.material === 'felt' ? 0.96 : 0.72
  });
  const height = option.material === 'felt' ? 0.012 : 0.02;
  const radius = option.material === 'felt' ? 0.022 : 0.018;
  const geometry = new THREE.CylinderGeometry(radius, radius * 1.08, height, 20);

  points.forEach((point) => {
    const glide = new THREE.Mesh(geometry, material);
    glide.position.set(point.x, height / 2, point.z);
    glide.castShadow = true;
    glide.receiveShadow = true;
    group.add(glide);
  });
}

function buildDowelBase(finish: BaseColorOption, glides: BaseOnOption): THREE.Group {
  const g = new THREE.Group();
  const wood = createBaseMaterial(finish);
  const wire =
    finish.id === 'natural'
      ? new THREE.MeshStandardMaterial({ color: 0xc9ccd0, metalness: 0.9, roughness: 0.25 })
      : createBaseMaterial(finish);
  const { top, foot } = legPoints();

  top.forEach((t, i) => g.add(rodBetween(foot[i], t, 0.017, wood)));

  // Wire cross brace between the legs
  const brace = foot.map((f) => f.clone().setY(0.17).lerp(new THREE.Vector3(0, 0.17, 0), 0.1));
  g.add(rodBetween(brace[0], brace[3], 0.004, wire), rodBetween(brace[1], brace[2], 0.004, wire));
  g.add(
    rodBetween(brace[0], brace[1], 0.004, wire),
    rodBetween(brace[2], brace[3], 0.004, wire),
    rodBetween(brace[0], brace[2], 0.004, wire),
    rodBetween(brace[1], brace[3], 0.004, wire)
  );
  addGlides(g, foot, glides);
  return g;
}

function buildEiffelBase(finish: BaseColorOption, glides: BaseOnOption): THREE.Group {
  const g = new THREE.Group();
  const chrome = createBaseMaterial(finish);
  const { top, foot } = legPoints();

  top.forEach((t, i) => g.add(rodBetween(foot[i], t, 0.006, chrome)));

  // Bottom rectangle + X brace under the seat
  const f = foot;
  [[0, 1], [2, 3], [0, 2], [1, 3]].forEach(([a, b]) => g.add(rodBetween(f[a], f[b], 0.005, chrome)));
  g.add(rodBetween(top[0], top[3], 0.005, chrome), rodBetween(top[1], top[2], 0.005, chrome));
  addGlides(g, foot, glides);
  return g;
}

function buildSledBase(finish: BaseColorOption, glides: BaseOnOption): THREE.Group {
  const g = new THREE.Group();
  const steel = createBaseMaterial(finish);

  for (const side of [-1, 1]) {
    const x = side * 0.2;
    const curve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(x, SEAT_HEIGHT - 0.02, 0.17),
        new THREE.Vector3(x, 0.2, 0.25),
        new THREE.Vector3(x, 0.02, 0.29),
        new THREE.Vector3(x, 0.012, 0.2),
        new THREE.Vector3(x, 0.012, -0.2),
        new THREE.Vector3(x, 0.02, -0.29),
        new THREE.Vector3(x, 0.2, -0.25),
        new THREE.Vector3(x, SEAT_HEIGHT - 0.02, -0.14)
      ],
      false,
      'catmullrom',
      0.2
    );
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.011, 12), steel);
    tube.castShadow = true;
    g.add(tube);
  }

  // Cross tubes
  g.add(
    rodBetween(new THREE.Vector3(-0.2, 0.28, 0.22), new THREE.Vector3(0.2, 0.28, 0.22), 0.01, steel),
    rodBetween(new THREE.Vector3(-0.2, 0.28, -0.2), new THREE.Vector3(0.2, 0.28, -0.2), 0.01, steel)
  );
  addGlides(
    g,
    [-0.2, 0.2].flatMap((x) => [
      new THREE.Vector3(x, 0, -0.2),
      new THREE.Vector3(x, 0, 0.2)
    ]),
    glides
  );
  return g;
}

export function buildChair(cfg: ChairConfig): THREE.Group {
  const chair = new THREE.Group();
  const shellColor = findColor(cfg.color);

  const shell = new THREE.Mesh(
    createShellGeometry(),
    new THREE.MeshPhysicalMaterial({
      color: shellColor.hex,
      roughness: 0.38,
      clearcoat: 0.35,
      clearcoatRoughness: 0.4,
      side: THREE.DoubleSide
    })
  );
  shell.position.y = SEAT_HEIGHT;
  shell.castShadow = true;
  shell.receiveShadow = true;
  chair.add(shell);

  if (cfg.shellStyle === 'armchair') {
    const armMaterial = new THREE.MeshPhysicalMaterial({
      color: shellColor.hex,
      roughness: 0.38,
      clearcoat: 0.35,
      clearcoatRoughness: 0.4
    });

    for (const side of [-1, 1]) {
      const armPath = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.205, SEAT_HEIGHT + 0.12, 0.14),
        new THREE.Vector3(side * 0.225, SEAT_HEIGHT + 0.2, 0.08),
        new THREE.Vector3(side * 0.235, SEAT_HEIGHT + 0.22, -0.12),
        new THREE.Vector3(side * 0.22, SEAT_HEIGHT + 0.2, -0.26)
      ]);
      const arm = new THREE.Mesh(new THREE.TubeGeometry(armPath, 32, 0.018, 12), armMaterial);
      arm.castShadow = true;
      arm.receiveShadow = true;
      chair.add(arm);

      chair.add(
        rodBetween(
          new THREE.Vector3(side * 0.205, SEAT_HEIGHT + 0.12, 0.14),
          new THREE.Vector3(side * 0.18, SEAT_HEIGHT + 0.015, 0.13),
          0.012,
          armMaterial
        ),
        rodBetween(
          new THREE.Vector3(side * 0.22, SEAT_HEIGHT + 0.2, -0.26),
          new THREE.Vector3(side * 0.17, SEAT_HEIGHT + 0.015, -0.2),
          0.012,
          armMaterial
        )
      );
    }
  }

  if (cfg.seatPad) {
    const pad = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 16),
      new THREE.MeshStandardMaterial({ color: 0x3b3f46, roughness: 0.95 })
    );
    pad.scale.set(0.19, 0.028, 0.19);
    pad.position.set(0, SEAT_HEIGHT + 0.03, 0.03);
    pad.castShadow = true;
    chair.add(pad);
  }

  const base = findBase(cfg.base).id;
  const baseColor = findBaseColor(cfg.baseColor);
  const baseOn = findBaseOn(cfg.baseOn);
  chair.add(
    base === 'dowel'
      ? buildDowelBase(baseColor, baseOn)
      : base === 'eiffel'
        ? buildEiffelBase(baseColor, baseOn)
        : buildSledBase(baseColor, baseOn)
  );

  return chair;
}

export function disposeObject(root: THREE.Object3D): void {
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m: THREE.Material) => m.dispose());
    }
  });
}

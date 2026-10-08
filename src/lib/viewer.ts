import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildChair, disposeObject } from './chair';
import type { ChairConfig } from './config';

export class ChairViewer {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  private controls: OrbitControls;
  private chair: THREE.Group | null = null;
  private observer: ResizeObserver;
  private frame = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    // Image-based lighting for believable plastic and chrome
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(1.5, 3, 2);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = key.shadow.camera.bottom = -1;
    key.shadow.camera.right = key.shadow.camera.top = 1;
    key.shadow.bias = -0.0005;
    this.scene.add(key);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.ShadowMaterial({ opacity: 0.22 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    this.camera.position.set(1.6, 1.1, 1.9);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.target.set(0, 0.42, 0);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.minDistance = 1.1;
    this.controls.maxDistance = 4;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
    this.controls.autoRotateSpeed = 1.2;

    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas.parentElement ?? canvas);
    this.resize();
    this.loop();
  }

  setConfig(cfg: ChairConfig): void {
    if (this.chair) {
      this.scene.remove(this.chair);
      disposeObject(this.chair);
    }
    this.chair = buildChair(cfg);
    this.scene.add(this.chair);
  }

  setAutoRotate(on: boolean): void {
    this.controls.autoRotate = on;
  }

  resetView(): void {
    this.camera.position.set(1.6, 1.1, 1.9);
    this.controls.target.set(0, 0.42, 0);
  }

  private resize(): void {
    const parent = this.canvas.parentElement ?? this.canvas;
    const { clientWidth: w, clientHeight: h } = parent;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private loop = (): void => {
    this.frame = requestAnimationFrame(this.loop);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  dispose(): void {
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    this.controls.dispose();
    if (this.chair) disposeObject(this.chair);
    this.renderer.dispose();
  }
}

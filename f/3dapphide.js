import * as THREE from "three";

const isMobile = () => window.innerWidth < 992;

function getSvh() {
  const testElement = document.createElement("div");
  testElement.style.height = "100lvh";
  testElement.style.position = "fixed";
  testElement.style.top = "0";
  testElement.style.visibility = "hidden";
  document.body.appendChild(testElement);
  const svhHeight = testElement.offsetHeight || window.innerHeight;
  document.body.removeChild(testElement);
  return svhHeight;
}

const init3dApp = () => {
  const POINTS_COUNT = 10000;
  const svhHeight = getSvh();

  function getSphereGeometry() {
    // Создаём BufferGeometry
    const geometry = new THREE.BufferGeometry();

    // Создаём атрибут позиций (3 значения на точку: x, y, z)
    const positions = new Float32Array(POINTS_COUNT * 3).fill(0); // Заполняем 0
    const indexes = new Float32Array(POINTS_COUNT).fill(0); // Заполняем 0

    for (let i = 0; i < POINTS_COUNT; i++) {
      indexes[i] = i;
    }

    // Перемешиваем индексы в случайном порядке
    for (let i = POINTS_COUNT - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
    }

    // Добавляем атрибут в геометрию
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("index", new THREE.BufferAttribute(indexes, 1));
    return geometry;
  }

  class GuiStub {
    constructor() {
      this.addFolder = () => this;
    }

    addColor() {
      return this;
    }

    add(key, value) {
      return this;
    }

    name() {
      return this;
    }

    hide() {
      return this;
    }

    addFolder() {
      return this;
    }

    onChange() {
      return this;
    }
  }

  const gui = new GuiStub();

  if (!window.location.hash.includes("debug")) {
    gui.hide();
  }

  const canvas = document.querySelector("#canvas");

  canvas.style.transform = "translateY(-50%)";
  canvas.style.transition = "transform 1s ease-in-out";

  const dpr = Math.min(window.devicePixelRatio * 2, 4);
  const width = (canvas.width = window.innerWidth * 1);
  const height = (canvas.height = svhHeight * 1);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    powerPreference: "high-performance"
  });

  const renderSettings = {
    dpr
  };

  renderer.setSize(width, height);
  renderer.autoClear = false;
  renderer.setPixelRatio(dpr);

  const renderGroup = gui.addFolder("Render");

  renderGroup
    .add(renderSettings, "dpr", 1, 4, 0.5)
    .name("Pixel ratio")
    .onChange((value) => {
      renderer.setPixelRatio(value);
    });

  const fpsCounterElement = document.createElement("div");

  fpsCounterElement.className = "controller number hasSlider";

  fpsCounterElement.textContent = "FPS: 0";

  // renderGroup.domElement.appendChild(fpsCounterElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x300504, 3, 12);

  // =====================
  // Uniforms for GUI
  // =====================
  const gu = {
    time: { value: 0 },
    planeToSphereMorph: { value: 0 },
    mouse: { value: [0, 0] },
    mouseAnimated: { value: [0, 0] },
    scrollY: { value: window.scrollY },
    light: { value: [0, 0, 0] },
    pointSize: { value: 0.04 },
    maxPointSize: { value: 1.1 },

    fresnelColor: { value: [0.945, 0.23, 0.053] },
    lightColor: { value: [0.99, 0.2, 0] },
    mouseLightColor: { value: [0.885, 0.528, 0.44] },
    sphereColor1: { value: [0.48, 0.095, 0] },
    sphereColor2: { value: [0.96, 0.645, 0.545] },
    waveColor: { value: [0.44, 0.66, 0.99] },
    noiseAmplitude: { value: 0.16 },
    noiseDensity: { value: 3.3 },
    timeScale: { value: 0.5 },
    blurPower: { value: 0.5 },
    sphereScale: { value: 1.39 },
    sphereScaleMobile: { value: 1 },
    sphereRotationLimit: { value: 0.1 },

    firstScreenAnimationTimeScale: { value: 1 }
  };

  const getAnimationBreakpoints = () => {
    const getElement = (element) => {
      if (!element) {
        return { element: null, top: 99999, bottom: 99999, height: 0 };
      }
      const rect = element.getBoundingClientRect();

      return {
        element,
        top: Math.floor(rect.top + window.scrollY),
        bottom: Math.floor(rect.bottom + window.scrollY - svhHeight),
        height: Math.floor(rect.height - svhHeight)
      };
    };

    const oneTwoTreeAnimElement = getElement(
      document.querySelector(".one-two-tree-nim")
    );
    const coverAnimElement = getElement(document.querySelector(".cover-anim"));
    const oneAnimElement = getElement(document.querySelector(".one-anim"));
    const twoAnimElement = getElement(document.querySelector(".two-anim"));
    const treeAnimElement = getElement(document.querySelector(".tree-anim"));
    const aboutAnimElement = getElement(document.querySelector(".about-anim"));

    const halfHeight = svhHeight / 2 - 100;

    const oneTwoTreeStart = oneTwoTreeAnimElement.top - 300 - halfHeight;
    const oneTwoTreeLength = oneTwoTreeAnimElement.height;

    const oneTwoTreeAnimationBlock = isMobile()
      ? [
          // sphere to two
          oneTwoTreeStart + oneTwoTreeLength * 0.6,
          oneTwoTreeStart + oneTwoTreeLength * 0.8,

          // two to three
          oneTwoTreeStart + oneTwoTreeLength * 1.3,
          oneTwoTreeStart + oneTwoTreeLength * 1.4,

          // three to one
          oneTwoTreeStart + oneTwoTreeLength * 2.0,
          oneTwoTreeStart + oneTwoTreeLength * 2.4
        ]
      : [
          // sphere to two
          oneAnimElement.top - 300 - halfHeight,
          twoAnimElement.top - halfHeight,

          // two to three
          treeAnimElement.top - halfHeight,
          treeAnimElement.top + 200 - halfHeight,

          // three to one
          treeAnimElement.top + 400 - halfHeight,
          treeAnimElement.top + 600 - halfHeight
        ];

    return new Float32Array([
      // plane to sphere
      coverAnimElement.top,
      coverAnimElement.bottom,

      ...oneTwoTreeAnimationBlock,

      // one to five
      aboutAnimElement.top - 100,
      aboutAnimElement.bottom - 200,

      // five to disappear
      aboutAnimElement.bottom + 1100,
      aboutAnimElement.bottom + 2800
    ]);
  };

  const sceneGroup = gui.addFolder("Scene");

  sceneGroup.addColor(gu.mouseLightColor, "value").name("mouseLightColor");

  sceneGroup
    .add(gu.firstScreenAnimationTimeScale, "value", 0.0, 2, 0.01)
    .name("Animation Time Scale");

  const sphereGroup = gui.addFolder("Sphere");

  sphereGroup.addColor(gu.sphereColor1, "value").name("color1");
  sphereGroup.addColor(gu.sphereColor2, "value").name("color2");
  sphereGroup.addColor(gu.fresnelColor, "value").name("colorOut");
  sphereGroup
    .add(gu.pointSize, "value", 0.01, 0.5, 0.01)
    .name("pointSize")
    .onChange((value) => {
      updatePointSize();
    });

  sphereGroup.add(gu.maxPointSize, "value", 0.0, 10, 0.1).name("blurAmount");
  sphereGroup
    .add(gu.noiseAmplitude, "value", 0.0, 1, 0.01)
    .name("noiseAmplitude");
  sphereGroup.add(gu.noiseDensity, "value", 0.0, 10, 0.1).name("noiseDensity");
  sphereGroup.add(gu.timeScale, "value", 0.0, 1, 0.01).name("timeScale");
  sphereGroup.add(gu.blurPower, "value", 0.0, 10, 0.1).name("blurPower");

  sphereGroup
    .add(gu.sphereScale, "value", 1, 2, 0.01)
    .name("scale")
    .onChange((value) => {
      spheres[0].sphere.scale.set(value, value, value);
    });

  sphereGroup
    .add(gu.sphereRotationLimit, "value", 0, 1, 0.01)
    .name("rotation Limit");

  const waveSettings = {
    color: { value: [0.945, 0.23, 0.052] },
    pointSize: { value: 0.04 },
    noiseAmplitude: { value: 0.9 },
    noiseDensity: { value: 2.6 },
    timeScale: { value: 2.24 }
  };

  const waveGroup = gui.addFolder("Wave");

  waveGroup.addColor(waveSettings.color, "value").name("color");
  waveGroup
    .add(waveSettings.pointSize, "value", 0.01, 0.5, 0.01)
    .name("pointSize")
    .onChange((value) => {
      updatePointSize();
    });

  waveGroup
    .add(waveSettings.noiseAmplitude, "value", 0.0, 4, 0.01)
    .name("Noise Amplitude");
  waveGroup
    .add(waveSettings.timeScale, "value", 0.0, 4, 0.01)
    .name("Time Scale");

  const objectDimensions = [25, 1, 7];
  const debugShader = { current: null };

  const animStops = {
    value: getAnimationBreakpoints()
  };

  class WobblingSphere extends THREE.Points {
    constructor() {
      const sphereGeometry = getSphereGeometry();

      const pointsMaterial = new THREE.PointsMaterial({
        size: 0.05,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending
      });

      super(sphereGeometry, pointsMaterial);

      const ratio = (objectDimensions[0] * 0.6) / objectDimensions[2];

      function findFactors(product, ratio) {
        const b = Math.sqrt(product / ratio);
        const a = product / b;
        return [a, b];
      }

      const [heightSegments, widthSegments] = findFactors(POINTS_COUNT, ratio);

      const planeGeometry = new THREE.PlaneGeometry(
        objectDimensions[0],
        objectDimensions[2],
        heightSegments,
        widthSegments
      )
        .rotateX(-Math.PI * 0.65)
        .translate(0, 1.8, 0);

      planeGeometry.computeTangents();

      sphereGeometry.setAttribute(
        "planePosition",
        planeGeometry.attributes.position
      );
      sphereGeometry.setAttribute("tangent", planeGeometry.attributes.tangent);

      this.uniforms = {
        fadeOutMaxSize: gu.maxPointSize,
        colorIn: gu.sphereColor1,
        colorCenter: gu.sphereColor2,
        colorOut: gu.fresnelColor,
        morph: gu.planeToSphereMorph,
        modelScale: { value: this.getScale() },
        mouse: gu.mouse,
        mouseAnimated: gu.mouseAnimated,
        light: gu.light,
        mouseLightColor: gu.mouseLightColor,
        radius: { value: 2 },
        noiseAmplitude: gu.noiseAmplitude,
        noiseDensity: gu.noiseDensity,
        objectSize: { value: objectDimensions },

        waveColor: waveSettings.color,
        waveNoiseAmplitude: waveSettings.noiseAmplitude,
        waveTimeScale: waveSettings.timeScale,

        timeScale: gu.timeScale,
        blurPower: gu.blurPower,
        subdivision: {
          value: [widthSegments, heightSegments]
        },

        animStops
      };

      this.material.onBeforeCompile = (shader) => {
        shader.uniforms.time = gu.time;

        shader.defines = {
          USE_TANGENT: "",
          SAMPLES: `${POINTS_COUNT}.0`
        };

        for (let key in this.uniforms) {
          shader.uniforms[key] = this.uniforms[key];
        }

        shader.vertexShader =
          document.querySelector("#vertexShader").textContent;

        shader.fragmentShader = `
                varying vec3 vColor;
                varying float fadeOut;
                varying vec3 vNormal;

                void main() {
                    float uvLen = length(gl_PointCoord.xy - 0.5);
                    if (fadeOut < 0.0 || uvLen > 0.5) discard;
                    vec4 diffuseColor = vec4( vColor, 1.0 );
                    
                    float fa = 1. - smoothstep(0.55, 1.0, uvLen);
                    float distanceFactor = 1. - smoothstep(0.989, 0.991, gl_FragCoord.z);

                    float alpha = fa * (0.25 + 0.75 * pow(fadeOut, 4.)) * distanceFactor;

                    diffuseColor *= alpha;
                    diffuseColor.a = distanceFactor;
                
                    gl_FragColor = diffuseColor;
                }
              `;

        debugShader.current = shader;
      };
    }

    getScale() {
      return isMobile() ? gu.sphereScaleMobile.value : gu.sphereScale.value;
    }
  }

  const updateSpheresRotation = () => {
    spheres.forEach((item, index) => {
      const { sphere } = item;
      const { clamp } = THREE.MathUtils;
      // Получаем позицию мыши в нормализованных координатах (-1..1)
      const mouseX = gu.mouseAnimated.value[0] / 10;
      const mouseY = -(gu.mouseAnimated.value[1] / 10);
      const ratio = window.innerWidth / svhHeight;

      // Плавное интерполирование
      const lerpFactor = clamp(gu.planeToSphereMorph.value / svhHeight, 0.2, 1);
      const rotationLimit = gu.sphereRotationLimit.value * lerpFactor;
      const maxAngle = Math.PI * rotationLimit;

      // Углы поворота (чувствительность можно регулировать коэффициентами)
      const targetRotationX = clamp(mouseY, -1, 1) * maxAngle;
      const targetRotationY = clamp(mouseX * ratio, -1, 1) * maxAngle;

      sphere.rotation.x +=
        (targetRotationX - sphere.rotation.x) * 0.2 * lerpFactor;
      sphere.rotation.y +=
        (targetRotationY - sphere.rotation.y) * 0.2 * lerpFactor;
    });
  };

  window.addEventListener("mousemove", (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 10;
    const y = -(e.clientY / svhHeight - 0.5) * 10;

    gu.mouse.value = [x, y];
  });

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / svhHeight,
    0.1,
    1000
  );
  camera.position.x = 0;
  camera.position.y = 0;
  camera.position.z = 7.5;

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / svhHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, svhHeight);

    animStops.value = getAnimationBreakpoints();
  });

  // =====================
  // Lights
  // =====================
  const lightsDebug = false;

  scene.add(new THREE.AmbientLight(0x222222, 0.5));
  const mouseLight = new THREE.PointLight(
    new THREE.Color(...gu.mouseLightColor.value),
    1.2,
    0
  );
  mouseLight.position.set(3, -3, 3);

  if (lightsDebug) {
    const keyLightDebug = new THREE.PointLightHelper(mouseLight, 0.1);
    scene.add(keyLightDebug);
  }

  scene.add(mouseLight);

  ///////////////////////
  // Spheres
  ///////////////////////

  const anim = { speed: 1.0 };
  const spheresCount = 1;
  const spheres = [];

  for (let i = 0; i < spheresCount; i++) {
    const sphere = new WobblingSphere(i);
    scene.add(sphere);

    spheres.push({
      sphere
    });
  }

  updateSpheresRotation();

  const updatePointSize = () => {
    const { lerp, clamp, smoothstep } = THREE.MathUtils;

    spheres.forEach((item, index) => {
      const { sphere } = item;

      sphere.material.size = lerp(
        waveSettings.pointSize.value,
        gu.pointSize.value,
        smoothstep(gu.planeToSphereMorph.value / svhHeight, 0.0, 0.2)
      );
    });
  };

  const updateMorph = () => {
    const animationValue = window.scrollY;
    gu.scrollY.value = window.scrollY;
    gu.planeToSphereMorph.value = animationValue;

    updatePointSize();

    spheres.forEach((item, index) => {
      const { sphere } = item;

      const scale = sphere.getScale();

      sphere.scale.set(scale, scale, scale);
    });

    if (isMobile()) {
      const canvasRoot = document.querySelector("#i6j0s7y68_0");
      const canvasRootRect = canvasRoot.getBoundingClientRect();

      const oneTwoThreeAnim = document.querySelector(".one-anim").parentElement;
      const oneTwoThreeAnimRect = oneTwoThreeAnim.getBoundingClientRect();

      const aboutAnim = document.querySelector("#igbr3psoe_0");
      const aboutAnimRect = aboutAnim.getBoundingClientRect();

      if (aboutAnimRect.top - window.innerHeight < window.innerHeight) {
        if (canvas.parentElement !== aboutAnim) {
          aboutAnim.appendChild(canvas);

          canvas.style.position = "absolute";
          canvas.style.top = `${Math.floor(-svhHeight * 0.1)}px`;
          canvas.style.left = `${-aboutAnimRect.left}px`;
        }
      } else if (oneTwoThreeAnimRect.top - window.innerHeight < window.innerHeight) {
        if (canvas.parentElement !== oneTwoThreeAnim) {
          oneTwoThreeAnim.appendChild(canvas);

          canvas.style.position = "absolute";
          canvas.style.top = `${Math.floor(svhHeight * 0.08)}px`;
          canvas.style.left = `${-oneTwoThreeAnimRect.left}px`;
        }
      } else {
        if (canvas.parentElement !== canvasRoot) {
          canvasRoot.appendChild(canvas);
        }
        
        canvas.style.position = "absolute";
        canvas.style.top = "-10svh";
        canvas.style.left = `${-canvasRootRect.left}px`;
      }
    }

    updateSpheresRotation();
  };

  updateMorph();

  window.addEventListener("scroll", updateMorph);

  let renderIsPaused = false;

  const clock = new THREE.Clock();
  function animate() {
    const delta = clock.getDelta(); // время в секундах с прошлого кадра
    gu.time.value += delta * anim.speed;
    requestAnimationFrame(animate);

    if (renderIsPaused) {
      return;
    }

    fpsCounterElement.textContent = `FPS: ${Math.round(1000 / delta / 1000)}`;

    // Рассчитываем максимальное изменение за этот кадр
    const maxDelta = 10 * delta;

    // Для каждой оси (X и Y)
    for (let i = 0; i < 2; i++) {
      const diff = gu.mouse.value[i] - gu.mouseAnimated.value[i];

      // Если разница больше максимального изменения
      if (Math.abs(diff) > maxDelta) {
        // Двигаемся к цели с максимальной скоростью
        gu.mouseAnimated.value[i] += Math.sign(diff) * maxDelta;
      } else {
        // Иначе просто достигаем цели
        gu.mouseAnimated.value[i] = gu.mouse.value[i];
      }
    }

    const lightZ = -3.5;

    mouseLight.position.set(...gu.mouseAnimated.value, lightZ);
    gu.light.value = [...gu.mouseAnimated.value, lightZ];

    updateSpheresRotation();

    renderer.render(scene, camera);
  }

  renderer.compileAsync(scene, camera).then(() => {
    animate();

    requestAnimationFrame(() => {
      canvas.style.transform = "translateY(0)";
    });
  });

  // Ждём появления .stage в области видимости
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        renderIsPaused = true;
        canvas.style.display = 'none';
      } else {
        renderIsPaused = false;
        canvas.style.display = 'block';
      }
    });
  }, { threshold: 0.1 });

  const matterJsStage = document.querySelector('.stage');
  if (matterJsStage) {
    observer.observe(matterJsStage);
  }
};

window.requestIdleCallback = window.requestIdleCallback || setTimeout;

setTimeout(
  () => {
    window.requestIdleCallback(
      () => {
        init3dApp();
      },
      { timeout: 5000 }
    );
  },
  3000
);

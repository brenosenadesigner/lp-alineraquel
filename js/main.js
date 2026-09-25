/**
 * ALINE RAQUEL - PSICOLOGIA CLÍNICA
 * INTERAÇÕES & COMPORTAMENTOS (CRO, ACESSIBILIDADE, FAQ ACCORDION E STICKY STACK)
 */

document.addEventListener('DOMContentLoaded', () => {
  initFaqAccordion();
  initSmoothScroll();
  initStickyStackMobile();
  initCardsReveal();
  initApproachShader();
  initExpandingCards();
  initJourneySteps();
});

/* 1. Acordeão de FAQ Acessível e Suave */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach((item, index) => {
    const trigger = item.querySelector('.faq-trigger');
    const panel = item.querySelector('.faq-content-panel');

    if (!trigger || !panel) return;

    // Acessibilidade ARIA
    const triggerId = `faq-trigger-${index + 1}`;
    const panelId = `faq-panel-${index + 1}`;
    trigger.id = triggerId;
    trigger.setAttribute('aria-controls', panelId);
    panel.id = panelId;
    panel.setAttribute('aria-labelledby', triggerId);
    panel.setAttribute('role', 'region');

    // Abre o primeiro item por padrão para engajamento visual
    if (index === 0) {
      item.classList.add('active');
      trigger.setAttribute('aria-expanded', 'true');
      panel.style.maxHeight = panel.scrollHeight + 'px';
    } else {
      trigger.setAttribute('aria-expanded', 'false');
    }

    trigger.addEventListener('click', () => {
      const isExpanded = item.classList.contains('active');

      // Fecha outros itens para foco visual refinado
      faqItems.forEach(otherItem => {
        if (otherItem !== item && otherItem.classList.contains('active')) {
          otherItem.classList.remove('active');
          const otherTrigger = otherItem.querySelector('.faq-trigger');
          const otherPanel = otherItem.querySelector('.faq-content-panel');
          if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
          if (otherPanel) otherPanel.style.maxHeight = '0';
        }
      });

      // Alterna o estado do item clicado
      if (isExpanded) {
        item.classList.remove('active');
        trigger.setAttribute('aria-expanded', 'false');
        panel.style.maxHeight = '0';
      } else {
        item.classList.add('active');
        trigger.setAttribute('aria-expanded', 'true');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });
}

/* 2. Rolagem Suave para Âncoras */
function initSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId === '#' || !targetId.startsWith('#')) return;

      const targetEl = document.querySelector(targetId);
      if (!targetEl) return;

      e.preventDefault();
      const targetPosition = targetEl.getBoundingClientRect().top + window.pageYOffset - 20;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    });
  });
}

/* 3. Efeito de Empilhamento e Inclinação GSAP nos Cards da Dobra 2 (Mobile Apenas) */
function initStickyStackMobile() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  // 1. Registra o ScrollTrigger no GSAP
  gsap.registerPlugin(ScrollTrigger);

  const mm = gsap.matchMedia();

  // Executa estritamente na versão mobile (<= 768px)
  mm.add("(max-width: 768px)", () => {
    // 2. Parâmetros configuráveis
    const TILT_ANGLE = 4.5; // Graus de inclinação alternada (+/-)
    const cards = gsap.utils.toArray('#stackPinTarget .card-item');
    if (!cards.length) return;

    // 3. Define o posicionamento inicial dos cards
    cards.forEach((card, index) => {
      if (index === 0) {
        // O primeiro card já nasce visível e no centro
        gsap.set(card, {
          yPercent: 0,
          rotation: 0,
          scale: 1,
          zIndex: index + 1,
          clearProps: 'filter'
        });
      } else {
        // Os cards seguintes começam ocultos abaixo da tela
        gsap.set(card, {
          yPercent: 180,
          rotation: 0,
          scale: 0.95,
          zIndex: index + 1,
          clearProps: 'filter'
        });
      }
    });

    // 4. Cria a Timeline sincronizada com o Scroll
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#stackPinTarget',
        start: 'top top',
        end: () => `+=${window.innerHeight * (cards.length - 1) * 1.2}`,
        pin: true,
        scrub: 1.2,
        anticipatePin: 1
      }
    });

    // 5. Encadeia a animação para cada card a partir do segundo
    cards.slice(1).forEach((card, i) => {
      const cardIndex = i + 1; // Índice real do card no array original

      // Momento em que o card atual entra na tela
      tl.to(card, {
        yPercent: 0,
        scale: 1,
        duration: 1,
        ease: 'power2.out'
      });

      // Ao mesmo tempo, atualiza a pilha anterior (inclinação, escala e recuo, sem escurecer o conteúdo)
      for (let prev = 0; prev < cardIndex; prev++) {
        const depth = cardIndex - prev;
        // Alterna a direção da rotação (+ ou -) para efeito de leque sutil
        const rotationDirection = prev % 2 === 0 ? -1 : 1;

        tl.to(
          cards[prev],
          {
            rotation: rotationDirection * TILT_ANGLE,
            scale: Math.max(0.85, 1 - depth * 0.045),
            y: -(depth * 16),
            duration: 1,
            ease: 'power2.out'
          },
          '<' // Executa simultaneamente com a entrada do card
        );
      }
    });
  });
}

/* 4. Efeito Card Reveal com GSAP na Dobra 3 (Desktop Lateral Discard & Mobile Vertical Reveal) */
function initCardsReveal() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  const mm = gsap.matchMedia();

  // =========================================================================
  // VERSÃO DESKTOP (min-width: 769px): Descarte Lateral Alternado + 3D Tilt + Stepper
  // =========================================================================
  mm.add("(min-width: 769px)", () => {
    const sectionEl = document.querySelector('#especialidades');
    const container = document.querySelector('#especialidades .specialties-grid');
    const cards = gsap.utils.toArray('#especialidades .specialty-card');
    const steps = gsap.utils.toArray('#especialidades .step-pill');
    const totalCards = cards.length;

    if (!sectionEl || !container || totalCards < 2) return;

    // Estado inicial: empilha os cards com profundidade decrescente e 100% de opacidade
    cards.forEach((card, i) => {
      gsap.set(card, {
        zIndex: (totalCards - i) * 10,
        scale: i === 0 ? 1 : 0.94,
        xPercent: 0,
        yPercent: 0,
        rotationZ: 0,
        rotationY: 0,
        rotationX: 0,
        filter: i === 0 ? 'brightness(1) blur(0px)' : 'brightness(0.7) blur(0.5px)',
        opacity: 1,
        transformOrigin: 'center center',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        pointerEvents: 'auto'
      });
    });

    // Reset dos steps
    steps.forEach((step, idx) => {
      step.classList.toggle('active', idx === 0);
    });

    // Timeline principal com ScrollTrigger acoplado à seção
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionEl,
        start: 'top top',
        end: '+=' + ((totalCards - 1) * 800),
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        onUpdate: (self) => {
          const stepIndex = Math.min(
            Math.floor(self.progress * totalCards),
            totalCards - 1
          );
          steps.forEach((step, idx) => {
            step.classList.toggle('active', idx === stepIndex);
          });
        }
      }
    });

    // Anima a saída de cada card revelando o próximo
    for (let i = 0; i < totalCards - 1; i++) {
      const currentCard = cards[i];
      const nextCard = cards[i + 1];
      const direction = (i % 2 === 0) ? 1 : -1;

      // Card atual é descartado lateralmente de forma alternada mantendo 100% de opacidade
      tl.to(currentCard, {
        xPercent: 145 * direction,
        yPercent: -10,
        rotationZ: 14 * direction,
        rotationY: -10 * direction,
        ease: 'power2.inOut',
        duration: 1
      });

      // Próximo card ganha escala total, sobe e remove blur/escurecimento
      tl.to(nextCard, {
        scale: 1,
        yPercent: 0,
        filter: 'brightness(1) blur(0px)',
        ease: 'power2.out',
        duration: 0.8
      }, '<+=0.2');
    }

    // Efeito sutil de inclinação 3D ao passar o mouse
    const onMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      const activeCard = cards.find(c => {
        const xPercent = gsap.getProperty(c, 'xPercent');
        return Math.abs(xPercent) < 20;
      });

      if (activeCard) {
        gsap.to(activeCard, {
          rotationY: x * 12,
          rotationX: -y * 12,
          ease: 'power1.out',
          duration: 0.5
        });
      }
    };

    const onMouseLeave = () => {
      cards.forEach(card => {
        const xPercent = gsap.getProperty(card, 'xPercent');
        if (Math.abs(xPercent) < 20) {
          gsap.to(card, {
            rotationY: 0,
            rotationX: 0,
            ease: 'power2.out',
            duration: 0.6
          });
        }
      });
    };

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseleave', onMouseLeave);

    return () => {
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseleave', onMouseLeave);
      cards.forEach(card => {
        gsap.set(card, { clearProps: 'all' });
      });
      steps.forEach((step, idx) => {
        step.classList.toggle('active', idx === 0);
      });
    };
  });

  // =========================================================================
  // VERSÃO MOBILE (max-width: 768px): Revelação Vertical de Cards com Pinning
  // =========================================================================
  mm.add("(max-width: 768px)", () => {
    const sectionEl = document.querySelector('#especialidades');
    const cards = gsap.utils.toArray('#especialidades .specialty-card');

    if (!sectionEl || cards.length < 2) return;

    // Configuração dos z-indexes e estados iniciais dos cards
    cards.forEach((card, index) => {
      const zIndex = (cards.length - index) * 10;
      gsap.set(card, {
        zIndex: zIndex,
        transformOrigin: 'center bottom',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden'
      });

      if (index === 0) {
        gsap.set(card, {
          opacity: 1,
          scale: 1,
          yPercent: 0,
          rotationZ: 0,
          rotationX: 0,
          filter: 'brightness(1) blur(0px)',
          pointerEvents: 'auto',
          willChange: 'transform'
        });
      } else {
        const depth = index;
        gsap.set(card, {
          scale: Math.max(0.85, 1 - depth * 0.05),
          yPercent: depth * 2.5,
          filter: `brightness(${Math.max(0.6, 1 - depth * 0.15)}) blur(${depth * 0.4}px)`,
          pointerEvents: 'none',
          willChange: 'transform, filter'
        });
      }
    });

    // Timeline acoplada ao ScrollTrigger com pinning da seção
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionEl,
        start: 'top top',
        end: `+=${cards.length * 600}`,
        pin: true,
        scrub: 1,
        anticipatePin: 1
      }
    });

    // Animação de revelação sequencial entre os cards
    cards.forEach((card, index) => {
      if (index === cards.length - 1) return;

      const nextCard = cards[index + 1];
      const rotationDir = index % 2 === 0 ? -5 : 5;

      // Card atual sobe com inclinação 3D orgânica mantendo 100% de opacidade
      tl.to(card, {
        yPercent: -130,
        rotationZ: rotationDir,
        rotationX: 12,
        scale: 1.02,
        opacity: 1,
        ease: 'power1.inOut'
      });

      // Próximo card ganha foco, nitidez e escala completa
      tl.to(nextCard, {
        scale: 1,
        yPercent: 0,
        filter: 'brightness(1) blur(0px)',
        pointerEvents: 'auto',
        ease: 'power1.inOut'
      }, '<');

      // Cards seguintes avançam na profundidade visual
      for (let j = index + 2; j < cards.length; j++) {
        const deeperCard = cards[j];
        const newDepth = j - index - 1;
        tl.to(deeperCard, {
          scale: Math.max(0.85, 1 - newDepth * 0.05),
          yPercent: newDepth * 2.5,
          filter: `brightness(${Math.max(0.6, 1 - newDepth * 0.15)}) blur(${newDepth * 0.4}px)`,
          ease: 'power1.inOut'
        }, '<');
      }
    });

    return () => {
      // Limpeza de propriedades ao alternar para desktop
      cards.forEach(card => {
        gsap.set(card, { clearProps: 'all' });
      });
    };
  });
}

/* 5. Fundo Animado Flow Field Shader (WebGL) na Dobra 4 (Abordagem Clínica) */
function initApproachShader() {
  const canvas = document.getElementById('approach-shader-canvas');
  if (!canvas) return;

  const section = document.getElementById('metodo') || document.getElementById('servicos') || document.getElementById('abordagem');
  const gl = canvas.getContext('webgl', { antialias: false, alpha: true });
  if (!gl) return;

  const VERT = `attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

  const FRAG = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec3 u_colors[8];
uniform vec4 u_scene;
uniform vec4 u_shape;
uniform vec4 u_surface;
uniform vec4 u_finish;
uniform vec4 u_transform;
uniform vec4 u_space;
uniform vec4 u_cursor;

#define u_resolution u_scene.xy
#define u_time u_scene.z
#define u_colorCount u_scene.w
#define u_scale u_shape.x
#define u_intensity u_shape.y
#define u_paramA u_shape.z
#define u_warp u_shape.w
#define u_detail u_surface.x
#define u_contrast u_surface.y
#define u_brightness u_surface.z
#define u_saturation u_surface.w
#define u_hue u_finish.x
#define u_vignette u_finish.y
#define u_blur u_finish.z
#define u_grain u_finish.w
#ifdef GL_FRAGMENT_PRECISION_HIGH
#define u_seed u_transform.x
#else
#define u_seed mod(u_transform.x, 31.0)
#endif
#define u_rotate u_transform.y
#define u_drift u_transform.z
#define u_oklab u_transform.w
#define u_offset u_space.xy
#define u_mouse u_space.zw
#define u_cursorPresence u_cursor.x
#define u_cursorEffect u_cursor.y
#define u_cursorStrength u_cursor.z
#define u_cursorRadius u_cursor.w

float hash21(vec2 p) {
#ifndef GL_FRAGMENT_PRECISION_HIGH
  p = mod(p, 31.0);
#endif
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float grainHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
#ifndef GL_FRAGMENT_PRECISION_HIGH
  p = mod(p, 31.0);
#endif
  float n = sin(dot(p, vec2(41.0, 289.0)));
  return fract(vec2(15731.743, 7892.321) * n);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
    u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(17.0, 9.2);
    a *= 0.5;
  }
  return v;
}

vec3 srgbToLinear(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)),
    step(0.04045, c));
}
vec3 linearToSrgb(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055,
    step(0.0031308, c));
}
vec3 linToOklab(vec3 c) {
  float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
  float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
  float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;
  l = pow(max(l, 0.0), 1.0 / 3.0);
  m = pow(max(m, 0.0), 1.0 / 3.0);
  s = pow(max(s, 0.0), 1.0 / 3.0);
  return vec3(
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s);
}
vec3 oklabToLin(vec3 c) {
  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  l = l * l * l; m = m * m * m; s = s * s * s;
  return vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
}
vec3 mixColour(vec3 a, vec3 b, float t) {
  if (u_oklab > 0.5) {
    vec3 la = linToOklab(srgbToLinear(a));
    vec3 lb = linToOklab(srgbToLinear(b));
    return clamp(linearToSrgb(oklabToLin(mix(la, lb, t))), 0.0, 1.0);
  }
  return mix(a, b, t);
}

vec3 palette(float x) {
  float n = max(u_colorCount - 1.0, 1.0);
  float f = clamp(x, 0.0, 1.0) * n;
  vec3 col = u_colors[0];
  for (int i = 0; i < 7; i++) {
    if (float(i) < n)
      col = mixColour(col, u_colors[i + 1],
        smoothstep(0.0, 1.0, clamp(f - float(i), 0.0, 1.0)));
  }
  return col;
}

vec3 hueRotate(vec3 col, float a) {
  const mat3 toYIQ = mat3(0.299, 0.596, 0.211,
                          0.587, -0.274, -0.523,
                          0.114, -0.322, 0.312);
  const mat3 toRGB = mat3(1.0, 1.0, 1.0,
                          0.956, -0.272, -1.106,
                          0.621, -0.647, 1.703);
  vec3 yiq = toYIQ * col;
  float ca = cos(a), sa = sin(a);
  yiq = vec3(yiq.x, yiq.y * ca - yiq.z * sa, yiq.y * sa + yiq.z * ca);
  return toRGB * yiq;
}

vec3 shade(vec2 uv, vec2 p, float t) {
  float a = fbm(p * 2.0 + u_seed) * 6.2831;
  vec2 dir = vec2(cos(a), sin(a));
  float v = fbm(p * 3.0 + dir * (u_intensity * 2.0) + t * 0.12);
  return palette(v);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 screenUv = uv;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy)
    / min(u_resolution.x, u_resolution.y);
  float cursorMask = 0.0;

  if (u_cursorPresence > 0.001) {
    vec2 cursor = (0.5 * u_mouse * u_resolution.xy)
      / min(u_resolution.x, u_resolution.y);
    vec2 cursorDelta = p - cursor;
    if (u_cursorEffect < 0.5) {
      p += cursor * u_cursorPresence * u_cursorStrength * 0.55;
    } else {
      float cursorDistance = length(cursorDelta);
      vec2 cursorDirection = cursorDelta / max(cursorDistance, 0.0001);
      cursorMask = u_cursorPresence
        * (1.0 - smoothstep(0.0, u_cursorRadius, cursorDistance));
      if (u_cursorEffect < 1.5) {
        p -= cursorDirection * cursorMask * u_cursorStrength * 0.24;
      } else if (u_cursorEffect < 2.5) {
        float cursorAngle = cursorMask * u_cursorStrength * 2.2;
        float cc = cos(cursorAngle), cs = sin(cursorAngle);
        p = cursor + mat2(cc, -cs, cs, cc) * cursorDelta;
      } else if (u_cursorEffect < 3.5) {
        float ripple = sin(
          cursorDistance / max(u_cursorRadius, 0.001) * 18.0 - u_time * 5.0);
        p -= cursorDirection * ripple * cursorMask * u_cursorStrength * 0.07;
      }
    }
  }

  uv = p * min(u_resolution.x, u_resolution.y) / u_resolution.xy + 0.5;
  p *= u_scale;
  if (abs(u_rotate) > 0.0001) {
    float cr = cos(u_rotate), sr = sin(u_rotate);
    p = mat2(cr, -sr, sr, cr) * p;
  }
  p += u_offset;
  if (u_drift > 0.0001)
    p += u_drift * vec2(sin(u_time * 0.31), cos(u_time * 0.23));
  if (u_warp > 0.0) {
    p += u_warp * (vec2(
      fbm(p * u_detail + u_seed),
      fbm(p * u_detail + vec2(5.2, 1.3))) - 0.5);
  }
  vec3 col;
  if (u_blur > 0.0) {
    float e = u_blur;
    float pe = e * u_scale;
    vec2 uvE = vec2(e) * min(u_resolution.x, u_resolution.y) / u_resolution.xy;
    col  = shade(uv, p, u_time) * 0.36;
    col += shade(uv + vec2(uvE.x, 0.0), p + vec2(pe, 0.0), u_time) * 0.16;
    col += shade(uv - vec2(uvE.x, 0.0), p - vec2(pe, 0.0), u_time) * 0.16;
    col += shade(uv + vec2(0.0, uvE.y), p + vec2(pe, 0.0), u_time) * 0.16;
    col += shade(uv - vec2(0.0, uvE.y), p - vec2(pe, 0.0), u_time) * 0.16;
  } else {
    col = shade(uv, p, u_time);
  }
  if (abs(u_contrast - 1.0) > 0.0001)
    col = (col - 0.5) * u_contrast + 0.5;
  if (abs(u_saturation - 1.0) > 0.0001) {
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(luma), col, u_saturation);
  }
  if (abs(u_hue) > 0.0001)
    col = hueRotate(col, u_hue);
  if (abs(u_brightness) > 0.0001)
    col += u_brightness;
  if (u_vignette > 0.0001) {
    float vd = length(screenUv - 0.5) * 1.41421356;
    col *= 1.0 - u_vignette * smoothstep(0.35, 1.0, vd);
  }
  if (u_cursorPresence > 0.001 && u_cursorEffect > 3.5)
    col += (vec3(0.18) + col * 0.12) * cursorMask * u_cursorStrength;
  if (u_grain > 0.0001)
    col += (grainHash(
      gl_FragCoord.xy + vec2(u_seed * 17.0, u_seed * 31.0)) - 0.5) * u_grain;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

  // Paleta oficial de Aline Raquel: Fundo Claro (#FAF7F2), Café Profundo (#2C2523), Terracota Café (#7A4E38) e Azul Serenidade (#8BA4B5)
  const UNIFORMS = {
    colors: [
      0.173, 0.145, 0.137, // #2C2523 - Café Profundo
      0.478, 0.306, 0.220, // #7A4E38 - Terracota Café
      0.545, 0.643, 0.710, // #8BA4B5 - Azul Serenidade
      0.980, 0.969, 0.949, // #FAF7F2 - Fundo Claro Oficial
      0.478, 0.306, 0.220, // #7A4E38 - Terracota Café
      0.545, 0.643, 0.710, // #8BA4B5 - Azul Serenidade
      0.173, 0.145, 0.137, // #2C2523 - Café Profundo
      0.478, 0.306, 0.220  // #7A4E38 - Terracota Café
    ],
    colorCount: 5,
    scale: 1.480,
    intensity: 0.390,
    paramA: 0.570,
    warp: 0.240,
    detail: 2.112,
    contrast: 1.185,
    brightness: 0.070,
    saturation: 1.540,
    hue: 0.0,
    vignette: 0.360,
    blur: 0.0048,
    grain: 0.021,
    seed: 8379.0,
    rotate: 5.0091,
    offsetX: -0.020,
    offsetY: 0.150,
    drift: 0.060,
    cursorEnabled: true,
    cursorEffect: 4.0,
    cursorStrength: 0.660,
    cursorRadius: 0.650,
    oklab: 0.0,
    timeScale: -1.278,
  };

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };

  const program = gl.createProgram();
  const vertexShader = compile(gl.VERTEX_SHADER, VERT);
  const fragmentShader = compile(gl.FRAGMENT_SHADER, FRAG);
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  gl.useProgram(program);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW
  );
  const loc = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uni = {
    colors: gl.getUniformLocation(program, "u_colors"),
    scene: gl.getUniformLocation(program, "u_scene"),
    shape: gl.getUniformLocation(program, "u_shape"),
    surface: gl.getUniformLocation(program, "u_surface"),
    finish: gl.getUniformLocation(program, "u_finish"),
    transform: gl.getUniformLocation(program, "u_transform"),
    space: gl.getUniformLocation(program, "u_space"),
    cursor: gl.getUniformLocation(program, "u_cursor"),
  };

  gl.uniform3fv(uni.colors, new Float32Array(UNIFORMS.colors));
  gl.uniform4f(
    uni.shape,
    UNIFORMS.scale,
    UNIFORMS.intensity,
    UNIFORMS.paramA,
    UNIFORMS.warp
  );
  gl.uniform4f(
    uni.surface,
    UNIFORMS.detail,
    UNIFORMS.contrast,
    UNIFORMS.brightness,
    UNIFORMS.saturation
  );
  gl.uniform4f(
    uni.finish,
    UNIFORMS.hue,
    UNIFORMS.vignette,
    UNIFORMS.blur,
    UNIFORMS.grain
  );
  gl.uniform4f(
    uni.transform,
    UNIFORMS.seed,
    UNIFORMS.rotate,
    UNIFORMS.drift,
    UNIFORMS.oklab
  );
  gl.uniform4f(
    uni.cursor,
    0,
    UNIFORMS.cursorEffect,
    UNIFORMS.cursorStrength,
    UNIFORMS.cursorRadius
  );

  let targetX = 0;
  let targetY = 0;
  let targetPresence = 0;
  let mouseX = 0;
  let mouseY = 0;
  let cursorPresence = 0;
  let pointerKnown = false;
  let pointerClientX = 0;
  let pointerClientY = 0;
  let bounds = canvas.getBoundingClientRect();
  let raf = 0;
  let lastNow = null;
  let visible = document.visibilityState === "visible";
  let inView = true;
  let disposed = false;
  const start = performance.now();
  const timeAnimated = Math.abs(UNIFORMS.timeScale) > 0.0001;

  const resizeCanvas = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rawWidth = Math.max(1, Math.round(bounds.width * dpr));
    const rawHeight = Math.max(1, Math.round(bounds.height * dpr));
    const pixelScale = Math.min(
      1,
      Math.sqrt(2000000 / Math.max(1, rawWidth * rawHeight))
    );
    const width = Math.max(1, Math.round(rawWidth * pixelScale));
    const height = Math.max(1, Math.round(rawHeight * pixelScale));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  };

  function requestRender() {
    if (!disposed && visible && inView && raf === 0) {
      raf = requestAnimationFrame(render);
    }
  }

  const updatePointerTarget = () => {
    if (!pointerKnown) return;
    if (bounds.width === 0 || bounds.height === 0) return;
    const inside =
      pointerClientX >= bounds.left &&
      pointerClientX <= bounds.right &&
      pointerClientY >= bounds.top &&
      pointerClientY <= bounds.bottom;
    if (!inside) {
      targetPresence = 0;
      requestRender();
      return;
    }
    const nextX = ((pointerClientX - bounds.left) / bounds.width) * 2 - 1;
    const nextY = -(((pointerClientY - bounds.top) / bounds.height) * 2 - 1);
    if (targetPresence === 0 && cursorPresence < 0.01) {
      mouseX = nextX;
      mouseY = nextY;
    }
    targetX = nextX;
    targetY = nextY;
    targetPresence = 1;
    requestRender();
  };

  const onPointerMove = (event) => {
    pointerKnown = true;
    pointerClientX = event.clientX;
    pointerClientY = event.clientY;
    bounds = canvas.getBoundingClientRect();
    updatePointerTarget();
  };

  const onPointerLeave = () => {
    pointerKnown = false;
    targetPresence = 0;
    requestRender();
  };

  const updateLayout = () => {
    bounds = canvas.getBoundingClientRect();
    resizeCanvas();
    updatePointerTarget();
    requestRender();
  };

  window.addEventListener("resize", updateLayout, { passive: true });
  if (UNIFORMS.cursorEnabled && section) {
    section.addEventListener("pointermove", onPointerMove, { passive: true });
    section.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("scroll", updateLayout, { passive: true });
  }

  if (typeof ResizeObserver !== "undefined") {
    const resizeObserver = new ResizeObserver(updateLayout);
    resizeObserver.observe(canvas);
  }

  if (typeof IntersectionObserver !== "undefined") {
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      inView = entry?.isIntersecting ?? true;
      if (inView) requestRender();
      else if (raf !== 0) {
        cancelAnimationFrame(raf)
        raf = 0;
        lastNow = null;
      }
    });
    intersectionObserver.observe(canvas);
  }

  document.addEventListener("visibilitychange", () => {
    visible = document.visibilityState === "visible";
    if (visible) requestRender();
    else if (raf !== 0) {
      cancelAnimationFrame(raf);
      raf = 0;
      lastNow = null;
    }
  });

  function render(now) {
    raf = 0;
    if (disposed || !visible || !inView) return;
    const dt = lastNow === null ? 0 : Math.min((now - lastNow) / 1000, 0.1);
    lastNow = now;
    const follow = 1 - Math.exp(-12 * dt);
    mouseX += (targetX - mouseX) * follow;
    mouseY += (targetY - mouseY) * follow;
    cursorPresence += (targetPresence - cursorPresence) * follow;
    resizeCanvas();
    const width = canvas.width;
    const height = canvas.height;
    gl.uniform4f(
      uni.scene,
      width,
      height,
      ((now - start) / 1000) * UNIFORMS.timeScale,
      UNIFORMS.colorCount
    );
    gl.uniform4f(
      uni.space,
      UNIFORMS.offsetX,
      UNIFORMS.offsetY,
      mouseX,
      mouseY
    );
    gl.uniform4f(
      uni.cursor,
      UNIFORMS.cursorEnabled ? cursorPresence : 0,
      UNIFORMS.cursorEffect,
      UNIFORMS.cursorStrength,
      UNIFORMS.cursorRadius
    );
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    const pointerSettling =
      Math.abs(targetX - mouseX) > 0.001 ||
      Math.abs(targetY - mouseY) > 0.001 ||
      Math.abs(targetPresence - cursorPresence) > 0.001;
    if (timeAnimated || pointerSettling) requestRender();
    else lastNow = null;
  }

  updateLayout();
  requestRender();
}

/* 6. Modalidades - Expanding Cards Interactivity (Hover no Desktop & Scroll no Mobile) */
function initExpandingCards() {
  const container = document.querySelector('[data-expanding-cards]');
  if (!container) return;

  const cards = container.querySelectorAll('[data-card]');
  if (cards.length < 2) return;

  // 1. DESKTOP: Expandir cards ao passar o mouse (hover / mouseenter)
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      if (window.innerWidth <= 768) return;
      if (card.classList.contains('is-active')) return;
      cards.forEach(c => c.classList.remove('is-active'));
      card.classList.add('is-active');
    });

    // Foco via teclado para total acessibilidade
    card.addEventListener('focusin', () => {
      if (window.innerWidth <= 768) return;
      if (card.classList.contains('is-active')) return;
      cards.forEach(c => c.classList.remove('is-active'));
      card.classList.add('is-active');
    });

    // Clique de suporte (preservando o link de CTA sem colapso)
    card.addEventListener('click', (e) => {
      if (e.target.closest('.exp-cta')) return;
      if (card.classList.contains('is-active')) return;
      cards.forEach(c => c.classList.remove('is-active'));
      card.classList.add('is-active');
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.target.closest('.exp-cta')) return;
        e.preventDefault();
        cards.forEach(c => c.classList.remove('is-active'));
        card.classList.add('is-active');
      }
    });
  });

  // 2. MOBILE: Cards expandem conforme a rolagem da página
  let isMobileTicking = false;

  function updateMobileOnScroll() {
    if (window.innerWidth > 768) return;

    const card1 = cards[0];
    const card2 = cards[1];
    const rect2 = card2.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;

    // Se o contêiner estiver completamente fora de visualização, não processa
    const containerRect = container.getBoundingClientRect();
    if (containerRect.bottom < 0 || containerRect.top > vh) return;

    // Histerese suave baseada na posição do Card 2 na viewport:
    // - Descendo: quando o Card 2 atinge 58% da altura da tela, ativa Card 2
    // - Subindo: quando o Card 2 recua para além de 42% da altura da tela, restaura Card 1
    const thresholdDown = vh * 0.58;
    const thresholdUp = vh * 0.42;

    if (rect2.top <= thresholdDown) {
      if (!card2.classList.contains('is-active')) {
        card1.classList.remove('is-active');
        card2.classList.add('is-active');
      }
    } else if (rect2.top >= thresholdUp) {
      if (!card1.classList.contains('is-active')) {
        card2.classList.remove('is-active');
        card1.classList.add('is-active');
      }
    }
  }

  window.addEventListener('scroll', () => {
    if (!isMobileTicking) {
      window.requestAnimationFrame(() => {
        updateMobileOnScroll();
        isMobileTicking = false;
      });
      isMobileTicking = true;
    }
  }, { passive: true });

  // Executa uma vez no início caso o usuário já carregue a página rolada
  updateMobileOnScroll();
}

/* 7. Linha SVG de Jornada Progressiva com Cards Emergentes (Passo a Passo) */
function initJourneySteps() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  const timelineContainer = document.querySelector('#stepsTimeline');
  const sectionEl = document.querySelector('#metodologia') || document.querySelector('#passo-a-passo') || document.querySelector('.steps-section');
  if (!timelineContainer || !sectionEl) return;

  const trackPath = timelineContainer.querySelector('.journey-track-path');
  const progressPath = timelineContainer.querySelector('.journey-progress-path');
  const stepCards = gsap.utils.toArray('#stepsTimeline .step-card-vertical');
  const badges = gsap.utils.toArray('#stepsTimeline .step-number-badge-vertical');

  if (!trackPath || !progressPath || stepCards.length < 2) return;

  let tl = null;

  function buildJourney() {
    const cRect = timelineContainer.getBoundingClientRect();
    const bRects = badges.map(b => b.getBoundingClientRect());

    const first = bRects[0];
    const last = bRects[bRects.length - 1];

    if (!first || !last || first.height === 0) return;

    // Se já havia uma timeline, encerra a anterior para recalcular tudo com precisão absoluta
    if (tl) {
      tl.kill();
      tl = null;
    }

    const x = Math.round((first.left + first.width / 2) - cRect.left);
    const y1 = Math.round((first.top + first.height / 2) - cRect.top);
    const y2 = Math.round((last.top + last.height / 2) - cRect.top);

    const d = `M ${x} ${y1} L ${x} ${y2}`;
    trackPath.setAttribute('d', d);
    progressPath.setAttribute('d', d);

    const totalLen = Math.max(10, progressPath.getTotalLength() || (y2 - y1));
    progressPath.style.strokeDasharray = `${totalLen}`;
    progressPath.style.strokeDashoffset = `${totalLen}`;

    const cardFractions = bRects.map(r => {
      const cy = Math.round((r.top + r.height / 2) - cRect.top);
      return Math.min(1, Math.max(0, (cy - y1) / Math.max(1, y2 - y1)));
    });

    tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionEl,
        start: 'top 75%',
        end: 'bottom 45%',
        scrub: 0.6
      }
    });

    // 1. Linha SVG desenha progressivamente de 0% a 100% conforme a rolagem
    tl.to(progressPath, {
      strokeDashoffset: 0,
      ease: 'none',
      duration: 2.6
    }, 0);

    // 2. Cada card e badge surge progressivamente com a cor azul da paleta (#527387 / #46677B)
    stepCards.forEach((card, idx) => {
      const frac = cardFractions[idx] ?? (idx / (stepCards.length - 1));
      const cardTime = Math.max(0, frac * 2.6 - 0.15);
      const badge = badges[idx];

      // Entrada suave do card
      tl.fromTo(
        card,
        { opacity: idx === 0 ? 0.8 : 0.35, y: 14 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
        cardTime
      );

      // Destaque no badge com o azul oficial ao ser alcançado pela linha (substitui qualquer roxo)
      if (badge) {
        tl.to(
          badge,
          {
            scale: 1.08,
            backgroundColor: '#46677B',
            boxShadow: '0 0 0 6px rgba(139, 164, 181, 0.35), 0 8px 22px rgba(70, 103, 123, 0.4)',
            duration: 0.35,
            ease: 'power1.out'
          },
          cardTime + 0.1
        );
      }
    });
  }

  // Executa medição imediata
  buildJourney();

  // Recalcular quando fontes terminarem de carregar
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      buildJourney();
      ScrollTrigger.refresh();
    });
  }

  // Recalcular quando imagens terminarem de carregar
  window.addEventListener('load', () => {
    buildJourney();
    ScrollTrigger.refresh();
  });

  window.addEventListener('resize', () => {
    buildJourney();
    ScrollTrigger.refresh();
  }, { passive: true });
}



import { LitElement, html } from 'lit-element';
import { styleMap } from 'lit-html/directives/style-map';
import { wcNameStyles } from "./animation-protonimg-styles";
import { Proton } from './lib/proton';
import { PxLoader, PxLoaderImage} from './lib/pxlib';

/**
 * `animation-protonimg`
 * AnimationProtonImg
 *
 * @customElement animation-protonimg
 * @polymer
 * @litElement
 * @demo demo/index.html
 */

export class AnimationProtonImg extends LitElement {
  static get is() {
    return 'animation-protonimg';
  }

  static get properties() {
    return {
      time: { type: String },
      width: { type: Number },
      height: { type: Number },
      background: { type: String },
      arrImagen: { type: Array },
    };
  }

  static get styles() {
    return [wcNameStyles];
  }

  constructor() {
    super();
    this.time = 0;
    this.width = 800;
    this.height = 400;
    this.background = '#000';
    
    const imgLightDom = [...this.querySelectorAll('img')];
    this.arrImages = imgLightDom.map(imgElement => imgElement.src);

    this.imgCounter = 0;
    this.reset = true;
  }

  _changeImageWithoutResetDispatched(ev) {
    console.log('2', ev.detail.id, this.id);
    if (ev.detail.id === this.id) {
      this.nextImage();
    }
  }

  _changeImageDispatched(ev) {
    console.log('1', ev.detail.id, this.id);
    if (ev.detail.id === this.id) {
      this.changeImage();
    }
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('animation-protonimg_change-image-without-reset', this._changeImageWithoutResetDispatched.bind(this));
    document.addEventListener('animation-protonimg_change-image', this._changeImageDispatched.bind(this));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.aremoveEventListener('animation-protonimg_change-image-without-reset', this._changeImageWithoutResetDispatched.bind(this));
    document.removeEventListener('animation-protonimg_change-image', this._changeImageDispatched.bind(this));

  }

  firstUpdated() {
    if (this.arrImages.length === 0) {
      console.warn('Sin imagenes definidas');
    }
    if (this.arrImages === 1) {
      this.arrImages.push(this.arrImages[0]);
    }
    this.rootIndex = 0;
    this.canvas = this.shadowRoot.querySelector('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.context = this.canvas.getContext('2d');
    this.context.fillStyle = this.background;

    this.imageDatas = [];
    let width = this.width;
    let height = this.height;

    // this.rect = new Proton.Rectangle((this.canvas.width - width) / 2, (this.canvas.height - height) / 2, width, height);
    // this.rect2 = new Proton.Rectangle(this.rect.x - height / 2, this.rect.y - height / 2, this.rect.width + height, this.rect.height + height);
    this.rect = new Proton.Rectangle(0, 0 , width, height);
    this.rect2 = new Proton.Rectangle(0, 0, this.rect.width + height, this.rect.height + height);
    this.randomBehaviour = new Proton.RandomDrift(0, 0, 0.05);
    const rectZone = new Proton.RectZone(this.rect2.x, this.rect2.y, this.rect2.width, this.rect2.height);
    this.crossBehaviour = new Proton.CrossZone(rectZone, 'bound');
    this.gravityWellBehaviour = new Proton.GravityWell({
      x: this.canvas.width / 2,
      y: this.canvas.height / 2
    }, 0, 0);

    if (this.time === 'mouse') {
      this.canvas.addEventListener('mousedown', this.changeImage.bind(this), false);
    } else if (this.time > 0) {
      setInterval(this.changeImage.bind(this), this.time * 1000);
    }
    this.loadImages();
  }

  loadImages() {
    this.logoZone = [];
    const loader = new PxLoader();
    const logo = this.arrImages.map(img => loader.addImage(img));

    loader.addCompletionListener(() => {
      for (let i = 0; i < logo.length; i++) {
        const imagedata = Proton.Util.getImageData(this.context, logo[i], this.rect);
        this.logoZone.push(new Proton.ImageZone(imagedata, this.rect.x, this.rect.y));
        this.imageDatas.push(imagedata);
      }
      this.createProton(this.rect);
      this.tick();
    });
    loader.start();
  }

  createProton() {
    this.proton = new Proton;
    this.emitter = new Proton.Emitter();
    this.emitter.rate = new Proton.Rate(new Proton.Span(24000), new Proton.Span(0.1));
    this.emitter.addInitialize(new Proton.Mass(1));
    this.emitter.addInitialize(new Proton.P(new Proton.RectZone(this.rect2.x, this.rect2.y, this.rect2.width, this.rect2.height)));

    this.emitter.addBehaviour(this.randomBehaviour);
    this.emitter.addBehaviour(this.customToZoneBehaviour());
    this.emitter.addBehaviour(this.crossBehaviour);
    this.emitter.addBehaviour(this.gravityWellBehaviour);

    this.emitter.emit('once');
    this.proton.addEmitter(this.emitter);

    this.renderer = new Proton.PixelRenderer(this.canvas);
    this.renderer.createImageData(this.rect2);
    this.proton.addRenderer(this.renderer);
  }

  customToZoneBehaviour() {
    return {
      initialize: (particle) => {
        const arrZonesPosition = this.logoZone.map(zone => zone.getPosition().clone());
        particle.R = Math.random() * 10;
        particle.Angle = Math.random() * Math.PI * 2;
        particle.speed = Math.random() * (-2) + 1;
        particle.zones = arrZonesPosition;
        particle.colors = this.getColor(particle.zones);
      },

      applyBehaviour: (particle) => {
        if (this.reset) {
          particle.v.clear();
          particle.Angle += particle.speed;
          const index = this.rootIndex;
          const x = particle.zones[this.rootIndex].x + particle.R * Math.cos(particle.Angle);
          const y = particle.zones[this.rootIndex].y + particle.R * Math.sin(particle.Angle);

          particle.p.x += (x - particle.p.x) * 0.05;
          particle.p.y += (y - particle.p.y) * 0.05;
          particle.rgb.r = particle.colors[this.rootIndex].r;
          particle.rgb.g = particle.colors[this.rootIndex].g;
          particle.rgb.b = particle.colors[this.rootIndex].b;
        }
      }
    };

  }

  getColor(posArr) {
    const arr = [];
    for (let i = 0; i < posArr.length; i++) {
      arr.push(this.logoZone[i].getColor(posArr[i].x, posArr[i].y));
    }
    return arr;
  }

  nextImage() {
    this.rootIndex = (this.rootIndex + 1 ) % this.logoZone.length;
    this.randomBehaviour.reset(0, 0, 0.001);
    this.gravityWellBehaviour.reset({
      x: this.canvas.width / 2,
      y: this.canvas.height / 2
    }, 0, 0);  // }, 3000, 500);
  }

  changeImage(e) {
    if (this.reset) {
      this.reset = false;
      this.randomBehaviour.reset(30, 30, 0.001);
    } else {
      this.reset = true;
      this.nextImage();
    }
  }

  timestampControl(timestamp) {
    if (!this.start) {
      this.start = timestamp;
    };
    const progress = timestamp - this.start;
    if (progress > 10000) {
      // RESET TIMESTAMP TO AVOID ANIMATION SLODOWN
      this.start = timestamp;
    }
  }

  tick(timestamp) {
    this.timestampControl(timestamp);
    requestAnimationFrame(this.tick.bind(this));
    this.proton.update();
  }

  render() {
    return html`
      <canvas style="${styleMap({'background': this.background})}"></canvas>
    `;
  }
}

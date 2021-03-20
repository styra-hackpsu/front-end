const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const clean = (html) => {
	let doc = new DOMParser().parseFromString(html, "text/html");
	return doc.body.textContent || "";
};

const userName = {
	get() {
		return window.localStorage.getItem("userName") ?? false;
	},
	set(name) {
		window.localStorage.setItem("userName", clean(name));
		return name;
	},
};

class Page {
	static duration = 0.55;
	static ease = "back";
	static moveBy = 200;

	selector = null;
	_isOpen = false;
	anim = null;

	set isOpen(isOpen) {
		if (isOpen === this._isOpen) {
			return;
		}
		this._isOpen = isOpen;
		if (isOpen) {
			this.open();
		} else {
			this.close();
		}
	}

	get isOpen() {
		return this._isOpen;
	}

	constructor(selector) {
		this.selector = selector;
		if (typeof this.init === "function") {
			this.init();
		}
	}

	open() {
		$(this.selector).style.display = "block";
		gsap.to(this.selector, {
			opacity: 1,
			y: 0,
			duration: Page.duration,
			ease: Page.ease,
		});
	}

	close() {
		gsap.to(this.selector, {
			opacity: 0,
			y: -Page.moveBy,
			duration: Page.duration,
			ease: Page.ease,
		}).then(() => {
			if (!this.isOpen) {
				$(this.selector).style.display = "none";
			}
		});
	}
}

class SetupPage extends Page {
	handleDone() {
		const name = $("#page-setup-name").value.trim();

		if (!name) return;
		userName.set(name);
		this.isOpen = false;
		this.next();
	}

	init() {
		$("#page-setup-done").addEventListener(
			"click",
			this.handleDone.bind(this)
		);
	}
	constructor(next) {
		super("#page-setup");
		this.next = next;

		if (!userName.get()) {
			this.isOpen = true;
		}
	}
}

class Wave {
	static resolution = 3;
	static ghost = 5;
	static ghostSpace = 30;

	ctx = null;
	canvas = null;
	color = "#000";

	mouseX = 0;
	dotSize = 3;
	waveFn = {
		a: 1,
		b: 1,
		c: 1,
		d: 1,
		e: 1,
	};

	ampFn = {
		a: 1,
		b: 1,
		c: 1,
	};

	getY(x, t) {
		return (
			this.canvas.height -
			(this.ampFn.a * Math.sin(this.ampFn.b * t) + this.ampFn.c) *
				(Math.exp(
					this.waveFn.a *
						Math.sin(this.waveFn.b * (x + t) + this.waveFn.c) +
						this.waveFn.d
				) -
					this.waveFn.e)
		);
	}

	constructor(canvas, ctx, waveFn, ampFn, color, dotSize = 3) {
		this.waveFn = waveFn;
		this.ampFn = ampFn;
		this.ctx = ctx;
		this.canvas = canvas;
		this.color = color;
		this.dotSize = dotSize;
		window.addEventListener(
			"mousemove",
			({ pageX }) => (this.mouseX = pageX)
		);
	}

	render(time) {
		const { width, height } = this.canvas;
		const jump = Wave.resolution;
		this.ctx.setLineDash([this.dotSize, 12]);
		this.ctx.strokeStyle = this.color;
		this.ctx.lineWidth = this.dotSize;

		for (let depth = 0; depth < Wave.ghost; depth++) {
			let t = time - depth * Wave.ghostSpace;
			this.ctx.beginPath();
			this.ctx.moveTo(0, height);

			for (let x = 0; x < width; x += jump) {
				this.ctx.lineTo(x, this.getY(x, t));
			}

			this.ctx.lineTo(width, this.getY(width, t));
			this.ctx.lineTo(width, height);
			this.ctx.moveTo(0, height);
			this.ctx.closePath();
			this.ctx.stroke();
		}
	}
}

class Waves {
	static bg = "#ffffff00";
	static colors = ["#ff4f5e", "#5793ff", "#5c5eff"];
	running = false;

	el = null;
	canvas = null;
	ctx = null;
	speed = 2.4;

	t = 0;
	waves = [];

	setDims() {
		const { height, width } = this.el.getBoundingClientRect();
		this.canvas.height = height * 0.3;
		this.canvas.width = width;
	}

	attachEvents() {
		window.addEventListener("resize", this.setDims);
	}

	start() {
		this.running = true;

		requestAnimationFrame(this.render);
	}

	stop() {
		this.running = false;
	}

	populate() {
		this.waves.push(
			new Wave(
				this.canvas,
				this.ctx,
				{ a: 1.2, b: 1 / 250, c: 0, d: 4, e: 20 },
				{ a: 0.6, b: 1 / 200, c: 0.5 },
				Waves.colors[0],
				3
			)
		);
		this.waves.push(
			new Wave(
				this.canvas,
				this.ctx,
				{ a: 1.4, b: 1 / 200, c: 7, d: 4, e: 30 },
				{ a: 0.4, b: 1 / 300, c: 0.5 },
				Waves.colors[1],
				3
			)
		);
		this.waves.push(
			new Wave(
				this.canvas,
				this.ctx,
				{ a: 1.2, b: 1 / 250, c: 4, d: 4, e: 40 },
				{ a: 0.6, b: 1 / 350, c: 0.5 },
				Waves.colors[2],
				3
			)
		);
	}

	constructor() {
		this.render = this.render.bind(this);
		this.el = document.querySelector("#page-main");
		this.canvas = this.el.querySelector("#page-main-canvas");
		this.ctx = this.canvas.getContext("2d");
		this.setDims = this.setDims.bind(this);
		this.populate();
		this.setDims();
		this.attachEvents();
		requestAnimationFrame(this.render);
	}

	render() {
		this.canvas.height = this.canvas.height;
		this.t += this.speed;
		if (this.t >= 8000 * Math.PI) {
			this.t = 0;
		}
		this.waves.forEach((wave) => wave.render(this.t));
		if (this.running) {
			requestAnimationFrame(this.render);
		}
	}
}

class MainPage extends Page {
	waves = null;
	heading = null;
	set isOpen(isOpen) {
		super.isOpen = isOpen;
		if (this.isOpen) {
			this.heading.innerHTML = `Keep crushing it,<br />${userName.get()} 💪`;
			this.waves.start();
			setTimeout(() => {
				this.waves.setDims();
			}, Page.duration);
		} else {
			this.waves.stop();
		}
	}

	get isOpen() {
		return super.isOpen;
	}

	init() {}

	constructor() {
		super("#page-main");
		this.heading = $("#page-main-heading");
		this.waves = new Waves();
		this.isOpen = !!userName.get();
	}
}

class DistractPage extends Page {
	heading = null;
	constructor() {
		super("#page-distract");
		this.heading = $("#page-distract-heading");
		this.heading.innerHTML = `Hey ${userName.get()}, seems like you're getting distracted<br />😳`;
		this.isOpen = true;
	}
}

document.addEventListener("DOMContentLoaded", () => {
	// const mainPage = new MainPage();

	const distractPage = new DistractPage();

	const setupPage = new SetupPage(() => {
		distractPage.isOpen = true;
	});
});

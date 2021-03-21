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

const chromeStore = {
	getAll() {
		return new Promise((res) => chrome.storage.local.get(null, res));
	},
	set(vals) {
		return new Promise((res) => chrome.storage.local.set(vals, res));
	},
	remove(keys) {
		return new Promise((res) => chrome.storage.local.remove(keys, res));
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
		this.waves = new window.Waves();
	}
}

class DistractPage extends Page {
	heading = null;
	constructor() {
		super("#page-distract");
		this.heading = $("#page-distract .page-content h3");
		this.heading.innerHTML = `Hey${
			userName.get() ? " " + userName.get() : ""
		}, seems like you're getting distracted<br />😳`;
	}
}

class EmotionPage extends Page {
	heading = null;
	text = null;
	mainBtn = null;
	subBtn = null;
	constructor() {
		super("#page-emotion");

		this.heading = $("#page-emotion .page-content h3");
		this.text = $("#page-emotion .page-content p");
		this.mainBtn = $("#page-emotion .page-content .button-main");
		this.subBtn = $("#page-emotion .page-content .button-subtle");
	}
}

class BreakPage extends Page {
	time = null;
	text = null;
	mainBtn = null;
	subBtn = null;
	constructor() {
		super("#page-break");

		this.time = $("#page-emotion .page-content h2");
		this.text = $("#page-emotion .page-content p");

		this.mainBtn = $("#page-emotion .page-content .button-main");
		this.subBtn = $("#page-emotion .page-content .button-subtle");
		this.isOpen = true;
	}
}

class Orchestrator {
	pages = {};

	async init() {
		const { pages } = this;
		pages.main = new MainPage();

		const setupNext = () => {
			pages.main.isOpen = true;
		};
		pages.setup = new SetupPage(setupNext);
		pages.emotion = new EmotionPage();
		pages.distract = new DistractPage();
		pages.break = new BreakPage();

		const store = await chromeStore.getAll();
		if (!userName.get()) {
			pages.setup.isOpen = true;
		}

		// if(!store.pageMode){
		// 	if(inBreak(store)){

		// 	}
		// }
	}

	constructor() {
		this.init = this.init.bind(this);
		document.addEventListener("DOMContentLoaded", this.init);
	}
}

const orchestrator = new Orchestrator();
// document.addEventListener("DOMContentLoaded", () => {});

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

const inTime = (store, key) => {
	const till = Number(store[key]);
	if (isNaN(till) || till === 0 || till - new Date() <= 0) {
		return false;
	}
	return till - new Date();
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
	timer = null;

	onDone = null;

	updateUI(left) {
		const mins = Math.floor(left / 1000);
		const secs = Math.floor(left - (mins * 60000) / 1000);
		this.time.innerHTML = `${mins}m ${secs}s`;
	}

	async handleClose() {
		clearInterval(this.timer);
		this.updateUI(new Date());
		await chromeStore.set({ breakTill: "0" });
		this.isOpen = false;
		if (typeof this.onDone === "function") {
			this.onDone();
		}
	}

	get isOpen() {
		return super.isOpen;
	}

	set isOpen(isOpen) {
		super.isOpen = isOpen;
		if (isOpen) {
			this.setupTimer();
		}
	}

	setupTimer() {
		this.timer = setInterval(async () => {
			const store = await chromeStore.getAll();
			const till = inTime(store, "breakTill");
			if (!till) {
				this.handleClose();
			} else {
				this.updateUI(till);
			}
		}, 1000);
	}

	constructor(onDone) {
		super("#page-break");
		this.time = $("#page-break .page-content h2");
		this.text = $("#page-break .page-content p");
		this.mainBtn = $("#page-break .page-content .button-main");
		this.subBtn = $("#page-break .page-content .button-subtle");
		this.onDone = onDone;
	}
}

class Orchestrator {
	pages = {};

	closeAll() {
		Object.entries(this.pages).map(([, page]) => {
			page.isOpen = false;
		});
	}

	async openPage() {
		const store = await chromeStore.getAll();
		this.closeAll();
		if (!userName.get()) {
			pages.setup.isOpen = true;
			return;
		}

		if (inTime(store, "breakTill")) {
			this.pages.break.isOpen = true;
			return;
		}

		if (store.pageMode === "distract") {
			this.pages.distract.isOpen = true;
			return;
		}

		if (store.pageMode === "tired") {
			this.pages.emotion.isOpen = true;
			return;
		}

		this.pages.main.isOpen = true;
	}

	async init() {
		const { pages } = this;
		pages.main = new MainPage();
		pages.setup = new SetupPage(this.openPage);
		pages.emotion = new EmotionPage();
		pages.distract = new DistractPage();
		pages.break = new BreakPage(this.openPage);
		this.openPage();
	}

	constructor() {
		this.openPage = this.openPage.bind(this);
		this.init = this.init.bind(this);
		document.addEventListener("DOMContentLoaded", this.init);
	}
}

const orchestrator = new Orchestrator();
// document.addEventListener("DOMContentLoaded", () => {});

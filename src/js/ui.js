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
			if (typeof this.setup === "function") {
				this.setup();
			}
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

	setup() {
		this.heading.innerHTML = `Keep crushing it,<br />${userName.get()} 💪`;
		this.waves.start();
		setTimeout(() => {
			this.waves.setDims();
		}, Page.duration);
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

	setup() {
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
			this.pages.setup.isOpen = true;
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

		if (store.pageMode === "analysis") {
			this.pages.analysis.isOpen = true;
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
		pages.analysis = new AnalysisFrontPage(this.openPage);
		this.openPage();
	}

	constructor() {
		this.openPage = this.openPage.bind(this);
		this.init = this.init.bind(this);
		document.addEventListener("DOMContentLoaded", this.init);
	}
}

class AnalysisFrontPage extends Page {
	heading = null;
	analysis_data = null;
	dummyData = {
		"user-keywords": [
			{
				timestamp: "2021-03-23 23:32:46.401451+00:00",
				"context-switch": true,
				url: "",
			},
		],
		"user-emotions": [
			{
				timestamp: "2021-03-20 23:32:16.401451+00:00",
				"simple-emotions": {
					additional_properties: {},
					anger: 0.0,
					contempt: 0.0,
					disgust: 0.0,
					fear: 0.0,
					happiness: 1.0,
					neutral: 0.0,
					sadness: 0.0,
					surprise: 0.0,
				},
				"complex-emotions": {
					non_vigilant: 0.9,
					tired: 0.1,
					alert: 0,
				},
			},
			{
				timestamp: "2021-03-29 23:32:26.401451+00:00",
				"simple-emotions": {
					additional_properties: {},
					anger: 0.0,
					contempt: 0.0,
					disgust: 0.0,
					fear: 0.0,
					happiness: 1.0,
					neutral: 0.0,
					sadness: 0.0,
					surprise: 0.0,
				},
				"complex-emotions": {
					non_vigilant: 0.9,
					tired: 0.1,
					alert: 0,
				},
			},
		],
	};

	checkBetweenTimeRanges(ctxs, tim1, tim2) {
		let count = 0;
		ctxs.forEach((elem, i) => {
			let time = parseInt(Date.parse(elem.timestamp));
			let x = time > tim2 && time <= tim1;
			count += x ? 1 : 0;
		});
		return count;
	}

	get isOpen() {
		return super.isOpen;
	}

	preprocessData(data) {
		//emotions
		let emotions = data["user-emotions"];

		emotions = emotions.sort((first, second) => {
			return Date.parse(second.timestamp) - Date.parse(first.timestamp);
		});

		let top_3 = emotions.map((elem) => {
			let dict = {
				...elem["complex-emotions"],
				...elem["simple-emotions"],
			};
			var items = Object.keys(dict).map(function (key) {
				return [key, dict[key]];
			});
			items.sort(function (first, second) {
				return second[1] - first[1];
			});

			return items.slice(0, 3);
		});
		// keywords
		let n = emotions.length;

		let ctxChangedTimestamps = data["user-keywords"];
		let ctx = [];
		for (let i = 0; i < n - 1; i++) {
			let tim1 = parseInt(Date.parse(emotions[i].timestamp));
			let tim2 = parseInt(Date.parse(emotions[i + 1].timestamp));
			ctx.push(
				this.checkBetweenTimeRanges(ctxChangedTimestamps, tim1, tim2)
			);
		}

		return [top_3, data, ctx];
	}

	async getData() {
		let url = "http://127.0.0.1:8000/utils/analysis"; //TODO
		let response = await fetch(url);
		let resData = await response.json();
		return resData;
	}

	createTimeline([top_3, data, ctx]) {
		let innerH = "";
		data["user-emotions"].map((elem, i) => {
			let date = new Date(elem.timestamp);
			innerH += `
			<div class="container ${i % 2 == 0 ? "left" : "right"}">
				<div class="content">
					<h2>${date.toTimeString().slice(0, 8)}</h2>
					<strong><span>${Number.parseFloat(top_3[i][0][1]).toFixed(
						2
					)}</span></strong> <img src="./assets/final_emoji/${
				top_3[i][0][0]
			}.gif" height ="64px"> 
					<strong><span>${Number.parseFloat(top_3[i][1][1]).toFixed(
						2
					)}</span></strong> <img src="./assets/final_emoji/${
				top_3[i][1][0]
			}.gif" height ="32px"> 
					<strong><span>${Number.parseFloat(top_3[i][2][1]).toFixed(
						2
					)}</span></strong> <img src="./assets/final_emoji/${
				top_3[i][2][0]
			}.gif" height ="32px"> 
					<p> <strong >${
						i == top_3.length - 1 ? 0 : ctx[i]
					} </strong> Context Switches </p>
				</div>
			</div>
			`;
		});
		document.getElementById("timeline").innerHTML = innerH;
		document.getElementById("timeline").style.marginBottom = "50px";
	}

	async setup() {
		this.analysis_data = await this.getData();
		this.createTimeline(this.preprocessData(this.analysis_data));
		return 1;
	}

	constructor() {
		super("#page-analysis");
	}
}

// document.addEventListener("DOMContentLoaded", () => {
// 	const analysisFrontPage = new AnalysisFrontPage();

// 	analysisFrontPage.setup();

// 	// const distractPage = new DistractPage();

// 	const setupPage = new SetupPage(() => {
// 		// distractPage.isOpen = false;
// 		analysisFrontPage.isOpen = true;
// 	});
// 	document.addEventListener("DOMContentLoaded", () => {
// 	// const mainPage = new MainPage();
// 	// pageMode -> distracted, tired, else(normal), analysis
// 	// pageData -> extra data
// 	// chrome.storage.local.remove(["tabIdGlobal"]);
// 	// chrome.storage.local.set({ tabIdGlobal: tab.id });

// 	chrome.storage.local.get(["pageMode"], ({ pageMode }) => {
// 		if (pageMode === "distracted") {
// 			const distractPage = new DistractPage();

// 			const setupPage = new SetupPage(() => {
// 				distractPage.isOpen = true;
// 			});
// 		} else {
// 			const analysisFrontPage = new AnalysisFrontPage();
// 			analysisFrontPage.setup();

// 			const mainPage = new MainPage();
// 			const setupPage = new SetupPage(() => {
// 				// mainPage.isOpen = true;
// 				analysisFrontPage.isOpen = true;
// 			});
// 		}
// 	});
// });
const orchestrator = new Orchestrator();
// document.addEventListener("DOMContentLoaded", () => {});

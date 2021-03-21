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
	return till - new Date().getTime();
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
	toggle = null;
	analysisButton = null;
	inSnooze = false;
	openPage = null;
	setup() {
		this.heading.innerHTML = `Keep crushing it,<br />${userName.get()} 💪`;
		this.waves.start();
		setTimeout(() => {
			this.waves.setDims();
		}, Page.duration);
	}

	init() {}

	updateSnooze = async function (e) {
		const store = await chromeStore.getAll();
		this.inSnooze = Number(store.snoozeTill) === -1;

		if (e !== false) {
			this.inSnooze = !this.inSnooze;
			await chromeStore.set({ snoozeTill: this.inSnooze ? "-1" : "0" });
		}

		if (this.inSnooze) {
			if (!this.toggle.classList.contains("toggle-active")) {
				this.toggle.classList.add("toggle-active");
			}
			$(this.selector).style.backgroundColor = "#16172f";
			$(this.selector).style.color = "#fff";
		} else {
			if (this.toggle.classList.contains("toggle-active")) {
				this.toggle.classList.remove("toggle-active");
			}
			$(this.selector).style.backgroundColor = "#fff";
			$(this.selector).style.color = "#111";
		}
	};

	openAnalysis = async function () {
		await chromeStore.set({ pageMode: "analysis" });
		this.isOpen = false;
		this.openPage();
	};

	constructor(openPage) {
		super("#page-main");
		this.updateSnooze = this.updateSnooze.bind(this);
		this.openAnalysis = this.openAnalysis.bind(this);
		this.heading = $("#page-main-heading");
		this.waves = new window.Waves();

		this.openPage = openPage;

		this.updateSnooze(false);

		this.toggle = $("#page-main .toggle");
		this.toggle.addEventListener("click", this.updateSnooze);
		this.analysisButton = $("#page-main .header-main .button-light");
		this.analysisButton.addEventListener("click", this.openAnalysis);
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
		const mins = Math.floor(left / 60000);
		const secs = Math.floor((left - mins * 60000) / 1000);
		this.time.innerHTML = `${mins}m ${secs}s`;
	}

	async handleClose() {
		clearInterval(this.timer);
		this.updateUI(0);
		await chromeStore.set({ breakTill: "0" });
		this.isOpen = false;
		if (typeof this.onDone === "function") {
			this.onDone();
		}
	}

	tick = async () => {
		const store = await chromeStore.getAll();
		const till = inTime(store, "breakTill");
		if (!till) {
			this.handleClose();
		} else {
			this.updateUI(till);
		}
	};

	setup() {
		this.tick();
		this.timer = setInterval(this.tick, 1000);
	}

	handleMoreTime = async () => {
		const store = await chromeStore.getAll();
		const till = inTime(store, "breakTill");
		if (!till) {
			return;
		}
		await chromeStore.set({
			breakTill: new Date().getTime() + till + 5 * 60 * 1000,
		});
		this.tick();
	};

	constructor(onDone) {
		super("#page-break");
		this.tick = this.tick.bind(this);
		this.handleClose = this.handleClose.bind(this);
		this.handleMoreTime = this.handleMoreTime.bind(this);
		this.time = $("#page-break .page-content h2");
		this.text = $("#page-break .page-content p");
		this.mainBtn = $("#page-break .page-content .button-main");
		this.subBtn = $("#page-break .page-content .button-subtle");
		this.mainBtn.addEventListener("click", this.handleMoreTime);
		this.subBtn.addEventListener("click", this.handleClose);
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

		console.log(`store`, store);

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
		pages.main = new MainPage(this.openPage);
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
	backButton = null;
	openPage = null;

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

	openMain = async function () {
		await chromeStore.set({ pageMode: "" });
		this.isOpen = false;
		this.openPage();
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
			let date2 = null;
			if (i == data["user-emotions"].length-1) 
				date2 = date
			else  {
				date2 = new Date(data["user-emotions"][i+1].timestamp);
			}
			innerH += `
			<div class="container ${i % 2 == 0 ? "left" : "right"}">
				<div class="content">
					<h2>${date.toTimeString().slice(0, 8)} -  ${date2.toTimeString().slice(0, 8)}</h2>
					<table>
					<thead>
						<tr>
							<th><img src="./assets/final_emoji/${ top_3[i][0][0] }.gif" height ="64px"> </th>
							<th><img src="./assets/final_emoji/${ top_3[i][1][0] }.gif" height ="32px"> </th>
							<th><img src="./assets/final_emoji/${ top_3[i][2][0] }.gif" height ="32px"> </th>
						</tr>
					</thead>
					<tbody>
						<tr style="text-align: center">
							<td ><span>${Number.parseFloat(top_3[i][0][1]).toFixed(2)}</span></td>
							<td><span>${Number.parseFloat(top_3[i][1][1]).toFixed(2)}</span></td>
							<td><span>${Number.parseFloat(top_3[i][2][1]).toFixed(2)}</span></td>
				
						</tr>
					</tbody>
				
				</table>
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

	constructor(openPage) {
		super("#page-analysis");
		this.openMain = this.openMain.bind(this);
		this.openPage = openPage;
		this.backButton = $("#page-analysis .header-main .button-light");
		this.backButton.addEventListener("click", this.openMain);
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

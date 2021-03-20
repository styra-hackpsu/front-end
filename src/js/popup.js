var stream;
// document.getElementById("but_start").addEventListener("click", async () => {
// 	document.getElementById("text").style.display = "block";
// 	await executeScript(getAccess);
// 	await executeScript(setPageBackgroundColor);
// });

let executeScript = async (fun) => {
	let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
	chrome.scripting.executeScript({
		target: { tabId: tab.id },
		function: fun,
	});
};

// will be executed in browser dom, need to send back stream from here.
let getAccess = async () => {
	navigator.mediaDevices
		.getUserMedia({ video: true })
		.then((stream_) => {
			console.log(stream_);
		})
		.catch((error) => {
			console.log(error);
		});
};

let stopCamera = () => {};

let sendStream = () => {};

function setPageBackgroundColor() {
	chrome.storage.sync.get("color", ({ color }) => {
		document.body.style.backgroundColor = color;
	});
}

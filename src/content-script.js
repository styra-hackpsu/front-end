async function post(url, data) {
	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-type": "application/json",
		},
		body: JSON.stringify(data),
	});

	const resData = await response.json();
	return resData;
}

function checkURL(url) {
	if (url.indexOf("search_query") > -1) {
		console.log("Youtube");
		return false;
	}

	if (url.indexOf("/search?q=") > -1) {
		console.log("Google link");
		return false;
	}

	return true;
}

function sendURL() {
	const request = { url: window.location.href };

	if (checkURL(request.url)) {
		post("http://127.0.0.1:8000/utils/change-detect/", { url: request.url })
			.then((res) => {
				if (res?.change_detected) {
					chrome.storage.local.set(
						{
							pageMode: "distracted",
							pageData: JSON.stringify(res),
						},
						() =>
							chrome.runtime.sendMessage({
								popup_open_new_tab: true,
							})
					);
				}
				console.log(res);
			})
			.catch((err) => {
				console.log(err.message);
			});
	}
}

const inTime = (till) => {
	if (till === -1) {
		return true;
	}

	if (isNaN(till) || till === 0 || till - new Date() <= 0) {
		return false;
	}
	return till - new Date().getTime();
};

chrome.storage.local.get(
	["snoozeTill", "breakTill"],
	({ snoozeTill, breakTill }) => {
		if (!inTime(Number(snoozeTill)) && !inTime(Number(breakTill))) {
			sendURL();
		}
	}
);

/* // TODO :
- navigation, 
- ui for snooze, 
- url checking before sending search history,
*/

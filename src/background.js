let color = "#3aa757";

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ color });
  console.log("Default background color set to %cgreen", `color: ${color}`);
});

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

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.purpose === "url-change") {
    post("http://dummy.restapiexample.com/api/v1/create", { url: request.url })
      .then((res) => {
        if (res.status === 200) {
          sendResponse({ data: request.url });
        } else {
          sendResponse({ data: "Failed" });
        }
      })
      .catch((err) => sendResponse({ data: err.message }));
  }
  return true;
});

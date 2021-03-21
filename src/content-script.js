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

function sendURL() {
  const request = { url: window.location.href };
  post("http://127.0.0.1:8000/utils/change-detect/", { url: request.url })
    .then((res) => {
      if (res?.change_detected) {
        chrome.storage.local.set({ pageMode: "distracted" });
        chrome.storage.local.set({ pageData: JSON.stringify(res) });
        setTimeout(
          () => chrome.runtime.sendMessage({ popup_open_new_tab: true }),
          2000
        );
      }
      console.log(res);
    })
    .catch((err) => {
      console.log(err.message);
    });
}
chrome.storage.local.get(
  ["snoozeTill", "breakTill"],
  ({ snoozeTill, breakTill }) => {
    if (snoozeTill === 0 && breakTill === 0) {
      sendURL();
    }
  }
);

/* // TODO :
- navigation, 
- ui for snooze, 
- url checking before sending search history,
*/

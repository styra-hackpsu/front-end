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

// function sendVideo() {
//   const request = {
//     purpose: "url-change",
//     url:
//       "https://image.shutterstock.com/image-photo/two-friends-smiling-outside-260nw-371956567.jpg",
//   };

//   post("http://127.0.0.1:8000/utils/detect/", { path: request.url, choice: 0 })
//     .then((res) => {
//       console.log(res);
//     })
//     .catch((err) => console.log(err.message));
// }

function sendURL() {
  const request = { url: window.location.href };
  //Change to reader mode
  post("http://127.0.0.1:8000/utils/change-detect/", { url: request.url })
    .then((res) => {
      if (!res?.change_detected) {
      }
      console.log(res);
      chrome.runtime.sendMessage({ state: "distracted" });
      chrome.runtime.sendMessage({ popup_open_new_tab: true });
    })
    .catch((err) => {
      chrome.runtime.sendMessage({ popup_open_new_tab: true });
      console.log(err.message);
    });
}

sendURL();

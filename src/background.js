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

let imageCapture,
  photoWidth,
  apiUrl = "http://127.0.0.1:8000";

let executeScript = async (fun) => {
  chrome.storage.local.get(["tabIdGlobal"], async ({ tabIdGlobal }) => {
    if (!tabIdGlobal) {
      const tab = await chrome.tabs.create({
        active: false,
        url: "https://www.google.com/",
        pinned: true,
      });
      chrome.storage.local.set({ tabIdGlobal: tab.id });
      // tabIdGlobal = tab.id;
      chrome.tabs.onUpdated.addListener(async function (
        tabId,
        changeInfo,
        tab
      ) {
        if (tabId === tabIdGlobal && changeInfo.status == "complete") {
          tabIdGlobal = tabId;
          await chrome.scripting.executeScript({
            target: { tabId: tabId },
            function: fun,
          });
        }
      });
    } else {
      await chrome.scripting.executeScript({
        target: { tabId: tabIdGlobal },
        function: fun,
      });
    }
  });
};

let getAccess = async () => {
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then(async (stream) => {
      const track = stream.getVideoTracks()[0];
      imageCapture = new ImageCapture(track);
      var reader = new FileReader();
      const blob = await imageCapture.takePhoto();
      reader.readAsDataURL(blob);
      reader.onloadend = function () {
        var base64data = reader.result;
        console.log(base64data);
        post(`${apiUrl}/utils/detect/`, {
          path: base64data,
          choice: 1,
        })
          .then((res) => {
            // if(res.) //if condition to check whether tired or not
            chrome.runtime.sendMessage({ state: "tired" });
            console.log(res);
          })
          .catch((err) => console.log(err.message));
      };
      return true;
    })
    .catch((error) => console.log(error));
};

chrome.alarms.create({ periodInMinutes: 0.1 });
chrome.alarms.onAlarm.addListener(() => {
  executeScript(getAccess);
});

// chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
//   console.log(
//     sender.tab
//       ? "from a content script:" + sender.tab.url
//       : "from the extension"
//   );
//   if (request.start) {
//     chrome.alarms.create({ periodInMinutes: 0.1 });
//     chrome.alarms.onAlarm.addListener(() => {
//       executeScript(getAccess);
//     });
//   }
// });

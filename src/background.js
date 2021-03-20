let imageCapture, photoWidth, tabIdGlobal;

let executeScript = async (fun) => {
  if (!tabIdGlobal) {
    chrome.tabs.create({
      active: false,
      url: "https://www.google.com/",
      pinned: true,
    });
    chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
      // make sure the status is 'complete' and it's the right tab
      if (
        tab.url.indexOf("https://www.google.com/") != -1 &&
        changeInfo.status == "complete"
      ) {
        tabIdGlobal = tabId;
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          function: fun,
        });
      }
    });
  } else {
    await chrome.scripting.executeScript({
      target: { tabId: tabGlobalId },
      function: fun,
    });
  }
  // let [tab] = await chrome.tabs.que	ry({ active: true, currentWindow: true });
  // await
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
        chrome.tabs.remove([tabIdGlobal], () => {});
      };
      return true;
    })
    .catch((error) => console.log(error));
};

chrome.action.onClicked.addListener(function (activeTab) {
  // setInterval(() => {
  //   executeScript(getAccess);
  // }, 1000);
  executeScript(getAccess);
});

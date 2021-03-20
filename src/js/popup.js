let imageCapture, photoWidth;

document.addEventListener("DOMContentLoaded", () => {
  console.log("Loaded");
  executeScript(getAccess);
  // setInterval(() => executeScript(getAccess), 60000);
});

let executeScript = async (fun) => {
  // const tab = await chrome.tabs.create({
  //   active: false,
  //   url: "https://www.google.com",
  // });
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: fun,
  });
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

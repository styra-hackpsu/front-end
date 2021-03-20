chrome.runtime.sendMessage(
  { purpose: "url-change", url: window.location.href },
  function (response) {
    console.log(response.data);
  }
);

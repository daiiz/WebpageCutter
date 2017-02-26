'use strict';

(function () {
  document.querySelector('#btn-show-cropper').addEventListener('click', function () {
    chrome.tabs.getSelected(null, function (tab) {
      console.info(tab);
      clearBadge();
      chrome.tabs.sendRequest(tab.id, {
        event: 'webpage_cutter-click-context-menu'
      });
      window.close();
    });
  });
})();

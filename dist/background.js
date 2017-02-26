'use strict';

(function () {
  var SCREENSHOT_DEV = '';
  var MODE = 'capture';
  var SCRAP_BOX_ID = '';
  var SITE_TITLE = '';
  var SITE_URL = '';

  // スクリーンショットをアップロードする
  var uploader = function uploader(bgBase64Img, width, height) {
    var data = {
      base64png: bgBase64Img,
      orgurl: SITE_URL,
      title: SITE_TITLE,
      width: width,
      height: height
    };
    console.log(data);
  };

  // Canvasに画像をセットして，必要部分のみ切り出す
  var renderImage = function renderImage(linkdata, base64img) {
    var canvas = document.querySelector("#cav");
    var pos_cropper = linkdata.cropperRect;
    SITE_URL = linkdata.baseUri;
    SITE_TITLE = linkdata.title;
    var w = +pos_cropper.width;
    var h = +pos_cropper.height;
    canvas.width = w;
    canvas.height = h;

    var ctx = canvas.getContext('2d');

    // MacBook ProのRetinaディスプレイなどの高解像度な
    // ディスプレイを使用している場合は1より大きな値となる
    var rat = window.devicePixelRatio;
    if (rat < 1) rat = 1;
    ctx.scale(1 / rat, 1 / rat);

    var img = new Image();
    img.onload = function () {
      ctx.drawImage(img, rat * pos_cropper.orgX, rat * pos_cropper.orgY, rat * w, rat * h, 0, 0, rat * w, rat * h);
      var screenshot = canvas.toDataURL('image/png');
      uploader(screenshot, w, h);
    };
    img.src = base64img;
  };

  // ポップアップ画面から命令を受ける
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    var opts = request.options;

    if (request.command === 'cut-webpage') {
      // スクリーンショットの撮影
      var linkdata = opts.sitedata;
      chrome.tabs.captureVisibleTab({ format: 'png' }, function (dataUrl) {
        MODE = opts.mode;
        SCRAP_BOX_ID = opts.scrapbox_box_id;
        renderImage(linkdata, dataUrl);
      });
    }
  });

  var getContextMenuTitle = function getContextMenuTitle(title) {
    var prefix = SCREENSHOT_DEV;
    return prefix + title;
  };

  var initScreenShotMenu = function initScreenShotMenu() {
    // ユーザーが閲覧中のページに専用の右クリックメニューを設ける
    // ウェブページ向け
    chrome.contextMenus.create({
      title: getContextMenuTitle('ページを切り取る'),
      contexts: ['page', 'selection'],
      onclick: function onclick(clicked, tab) {
        clearBadge();
        chrome.tabs.sendRequest(tab.id, {
          event: 'webpage_cutter-click-context-menu'
        });
      }
    });
    // ウェブページ上の画像向け
    chrome.contextMenus.create({
      title: getContextMenuTitle('ページを切り取る'),
      contexts: ['image', 'link'],
      onclick: function onclick(clicked, tab) {
        clearBadge();
        chrome.tabs.sendRequest(tab.id, {
          event: 'webpage_cutter-click-context-menu',
          elementType: 'image'
        });
      }
    });
  };

  initScreenShotMenu();

  chrome.tabs.onUpdated.addListener(function (tabId, info, tab) {
    if (info.status === 'complete') {
      chrome.tabs.sendRequest(tab.id, {
        event: 'updated-location-href'
      });
    }
  });
})();

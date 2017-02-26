'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var sendChromeMsg = function sendChromeMsg(json, callback) {
    chrome.runtime.sendMessage(json, callback);
};

var ScreenShot = function () {
    function ScreenShot() {
        _classCallCheck(this, ScreenShot);

        this.CROP_BOX_SIZE = 150;
        this.uiInit();
        this.positionLastRclick = [200, 200];
        this.linkdata = null;
        this.tmp = {
            // 右クリックされた画像要素
            '$contextMenuImg': []
        };
    }

    _createClass(ScreenShot, [{
        key: 'renderCropper',
        value: function renderCropper() {
            var boxParams = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

            var self = this;
            self.setCropper(boxParams, null);
        }
    }, {
        key: 'uiInit',
        value: function uiInit() {
            this.bindEvents();
        }

        // 切り抜きボックス, a要素カバーボックス

    }, {
        key: '$genCropper',
        value: function $genCropper() {
            var $cropper = $('<div class="daiz-ss-cropper" style="position: fixed;"></div>');
            $cropper.css({
                top: 0,
                left: 0,
                width: this.CROP_BOX_SIZE,
                height: this.CROP_BOX_SIZE
            });
            return $cropper;
        }

        // 範囲指定のための長方形を表示する

    }, {
        key: 'setCropper',
        value: function setCropper() {
            var _this = this;

            var boxParams = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
            var $scrapboxSelectBox = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

            var $cropper = this.$genCropper();
            var closeBtnImg = chrome.extension.getURL('x.png');
            var $closeBtn = $('<div id="daiz-ss-cropper-close"></div>');
            var $captureBtn = $('<div id="daiz-ss-cropper-capture">Capture</div>');
            $closeBtn.css({
                'background-image': 'url(' + closeBtnImg + ')'
            });

            $cropper[0].className = 'daiz-ss-cropper-main';
            $cropper[0].id = 'daiz-ss-cropper-main';
            // 切り抜きボックスの位置を初期化
            if (boxParams.length === 0) {
                $cropper.css({
                    left: this.positionLastRclick[0] - this.CROP_BOX_SIZE / 2,
                    top: this.positionLastRclick[1] - this.CROP_BOX_SIZE / 2,
                    width: this.CROP_BOX_SIZE,
                    height: this.CROP_BOX_SIZE
                });
            } else {
                $cropper.css({
                    left: boxParams[0],
                    top: boxParams[1],
                    width: boxParams[2],
                    height: boxParams[3]
                });
            }
            $cropper.append($captureBtn);
            if ($scrapboxSelectBox !== null) {
                $cropper.append($scrapboxBtn);
                $cropper.append($scrapboxSelectBox);
            }
            $cropper.append($closeBtn);

            // ドラッグ可能にする
            $cropper.draggable({
                stop: function stop(ev, ui) {
                    _this._setRects();
                }
            });

            // リサイズ可能にする
            $cropper.resizable({
                stop: function stop(ev, ui) {
                    _this._setRects();
                },
                handles: "all"
            });

            $('body').append($cropper);
            this._setRects();
        }
    }, {
        key: '_setRects',
        value: function _setRects() {
            var $cropper = $('#daiz-ss-cropper-main');
            var rect = $cropper[0].getBoundingClientRect();
            if (rect === undefined) return;
            this.removeCropper();
            this.linkdata = this.setRects(rect);
        }
    }, {
        key: 'setRects',
        value: function setRects(croppedRect) {
            // 切り取り領域
            var pos_cropper = {
                x: 0,
                y: 0,
                orgX: croppedRect.left,
                orgY: croppedRect.top,
                width: croppedRect.width,
                height: croppedRect.height
            };

            var res = {
                cropperRect: pos_cropper,
                aTagRects: [],
                text: '',
                winW: window.innerWidth,
                winH: window.innerHeight,
                baseUri: window.location.href,
                title: ''
            };
            return res;
        }

        // 描画されている長方形カバーを全て消去

    }, {
        key: 'removeCropper',
        value: function removeCropper() {
            $('.daiz-ss-cropper').remove();
        }
    }, {
        key: 'removeCropperMain',
        value: function removeCropperMain() {
            $(".daiz-ss-cropper-main").remove();
        }
    }, {
        key: 'capture',
        value: function capture() {
            var self = this;
            self.removeCropperMain();
            self.removeCropper();

            // ページから不要なdivが消去されてからスクリーンショットを撮りたい
            window.setTimeout(function () {
                if (self.linkdata !== null) {
                    sendChromeMsg({
                        command: 'cut-webpage',
                        options: {
                            sitedata: self.linkdata,
                            mode: 'capture'
                        }
                    });
                }
            }, 500);
        }
    }, {
        key: 'bindEvents',
        value: function bindEvents() {
            var _this2 = this;

            var self = this;

            // 画像上での右クリックを追跡
            $('body').on('contextmenu', 'img', function (ev) {
                var $img = $(ev.target).closest('img');
                self.tmp.$contextMenuImg = $img;
            });

            // 撮影ボタンがクリックされたとき
            $('body').on('click', '#daiz-ss-cropper-capture', function () {
                _this2.capture();
            });

            // 切り抜きボックスの閉じるボタンがクリックされたとき
            $('body').on('click', '#daiz-ss-cropper-close', function (ev) {
                _this2.removeCropper();
                _this2.removeCropperMain();
            });

            // ページでの右クリックを検出
            $(window).bind('contextmenu', function (e) {
                _this2.positionLastRclick = [e.clientX, e.clientY];
            });

            // コンテキストメニュー（右クリックメニュー）が押された通知をbackgroundページから受け取る
            chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
                var re = request.event;
                if (re === 'webpage_cutter-click-context-menu') {
                    if (request.elementType === 'image' && _this2.tmp.$contextMenuImg.length > 0) {
                        var $img = _this2.tmp.$contextMenuImg;
                        var imgRect = $img[0].getBoundingClientRect();
                        _this2.renderCropper([imgRect.left, imgRect.top, $img.width(), $img.height()]);
                    } else {
                        _this2.renderCropper();
                    }
                }
            });
        }
    }]);

    return ScreenShot;
}();

var ss = new ScreenShot();

var APP_PREFIX = 'webpage_cutter';
var sendChromeMsg = (json, callback) => {
    chrome.runtime.sendMessage(json, callback);
};

class ScreenShot {
    constructor () {
        this.CROP_BOX_SIZE = 150;
        this.uiInit();
        this.positionLastRclick = [200, 200];
        this.linkdata = null;
        this.tmp = {
            // 右クリックされた画像要素
            '$contextMenuImg': []
        };
    }

    renderCropper (boxParams=[]) {
        var self = this;
        self.setCropper(boxParams, null);
    }

    uiInit () {
        this.bindEvents();
    }

    // 切り抜きボックス, a要素カバーボックス
    $genCropper () {
        var $cropper = $(`<div class="daiz-ss-cropper" style="position: fixed;"></div>`);
        $cropper.css({
            top   : 0,
            left  : 0,
            width : this.CROP_BOX_SIZE,
            height: this.CROP_BOX_SIZE
        });
        return $cropper;
    }

    // 範囲指定のための長方形を表示する
    setCropper (boxParams=[], $scrapboxSelectBox=null) {
        var $cropper = this.$genCropper();
        var closeBtnImg = chrome.extension.getURL('x.png');
        var $closeBtn = $(`<div id="${APP_PREFIX}-daiz-ss-cropper-close" class="daiz-ss-cropper-close"></div>`);
        var $captureBtn = $(`<div id="${APP_PREFIX}-daiz-ss-cropper-capture" 
          class="daiz-ss-cropper-capture">Capture</div>`);
        $closeBtn.css({
            'background-image': `url(${closeBtnImg})`
        });

        $cropper[0].className = 'daiz-ss-cropper-main';
        $cropper[0].id = `${APP_PREFIX}-daiz-ss-cropper-main`;
        // 切り抜きボックスの位置を初期化
        if (boxParams.length === 0) {
            $cropper.css({
                left  : this.positionLastRclick[0] - (this.CROP_BOX_SIZE / 2),
                top   : this.positionLastRclick[1] - (this.CROP_BOX_SIZE / 2),
                width : this.CROP_BOX_SIZE,
                height: this.CROP_BOX_SIZE
            });
        }else {
            $cropper.css({
                left  : boxParams[0],
                top   : boxParams[1],
                width : boxParams[2],
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
            stop: (ev, ui) => {
                this._setRects();
            }
        });

        // リサイズ可能にする
        $cropper.resizable({
            stop: (ev, ui) => {
                this._setRects();
            },
            handles: "all"
        });

        $('body').append($cropper);
        this._setRects();
    }

    _setRects () {
        var $cropper = $(`#${APP_PREFIX}-daiz-ss-cropper-main`);
        var rect = $cropper[0].getBoundingClientRect();
        if (rect === undefined) return;
        this.removeCropper();
        this.linkdata = this.setRects(rect);
    }

    setRects (croppedRect) {
        // 切り取り領域
        var pos_cropper = {
            x     : 0,
            y     : 0,
            orgX  : croppedRect.left,
            orgY  : croppedRect.top,
            width : croppedRect.width,
            height: croppedRect.height
        };

        var res = {
            cropperRect : pos_cropper,
            aTagRects   : [],
            text        : '',
            winW        : window.innerWidth,
            winH        : window.innerHeight,
            baseUri     : window.location.href,
            title       : ''
        };
        return res;
    }

    // 描画されている長方形カバーを全て消去
    removeCropper () {
        $('.daiz-ss-cropper').remove();

    }

    removeCropperMain () {
        $(".daiz-ss-cropper-main").remove();
    }

    capture () {
        var self = this;
        self.removeCropperMain();
        self.removeCropper();

        // ページから不要なdivが消去されてからスクリーンショットを撮りたい
        window.setTimeout(() => {
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

    bindEvents () {
        var self = this;

        // 画像上での右クリックを追跡
        $('body').on('contextmenu', 'img', ev => {
            var $img = $(ev.target).closest('img');
            self.tmp.$contextMenuImg = $img;
        });

        // 撮影ボタンがクリックされたとき
        $('body').on('click', `#${APP_PREFIX}-daiz-ss-cropper-capture`, () => {
            this.capture();
        });

        // 切り抜きボックスの閉じるボタンがクリックされたとき
        $('body').on('click', `#${APP_PREFIX}-daiz-ss-cropper-close`, ev => {
            this.removeCropper();
            this.removeCropperMain();
        });

        // ページでの右クリックを検出
        $(window).bind('contextmenu', (e) => {
            this.positionLastRclick = [e.clientX, e.clientY];
        });

        // コンテキストメニュー（右クリックメニュー）が押された通知をbackgroundページから受け取る
        chrome.extension.onRequest.addListener((request, sender, sendResponse) => {
            var re = request.event;
            if (re === 'webpage_cutter-click-context-menu') {
                if (request.elementType === 'image' && this.tmp.$contextMenuImg.length > 0) {
                    var $img = this.tmp.$contextMenuImg;
                    var imgRect = $img[0].getBoundingClientRect();
                    this.renderCropper([
                        imgRect.left,
                        imgRect.top,
                        $img.width(),
                        $img.height()
                    ]);
                }else {
                    this.renderCropper();
                }
            }
        });
    }
}
var ss = new ScreenShot();
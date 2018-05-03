/**
 * Created by ll36 on 17/10/10.
 */
(function () {
    var GoBang = function (canvas, options) {
        this.canvas = document.getElementById(canvas);
        this.scale = Math.round(this.canvas.width / this.canvas.offsetWidth);//缩放比例
        this.scale = this.scale < 1 ? 1 : this.scale;
        
        this.ctx = this.canvas.getContext('2d');
        this.ctx.lineWidth = this.lineWidth = 1 * this.scale;//线条粗细

        this.mode = 'horizontal';//auto（自动，高度大于宽度，自动竖屏）;horizontal（横屏，正方形1:1）；vertical（竖屏，矩形23:31）
        this.status = 0;//0:未开始，1:黑子走，2:白子走
        this.playerType = 0;//0:未选择，1:单人持黑，2:单人持白，3:双人

        this.width = this.canvas.width; // canvas 宽度
        this.height = this.canvas.height; // canvas 高度
        this.chessWidth = this.width * 23 / 27;//棋盘宽度（460，包括边线）
        this.chessHeight = this.height * 23 / 27;//棋盘宽度
        this.positionY = 0;

        this.padding = this.width / 27; // canvas 内边距(20px)
        this.lineHeight = this.width / 18;//行间距(30px)
        this.chessRadius = this.width / 45;//棋子半径(12px)
        this.chessColor = [['#0a0a0a', '#636766'], ['#d1d1d1', '#f9f9f9']];//棋子颜色[黑，白]

        this.font = 13 * this.scale;//文字大小
        this.background = ['#f5d3b4', '#f5d3b4'];//背景颜色
        this.lineColor = '#625448'; // 边框颜色
        this.axisColor = '#764701'; // 坐标轴颜色

        this.init(options);
        this.bind();
    };
    GoBang.prototype = {
        init: function (options) {
            if (options) {
                for (var key in options) {
                    if (key === 'colorList' && Array.isArray(options[key])) {
                        this[key] = options[key].concat(this[key])
                    } else {
                        this[key] = options[key];
                    }
                }
            }
            //自动，高度大于宽度改为竖屏
            if (this.mode == 'auto'&&this.width<this.height) {
                this.mode = 'vertical';
            }
            //竖屏
            if (this.mode == 'vertical') {
                this.width = this.canvas.width; // canvas 宽度
                this.height = this.canvas.height; // canvas 高度
                this.chessWidth = this.width;//棋盘宽度（460，包括边线）
                this.chessHeight = this.height * 23 / 31;//棋盘宽度
                this.padding = this.width / 23; // canvas 内边距(20px)
                this.lineHeight = this.width * 3 / 46;//行间距(30px)
                this.chessRadius = this.width * 3 / 115;//棋子半径(12px)

                //偏移定位
                this.positionY = this.padding * 4;
            }

            this.ctx.clearRect(0, 0, this.width, this.height);
            this.drawChessBoard();

            this.status = 0;
            this.playerType = 0;
            //棋盘
            this.chess = [];
            for (var i = 0; i < 15; i++) {
                this.chess[i] = [];
                for (var j = 0; j < 15; j++) {
                    this.chess[i][j] = 0;
                }
            }
            this.startMenu();
        },
        refresh: function (isBack) {
            this.ctx.clearRect(0, 0, this.width, this.height);
            this.drawChessBoard();
            this.drawControl();
            this.drawHistory(isBack);
        },
        drawHistory: function (isBack) {
            if (isBack) {//还原棋子
                if (this.history.length) {
                    for (var i = 0, len = this.history.length; i < len; i++) {
                        this.drawChess(this.history[i][1], this.history[i][2], this.history[i][0], i === len - 1);
                    }
                }
                //文字提示
                if (this.status) {
                    if (this.mode == 'vertical') {
                        this.drawButton(this.width * 17 / 23, (this.positionY - this.lineHeight) / 2, this.lineHeight, this.lineHeight, 'Next:', '', { color: "#000" });
                        this.drawChess(13, -2, this.status);
                    } else {
                        this.drawButton(this.width * 23 / 27, 7 * this.lineHeight, this.width * 4 / 27, this.lineHeight, 'Next:', '', { color: "#000" });
                        this.drawChess(16, 8, this.status);
                    }
                }
            } else {
                this.history = [];
            }
            //比赛类型
            if (this.mode == 'vertical') {
                this.drawButton(this.padding, this.padding, 0, 0, this.playerType == 2 ? 'Computer' : 'Player', '', { color: "#000", shadowColor: "#fff", textAlign: 'start' });
                this.drawButton(this.padding, this.padding * 2, 0, 0, 'Vs:', '', { color: this.lineColor, textAlign: 'start' });
                this.drawButton(this.padding, this.padding * 3, 0, 0, this.playerType == 1 ? 'Computer' : 'Player', '', { color: "#fff", shadowColor: "#000", textAlign: 'start' });
            }
            else {
                this.drawButton(this.width * 23 / 27, 3 * this.lineHeight, this.width * 4 / 27, this.lineHeight, this.playerType == 2 ? 'Computer' : 'Player', '', { color: "#000", shadowColor: "#fff" });
                this.drawButton(this.width * 23 / 27, 4 * this.lineHeight, this.width * 4 / 27, this.lineHeight, 'Vs:', '', { color: this.lineColor });
                this.drawButton(this.width * 23 / 27, 5 * this.lineHeight, this.width * 4 / 27, this.lineHeight, this.playerType == 1 ? 'Computer' : 'Player', '', { color: "#fff", shadowColor: "#000" });
            }
        },
        handlerClick: function (offsetX, offsetY) {
            var pixelX = offsetX * this.scale;
            var pixelY = offsetY * this.scale;

            var x = (pixelX - this.padding) > 0 ? Math.round((pixelX - this.padding) / this.lineHeight) : -1;
            var y = (pixelY - this.padding - this.positionY) > 0 ? Math.round((pixelY - this.padding - this.positionY) / this.lineHeight) : -1;

            if (this.status && x > -1 && y > -1 && x < 15 && y < 15 && !this.chess[x][y] && (this.playerType == 3 || this.playerType === this.status)) {
                //增加棋子
                this.addChess(x, y, this.status);
                //检查输赢
                var result = this.checkWin();
                this.getResult(result);
                //判断是否电脑走
                if (!result && (this.playerType === 1 && this.status === 2 || this.playerType === 2 && this.status === 1)) {
                    this.computerPlay(this.status);
                }
            }
            else if (this.btnList.length) {
                for (var i = 0; i < this.btnList.length; i++) {
                    if (pixelX >= this.btnList[i][0] && pixelX <= this.btnList[i][2] && pixelY >= this.btnList[i][1] && pixelY <= this.btnList[i][3]) {
                        switch (this.btnList[i][4]) {
                            case 'player1'://持黑单机
                                this.status = 1;
                                this.playerType = 1;
                                this.refresh();
                                break;
                            case 'player2'://持白单机
                                this.status = 1;
                                this.playerType = 2;
                                this.refresh();
                                this.computerPlay(this.status);
                                break;
                            case 'player3'://双人游戏
                                this.status = 1;
                                this.playerType = 3;
                                this.refresh();
                                break;
                            case 'restart'://重新开始
                                this.init();
                                break;
                            case 'reback'://返回
                                this.refresh(true);
                                break;
                            case 'undo'://悔棋
                                this.undo();
                                break;
                            case 'hint'://提示
                                this.hint();
                                break;
                        }
                    }
                }
            }
        },
        handlerTouch: function (e) {
            switch (e.type) {
                case "touchstart": case "mousedown":
                    this.isTouch = true;
                    this.touch.start = new Date().getTime();
                    this.touch.x2 = this.touch.x1 = e.offsetX || e.touches[0].clientX;
                    this.touch.y2 = this.touch.y1 = e.offsetY || e.touches[0].clientY;
                    break;
                case "touchmove": case "mousemove":
                    if (this.isTouch) {
                        this.touch.end = new Date().getTime();
                        if (this.touch.end - this.touch.start < 300) {
                            this.touch.x2 = e.offsetX || e.touches[0].clientX, this.touch.y2 = e.offsetY || e.touches[0].clientY;
                        }
                        else {
                            this.isTouch = false;
                        }
                    }
                    break;
                case "touchend": case "mouseup":
                    this.touch.end = new Date().getTime();
                    if (this.isTouch && this.touch.end - this.touch.start < 300) {
                        if (Math.abs(this.touch.x2 - this.touch.x1) < 10 && Math.abs(this.touch.y2 - this.touch.y1) < 10) {
                            this.handlerClick(this.touch.x2, this.touch.y2);
                        }
                        //console.log(this.touch);
                    }
                    this.isTouch = false;
                    e.preventDefault();
                    break;
            }
        },
        bind: function () {
            this.isTouch = false;
            this.touch = { x1: 0, y1: 0, x2: 0, y2: 0, start: 0, end: 0 };
            var $this = this;
            if ("ontouchend" in document) {
                this.canvas.addEventListener('touchstart', function (e) {
                    $this.handlerTouch(e);
                }, false);
                this.canvas.addEventListener('touchmove', function (e) {
                    $this.handlerTouch(e);
                }, false);
                this.canvas.addEventListener('touchend', function (e) {
                    $this.handlerTouch(e);
                }, false);
            } else {
                this.canvas.addEventListener('mousedown', function (e) {
                    $this.handlerTouch(e);
                }, false);
                this.canvas.addEventListener('mousemove', function (e) {
                    $this.handlerTouch(e);
                }, false);
                this.canvas.addEventListener('mouseup', function (e) {
                    $this.handlerTouch(e);
                }, false);
            }
        },
        hint: function () {
            if (this.status) {
                var result = this.computerPlay(this.status);
                if (!result && (this.playerType === 1 && this.status === 2 || this.playerType === 2 && this.status === 1)) {
                    this.computerPlay(this.status);
                }
            }
        },
        undo: function () {//悔棋
            if (this.history.length > 0) {
                var len = this.history.length;
                if (this.history[len - 1][0] == this.playerType || this.playerType==3) 
                    this.removeChess([this.history[len - 1]]);
                else if (len > 1)
                    this.removeChess([this.history[len - 1], this.history[len - 2]]);
            }
        },
        removeChess:function(last){
            for(var i=0,len=last.length;i<len;i++){
                var m=last[i];
                this.chess[m[1]][m[2]] = 0;
                this.history.splice(this.history.length - 1, 1);//删除最后一子
                this.status = m[0];
            }
            this.refresh(true);
        },
        addChess: function (x, y, chessType) {//落子
            this.history.push([chessType, x, y]);
            this.chess[x][y] = this.status;
            this.status = this.status == 1 ? 2 : 1;
            this.refresh(true);
        },
        computerPlay: function (chessType) {
            var position = ComputerAI.getPosition(this.chess,chessType);
            if (position)
                this.addChess(position[0], position[1], chessType);
            //检查输赢
            var result = this.checkWin();
            this.getResult(result);
            return result;
        },
        drawMask: function () {
            //半透明遮罩
            this.ctx.beginPath();
            var grd = this.ctx.createLinearGradient(0, 0, this.width, this.height);
            grd.addColorStop(0, "rgba(0,0,0,.8)");
            this.ctx.fillStyle = grd;
            this.ctx.fillRect(0, 0, this.width, this.height);
        },
        startMenu: function () {
            this.drawMask();
            //设置菜单按钮
            var width = this.lineHeight * 5, height = this.lineHeight, padding = (this.height - (2 * 3 - 1) * this.lineHeight) / 2;

            this.btnList = [];
            this.drawButton((this.width - width) / 2, padding, width, height, 'Player vs Computer', 'player1');
            this.drawButton((this.width - width) / 2, padding + this.lineHeight * 2, width, height, 'Computer vs Player', 'player2');
            this.drawButton((this.width - width) / 2, padding + this.lineHeight * 4, width, height, 'Player vs Player', 'player3');
        },
        getResult: function (winner) {//结局
            if (winner) {
                this.drawMask();
                this.status = 0;//结束
                //设置按钮
                var width = this.lineHeight * 3, height = this.lineHeight, padding = (this.height - (2 * 3 - 1) * this.lineHeight) / 2;
                this.btnList = [];
                if (this.playerType === 1 || this.playerType === 2) {
                    if (winner === this.playerType) {//你赢了
                        this.drawButton((this.width - width) / 2, padding, width, height, 'Congratulations! You win!');
                    } else {
                        this.drawButton((this.width - width) / 2, padding, width, height, 'Regrets! You lost!');
                    }
                } else {
                    if (winner === 1) {
                        this.drawButton((this.width - width) / 2, padding, width, height, 'Congratulations! Black win!');
                    } else if (winner === 2) {
                        this.drawButton((this.width - width) / 2, padding, width, height, 'Congratulations! White win!');
                    }
                }
                this.drawButton((this.width - width) / 2, padding + this.lineHeight * 2, width, height, 'Restart', 'restart');
                this.drawButton((this.width - width) / 2, padding + this.lineHeight * 4, width, height, 'ReBack', 'reback');
            }
        },
        drawControl: function () {
            var width = this.lineHeight * 2, height = this.lineHeight, padding = width / 2;

            this.btnList = [];
            this.drawButton(padding, this.height - this.padding - height, width, height, 'Undo', 'undo');
            this.drawButton(width + padding * 2, this.height - this.padding - height, width, height, 'Hint', 'hint');
            this.drawButton(width * 2 + padding * 3, this.height - this.padding - height, width, height, 'Restart', 'restart');
        },
        drawButton: function (pixelX, pixelY, width, height, txt, eventName, options) {
            if (eventName) {
                this.btnList.push([pixelX, pixelY, pixelX + width, pixelY + height, eventName]);
                //按钮背景
                this.ctx.beginPath();
                var grd = this.ctx.createLinearGradient(0, 0, this.width, this.height);
                grd.addColorStop(0, "#cb840e");
                this.ctx.fillStyle = grd;
                this.ctx.arc(50, 50, 50, 0, 2 * Math.PI);
                this.ctx.fillRect(pixelX, pixelY, width, height);
            }
            //按钮文字
            this.ctx.beginPath();
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            this.ctx.fillStyle = "#fff";
            this.ctx.font = this.font + "px Arial";
            if (options && options.hasOwnProperty('textAlign'))
                this.ctx.textAlign = options.textAlign;
            if (options && options.hasOwnProperty('color'))
                this.ctx.fillStyle = options.color;
            if (options && options.hasOwnProperty('font'))
                this.ctx.fillStyle = options.font + "px Arial";
            if (options && options.hasOwnProperty('shadowColor')) {
                this.ctx.shadowOffsetX = 2;
                this.ctx.shadowOffsetY = 2;
                this.ctx.shadowBlur =2;
                this.ctx.shadowColor = options.shadowColor;  //or use rgb(red, green, blue)
            }
            this.ctx.fillText(txt, pixelX + width / 2, pixelY + height / 2);
            if (options && options.hasOwnProperty('shadowColor')) {
                //取消阴影设定
                this.ctx.shadowOffsetX = 0;
                this.ctx.shadowOffsetY = 0;
                this.ctx.shadowBlur = 0;
            }
        },
        drawChessBoard: function () {//设定460*460(棋盘：背景、边框、坐标)
            this.ctx.beginPath();
            //背景色
            var grd = this.ctx.createLinearGradient(0, 0, this.width, this.height);
            grd.addColorStop(0, this.background[0]);
            grd.addColorStop(1, this.background[this.background.length - 1]);
            this.ctx.fillStyle = grd;
            this.ctx.fillRect(0, 0, this.width, this.height);
            //坐标
            this.ctx.strokeStyle = this.axisColor;
            this.ctx.lineWidth = this.lineWidth;
            for (var i = 0; i < 15; i++) {
                this.ctx.moveTo(this.padding + .5 + i * this.lineHeight, this.positionY + this.padding - .5);
                this.ctx.lineTo(this.padding + .5 + i * this.lineHeight, this.positionY + this.chessHeight - this.padding - .5);
                this.ctx.moveTo(this.padding + .5, this.positionY + this.padding + i * this.lineHeight - .5);
                this.ctx.lineTo(this.chessWidth - this.padding + .5, this.positionY + this.padding + i * this.lineHeight - .5);
            }
            this.ctx.stroke();
            //边框
            this.ctx.beginPath();
            this.ctx.strokeStyle = this.lineColor; // 边框颜色
            this.ctx.lineWidth = this.lineWidth * 5;//线条粗细
            this.ctx.moveTo(.5, this.positionY + .5);
            this.ctx.lineTo(this.chessWidth - .5, this.positionY + .5);
            this.ctx.lineTo(this.chessWidth - .5, this.positionY + this.chessHeight - .5);
            this.ctx.lineTo(.5, this.positionY + this.chessHeight - .5);
            this.ctx.closePath();
            this.ctx.stroke();

            //四个点
            function drawPoint(obj, x, y) {
                obj.ctx.beginPath();
                obj.ctx.fillStyle = "#543201";
                obj.ctx.arc(obj.padding + .5 + x * obj.lineHeight, obj.padding + .5 + y * obj.lineHeight + obj.positionY, obj.chessRadius * .4, 0, Math.PI * 2, true);
                obj.ctx.fill();
            };
            drawPoint(this, 3, 3),
            drawPoint(this, 12, 3),
            drawPoint(this, 3, 12),
            drawPoint(this, 12, 12);
        },
        drawChess: function (x, y, chessType, isSign) {//绘制棋子
            var pixelX = this.padding + .5 + x * this.lineHeight;
            var pixelY = this.padding + .5 + y * this.lineHeight + this.positionY;
            this.ctx.beginPath();
            this.ctx.arc(pixelX, pixelY, this.chessRadius, 0, 2 * Math.PI);//画圆
            //渐变
            var gradient = this.ctx.createRadialGradient(pixelX + 2, pixelY - 2, this.chessRadius - 2, pixelX - 2, pixelY - 2, 0);

            if (chessType === 1) {
                gradient.addColorStop(0, this.chessColor[0][0]);
                gradient.addColorStop(1, this.chessColor[0][1]);
            } else if (chessType === 2) {
                gradient.addColorStop(0, this.chessColor[1][0]);
                gradient.addColorStop(1, this.chessColor[1][1]);
            }
            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            //定位标识
            if (isSign) {
                this.ctx.beginPath();
                this.ctx.strokeStyle = 'red'; // 边框颜色
                this.ctx.lineWidth = this.lineWidth;//线条粗细
                this.ctx.moveTo(pixelX - this.lineHeight / 5, pixelY);
                this.ctx.lineTo(pixelX + this.lineHeight / 5, pixelY);
                this.ctx.moveTo(pixelX, pixelY - this.lineHeight / 5);
                this.ctx.lineTo(pixelX, pixelY + this.lineHeight / 5);
                this.ctx.stroke();
            }
        },
        checkWin: function () {
            //赢法数组
            var wins = [];
            for (var i = 0; i < 15; i++) {
                wins[i] = [];
                for (var j = 0; j < 15; j++) {
                    wins[i][j] = [];
                }
            }
            //横线赢法（—）
            for (var i = 0; i < 11; i++) {
                for (var j = 0; j < 15; j++) {
                    if (this.chess[i][j]) {
                        //第一颗
                        wins[i][j] = this.chess[i][j];
                        for (var k = 1; k < 5; k++) {
                            if (wins[i][j] === this.chess[i + k][j]) {
                                if (k == 4)
                                    return wins[i][j];
                            } else
                                break;
                        }
                    }
                }
            }
            //竖线赢法（|）
            for (var i = 0; i < 15; i++) {
                for (var j = 0; j < 11; j++) {
                    if (this.chess[i][j]) {
                        //第一颗
                        wins[i][j] = this.chess[i][j];
                        for (var k = 1; k < 5; k++) {
                            if (wins[i][j] === this.chess[i][j + k]) {
                                if (k == 4)
                                    return wins[i][j];
                            } else
                                break;
                        }
                    }
                }
            }
            //正斜（/：从上至下）
            for (var i = 4; i < 15; i++) {
                for (var j = 0; j < 11; j++) {
                    if (this.chess[i][j]) {
                        //第一颗
                        wins[i][j] = this.chess[i][j];
                        for (var k = 1; k < 5; k++) {
                            if (wins[i][j] === this.chess[i - k][j + k]) {
                                if (k == 4)
                                    return wins[i][j];
                            } else
                                break;
                        }
                    }
                }
            }
            //反斜（\：从上至下）
            for (var i = 0; i < 11; i++) {
                for (var j = 0; j < 11; j++) {
                    if (this.chess[i][j]) {
                        //第一颗
                        wins[i][j] = this.chess[i][j];
                        for (var k = 1; k < 5; k++) {
                            if (wins[i][j] === this.chess[i + k][j + k]) {
                                if (k == 4)
                                    return wins[i][j];
                            } else
                                break;
                        }
                    }
                }
            }
            return 0;
        },
    };
    /**五子棋AI (参考：http://blog.csdn.net/show_me_the_world/article/details/48886027)
 *思路：对棋盘上的每一个空格进行估分，电脑优先在分值高的点落子 
 * 棋型： 
 * 〖五连〗只有五枚同色棋子在一条阳线或阴线上相邻成一排 
 * 〖成五〗含有五枚同色棋子所形成的连，包括五连和长连。 
 * 〖活四〗有两个点可以成五的四。 
 * 〖冲四〗只有一个点可以成五的四。 
 * 〖死四〗不能成五的四。 
 * 〖三〗在一条阳线或阴线上连续相邻的5个点上只有三枚同色棋子的棋型。 
 * 〖活三〗再走一着可以形成活四的三。 
 * 〖连活三〗即：连的活三（同色棋子在一条阳线或阴线上相邻成一排的活三）。简称“连三”。 
 * 〖跳活三〗中间隔有一个空点的活三。简称“跳三”。 
 * 〖眠三〗再走一着可以形成冲四的三。 
 * 〖死三〗不能成五的三。 
 * 〖二〗在一条阳线或阴线上连续相邻的5个点上只有两枚同色棋子的棋型。 
 * 〖活二〗再走一着可以形成活三的二。 
 * 〖连活二〗即：连的活二（同色棋子在一条阳线或阴线上相邻成一排的活二）。简称“连二”。 
 * 〖跳活二〗中间隔有一个空点的活二。简称“跳二”。 
 * 〖大跳活二〗中间隔有两个空点的活二。简称“大跳二”。 
 * 〖眠二〗再走一着可以形成眠三的二。 
 * 〖死二〗不能成五的二。 
 * 〖先手〗对方必须应答的着法，相对于先手而言，冲四称为“绝对先手”。 
 * 〖三三〗一子落下同时形成两个活三。也称“双三”。 
 * 〖四四〗一子落下同时形成两个冲四。也称“双四”。 
 * 〖四三〗一子落下同时形成一个冲四和一个活三。 
 * 分值表 
 * 成5:100000分 
 * 活4：10000分 
 * 活3+冲4:5000分 
 * 眠3+活2：2000分 
 * 眠2+眠1:1分 
 * 死棋即不能成5的是0分 
 * @return {[type]} [description] 
 */
    var ComputerAI = {
        getPosition: function (chess,chessType) {
            this.chess = chess;
            var a = new Array(2);
            var score = 0;
            for (var x = 0; x < 15; x++) {
                for (var y = 0; y < 15; y++) {
                    if (this.chess[x][y] === 0) {
                        var _score = this.judge(x, y, chessType);
                        if (_score > score || (x === 7 && y === 7 && _score == score)) {//持黑先走优先落中间,
                            score = _score;
                            a[0] = x;
                            a[1] = y;
                        }
                    }
                }
            }
            return a;
        },
        judge: function (x, y, chessType) {
            var a = parseInt(this.leftRight(x, y, 1)) + parseInt(this.topBottom(x, y, 1)) + parseInt(this.rightBottom(x, y, 1)) + parseInt(this.rightTop(x, y, 1)); //判断黑棋走该位置的得分
            var b = parseInt(this.leftRight(x, y, 2)) + parseInt(this.topBottom(x, y, 2)) + parseInt(this.rightBottom(x, y, 2)) + parseInt(this.rightTop(x, y, 2)) + 100; //判断白棋走该位置的得分
            //优先该回合的落子成五(黑子走，并能成5)
            if (a > 100000 && chessType === 1)
                a = a * 2;
            else if (b > 100000 && chessType === 2)
                b = b * 2;
            var result = a + b;
            // console.log("我计算出了" + x + "," + y + "这个位置的得分为" + result);  
            return result; //返回黑白棋下该位置的总和  
        },
        leftRight: function (x, y, num) {
            var death = 0; //0表示两边都没堵住,且可以成5，1表示一边堵住了，可以成5,2表示是死棋，不予考虑  
            var live = 0;
            var count = 0;
            var arr = new Array(15);
            for (var i = 0; i < 15; i++) {
                arr[i] = new Array(15);
                for (var j = 0; j < 15; j++) {
                    arr[i][j] = this.chess[i][j];
                }
            }
            arr[x][y] = num;
            for (var i = x; i >= 0; i--) {
                if (arr[i][y] == num) {
                    count++;
                } else if (arr[i][y] == 0) {
                    live += 1; //空位标记  
                    i = -1;
                } else {
                    death += 1; //颜色不同是标记一边被堵住  
                    i = -1;
                }
            }
            for (var i = x; i <= 14; i++) {
                if (arr[i][y] == num) {
                    count++;
                } else if (arr[i][y] == 0) {
                    live += 1; //空位标记  
                    i = 100;
                } else {
                    death += 1;
                    i = 100;
                }
            }
            count -= 1;
            // console.log(x + "," + y + "位置上的左右得分为" + model(count, death));  
            return this.model(count, death);
        },
        topBottom: function (x, y, num) {
            var death = 0; //0表示两边都没堵住,且可以成5，1表示一边堵住了，可以成5,2表示是死棋，不予考虑  
            var live = 0;
            var count = 0;
            var arr = new Array(15);
            for (var i = 0; i < 15; i++) {
                arr[i] = new Array(15);
                for (var j = 0; j < 15; j++) {
                    arr[i][j] = this.chess[i][j];
                }
            }
            arr[x][y] = num;
            for (var i = y; i >= 0; i--) {
                if (arr[x][i] == num) {
                    count++;
                } else if (arr[x][i] == 0) {
                    live += 1; //空位标记  
                    i = -1;
                } else {
                    death += 1;
                    i = -1;
                }
            }
            for (var i = y; i <= 14; i++) {
                if (arr[x][i] == num) {
                    count++;
                } else if (arr[x][i] == 0) {
                    live += 1; //空位标记  
                    i = 100;
                } else {
                    death += 1;
                    i = 100;
                }
            }
            count -= 1;
            // console.log(x + "," + y + "位置上的上下斜得分为" + model(count, death));  
            return this.model(count, death);
        },
        rightBottom: function (x, y, num) {
            var death = 0; //0表示两边都没堵住,且可以成5，1表示一边堵住了，可以成5,2表示是死棋，不予考虑  
            var live = 0;
            var count = 0;
            var arr = new Array(15);
            for (var i = 0; i < 15; i++) {
                arr[i] = new Array(15);
                for (var j = 0; j < 15; j++) {
                    arr[i][j] = this.chess[i][j];
                }
            }
            arr[x][y] = num;
            for (var i = x, j = y; i >= 0 && j >= 0;) {
                if (arr[i][j] == num) {
                    count++;
                } else if (arr[i][j] == 0) {
                    live += 1; //空位标记  
                    i = -1;
                } else {
                    death += 1;
                    i = -1;
                }
                i--;
                j--;
            }
            for (var i = x, j = y; i <= 14 && j <= 14;) {
                if (arr[i][j] == num) {
                    count++;
                } else if (arr[i][j] == 0) {
                    live += 1; //空位标记  
                    i = 100;
                } else {
                    death += 1;
                    i = 100;
                }
                i++;
                j++;
            }
            count -= 1;
            // console.log(x + "," + y + "位置上的右下斜得分为" + model(count, death));  
            return this.model(count, death);
        },
        rightTop: function (x, y, num) {
            var death = 0; //0表示两边都没堵住,且可以成5，1表示一边堵住了，可以成5,2表示是死棋，不予考虑  
            var live = 0;
            var count = 0;
            var arr = new Array(15);
            for (var i = 0; i < 15; i++) {
                arr[i] = new Array(15);
                for (var j = 0; j < 15; j++) {
                    arr[i][j] = this.chess[i][j];
                }
            }
            arr[x][y] = num;
            for (var i = x, j = y; i >= 0 && j <= 14;) {
                if (arr[i][j] == num) {
                    count++;
                } else if (arr[i][j] == 0) {
                    live += 1; //空位标记  
                    i = -1;
                } else {
                    death += 1;
                    i = -1;
                }
                i--;
                j++;
            }
            for (var i = x, j = y; i <= 14 && j >= 0;) {
                if (arr[i][j] == num) {
                    count++;
                } else if (arr[i][j] == 0) {
                    live += 1; //空位标记  
                    i = 100;
                } else {
                    death += 1;
                    i = 100;
                }
                i++;
                j--;
            }
            count -= 1;
            // console.log(x + "," + y + "位置上的右上斜得分为" + model(count, death));  
            return this.model(count, death);
        },
        model: function (count, death) {
            /**罗列相等效果的棋型(此处只考虑常见的情况，双成五，双活四等少概率事件不考虑) 
 * 必胜棋：成五=活四==双活三=冲四+活三=双冲四 */
            // console.log("count" + count + "death" + death);  
            var LEVEL_ONE = 0;//单子  
            var LEVEL_TWO = 1;//眠2，眠1  
            var LEVEL_THREE = 1500;//眠3，活2  
            var LEVEL_FOER = 4000;//冲4，活3  
            var LEVEL_FIVE = 10000;//活4  
            var LEVEL_SIX = 100000;//成5  
            if (count == 1 && death == 1) {
                return LEVEL_TWO; //眠1  
            } else if (count == 2) {
                if (death == 0) {
                    return LEVEL_THREE; //活2  
                } else if (death == 1) {
                    return LEVEL_TWO; //眠2  
                } else {
                    return LEVEL_ONE; //死棋  
                }
            } else if (count == 3) {
                if (death == 0) {
                    return LEVEL_FOER; //活3  
                } else if (death == 1) {
                    return LEVEL_THREE; //眠3  
                } else {
                    return LEVEL_ONE; //死棋  
                }
            } else if (count == 4) {
                if (death == 0) {
                    return LEVEL_FIVE; //活4  
                } else if (death == 1) {
                    return LEVEL_FOER; //冲4  
                } else {
                    return LEVEL_ONE; //死棋  
                }
            } else if (count == 5) {
                return LEVEL_SIX; //成5  
            }
            return LEVEL_ONE;
        }
    };
    function goBang(el, options) {
        if (el) {
            var _goBang = new GoBang(typeof (el) == 'object' && el.length ? el[0] : el, options);
        }
    };
    window.goBang = goBang;
})();

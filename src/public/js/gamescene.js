
export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' })
    }
    
    preload() {
        // preload board images
        this.load.image('boardCol', 'images/boardCol.png');
        this.load.html("form", "images/form.html");
    }
    
    create() {
        // declare variables to be used later on
        let self = this;
        this.isPlayerA = false;
        this.isMyTurn = false;
        this.logicalBoard = {
            col0: [], col1: [], col2: [], col3: [], col4: [], col5: [], col6: []
        }
        // x and y values for board locations
        this.xVals = [147,228,308,388,468,548,628];
        this.yVals = [551,471,391,311,231,151];
        this.boardCols = [];
        this.preview = [];
        this.socket = io();
        this.gameOver = false;
        this.turnIndicator;
        this.turnText;
        this.chatMessages = [];

        // when 'isPlayerA' is emitted from server, set that player to player A(red)
        this.socket.on('isPlayerA', (coinFlip) => {
            self.isPlayerA = true;
        });

        // socket event determines whose turn it is based on the random coin flip (0 or 1)
        this.socket.on('whoseTurn', (coinFlip) => {
            // if coin flip is 0, red goes first
            if (coinFlip === 0 ){
                if (self.isPlayerA){
                    self.isMyTurn = true;
                    console.log('red goes first');
                }
            }
            // if coin flip is 1, yellow goes first
            else if(coinFlip === 1 ){
                if (self.isPlayerA === false){
                    self.isMyTurn = true;
                    console.log('yellow goes first');
                }
            }
            let tempName = coinFlip === 0 ? 'Red' : 'Yellow';
            self.turnIndicator = this.add.rectangle(50,60,20,20, coinFlip === 0 ? 0xff0000 : 0xffff00 );
            self.turnText = this.add.text(20,20,'Turn:',{ fontSize: 26 });
            this.chatMessages.push('Game started! ' + tempName);
            this.chatMessages.push('goes first!');
            this.chat.setText(this.chatMessages);
        });

        // when a move is made, render disk in the appropriate color and add to logical board
        this.socket.on('moveMade', (moveCol, wasPlayerA, roomId) => {
            if (this.gameOver === false){
                this.renderDisk(moveCol, wasPlayerA);
                this.getBoardFromCol(moveCol).push(wasPlayerA === true ? 'r' : 'y');
                this.checkDiagonal();
                this.checkVerticalAndHorizontal();
                // flip turn indicator color here
                this.turnIndicator.fillColor = this.turnIndicator.fillColor === 0xffff00 ? 0xff0000 : 0xffff00;
                if (self.isMyTurn){
                    self.isMyTurn = false;
                }
                else{
                    self.isMyTurn = true;
                }
            }
        });

        this.socket.on('gameOver', (winner) => {
            let winnerText = winner + ' won!';
            self.add.text(275,50,winnerText,{ fontSize: 36 });
            self.gameOver = true;
        });

        // create sprites for each board column and set them as interactive
        for (var i = 0; i < 7; i++){
            this.boardCols[i] = this.add.sprite(this.xVals[i],350,'boardCol').setInteractive();
        }

        // create chat elements onscreen
        this.inputForm = this.add.dom(795,535).createFromCache("form");
        this.chat = this.add.text(685, 110, "", { lineSpacing: 15, backgroundColor: "#303030", color: "#FFFFFF", padding: 10, fontStyle: "bold", fontSize: 20 });
        this.chat.setFixedSize(300,440);
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.enterKey.on("down", event => {
            let chatbox = this.inputForm.getChildByName("chat");
            if (chatbox.value != "") {
                self.socket.emit('chatMsg', chatbox.value, self.isPlayerA);
                chatbox.value = "";
            }
        });

        // event for receiving a chat message from the server (originated from a player)
        this.socket.on('chatMsg', (message, wasPlayerA) => {
            let team = wasPlayerA === true ? '[r]:' : '[y]:';
            let chunks = Math.ceil(message.length / 16);
            let start = 0, end = 18;
            if (message.length > 20){
                for (i = 0; i < chunks; i++){
                    let tempMsg = (message.slice(start, end));
                    start += 18, end +=18;
                    if (tempMsg != ''){
                        if (i === 0){
                            this.chatMessages.push(team + tempMsg);
                        }
                        else{
                            this.chatMessages.push(tempMsg.trim());
                        }
                    }
                }
            }
            else{
                this.chatMessages.push(team + message);
            }
            
            if (this.chatMessages.length > 12) {
                let numLines = this.chatMessages.length - 12;
                for (let i = 0; i < numLines; i++){
                    this.chatMessages.shift();
                }
            }
            this.chat.setText(this.chatMessages);
        });


        // set event handlers for each column ---------------------------------------------------------------------------------------------------------------------
        // column 0 event listeners
        this.boardCols[0].on('pointerup', () => {
            // if column is not full, emit that a disk was dropped and the information
            if (self.logicalBoard.col0.length < 6 && self.isMyTurn) {
                var moveCol = 0;
                self.socket.emit('diskDropped', moveCol, self.isPlayerA);
            }
        });
        this.boardCols[0].on('pointerover', () => {
            // show preview on top of board when you hover over it
            self.preview[0] = this.add.circle(this.xVals[0], 70, 35, self.isPlayerA === true ? 0xff0000 : 0xffff00);
        });
        this.boardCols[0].on('pointerout', () => {
            // remove preview when pointer exits column
            self.preview[0].destroy();
        });
        // column 1 event listeners
        this.boardCols[1].on('pointerup', () => {
            // if column is not full, emit that a disk was dropped and the information
            if (self.logicalBoard.col1.length < 6 && self.isMyTurn) {
                var moveCol = 1;
                self.socket.emit('diskDropped', moveCol, self.isPlayerA);
            }
        });
        this.boardCols[1].on('pointerover', () => {
            // show preview on top of board when you hover over it
            self.preview[1] = this.add.circle(this.xVals[1], 70, 35, self.isPlayerA === true ? 0xff0000 : 0xffff00);
        });
        this.boardCols[1].on('pointerout', () => {
            // remove preview when pointer exits column
            self.preview[1].destroy();
        });
        // column 2 event listeners
        this.boardCols[2].on('pointerup', () => {
            if (self.logicalBoard.col2.length < 6 && self.isMyTurn) {
                var moveCol = 2;
                self.socket.emit('diskDropped', moveCol, self.isPlayerA);
            }
        });
        this.boardCols[2].on('pointerover', () => {
            // show preview on top of board when you hover over it
            self.preview[2] = this.add.circle(this.xVals[2], 70, 35, self.isPlayerA === true ? 0xff0000 : 0xffff00);
        });
        this.boardCols[2].on('pointerout', () => {
            // remove preview when pointer exits column
            self.preview[2].destroy();
        });
        // column 3 event listeners
        this.boardCols[3].on('pointerup', () => {
            // if column is not full, emit that a disk was dropped and the information
            if (self.logicalBoard.col3.length < 6 && self.isMyTurn) {
                var moveCol = 3;
                self.socket.emit('diskDropped', moveCol, self.isPlayerA);
            }
        });
        this.boardCols[3].on('pointerover', () => {
            // show preview on top of board when you hover over it
            self.preview[3] = self.add.circle(this.xVals[3] - 0.5, 70, 35, self.isPlayerA === true ? 0xff0000 : 0xffff00);
        });
        this.boardCols[3].on('pointerout', () => {
            // remove preview when pointer exits column
            self.preview[3].destroy();
        });
        // column 4 event listeners
        this.boardCols[4].on('pointerup', () => {
            // if column is not full, emit that a disk was dropped and the information
            if (self.logicalBoard.col4.length < 6 && self.isMyTurn) {
                var moveCol = 4;
                self.socket.emit('diskDropped', moveCol, self.isPlayerA);
            }
        });
        this.boardCols[4].on('pointerover', () => {
            // show preview on top of board when you hover over it
            self.preview[4] = self.add.circle(this.xVals[4], 70, 35, self.isPlayerA === true ? 0xff0000 : 0xffff00);
        });
        this.boardCols[4].on('pointerout', () => {
            // remove preview when pointer exits column
            self.preview[4].destroy();
        });
        // column 5 event listeners
        this.boardCols[5].on('pointerup', () => {
            // if column is not full, emit that a disk was dropped and the information
            if (self.logicalBoard.col5.length < 6 && self.isMyTurn) {
                var moveCol = 5;
                self.socket.emit('diskDropped', moveCol, self.isPlayerA);
            }
        });
        this.boardCols[5].on('pointerover', () => {
            // show preview on top of board when you hover over it
            self.preview[5] = self.add.circle(this.xVals[5], 70, 35, self.isPlayerA === true ? 0xff0000 : 0xffff00);
        });
        this.boardCols[5].on('pointerout', () => {
            // remove preview when pointer exits column
            self.preview[5].destroy();
        });
        // column 6 event listeners
        this.boardCols[6].on('pointerup', () => {
            // if column is not full, emit that a disk was dropped and the information
            if (self.logicalBoard.col6.length < 6 && self.isMyTurn) {
                var moveCol = 6;
                self.socket.emit('diskDropped', moveCol, self.isPlayerA);
            }
        });
        this.boardCols[6].on('pointerover', () => {
            // show preview on top of board when you hover over it
            self.preview[6] = self.add.circle(this.xVals[6], 70, 35, self.isPlayerA === true ? 0xff0000 : 0xffff00);
        });
        this.boardCols[6].on('pointerout', () => {
            // remove preview when pointer exits column
            self.preview[6].destroy();
        });

        // end event handlers -------------------------------------------------------------------------------------------------------------------------------------

        /*
        const turn = this.time.addEvent({
            callback: null,
            delay: 30000,
            callbackScope: this,
            loop: true,
        });
        */
    }

    // function adds circle on players screen following a turn in appropriate color and place
    renderDisk(moveCol, wasPlayerA){
        this.add.circle(this.xVals[moveCol] + -0.5, this.yVals[this.getBoardFromCol(moveCol).length], 35, wasPlayerA === true ? 0xff0000 : 0xffff00);
    }

    // function returns board column array when given column number
    getBoardFromCol(colNum){
        switch (colNum) {
            case 0:
                return this.logicalBoard.col0;
            case 1:
                return this.logicalBoard.col1;
            case 2:
                return this.logicalBoard.col2;
            case 3:
                return this.logicalBoard.col3;
            case 4:
                return this.logicalBoard.col4;
            case 5:
                return this.logicalBoard.col5;
            case 6:
                return this.logicalBoard.col6;
            default:
                return null;
        }
    }

    // check if either player has won diagonally
    checkDiagonal(){
        for (var i = 0; i < 7; i++){
            var col = this.getBoardFromCol(i);
            for (var j = 0; j < col.length ; j++){
                if (i < 3){
                    if (j < 3){
                        // check bottom 3 rows of first 3 columns
                        if (col[j] === 'r' && this.getBoardFromCol(i+1)[j+1] === 'r' && this.getBoardFromCol(i+2)[j+2] === 'r' && this.getBoardFromCol(i+3)[j+3] === 'r'){
                            // red won diagonally
                            this.socket.emit('gameOver', 'red');
                            this.gameOver = true;
                        }
                        else if(col[j] === 'y' && this.getBoardFromCol(i+1)[j+1] === 'y' && this.getBoardFromCol(i+2)[j+2] === 'y' && this.getBoardFromCol(i+3)[j+3] === 'y'){
                            // yellow won diagonally
                            this.socket.emit('gameOver', 'yellow');
                            this.gameOver = true;
                        }
                    }
                    // check top 3 rows of first 3 columns
                    else if (j >= 3){
                        if (col[j] === 'r' && this.getBoardFromCol(i+1)[j-1] === 'r' && this.getBoardFromCol(i+2)[j-2] === 'r' && this.getBoardFromCol(i+3)[j-3] === 'r'){
                            // red won diagonally
                            this.socket.emit('gameOver', 'red');
                            this.gameOver = true;
                        }
                        else if(col[j] === 'y' && this.getBoardFromCol(i+1)[j-1] === 'y' && this.getBoardFromCol(i+2)[j-2] === 'y' && this.getBoardFromCol(i+3)[j-3] === 'y'){
                            // yellow won diagonally
                            this.socket.emit('gameOver', 'yellow');
                            this.gameOver = true;
                        }
                    }
                }
                else if (i > 3){
                    if (j < 3){
                        if (col[j] === 'r' && this.getBoardFromCol(i-1)[j+1] === 'r' && this.getBoardFromCol(i-2)[j+2] === 'r' && this.getBoardFromCol(i-3)[j+3] === 'r') {
                            // red won diagonally
                            this.socket.emit('gameOver', 'red');
                            this.gameOver = true;
                        }
                        else if (col[j] === 'y' && this.getBoardFromCol(i-1)[j+1] === 'y' && this.getBoardFromCol(i-2)[j+2] === 'y' && this.getBoardFromCol(i-3)[j+3] === 'y') {
                            // yellow won diagonally
                            this.socket.emit('gameOver', 'yellow');
                            this.gameOver = true;
                        }
                    }
                    else if (j >= 3){
                        if (col[j] === 'r' && this.getBoardFromCol(i-1)[j+1] === 'r' && this.getBoardFromCol(i-2)[j+2] === 'r' && this.getBoardFromCol(i-3)[j+3] === 'r'){
                            // red won diagonally
                            this.socket.emit('gameOver', 'red');
                            this.gameOver = true;
                        }
                        else if (col[j] === 'y' && this.getBoardFromCol(i-1)[j+1] === 'y' && this.getBoardFromCol(i-2)[j+2] === 'y' && this.getBoardFromCol(i-3)[j+3] === 'y'){
                            // yellow won diagonally
                            this.socket.emit('gameOver', 'yellow');
                            this.gameOver = true;
                        }
                    }
                }
                
            }
        }
    };

    // check if either player has won vertically or horizontally
    checkVerticalAndHorizontal(){
        for (var i = 0; i < 7; i++){
            let col = this.getBoardFromCol(i);
            // check for horizontal wins 
            if (i < 4){
                for (var j = 0; j < col.length; j++){
                    if (col[j] === 'r' && this.getBoardFromCol(i+1)[j] === 'r' && this.getBoardFromCol(i+2)[j] === 'r' && this.getBoardFromCol(i+3)[j] === 'r'){
                        this.socket.emit('gameOver', 'red');
                        this.gameOver = true;
                    }
                    else if (col[j] === 'y' && this.getBoardFromCol(i+1)[j] === 'y' && this.getBoardFromCol(i+2)[j] === 'y' && this.getBoardFromCol(i+3)[j] === 'y'){
                        this.socket.emit('gameOver', 'yellow');
                        this.gameOver = true;
                    }
                }
            }
            // check for vertical wins
            if (col.length >= 4){
                for(var j = 0; j < 3; j++){
                    if (col[j] === 'r' && col[j+1] === 'r' && col[j+2] === 'r' && col[j+3] === 'r'){
                        this.socket.emit('gameOver', 'red');
                        this.gameOver = true;
                    }
                    else if (col[j] === 'y' && col[j+1] === 'y' && col[j+2] === 'y' && col[j+3] === 'y'){
                        this.socket.emit('gameOver', 'yellow');
                        this.gameOver = true;
                    }
                }
            }
        }
    }

}



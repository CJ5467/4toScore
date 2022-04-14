require("dotenv").config();
import express from "express";
import viewEngine from "./config/viewEngine";
import initWebRoutes from "./routes/web";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import connection from "./config/connectDB";


const app = express();

// load all game dependencies

const server = require('http').Server(app);

// create variables and object for rooms


let players = [];

const openRankedRooms = [];
const friendRooms = [];
const openRooms = [];
const activeRooms = [];
let gameRoom = {
    roomId: '',
    playerAId: '',
    playerBId: '',
    playerAUsername: '',
    playerBUsername: '',
    gameIsOver: null,
};



app.use(cookieParser("secret"));

//config session
const sessionMiddleware = session({
    secret: 'secret',
    resave: true,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 //86400000 1 day
    }
})

app.use(sessionMiddleware);


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//config view engine
viewEngine(app);

//config passport middleware
app.use(passport.initialize());
app.use(passport.session());

//init all web routes
initWebRoutes(app);

const crypto = require('crypto');
const io = require('socket.io')(server);
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
io.use(wrap(sessionMiddleware));
io.use(wrap(passport.initialize()));
io.use(wrap(passport.session()));

io.use((socket, next) => {
    if (socket.request.user) {
        console.log('CONNECT SOCKET TO PASSPORT WORKED');
        next();
    } else {
        next(new Error('unauthorized'));
    }
})

// game stuff
// do this if user connects

io.on('connection', async (socket) => {

    console.log('A user connected:' + socket.id);
    var url = socket.handshake.headers.referer;
    //console.log("THIS IS THE URL")
    //console.log(url);
    //console.log("BELOW IS USER's username")
    //console.log(socket.request.user.username);

    // if there are no rooms available to join
    // IF (current URL points to /unranked)
    if (url.includes('/unranked')) {
        // console.log("ITS UNRANKED");
        if (openRooms.length < 1) {
            // create new room, let socket join it, and set that player as red
            let newRoom = createNewRoom(socket, url);
            await socket.join(newRoom.roomId);
            io.to(socket.id).emit('isPlayerA');
        }
        else {
            // pick a random open room and join it
            let randomRoom = Math.floor(Math.random() * openRooms.length);
            if (socket.request.user.username != openRooms[randomRoom].playerAUsername){
                console.log(socket.request.user.username);
                console.log(openRooms[randomRoom].playerAUsername);
                await socket.join(openRooms[randomRoom].roomId);
                openRooms[randomRoom].playerBId = socket.id;
                openRooms[randomRoom].playerBUsername = socket.request.user.username;
                // do coin flip for whose turn it is, send that to client
                let coinFlip = Math.floor(Math.random() * 2);
                let roomId = openRooms[randomRoom].roomId;
                io.in(roomId).emit('whoseTurn', coinFlip, openRooms[randomRoom].playerAUsername, openRooms[randomRoom].playerBUsername );
                // add room to active rooms and remove it from the list of open rooms
                activeRooms.push(openRooms[randomRoom]);
                openRooms.splice(randomRoom);
            }
        }
    }
    else if (url.includes('/ranked')) {
        //  console.log('ITS RANKED');
        // CALL DATABASE TO GET RANK FOR CURRENT PLAYER on next line
        let currPlayerRankPoints = socket.request.user.user_rankpoints;
        if (openRankedRooms.length < 1) {
            //create new room, let socket join it, set this player as red
            let newRoom = createNewRoom(socket, url);
            newRoom.playerARankPoints = currPlayerRankPoints;
            await socket.join(newRoom.roomId);
            io.to(socket.id).emit('isPlayerA');
        }
        else {
            let diff, min;
            let index = 0;
            for (let i = 0; i < openRankedRooms.length; i++) {
                if (i === 0) {
                    min = Math.abs(openRankedRooms[i].playerARankPoints - currPlayerRankPoints);
                }
                diff = Math.abs(openRankedRooms[i].playerARankPoints - currPlayerRankPoints);
                if (diff < min) {
                    min = diff;
                    index = i;
                }
            }
            if (socket.request.user.username != openRankedRooms[index].playerAUsername){
                await socket.join(openRankedRooms[index].roomId);
                openRankedRooms[index].playerBId = socket.id;
                openRankedRooms[index].playerBUsername = socket.request.user.username;
                // do coin flip for whose turn it is, send that to client
                let coinFlip = Math.floor(Math.random() * 2);
                io.in(openRankedRooms[index].roomId).emit('whoseTurn', coinFlip, openRankedRooms[index].playerAUsername, openRankedRooms[index].playerBUsername);
                activeRooms.push(openRankedRooms[index]);
                openRankedRooms.splice(index);
            }
        }
    }
    /*
    else if (*play with friends*){
        let friendName = *name of friend searched for*;
        let roomIndex;
        let joining = false;
        if (friendRooms.length > 0){
            for (int i = 0; i < friendRooms.length; i++){
                if (friendRooms[i].playerAUsername === friendName){
                    roomIndex = i;
                    joining = true;
                }
            }
            if (joining){
                await socket.join(friendRooms[roomIndex].roomId);
                // do coin flip for whose turn it is, send that to client
                let coinFlip = Math.floor(Math.random() * 2);
                // will need to add player usernames accessible
                io.in(friendRooms[roomIndex].roomId).emit('whoseTurn', coinFlip, playerAUsername, playerBUsername);
                activeRooms.push(friendRooms[roomIndex]);
                friendRooms.splice(roomIndex);
            }
            else {
                //create new room, let socket join it, set this player as red
                let newRoom = createNewRoom(socket, url);
                await socket.join(newRoom.roomId);
                io.to(socket.id).emit('isPlayerA');
            }
        }
    }
        
    */
    players.push(socket.id);

    // when event is received, send it out to the room of the client it is from
    socket.on('diskDropped', function (moveCol, isPlayerA) {
        io.to(Array.from(socket.rooms)[1]).emit('moveMade', moveCol, isPlayerA);
    });

    socket.on('chatMsg', function (message, wasPlayerA) {
        io.to(Array.from(socket.rooms)[1]).emit('chatMsg', message, wasPlayerA);
    });

    socket.on('gameOver', (winner) => {
        let roomId = Array.from(socket.rooms)[1];
        let roomObj = getRoomObjFromId(socket.id, url);
        roomObj.gameIsOver = true;
        io.to(roomId).emit('gameOver', winner);
        if (socket.request.user.username === roomObj.playerAUsername && url.includes('/ranked')) {
            if (winner === 'red') {
                //IF RED/PLAYER A WINS UPDATE WINS, STREAK, & RANKPOINTS
                connection.query("UPDATE players SET user_wins=user_wins+1, user_streak=user_streak+1, user_rankpoints=user_rankpoints+20+(20*user_streak*.05) WHERE username=?", roomObj.playerAUsername, function (error, results) {
                    if (error) throw (error);
                    console.log("PLAYER A WINS UPDATED")
                })
                //AFTER UPDATE GET USER_DIVISION AND UPDATED USER_RANKPOINTS
                connection.query("SELECT user_division, user_rankpoints from players where username = ?", roomObj.playerAUsername, function (error, results) {
                    if (error) throw (error);
                    //UPDATE PLAYER A RANK TO BRONZE IF OVER 0 OR BELOW 0
                    if((results[0].user_rankpoints>=0 && results[0].user_rankpoints<250) || results[0].user_rankpoints<0){
                        connection.query("UPDATE players SET user_division='Bronze' WHERE username=?", roomObj.playerAUsername, function (error, results) {
                            if (error) throw (error);
                            console.log("PLAYER A RANK UPDATED")
                        })
                    }
                    //UPDATE PLAYER A RANK TO SILVER IF OVER OR EQUAL 250
                    else if(results[0].user_rankpoints>=250 && results[0].user_rankpoints<500){
                        connection.query("UPDATE players SET user_division='Silver' WHERE username=?", roomObj.playerAUsername, function (error, results) {
                            if (error) throw (error);
                            console.log("PLAYER A RANK UPDATED")
                        })
                    }
                    //UPDATE PLAYER A RANK TO GOLD IF OVER OR EQUAL 500
                    else if(results[0].user_rankpoints>=500){
                        connection.query("UPDATE players SET user_division='Gold' WHERE username=?", roomObj.playerAUsername, function (error, results) {
                            if (error) throw (error);
                            console.log("PLAYER A RANK UPDATED")
                        })
                    }
                    //UPDATE PLAYER A RANK TO DIAMOND IF OVER OR EQUAL 750
                    else if(results[0].user_rankpoints>=750){
                        connection.query("UPDATE players SET user_division='Diamond' WHERE username=?", roomObj.playerAUsername, function (error, results) {
                            if (error) throw (error);
                            console.log("PLAYER A RANK UPDATED")
                        })
                    }
                    //UPDATE PLAYER A RANK TO PLATINUM IF OVER OR EQUAL 1000
                    else if(results[0].user_rankpoints>=1000){
                        connection.query("UPDATE players SET user_division='Platinum' WHERE username=?", roomObj.playerAUsername, function (error, results) {
                            if (error) throw (error);
                            console.log("PLAYER A RANK UPDATED")
                        })
                    }
                })
                //SINCE RED/PLAYER A WON THEN YELLOW/PLAYER B LOST SO UPDATE LOSSES, STREAK, AND RANKPOINTS
                connection.query("UPDATE players SET user_losses=user_losses+1, user_streak=user_streak-1, user_rankpoints=user_rankpoints-20-(20*user_streak*.05)  WHERE username=?", roomObj.playerBUsername, function (error, results) {
                    if (error) throw (error);
                    console.log("PLAYER B LOSSES UPDATED")
                })
                //AFTER UPDATE GET USER_DIVISION & USER_RANKPOINTS
                connection.query("SELECT user_division, user_rankpoints from players where username = ?", roomObj.playerBUsername, function (error, results) {
                    if (error) throw (error);
                    //UPDATE PLAYER B RANK TO BRONZE IF NEEDED WHEN OVER OR EQUAL 0 OR WHEN BELOW 0
                    if(results[0].user_rankpoints>=0 || results[0].user_rankpoints<0){
                        connection.query("UPDATE players SET user_division='Bronze' WHERE username=?", roomObj.playerBUsername, function (error, results) {
                            if (error) throw (error);
                            console.log("PLAYER B RANK UPDATED")
                        })
                    }
                    //UPDATE PLAYER B RANK TO SILVER IF OVER OR EQUAL 250
                    else if(results[0].user_rankpoints>=250){
                        connection.query("UPDATE players SET user_division='Silver' WHERE username=?", roomObj.playerBUsername, function (error, results) {
                            if (error) throw (error);
                            console.log("PLAYER B RANK UPDATED")
                        })
                    }
                    //UPDATE PLAYER B RANK TO GOLD IF OVER OR EQUAL 500
                    else if(results[0].user_rankpoints>=500){
                        connection.query("UPDATE players SET user_division='Gold' WHERE username=?", roomObj.playerBUsername, function (error, results) {
                            if (error) throw (error);
                            console.log("PLAYER B RANK UPDATED")
                        })
                    }
                    //UPDATE PLAYER B RANK TO DIAMOND IF OVER OR EQUAL 750
                    else if(results[0].user_rankpoints>=750){
                        connection.query("UPDATE players SET user_division='Diamond' WHERE username=?", roomObj.playerBUsername, function (error, results) {
                            if (error) throw (error);
                            console.log("PLAYER B RANK UPDATED")
                        })
                    }
                    //UPDATE PLAYER B RANK TO PLATINUM IF OVER OR EQUAL 1000
                    else if(results[0].user_rankpoints>=1000){
                        connection.query("UPDATE players SET user_division='Platinum' WHERE username=?", roomObj.playerBUsername, function (error, results) {
                            if (error) throw (error);
                            console.log("PLAYER B RANK UPDATED")
                        })
                    }
                })    
            }
            //IF YELLOW/PLAYER B WINS UPDATE WINS, STREAK, & RANKPOINTS
            else if (winner === 'yellow') {
                connection.query("UPDATE players SET user_wins=user_wins+1, user_streak=user_streak+1, user_rankpoints=user_rankpoints+20+(20*user_streak*.05) WHERE username=?", roomObj.playerBUsername, function (error, results) {
                    if (error) throw (error);
                    console.log("PLAYER B WINS UPDATED")
                })
                //AFTER UPDATE GET USER_DIVISION & USER_RANKPOINTS
                connection.query("SELECT user_division, user_rankpoints from players where username = ?", roomObj.playerBUsername, function (error, results) {
                    if (error) throw (error);
                    //UPDATE PLAYER B RANK TO BRONZE IF NEEDED WHEN OVER OR EQUAL 0 OR WHEN BELOW 0
                    if(results[0].user_rankpoints>=0 || results[0].user_rankpoints<0){
                        connection.query("UPDATE players SET user_division='Bronze' WHERE username=?", roomObj.playerBUsername, function (error, results) {
                            if (error) throw (error);
                            console.log("PLAYER B RANK UPDATED")
                        })
                    }
                    //UPDATE PLAYER B RANK TO SILVER WHEN OVER OR EQUAL 250
                    else if(results[0].user_rankpoints>=250){
                        connection.query("UPDATE players SET user_division='Silver' WHERE username=?", roomObj.playerBUsername, function (error, results) {
                            if (error) throw (error);
                            console.log("PLAYER B RANK UPDATED")
                        })
                    }
                    //UPDATE PLAYER B RANK TO GOLD WHEN OVER OR EQUAL 500
                    else if(results[0].user_rankpoints>=500){
                        connection.query("UPDATE players SET user_division='Gold' WHERE username=?", roomObj.playerBUsername, function (error, results) {
                            if (error) throw (error);
                            console.log("PLAYER B RANK UPDATED")
                        })
                    }
                    //UPDATE PLAYER B RANK TO DIAMOND WHEN OVER OR EQUAL 750
                    else if(results[0].user_rankpoints>=750){
                        connection.query("UPDATE players SET user_division='Diamond' WHERE username=?", roomObj.playerBUsername, function (error, results) {
                            if (error) throw (error);
                            console.log("PLAYER B RANK UPDATED")
                        })
                    }
                    //UPDATE PLAYER B RANK TO PLATINUM WHEN OVER OR EQUAL 1000
                    else if(results[0].user_rankpoints>=1000){
                        connection.query("UPDATE players SET user_division='Platinum' WHERE username=?", roomObj.playerBUsername, function (error, results) {
                            if (error) throw (error);
                            console.log("PLAYER B RANK UPDATED")
                        })
                    }
                })
                //SINCE YELLOW/PLAYER B WON THEN RED/PLAYER A LOST SO UPDATE LOSSES, STREAK, AND RANKPOINTS
                connection.query("UPDATE players SET user_losses=user_losses+1, user_streak=user_streak-1 WHERE username=?", roomObj.playerAUsername, function (error, results) {
                    if (error) throw (error);
                    console.log("PLAYER A LOSSES UPDATED")
                })
                //AFTER UPDATE GET USER_DIVISION AND UPDATED USER_RANKPOINTS
                connection.query("SELECT user_division, user_rankpoints from players where username = ?", roomObj.playerAUsername, function (error, results) {
                    if (error) throw (error);
                    //UPDATE PLAYER A RANK TO BRONZE IF OVER 0 OR BELOW 0
                    if(results[0].user_rankpoints>=0 || results[0].user_rankpoints<0){
                        connection.query("UPDATE players SET user_division='Bronze' WHERE username=?", roomObj.playerAUsername, function (error, results) {
                            if (error) throw (error);
                            console.log("PLAYER A RANK UPDATED")
                        })
                    }
                    //UPDATE PLAYER A RANK TO SILVER IF OVER OR EQUAL 250
                    else if(results[0].user_rankpoints>=250){
                        connection.query("UPDATE players SET user_division='Silver' WHERE username=?", roomObj.playerAUsername, function (error, results) {
                            if (error) throw (error);
                            console.log("PLAYER A RANK UPDATED")
                        })
                    }
                    //UPDATE PLAYER A RANK TO GOLD IF OVER OR EQUAL 500
                    else if(results[0].user_rankpoints>=500){
                        connection.query("UPDATE players SET user_division='Gold' WHERE username=?", roomObj.playerAUsername, function (error, results) {
                            if (error) throw (error);
                            console.log("PLAYER A RANK UPDATED")
                        })
                    }
                    //UPDATE PLAYER A RANK TO DIAMOND IF OVER OR EQUAL 750
                    else if(results[0].user_rankpoints>=750){
                        connection.query("UPDATE players SET user_division='Diamond' WHERE username=?", roomObj.playerAUsername, function (error, results) {
                            if (error) throw (error);
                            console.log("PLAYER A RANK UPDATED")
                        })
                    }
                    //UPDATE PLAYER A RANK TO PLATINUM IF OVER OR EQUAL 1000
                    else if(results[0].user_rankpoints>=1000){
                        connection.query("UPDATE players SET user_division='Platinum' WHERE username=?", roomObj.playerAUsername, function (error, results) {
                            if (error) throw (error);
                            console.log("PLAYER A RANK UPDATED")
                        })
                    }
                })
            }
        }
        //UPDATE GAMES PLAYED FOR BOTH USERS
        connection.query("UPDATE players SET user_gamesplayed=user_gamesplayed+1 WHERE username=?", socket.request.user.username, function (error, results) {
            if (error) throw (error);
            console.log("GAMES PLAYED UPDATED")
        })
        
        // run database call to change stats based on who won **********************************************************
        /* check if it is a ranked match, if so grab the users' multipliers.  Add points to winner, subtract points
           from loser based on multiplier. */

    });
    socket.on('disconnect', () => {
        console.log('A user disconnected:' + socket.id);
        // call function to get the room object of the room that was left
        let leftRoomObj = getRoomObjFromId(socket.id, url);
        if (leftRoomObj != undefined) {
            // if the room was an open room, remove that from the open rooms array
            if (leftRoomObj.playerBId === null) {
                openRooms.splice([openRooms.indexOf(leftRoomObj)]);
            }
            else {
                // send to room: if player A left then B won, if B left then A won
                if (leftRoomObj.gameIsOver === false) {
                    io.to(leftRoomObj.roomId).emit('gameOver', leftRoomObj.playerAId === socket.id ? 'yellow' : 'red');
                }
                activeRooms.splice(activeRooms.indexOf(leftRoomObj));
            }
            players = players.filter(player => player !== socket.id);
        }
        // run database call to change stats based on who won *********************************************************
        /* check if it is a ranked match, if so grab the users' multipliers.  Add points to winner, subtract points
         from loser based on multiplier. */
    });
});




//server setup
let port = process.env.PORT || 8081;


server.listen(port, () => {
    console.log(`App is running at the ${port}`);
})



// create a new room object based around the socket rooms for the game
let createNewRoom = (socket, url) => {
    let a = Object.create(gameRoom);
    a.roomId = crypto.randomBytes(5).toString('hex');
    a.playerAId = socket.id;
    a.playerBId = null; a.playerAUsername = socket.request.user.username; a.playerBUsername = null; a.gameIsOver = false;
    a.playerARankPoints = socket.request.user.user_rankpoints;
    if (url.includes('/ranked')) {
        openRankedRooms.push(a);
    }
    else if (url.includes('/unranked')) {
        openRooms.push(a);
    }
    else if (url.includes('/playwithfriends')) {
        friendRooms.push(a);
    }
    return a;
}


let getRoomObjFromId = (sid, gameType) => {
    if (gameType.includes('/unranked')) {
        for (let i = 0; i < openRooms.length; i++) {
            if (openRooms[i].playerAId === sid || openRooms[i].playerBId === sid) {
                return openRooms[i];
            }
        }
        for (let i = 0; i < activeRooms.length; i++) {
            if (activeRooms[i].playerAId === sid || activeRooms[i].playerBId === sid) {
                return activeRooms[i];
            }
        }
    }
    else if (gameType.includes('/ranked')) {
        for (let i = 0; i < openRankedRooms.length; i++) {
            if (openRankedRooms[i].playerAId === sid || openRankedRooms[i].playerBId === sid) {
                return openRankedRooms[i];
            }
        }
        for (let i = 0; i < activeRooms.length; i++) {
            if (activeRooms[i].playerAId === sid || activeRooms[i].playerBId === sid) {
                return activeRooms[i];
            }
        }
    }
    else if (gameType.includes('/playwithfriends')) {
        for (let i = 0; i < friendRooms.length; i++) {
            if (friendRooms[i].playerAId === sid || friendRooms[i].playerBId === sid) {
                return friendRooms[i];
            }
        }
        for (let i = 0; i < activeRooms.length; i++) {
            if (activeRooms[i].playerAId === sid || activeRooms[i].playerBId === sid) {
                return activeRooms[i];
            }
        }
    }
}

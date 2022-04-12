import connection from "../config/connectDB";

let getUsers = (req, res) => {
    findPlayers(req.user.user_id, data => {
        var players = data;
        console.log(data);
        checkPlayers(req.user.user_id, data => {
            var friends = data;
            console.log(data);
            return res.render('searchplayers.ejs', {
                user: req.user, players, friends
            })
        })
        
    })
};



function findPlayers(user_id, callback) {
    connection.query("SELECT username, user_division, user_rankpoints, user_wins, user_losses, user_streak FROM players WHERE NOT(user_id = ?) ORDER BY username ASC", user_id, function (error, results) {
        var players = [];
        if (error) throw (error);
        for (let i = 0; i < results.length; i++) {
            players.push(results[i]);
        }
        callback(players);
    })
};

function checkPlayers(user_id, callback){
    connection.query("SELECT friend_username FROM friends where user_id = ?", user_id, function (error, results) {
        var friends = []; 
        if (error) throw (error);
        for( let j = 0; j < results.length; j++){
            friends.push(results[j]);
        }
        callback(friends);
    })
}



module.exports = {
    getUsers: getUsers
}
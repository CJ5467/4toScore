import connection from "../config/connectDB";

let getUsers = (req, res) => {
    findPlayers(req.user.user_id, data => {
        var players = data;
        //console.log(data);
        return res.render('leaderboard.ejs', {
            user: req.user, players
        })
    })
};



function findPlayers(user_id, callback) {
    connection.query("SELECT username, user_division, user_rankpoints, user_wins, user_losses, user_streak FROM players ORDER BY user_rankpoints DESC", user_id, function (error, results) {
        var players = [];
        if (error) throw (error);
        for (let i = 0; i < results.length; i++) {
            players.push(results[i]);
        }
        callback(players);
    })
};




module.exports = {
    getUsers: getUsers
}
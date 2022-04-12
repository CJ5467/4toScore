import connection from "../config/connectDB";

let getUserProfile = (req, res) => {
    findFriends(req.user.user_id, data => {
        var friends = data;
        console.log(data);
        return res.render("profile.ejs", {
            user: req.user, friends
        })
    });
};


function findFriends(user_id, callback) {
    connection.query("SELECT friend_username from friends where user_id = ?  ORDER BY friend_username ASC", user_id, function (error, friendname) {
        var friends = [];
        if (error) throw (error);
        for (let i = 0; i < friendname.length; i++) {
            friends.push(friendname[i].friend_username);
        }
        //console.log(friends);
        var stats = [];
        for (let j = 0; j < friends.length; j++) {
            let val = friends[j];
            connection.query("SELECT username, user_division, user_rankpoints, user_gamesplayed, user_wins, user_losses, user_streak from players where username = ?",
                val, function (error, results) {
                    if (error) throw (error);
                    stats.push(results[0]);
                    //console.log(stats);
                    if(j==friends.length-1){
                        callback(stats);
                    }
            })
        }
    })
};


module.exports = {
    getUserProfile: getUserProfile
};
import connection from "../config/connectDB";
//shows friends in friends list on website
/*
To add a friend:
1. User searches for friends through a table that shows all users
created EXCEPT THEIR OWN SINCE THEY CANT FRIEND THEMSELF
2. User has found friends and presses add friend button
3. Said friend is entered into friends table and is assigned
the user_id that added them as a friend.

To Remove a friend: 
1. User searches their friends list to find friend they want to remove.
This performs a query using the user's user_id to get their friends.
2. User has found friend and presses remove friend button.
3. Said friend is removed from friends table by finding them by username and
user_id they are assigned to. 
*/


let getFriendsList = (req, res) => {
    findFriends(req.user.user_id, data => {
        var friends = data;
        //console.log(data);
        return res.render("friends.ejs", {
            user: req.user, friends
        })
    });
};


function findFriends(user_id, callback) {
    var friends = [];
    var stats = [];
    connection.query("SELECT friend_username from friends where user_id = ?", user_id, function (error, friendname) {
        if (error) throw (error);
        for (var i = 0; i < friendname.length; i++) {
            friends.push(friendname[i].friend_username);
        }
        console.log(friends);
    });
    
    for (var j = 0; j < friends.length; j++) {
        connection.query("SELECT username, user_division, user_rankpoints, user_gamesplayed, user_wins, user_losses from players where username = ?",
            friends[j], function (error, results) {
                if (error) throw (error);
                for (var k = 0; k < results.length; k++) {
                    stats.push(results[k]);
                    console.log(stats);
                }

        })
    }
    //callback(stats);

}


module.exports = {
    getFriendsList: getFriendsList
};
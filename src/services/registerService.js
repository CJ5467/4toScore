import connection from "../config/connectDB";
import bcrypt from "bcryptjs";

let createNewUser = (user) => {
    return new Promise( async (resolve, reject) => {
        try {
            let checkEmail = await checkEmailUser(user.email);
            let checkUsername = await checkUsernameUser(user.username);
            if (checkEmail === false && checkUsername === false) {

                //hash user's password
                let salt = bcrypt.genSaltSync(10);
                let data = {
                    user_firstname: user.fname,
                    user_lastname: user.lname,
                    user_email: user.email,
                    username: user.username,
                    user_password: bcrypt.hashSync(user.password, salt)
                };

                //create a new user
                connection.query("INSERT INTO players set ?", data, function (error, rows) {
                    if (error) reject(error);
                    resolve("create a new user successfully");
                })

                //set basic rank and rankpoints for that user
                connection.query("UPDATE players SET user_division='Bronze', user_rankpoints=0 WHERE username = ?", user.username, function (error, rows) {
                    if (error) throw(error);
                })
            }
            if(checkEmail===true)
                reject(`The email ${user.email} already exists. Please choose another email.`)
            if(checkUsername===true)
                reject(`This username ${user.username} already exists. Please choose another username.`)

        } catch (e) {
            reject(e);
        }
    });
};

let checkEmailUser = (email) => {
    return new Promise((resolve, reject) => {
        try {
            connection.query("SELECT * FROM players WHERE user_email =?", email, function (error, rows) {
                if (error) reject(error);
                if (rows.length > 0) resolve(true);
                resolve(false);
            })
        } catch (e) {
            reject(e);
        }
    })
}

let checkUsernameUser = (username) => {
    return new Promise((resolve, reject) => {
        try {
            connection.query("SELECT * from players where username = ?", username, function (error, rows) {
                if(error) reject(error);
                if (rows.length > 0) resolve(true);
                resolve(false);
            })
        } catch (e) {
            reject(e);
        }
    })
}


module.exports = {
    createNewUser: createNewUser
};
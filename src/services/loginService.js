import connection from "../config/connectDB";
import bcrypt from "bcryptjs";

let findUserByUsername = (username) => {
    return new Promise( (resolve, reject) => {
        try{
            connection.query("SELECT * from players where username = ?", username, function(error, rows) {
                if(error) reject(error);
                let user = rows[0];
                resolve(user);
            });
        } catch (e) {
            reject(e);
        }
    })
};

let compareUserPassword = (user, user_password) => {
    return new Promise( async (resolve, reject) => {
        try{
            let match = await bcrypt.compare(user_password, user.user_password);
            if(match) resolve(true);
            else resolve("The password that you've entered is incorrect");
        } catch (e) {
            reject(e);
        }
    })
};

let findUserById = (user_id) => {
    return new Promise( (resolve, reject) => {
        try{
            connection.query("SELECT * from players where user_id = ?", user_id, function(error, rows) {
                if(error) reject(error);
                let user = rows[0];
                resolve(user);
            });
        } catch (e) {
            reject(e);
        }
    })
};

module.exports = {
    compareUserPassword: compareUserPassword,
    findUserByUsername: findUserByUsername,
    findUserById: findUserById
};
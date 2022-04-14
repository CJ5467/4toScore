require("dotenv").config();
import mysql from "mysql2";

let connection = mysql.createConnection( {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD
});

connection.connect( () => {
    console.log("Mysql connected....");
});

module.exports = connection;
import express from "express";
import registerController from "../controllers/registerController";
import loginController from "../controllers/loginController";
import homePageController from "../controllers/homePageController";
import userProfileController from "../controllers/userProfileController";
import staticPagesController from "../controllers/staticPagesController";
import initPassportLocal from "../controllers/passportLocalController";
import gameModesController from "../controllers/gameModesController";
import leaderboardController from "../controllers/leaderboardController";

/*
init passport routes
*/
initPassportLocal();

let router = express.Router();

let initWebRoutes = (app) => {
    router.get("/", loginController.checkLoggedIn, homePageController.getHomePage);
    router.post("/logout", loginController.postLogOut);

    router.get("/register", registerController.getRegisterPage);
    router.post("/register-new-user", registerController.createNewUser);

    router.get("/login", loginController.checkLoggedOut, loginController.getLoginPage);
    router.post("/login", loginController.handleLogin);

    //static pages
    router.get("/howtoplay", loginController.checkLoggedIn, staticPagesController.getHowToPlayPage);
    router.get("/eloranking", loginController.checkLoggedIn, staticPagesController.getEloRankingPage);
    router.get("/aboutus", loginController.checkLoggedIn, staticPagesController.getAboutUsPage);

    //game pages
    router.get("/unranked", loginController.checkLoggedIn, gameModesController.getUnrankedPage);
    router.get("/ranked", loginController.checkLoggedIn, gameModesController.getRankedPage);

    //profile and find players pages
    router.get("/leaderboard", loginController.checkLoggedIn, leaderboardController.getUsers);
    router.get("/profile", loginController.checkLoggedIn, userProfileController.getUserProfile);
    return app.use("/", router);
};

module.exports = initWebRoutes;
  
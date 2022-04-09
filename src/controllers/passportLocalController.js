import passport from "passport";
import passportLocal from "passport-local";
import loginService from "../services/loginService";


let LocalStrategy = passportLocal.Strategy;

let initPassportLocal = () => {
    passport.use("localLogin", new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
    },
        async (username, user_password, done) => {
            try {
                await loginService.findUserByUsername(username).then(async (user) => {
                    if (!user) return done(null, false, { message: `This username "${username}" doesn't exist!` });
                    if (user) {
                        //compare password
                        let match = await loginService.compareUserPassword(user, user_password);
                        if (match === true) return done(null, user, null);
                        return done(null, false, { message: match });
                    }
                });

            } catch (err) {
                return done(null, false, { message: err });
            }
        }));
};

passport.serializeUser((user, done) => {
    done(null, user.user_id);
});

passport.deserializeUser((user_id, done) => {
    loginService.findUserById(user_id).then((user) => {
        return done(null, user);
    }).catch(error => {
        return done(error, null);
    });
});

module.exports = initPassportLocal;
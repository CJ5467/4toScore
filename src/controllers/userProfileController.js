let getUserProfile = (req, res) => {
    return res.render("profile.ejs", {
        user: req.user
    })
};

module.exports = {
    getUserProfile: getUserProfile
};
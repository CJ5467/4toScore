
let getUnrankedPage = (req, res) => {
    return res.render("unranked.ejs", {
        user: req.user
    })
}

let getRankedPage = (req, res) => {
    return res.render("ranked.ejs", {
        user: req.user
    })
};

let getPlayWithFriendsPage = (req, res) => {
    return res.render("playwithfriends.ejs", {
        user: req.user
    })
}

module.exports = {
    getUnrankedPage: getUnrankedPage,
    getRankedPage: getRankedPage
}
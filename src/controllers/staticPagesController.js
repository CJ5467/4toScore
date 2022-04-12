
let getHowToPlayPage = (req, res) => {
    return res.render("howtoplay.ejs", {
        user: req.user
    })
};

let getEloRankingPage = (req, res) => {
    return res.render("eloranking.ejs", {
        user: req.user
    })
}

let getAboutUsPage = (req, res) => {
    return res.render("aboutus.ejs", {
        user: req.user
    })
}


module.exports = {
    getHowToPlayPage: getHowToPlayPage,
    getEloRankingPage: getEloRankingPage,
    getAboutUsPage: getAboutUsPage
};
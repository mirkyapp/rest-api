// Route /
exports.home = async function(req, res) {

    res.status(200).json({
        message: 'Welcome to Mirky API, read the docs -> https://github.com/MirkyAnalytics/rest-api',
    });

}
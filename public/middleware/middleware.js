export function checkCurrentUser(req, res, next) {
    if (req.session && req.session.user && req.session.user.email) {
        req.isUserLoggedIn = true;
        next();
    } else {
        req.isUserLoggedIn = false;
        next();
    }
}
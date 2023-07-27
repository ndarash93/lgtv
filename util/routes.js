const magic = require("./magic");

module.exports = function(router, lgtv, router){
    router.get('turnOn', function(req, res){
        magic();
    });
}
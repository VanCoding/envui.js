var less = require("less");
var fs = require("fs");
var path = require("path");

exports.build = function(dir){
    fs.mkdirSync(dir);
    less.render(fs.readFileSync(path.resolve(__dirname,"../style/style.less"))+"",function(e,css){
        fs.writeFileSync(dir+"style.css",css);
    });
}

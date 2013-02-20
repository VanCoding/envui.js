var less = require("less");
var fs = require("fs");
var path = require("path");

less.render(fs.readFileSync(path.resolve(__dirname,"./style/style.less"))+"",function(e,css){
    fs.writeFileSync(path.resolve(__dirname,"./static/style.css"),css);
});
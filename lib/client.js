var dom = require("domlib.js");

var Div = function(){
    var self = dom.Div.apply(this,Array.prototype.slice.call(arguments));
    self.addClass("envui");
    return self;
}


exports.Manager = Manager;
exports.Window = Window;
exports.Group = Group;
exports.Module = Module;


function Manager(){
    var dock;
    var self = Div("manager",
        dock = Div()
    );

    self.add = function(w){                    
        self.appendChild(w);
        w.manager = self
    }
    
    self.remove = function(w){
        self.removeChild(w);
        delete w.manager;
    }
    
    dock.style.position = "absolute";
    dock.style.top = "0px";
    dock.style.left = "0px";
    dock.style.right = "0px";
    dock.style.height = "5px";
    
    
    dock.on("mouseover",function(){
        if(Window.dragging){
            dock.style.backgroundColor = "rgba(65,157,232,0.8)";
            
            function up(){
                out();
                
                var g = Window.dragging.windowgroup;
                g.pinTop = true;
                g.pinLeft = true;
                g.pinRight = true;
                g.pinBottom = true;
                g.x = 0;
                g.update();
                g.resize(self.clientWidth-g.getTotalWidth());
                
                for(var i = 0; i < g.length; i++){
                    g[i].setIndex(0);
                }
                
                
            }
            function out(){
                self.off("mouseup",up);
                self.off("mouseout",out);
                dock.style.backgroundColor = "";
            }
            
            
            self.on("mouseup",up);
            self.on("mouseout",out);
        }
    });
    
    

    
    /*
    var currentsize = 0;
    
    self.updateSize = function(){ 
        //main.windowgroup.resize(self.clientWidth-currentsize);

        //main.windowgroup.pinLeft = true;
        currentsize = self.clientWidth;
    }*/

    
    
    return self;
}


function WindowGroup(){
    var self = [];
    
    
    self.x = 0;
    self.y = 0;
    self.leftOriented = true;
    self.pinTop = false;
    self.pinBottom = false;
    self.pinLeft = false,
    self.pinRight = false;
    
    self.add = function(window){
        window.windowgroup = self;
        self.push(window);
        self.update();
    }
    
    self.move = function(window,index){
        self.splice(self.indexOf(window),1);
        self.splice(index,0,window);
        self.update();
    }
    self.remove = function(window){
        console.log("before remove: ",self);
        delete window.windowgroup;
        self.splice(self.indexOf(window),1);
        self.update();
        console.log("after remove: ",self);
    }
    
    
    self.update = function(){
        console.log("self",self);
        var width = 0;        
        for(var i = 0; i < self.length; i++){
            var w = self.leftOriented?self[i]:self[self.length-1-i];            
            
            
            if(self.pinTop){
                w.style.top = "0px";                
                w.resize(w.manager.clientHeight-w.clientHeight,w.groups.length-1);
                
            }else{
                w.style.top = self.y+"px";
            }
            
            

            if(self.leftOriented){
                w.style.left = (self.x+width)+"px";
                w.style.right = "";
            }else{
                w.style.right =(self.x+width)+"px";
                w.style.left = "";
            }            
            width += w.offsetWidth;            
        }
    }
    
    self.startMove = function(window,e){
        var manager = window.manager;
        
        self.pinTop = false;
        self.pinBottom = false;
        self.pinLeft = false;
        self.pinRight = false;
        self.leftOriented = true;

        self.x = self[0].getX();
        self.y = self[0].getY();
        
        
        var offsetx = e.clientX-manager.getX(true)-self.x;
        var offsety = e.clientY-manager.getY(true)-self.y;
        
        
        
        
        manager.on("mousemove",mousemove);
        window.style.pointerEvents = "none";
        window.style.opacity = "0.4";        
        window.setIndex(window.parentNode.childNodes.length-1);        
        Window.dragging = window;  
        
        
        
        function mousemove(e){
            if(e.which){
                self.x = (e.clientX-offsetx);
                self.y = (e.clientY-offsety);
                self.update();
            }else{
                manager.off("mousemove",mousemove);
                window.style.pointerEvents = "";
                window.style.opacity = "";
                delete Window.dragging;
            }
        }
    }
    
    self.startLeftResize = function(window,e){
        self.startResize(self.indexOf(window)-1,e);
    }
    self.startRightResize = function(window,e){
        self.startResize(self.indexOf(window),e);
    }
    
    self.getTotalWidth = function(){
        var w = 0;
        for(var i = 0; i < self.length; i++){
            w += self[i].clientWidth;
        }
        return w;
    }
    
    
    self.startResize = function(index,e, isfirst, islast,amount){
        
        if(isfirst === undefined){
            isfirst = index < 0;
        }
        if(islast === undefined){
            islast = index == self.length-1;
        }
        
        var startx = e.clientX;
        
        var min = [];
        var start = [];
        var windowstart = self.x;
        
        
        for(var i = 0; i < self.length; i++){            
            min.push(self[i].getMinWidth());
            start.push(self[i].clientWidth);            
        }
        
        
        function mousemove(e){
            if(e.which){
                
                var diff = e.clientX-startx;
                
                console.log("resizing ",diff);
                
                var newwidths = start.slice();
                self.x = windowstart;

                
                if(diff < 0){
                    for(var i = index; diff < 0 && i >= 0; i--){                        
                        var needed = -diff;
                        var available = start[i]-min[i];
                        var used = needed;
                        if(used > available){
                            used = available;
                        }
                        newwidths[i] = start[i]-used;
                        newwidths[index+1] += used;
                        diff += used;
                    }                    
                    if(!self.pinLeft){
                        self.x +=diff;
                        newwidths[index+1] -= diff;
                    }
                    
                    
                }else{
                    for(var i = index+1; diff > 0 && i < self.length; i++){
                        var needed = diff;
                        var available = start[i]-min[i];
                        var used = needed;
                        if(used > available){
                            used = available;
                        }
                        newwidths[i] = start[i]-used;
                        if(isfirst){
                            self.x += used;
                        }else{
                            newwidths[index] += used;
                        }
                        diff -= used;
                    }
                    
                    if(!self.pinRight){
                        if(isfirst){
                            self.x +=diff;
                            newwidths[index] -= diff;
                        }else{
                            newwidths[index] += diff;
                        }
                    }
                }
                
                for(var i = 0; i < self.length; i++){
                    self[i].style.width = newwidths[i]+"px";
                }
                self.update();
                
                
                
            }else if(!amount){
                self[0].manager.off("mousemove",mousemove);
            }
        }
        
        if(amount){
            mousemove({which:1,clientX:amount});
            mousemove({});
        }else{
            self[0].manager.on("mousemove",mousemove);
        }
    }
    
    self.resize = function(amount, index){
        
        if(index === undefined){
            index = self.length-1;
        }
        
        

        var pinRight = self.pinRight;
        self.pinRight = false;
      
        
        self.startResize(index,{clientX:0},undefined,undefined,amount);
        
        self.pinRight = pinRight;

    }
    
    

    return self;
}


function Window(){
    var head,contents,leftresizer,rightresizer;
    var self = Div("window",
        head = Div("windowhead"),
        contents = Div("windowcontents"),
        leftresizer = Div(),
        rightresizer = Div()
    );
    
    WindowGroup().add(self);  
    
    leftresizer.style.position = "absolute";
    leftresizer.style.left = "0px";
    leftresizer.style.top = "0px";
    leftresizer.style.bottom = "0px";
    leftresizer.style.width = "2px";
    leftresizer.style.cursor = "w-resize";     
    
    leftresizer.on("mousedown",function(e){                    
        self.windowgroup.startLeftResize(self,e);
    });
    
    rightresizer.style.position = "absolute";
    rightresizer.style.right = "0px";
    rightresizer.style.top = "0px";
    rightresizer.style.bottom = "0px";
    rightresizer.style.width = "2px";
    rightresizer.style.cursor = "w-resize";
    
    rightresizer.on("mousedown",function(e){    
        self.windowgroup.startRightResize(self,e);
    });
    
    rightresizer.on("mouseover",function(){
        
        if(Window.dragging){
            rightresizer.style.backgroundColor = "rgba(65,157,232,0.8)";
            
            
            function up(){
                out();
                
                Window.dragging.windowgroup.remove(Window.dragging);
                
                
                if(self.windowgroup.pinLeft || self.windowgroup.pinRight){
                    self.windowgroup.resize(-Window.dragging.clientWidth,self.windowgroup.indexOf(self));
                }
                
                console.log(Window.dragging);
                
                self.windowgroup.add(Window.dragging);
                self.windowgroup.move(Window.dragging,self.windowgroup.indexOf(self)+1);
                
                
                
                console.log(self.windowgroup);
                
            }
            
            function out(){
                rightresizer.off("mouseout",out);
                rightresizer.off("mouseup",up);
                rightresizer.style.backgroundColor = "";
            }
            
            rightresizer.on("mouseout",out);
            rightresizer.on("mouseup",up);
            
            
            
        }
    });

    
    
    
    
    self.groups = [];
    
    self.add = function(group){
        group.window = self;
        contents.appendChild(group);                    
        var divider = Div("modulegroupdivider");                    
        contents.appendChild(divider);
        self.groups.push(group);
        
        divider.on("mouseover",function(e){
            if(Window.dragging||Group.dragging||Module.dragging){
                var hint = Div();
                hint.style.background = "rgba(65,157,232,0.8)";
                hint.style.height = "4px";
                hint.style.left = "0px";
                hint.style.right = "0px";
                hint.style.top = divider.getY(false)+"px";
                hint.style.position = "absolute";
                hint.style.pointerEvents = "none";
                
                
                self.appendChild(hint);
                
                
                function out(){
                    divider.off("mouseout",out);
                    divider.off("mouseup",up);
                    self.removeChild(hint);
                }
                
                function up(){
                    out();
                    var i = group.getIndex()/2+1;
                    if(Window.dragging){                                    
                        var d = Window.dragging; 
                        while(d.groups.length){
                            var g = d.groups[0];
                            d.remove(g);
                            self.add(g);
                            self.move(g,i++);
                        }
                    }
                    
                    if(Group.dragging){
                        self.add(Group.dragging);
                        self.move(Group.dragging,i);
                    }
                    
                    if(Module.dragging){
                        var g = Group();
                        g.add(Module.dragging);
                        self.add(g);
                        self.move(g,i);
                    }
                }
                
                divider.on("mouseout",out);
                divider.on("mouseup",up);
            }                   
        });
        
        divider.on("mousedown",function(e){
            self.startResize((group.getIndex())/2,e);
        });
    }
    
    self.startResize = function(index,e, isfirst, islast,amount){
        
        if(isfirst === undefined){
            isfirst = index < 0;
        }
        if(islast === undefined){
            islast = index == self.length-1;
        }
        
        var starty = e.clientY;
        
        var min = [];
        var start = [];
        var windowstart = self.getY();
        
        
        for(var i = 0; i < contents.childNodes.length; i+= 2){            
            min.push(contents.childNodes[i].getMinHeight());
            start.push(contents.childNodes[i].clientHeight);            
        }
        
        
        function mousemove(e){
            if(e.which){
                
                var diff = e.clientY-starty;
                
                var newheights = start.slice();
                var newy = windowstart;
                self.style.top = windowstart+"px";
                

                
                if(diff < 0){
                    for(var i = index; diff < 0 && i >= 0; i--){                        
                        var needed = -diff;
                        var available = start[i]-min[i];
                        var used = needed;
                        if(used > available){
                            used = available;
                        }
                        newheights[i] = start[i]-used;
                        //newheights[index+1] += used;
                        diff += used;
                    }                    
                    if(!self.windowgroup.pinTop){
                        newy +=diff;
                        newheights[index+1] -= diff;
                    }
                    
                    
                }else{
                    for(var i = index+1; diff > 0 && i < min.length; i++){
                        var needed = diff;
                        var available = start[i]-min[i];
                        var used = needed;
                        if(used > available){
                            used = available;
                        }
                        newheights[i] = start[i]-used;
                        if(isfirst){
                            newy += used;
                        }else{
                            newheights[index] += used;
                        }
                        diff -= used;
                    }
                    
                    if(!self.windowgroup.pinBottom){
                        if(isfirst){
                            newy +=diff;
                            newheights[index] -= diff;
                        }else{
                            newheights[index] += diff;
                        }
                    }
                }
                
                for(var i = 0; i < contents.childNodes.length; i+=2){
                    contents.childNodes[i].style.height = newheights[i/2]+"px";
                }
                self.style.top = newy+"px";
                
                
                
            }else if(!amount){
                self.manager.off("mousemove",mousemove);
                
                
                if(self.windowgroup[0] == self){
                    self.windowgroup.y = self.getY();
                }
                self.windowgroup.update();
            }
        }
        
        if(amount){
            mousemove({which:1,clientY:amount});
            mousemove({});
        }else{
            self.manager.on("mousemove",mousemove);
        }
    }
    
    self.resize = function(amount,index){
        if(index === undefined){
            index = self.length-1;
        }       

        var pinBottom = self.windowgroup.pinBottom;
        self.windowgroup.pinBottom = false;
        self.startResize(index,{clientY:0},undefined,undefined,amount);    
        self.windowgroup.pinBottom = pinBottom;

    }
    
    
    
    self.remove = function(group){
        
        console.log("deleting group");
        
        
        delete group.window;
        var index = group.getIndex();
        contents.removeChild(group);
        contents.removeChild(contents.childNodes[index]);
        self.groups.splice(self.groups.indexOf(group),1);
        
        console.log(self.groups);
        
        if(!self.groups.length){
            self.close();
        }else{
            console.log(self.groups.length);
        }
        
    }
    
    self.move = function(group,index){
        index = index*2;
        var divider = contents.childNodes[group.getIndex()+1];                    
        group.setIndex(index);
        divider.setIndex(index+1);                    
    }
    
    
    self.close = function(){
        console.log("closing");
        self.manager.remove(self);
        self.windowgroup.remove(self);
    }
    
    self.getMinWidth = function(){
        var minwidth = self.offsetWidth;
        for(var i = 0; i < self.groups.length; i++){
            var mw = self.groups[i].getMinWidth();
            if(mw < minwidth){
                minwidth = mw;
            }
        }
        return minwidth;
    }
    
    
    
    head.on("mousedown",function(e){
        self.windowgroup.startMove(self,e);
    });
    head.on("mouseover",function(e){
        if(Window.dragging||Group.dragging||Module.dragging){
            
            var hint = Div();
            hint.style.background = "-webkit-linear-gradient(top, rgba(65,157,232,1) 0%,rgba(65,157,232,0) 100%)";
            hint.style.height = "5px";
            hint.style.left = "0px";
            hint.style.right = "0px";
            hint.style.top = head.clientHeight+"px";
            hint.style.position = "absolute";
            hint.style.pointerEvents = "none";
            
            
            self.appendChild(hint);
            
            
            function out(){
                self.off("mouseout",out);
                self.off("mouseup",up);
                self.removeChild(hint);
            }
            
            function up(){
                out();
                if(Window.dragging){
                    var d = Window.dragging;
                    var i = 0;
                    while(d.groups.length){
                        var g = d.groups[0];
                        d.remove(g);
                        self.add(g);
                        self.move(g,i++);
                    }
                }
                
                if(Group.dragging){
                    self.add(Group.dragging);
                    self.move(Group.dragging,0);
                }
                
                if(Module.dragging){
                    var g = Group();
                    g.add(Module.dragging);
                    self.add(g);
                    self.move(g,0);
                }
            }
            
            self.on("mouseout",out);
            self.on("mouseup",up);
        }
    });
    
    
    
    return self;
}


function Group(){
    var tabs,contents,active;
    var self = Div("modulegroup",
        tabs = Div("moduletabs"),
        contents = Div("modulecontents")
    );
    
    
    self.modules = [];
    
    self.setActive = function(module){
        if(active){
            active.tab.removeClass("active");
            active.style.display = "none";
        }
        active = module;
        active.tab.addClass("active");
        active.style.display = "";
    }
    
    self.add = function(module){
        
        
        var gX;
        var gY;
        
        var offsetx;
        var startx;
        var preview;
        module.group = self;
        module.style.display = "none";
        var tab = module.tab = Div("moduletab",module.title);
        var manager;
        function mousedown(e){
            manager = self.window.manager;
            self.setActive(module);
            
            gX = self.getX(true);
            gY = self.getY(true);
            
            startx = module.tab.getX();
            offsetx = e.clientX-startx-gX;
            
            module.tab.style.position = "relative";
            manager.on("mousemove",mousemove);
            e.stopPropagation();
        }
        function mousemove(e){
            
            var rX = e.clientX-gX;
            var rY = e.clientY-gY;
            
            
            if(e.which){
                
                if(!preview){

                    if(rX < 0 || rX > self.clientWidth || rY < 0 || rY > tabs.clientHeight){                                    
                        
                        module.tab.style.left = "";                                    
                        preview = Div("",self.innerHTML);
                        preview.style.position = "absolute";
                        preview.style.width = self.clientWidth+"px";
                        preview.style.height = self.clientHeight+"px";
                        preview.style.pointerEvents = "none"; 
                        document.body.appendChild(preview);
                        Module.dragging = module;
                        self.remove(module);
                        
                    }else{
                    
                        var x = (rX-startx-offsetx);
                        var maxx = self.clientWidth-module.tab.clientWidth-(startx-self.getX());
                        var minx = -(startx-self.getX());
                        x = x<minx?minx:(x>maxx?maxx:x);
                        
                        var index = module.tab.getIndex();
                        
                        while(index && -x >= tabs.childNodes[index-1].offsetWidth){
                            startx -= tabs.childNodes[index-1].offsetWidth;
                            x+= tabs.childNodes[index-1].offsetWidth;
                            self.move(module,index-1);
                            index--;                                    
                        }
                        
                        while(index < tabs.childNodes.length-1 && x >= tabs.childNodes[index+1].offsetWidth){
                            startx += tabs.childNodes[index+1].offsetWidth;
                            x -= tabs.childNodes[index+1].offsetWidth;                                
                            self.move(module,index+1);
                            index++;
                        }
                        module.tab.style.left = x+"px";
                    }
                }
                if(preview){                                
                    preview.style.top = (e.clientY-4)+"px";
                    preview.style.left = (e.clientX-offsetx-startx)+"px";
                    preview.style.opacity = "0.5";
                }
            }else{
                manager.off("mousemove",mousemove);
                tab.style.position = "";
                tab.style.left = "";
                if(preview){
                    
                    var newWindowX = preview.getX()-manager.getX(true);
                    var newWindowY = preview.getY()-manager.getY(true);                                
                    
                    document.body.removeChild(preview);
                    preview = null;
                    
                    
                    
                    setTimeout(function(){
                        if(!module.group){
                            var w = Window();
                            var g = Group();
                            w.add(g);
                            g.add(module);
                            w.windowgroup.y = newWindowY;
                            w.windowgroup.x = newWindowX;
                            w.windowgroup.update();
                            manager.add(w);
                        }
                        delete Module.dragging;                                    
                    },10);
                    
                    
                    
                    
                }
            }
                                    
        }
        
        
        function mouseover(e){
            if(Group.dragging||Module.dragging){
            
                var hint = Div();
                hint.style.background = "-webkit-linear-gradient(left, rgba(65,157,232,1) 0%,rgba(65,157,232,0) 100%)";
                hint.style.top = "0px";
                hint.style.bottom = "0px";
                hint.style.left = "0px";
                hint.style.width = "5px";
                hint.style.position = "absolute";
                hint.style.pointerEvents = "none";                           
                
                tab.appendChild(hint);
                
                
                function out(){
                    tab.off("mouseout",out);
                    tab.off("mouseup",up);
                    tab.removeChild(hint);
                }
                
                function up(){
                    out();
                    
                    if(Group.dragging){                        
                        var index = tab.getIndex();
                        var modules = Group.dragging.getModules();
                        while(modules.length){
                            var m = modules.shift();
                            Group.dragging.remove(m);
                            self.add(m);
                            self.move(m,index++);
                        }
                    }
                    
                    if(Module.dragging){
                        self.add(Module.dragging);
                        self.move(Module.dragging,tab.getIndex());
                    }
                }
                
                tab.on("mouseout",out);
                tab.on("mouseup",up);
            }
        }
        
        tab.on("mousedown",mousedown);
        tab.on("mouseover",mouseover);
        
        tabs.appendChild(module.tab);
        contents.appendChild(module); 
        if(Array.prototype.indexOf.call(contents.childNodes,module) == 0){
            self.setActive(module);
        }
        
        for(var i = 0; i < tabs.childNodes.length; i++){
            tabs.childNodes[i].style.maxWidth = Math.floor(100/tabs.childNodes.length)+"%";
        }
    }
    
    self.move = function(module,index){
        module.setIndex(index);
        module.tab.setIndex(index);
    }
    
    self.remove = function(module){       
        if(contents.childNodes[0] != module){
            self.setActive(contents.childNodes[0]);
        }else if(contents.childNodes.length > 1){
            self.setActive(contents.childNodes[1]);
        }else if(self.window){
            self.window.remove(self);                        
        }
        
        tabs.removeChild(module.tab);                    
        contents.removeChild(module);
        delete module.tab;
        delete module.group; 
    }
    
    self.getModules = function(){
        return Array.prototype.slice.call(contents.childNodes);
    }
    
    self.getMinWidth = function(){
        var minwidth = contents.childNodes.length*25;
        for(var i = 0; i < contents.childNodes.length; i++){
            var mw = contents.childNodes[i].minWidth;
            if(mw && mw > minwidth){
                minwidth = mw;
            }
        }
        return minwidth;
    }
    
    self.getMinHeight = function(){
        var minheight = tabs.clientHeight;
        for(var i = 0; i < contents.childNodes.length; i++){
            var mh = contents.childNodes[i].minHeight;
            if(mh && mh > minheight){
                minheight = mh;
            }
        }
        return minheight;
    }
    
    
    function mousedown(e){                   
        
        var manager = self.window.manager;
        if(e.srcElement == tabs){
            var gX = self.getX(true);
            var gY = self.getY(true);                    
            var offsetx = e.clientX-gX;
            var preview;                
            
            function mousemove(e){
                if(e.which){                            
                    if(!preview){
                        preview = Div("",self.innerHTML);
                        preview.style.position = "absolute";
                        preview.style.width = self.clientWidth+"px";
                        preview.style.height = self.clientHeight+"px";
                        preview.style.pointerEvents = "none"; 
                        document.body.appendChild(preview);
                        Group.dragging = self;
                        self.window.remove(self);
                    }                            
                    preview.style.top = (e.clientY-4)+"px";
                    preview.style.left = (e.clientX-offsetx)+"px";
                    preview.style.opacity = "0.5";
                }else{
                    manager.off("mousemove",mousemove);
                    if(preview){
                        
                        var newWindowX = preview.getX()-manager.getX(true);
                        var newWindowY = preview.getY()-manager.getY(true);                                
                        
                        document.body.removeChild(preview);
                        preview = null;                    
                        
                        setTimeout(function(){
                            if(!self.window && contents.childNodes.length){
                                var w = Window();
                                w.add(self);
                                w.windowgroup.y = newWindowY;
                                w.windowgroup.x = newWindowX;
                                w.windowgroup.update();
                                manager.add(w);
                            }
                            delete Group.dragging;                                    
                        },10);
                    }                    
                }
            }
        }
        
        
        manager.on("mousemove",mousemove);  
    }
    
    tabs.on("mousedown",mousedown);
    
    return self;
}

function Module(title,content){
    var self = Div("modulecontent",content);
    self.title = title;
    self.style.display = "none";
    
    
    return self;                
}

angular.module("user", ["youtrackClient"]).service("user", ["$rootScope", "API", function user($rootScope, API) {

    var admin = false;
    var o = this;
    o.login = "guest";
    o.fullName = "";
    o.groups = [];
    o.projects = [];
    o.init = function (callback) {
        var async = Async();
        async.doit(function (cb) {
            API.getCurrentUser(function (user) {
                o.login = user.login;
                o.fullName = user.fullName;
                API.getUserGroups(user.login, function (groups) {
                    o.groups = groups;
                    cb();
                });
            })
        });
        async.doit(function (cb) {
            API.getAccessibleProjects(function (projects) {
                o.projects = projects;
                cb();
            });
        });
        async.done(callback);
    };

    o.setupData = function (data) {
        for (var i in data)
            o[i] = data[i];
    };

    o.info = function () {
        return API.userInfo;
    };

    o.checkGroups = function (groups) {
        for (var i = 0; i < groups.length; i++)
            if (o.groups[groups[i]])
                return true;
        return false;
    };

    o.isGuest = function () {
        return !o.isUser();
    };

    o.isUser = function () {
        return o.login && o.login != "guest" && o.login != "<no user>";
    };

    o.isAdmin = function () {
        return admin;
    };

    o.getUserLink = function (login) {
        if (!login)
            return;
        var u = login.split("@");
        switch (u[0]) {
            case "vk":
                return "https://vk.com/id" + u[1];
            case "fb":
                return "http://facebook.com/profile.php?id=" + u[1];
            case "mailru":
                var p = u[1].match(/^([^\.]+)\.(.*?)\.(\d+)$/) || ["", "mail", "nouser", "0"];
                console.log(p, u[1]);
                return "http://my.mail.ru/" + p[1] + "/" + p[2] + "/";
            //case "gmail":
            //    return "http://facebook.com/profile.php?id=" + u[1];
            case "od":
            case "ok":
                return "http://odnoklassniki.ru/profile/" + u[1];
        }
        return false;
    };

    o.getFirstName = function (name) {
        return name ? name.split(" ").shift() : name;
    };

    o.showAuthModal = function (txt) {
        if (this.isUser())
            return false;
        $rootScope.authModal = true;
        $rootScope.authText = txt;
        //$rootScope.go("/login/");
        return true;
    };

    o.hideAuthModal = function () {
        $rootScope.authModal = false;
    };

    o.getCookie = function (name) {
        var a = new RegExp(name + "=([^;]*)");
        var cookie = document.cookie.match(a);
        return (cookie && cookie[1]) ? cookie[1] : false;
    };

    o.setCookie = function (name, val, time) {
        if (!time) {
            time = new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000);
        }
        document.cookie = name + '=' + val + ';expires=' + time.toUTCString() + ';path=/';
    };

    o.logout = function () {
        window.location = "/auth/logout/?origin=" + encodeURIComponent("http://" + punycode.toASCII(location.host) + "/");
    }

    o.auth = function (type) {
        var host = "host=" + encodeURIComponent("http://" + punycode.toASCII(location.host) + "/");
        var params = {
            app: "http://" + punycode.toASCII(location.host) + "/",
            originUrl: "http://" + punycode.toASCII(location.host) + "/",
            youtrackUrl: "http://" + config.youtrackName + ".youtrack.app.strintec.com:8080/youtrack"
        }
        //params.app = params.app.replace(".local", ".dev.serpa.strintec.com");
        switch (type) {
            case "vk":
                window.location = "/auth/oauth/login/?" + $.param(params) + "&provider=vk";
                //window.location = "/auth/login/vk?" + host;
                break;
            case "fb":
                window.location = "/auth/oauth/login/?" + $.param(params) + "&provider=fb";
                //window.location = "/auth/login/fb?" + host;
                break;
            case "od":
                window.location = "/auth/oauth/login/?" + $.param(params) + "&provider=od";
                //window.location = "/auth/login/od?" + host;
                break;
            case "gmail":
                window.location = "/auth/oauth/login/?" + $.param(params) + "&provider=gmail";
                //window.location = "/auth/login/od?" + host;
                break;
            case "mailru":
                window.location = "/auth/oauth/login/?" + $.param(params) + "&provider=mailru";
                //window.location = "/auth/login/od?" + host;
                break;
        }
    }
}]);






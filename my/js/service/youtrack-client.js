angular.module("youtrackClient", []).service("API", ["$http", function API($http) {
    $http.defaults.headers.post['Content-Type'] = "application/x-www-form-urlencoded";
    $http.defaults.headers.put = {};
    delete $http.defaults.headers.common['X-Requested-With'];
    $http.defaults.withCredentials = true;

    var isAdmin = false;
    var o = this;
    o.prefix = "/youtrack";
    o.youtrackName = "";
    o.userInfo = {groups: {}};
    o.isUser = document.cookie.match(/jetbrains.charisma.main.security.PRINCIPAL/) ? true : false;
    o.userLoaded = false;
    o.onerror = function () {};


    o.req = function (method, url, urlParams, postData, callback, dontShowError) {
        callback = callback || function () {};
        urlParams = urlParams || {};

        if (o.youtrackName)
            urlParams.youtrackname = o.youtrackName;

        var options = {
            method: method,
            url: encodeURI(o.prefix + url),
            params: urlParams,
            data: postData ? $.param(postData) : null,
            //cache: false,
            withCredentials: true
        };

        $http(options)
            .success(function (data) {
                //try {
                if (urlParams && urlParams.filter)
                    console.log(urlParams.filter, data);
                callback(data);
                /*}
                 catch (e) {
                 console.error(e);
                 }*/
            })
            .error(function (data) {
                //try {
                console.error(data);
                if (!dontShowError)
                    o.onerror(data.value ? data.value : data);
                callback([]);
                //}
                //catch (e) {
                //    console.error(e);
                //}
            });
    };


    o.get = function (url, urlParams, callback, dontShowError) {
        o.req("get", url, urlParams, null, callback, dontShowError);
    };

    o.post = function (url, urlParams, postData, callback, dontShowError) {
        o.req("post", url, urlParams, postData, callback, dontShowError);
    };

    o.put = function (url, urlParams, postData, callback, dontShowError) {
        o.req("put", url, urlParams, postData, callback, dontShowError);
    };

    o._delete = function (url, urlParams, callback) {
        o.req("delete", url, urlParams, null, callback);
    }


    // todo:defaultGroupName;
    o.getUser = function (callback) {
        o.get(o.prefix + "/rest/user/current", false, function (data) {
            o.userInfo = data;
            o.userInfo.groups = {};
            o.isUser = o.userInfo.login && o.userInfo.login != "guest" && o.userInfo.login != "<no user>";
            o.get("/admin/user/" + o.userInfo.login + "/group", false, function (data) {
                for (var i = 0; i < data.length; i++)
                    o.userInfo.groups[data[i].name] = true;
                o.userLoaded = true;
                callback();
            })
            //o.userInfo.groups[config.defaultGroupName] = true;
        })
    };


    o.getCurrentUser = function (callback) {
        o.get("/rest/user/current", false, callback);
    };

    o.getUserGroups = function (login, callback) {
        o.get("/rest/admin/user/" + login + "/group", false, function (data) {
            var groups = {};
            for (var i = 0; i < data.length; i++)
                groups[data[i].name] = true;
            callback(groups);
        }, true)
    };

    o.getAccessibleProjects = function (callback) {
        o.get('/rest/project/all', false, function (data) {
            var projects = [];
            for (var i = 0; i < data.length; i++) {
                projects.push({id: data[i].shortName, name: data[i].name});
                projects[data[i].shortName] = data[i].name;
            }
            callback(projects);
        });
    };

    o.login = function (data, callback) {
        o.post("/rest/user/login", false, data, function (data) {
            callback(typeof data == "string");
        });
    };

    o.getFileIcon = function (filename) {
        if (!filename) return;

        var ext = filename.split(".").pop();
        var cls = 'icon-file';
        cls = (ext.match(/(rar|zip|7z|iso|tgz)/i) ? 'icon-archive' : cls);
        cls = (ext.match(/(pdf|djvu)/i) ? 'icon-file-text ' : cls);
        cls = (ext.match(/(docx?|txt|rtf|odt|chm|html?|ppt|srt)/i) ? 'icon-file-text ' : cls);
        cls = (ext.match(/(xls|xlsx|csv)/i) ? 'icon-file-text ' : cls);
        cls = (ext.match(/(jpe?g|png|gif|bmp|psd|tiff|ico)/i) ? 'icon-picture' : cls);
        cls = (ext.match(/(mp3|aac|wav|ogg|ac3)/i) ? 'icon-play-sign' : cls);
        cls = (ext.match(/(mp4|avi|mkv|wmv|m4v|3gp|flv|mov)/i) ? 'icon-youtube-play' : cls);
        return cls;
    };


    o.star = function (issue) {
        var star;
        if (o.isStarred(issue)) {
            star = false;
            issue.tag = [];
        }
        else {
            star = true;
            issue.tag = [
                {value: "Star"}
            ];
        }
        o.post("/rest/issue/" + issue.id + "/execute", false, {command: (star ? 'star me' : 'unstar me')});
    };
    o.isStarred = function (issue) {
        return issue.tag && issue.tag[0] && issue.tag[0].value && issue.tag[0].value.match(/star/i);
    };

    o.vote = function (id) {

    };

    o.getBundleValues = function (name, callback) {
        o.get("/rest/admin/customfield/bundle/" + name, false, function (data) {
            var items = [];
            if (data.value)
                for (var i = 0; i < data.value.length; i++) {
                    var info = {}
                    try {info = JSON.parse(data.value[i].description) || {}}
                    catch (e) {}
                    data.value[i].value = o.decodeBundleValue(data.value[i].value);
                    items.push({name: data.value[i].value, info: info});
                }
            callback(items);
        })
    };


    o.getVersionBundle = function (name, callback) {
        o.get("/rest/admin/customfield/versionBundle/" + name, false, function (data) {
            var items = [];
            data.version = data.version || [];
            for (var i = 0; i < data.version.length; i++) {
                data.version[i].name = data.version[i].value;
                items.push(data.version[i]);
            }
            callback(items);
        })
    };
    o.updateVersionValue = function (bundle, value, data, callback) {
        o.post("/rest/admin/customfield/versionBundle/" + bundle + "/" + value, false, data, callback);
    };
    o.createVersionValue = function (bundle, value, data, callback) {
        o.put("/rest/admin/customfield/versionBundle/" + bundle + "/" + value, false, data, callback);
    };

    o.encodeBundleValue = function (name) {
        name = name.replace(/\//g, "%2F");
        name = name.replace(/\\/g, "%5C");
        name = name.replace(/</g, "%3C");
        name = name.replace(/>/g, "%3E");
        return name;
    };

    o.decodeBundleValue = function (name) {
        name = decodeURIComponent(name);
        return name;
    };

    o.updateBundleValue = function (bundle, name, newName, description, callback) {
        o.post("/rest/admin/customfield/bundle/" + bundle + "/" + o.encodeBundleValue(name), false, {newValue: o.encodeBundleValue(newName), description: description}, callback);
    };

    o.createBundleValue = function (bundle, name, description, callback) {
        o.put("/rest/admin/customfield/bundle/" + bundle + "/" + o.encodeBundleValue(name), {description: description}, null, callback);
    };

    o.deleteBundleValue = function (bundle, name, callback) {
        o._delete("/rest/admin/customfield/bundle/" + bundle + "/" + o.encodeBundleValue(name), false, callback);
    };

    o.getStateBundleValues = function (name, callback) {
        o.get("/rest/admin/customfield/stateBundle/" + name, false, function (data) {
            var items = [];
            for (var i = 0; i < data.state.length; i++) {
                items.push({name: data.state[i].value});
            }
            callback(items);
        });
    };

    o.setBundleField = function (issue, filter, index, callback) {
        var value = filter.items[index];
        issue[filter.fieldName] = [value.name];
        o.post("/rest/issue/" + issue.id + "/execute", false, {command: filter.fieldName + " " + value.name}, callback);
    };

    o.setAssignee = function (issue, filter, value, callback) {
        issue[filter.fieldName] = [
            {value: value.login, fullName: value.name}
        ];
        o.post("/rest/issue/" + issue.id + "/execute", false, {command: filter.fieldName + " " + value.login}, callback);
    };

    o.getIntellisense = function (project, fieldName, callback) {
        var filter = "";
        if (project)
            filter += "project: {" + project + "} ";
        filter += fieldName + ':';

        o.get("/rest/issue/intellisense", {filter: filter, optionsLimit: 1000}, function (data) {
            callback(data.suggest);
        });
    };

    o.getCategoryList = function (callback) {
        var list = [];
        o.get("/rest/issue/intellisense", {filter: config.category.fieldName + ':'}, function (data) {
            if (data.suggest) {
                for (var i = 2; i < data.suggest.length; i++)
                    list.push(data.suggest[i].option);
            }
            callback(list);
        })
    };

    o.setState = function (issueID, state, callback) {
        o.post("/rest/issue/" + issueID + "/execute", false, {command: config.state.fieldName + " " + state}, callback);
    };

    o.getStateCommands = function (issueID, callback) {

        var stateCommands = [];
        o.get("/rest/issue/" + issueID + "/execute/intellisense", {command: 'Состояние:'}, function (data) {
                if (data.suggest) {
                    for (var i = 0; i < data.suggest.length; i++)
                        if (!data.suggest[i].description.match(/undefined/))
                            stateCommands.push(data.suggest[i].option);
                }
                callback(stateCommands);
            }
        )
    };


    o.getIssues = function (projectID, filter, page, perPage, callback, noCache, noWikify) {
        var issues = [];
        if (projectID)
            filter = "project: {" + projectID + "} " + filter;

        o.get("/rest/issue/", {wikifyDescription: !noWikify, max: perPage, after: (page - 1) * perPage, filter: filter}, function (response) {
            try {
                for (var i = 0; i < response.issue.length; i++) {
                    var issue = response.issue[i];
                    for (var j = 0; j < issue.field.length; j++) {
                        issue[issue.field[j].name] = issue.field[j].value;
                        if (issue[issue.field[j].name] instanceof Array && typeof issue[issue.field[j].name][0] == "string") {
                            issue[issue.field[j].name][0] = o.decodeBundleValue(issue[issue.field[j].name][0]);
                        }

                    }
                    issue.stripDescription = (issue.description || "").replace(/<[^>]+>/g, "");
                    issues.push(issue);
                }
            }
            catch (e) {console.error(e)}
            callback(issues);
        });
    };

    o.getIssue = function (issueID, callback, noCache, noWikify) {
        o.get("/rest/issue/" + issueID, {wikifyDescription: !noWikify}, function (response) {
            try {
                var issue = response;
                for (var j = 0; j < issue.field.length; j++) {
                    issue[issue.field[j].name] = issue.field[j].value;
                    if (issue[issue.field[j].name] instanceof Array && typeof issue[issue.field[j].name][0] == "string") {
                        issue[issue.field[j].name][0] = o.decodeBundleValue(issue[issue.field[j].name][0]);
                    }
                }

                issue.stripDescription = (issue.description || "").replace(/<[^>]+>/g, "");
            }
            catch (e) {console.error(e)}
            callback(issue);
        })
    };

    o.getIssueAttachments = function (issueID, callback) {
        o.get("/rest/issue/" + issueID + "/attachment", false, function (data) {
            callback(data.fileUrl);
        });
    };

    o.countIssues = function (projectID, filter, callback) {
        if (projectID)
            filter = "project: {" + projectID + "} " + filter;

        o.get("/rest/issue/count/", {sync: true, filter: filter}, function (data) {
            callback(Math.max(0, data.entity.value));
        });
    };

    o.createIssue = function (projectID, summary, description, callback) {
        var post = {project: projectID, summary: summary, description: description};
        o.post("/rest/issue", false, post, callback);
    };

    o.updateIssue = function (issueID, summary, description, callback) {
        var post = {summary: summary, description: description};
        o.post("/rest/issue/" + issueID, false, post, callback);
    };

    o.setFields = function (issueID, obj, callback) {
        var command = "";
        for (var i in obj) {
            if (obj[i] && i != "summary" && i != "description")
                command += " " + i + ": " + obj[i];
        }
        o.post("/rest/issue/" + issueID + "/execute", false, {command: command}, callback);
    };

    o.deleteIssue = function (issueID, callback) {
        o._delete("/rest/issue/" + issueID, false, callback);
    };

    o.commentIssue = function (issueID, comment, callback) {
        o.post("/rest/issue/" + issueID + "/execute", false, {command: 'comment', comment: comment}, callback);
    };

    o.deleteComment = function (issueID, commentID, callback) {
        o._delete("/rest/issue/" + issueID + "/comment/" + commentID, false, callback);
    };

    o.getProjectCustomField = function (projectID, field, callback) {
        o.get("/rest/admin/project/" + projectID + "/customfield/" + field, false, function (data) {
            callback(data.param || []);
        })
    }
}])


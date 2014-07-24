var my = angular.module("my", []);
/**
 * @ngdoc directive
 * @name ng.directive:ngModel
 * @element ANY
 * @param {expression} ngModel
 */


/**
 * @ngdoc directive
 * @name ng.directive:label
 * @element ANY
 * @param {expression} label
 */
my.directive("control", function ($rootScope) {
    return {
        restrict: 'EA',
        //priority: 10,
        compile: function (element, attributes, transclude) {
            var form = attributes.form || "form";
            var model = attributes.model || "";
            var required = attributes.required || "false";
            //var name = model.split(".").pop();
            var name = attributes.name;
            if (!name) {
                name = model.replace(/[^a-z0-9]+/ig, "")// + (Math.random() + "").substr(2, 3);
                name = 'control' + (Math.random() + '').slice(2);
            }

            var className = attributes.className || "";
            var id = attributes.id || name + "-" + Math.random().toString(16).substr(2, 2);
            try {
                var label = attributes.label ? $rootScope.$eval(attributes.label) + ':' : "";
            }
            catch (e) {
                var label = attributes.label + ':';
            }


            var help = attributes.help || "";
            var onerror = form + '.' + name + '.$invalid && ' + form + '.' + name + '.$dirty';

            /*
             if (!help && label.indexOf("}}") > -1)
             help = label.replace(/\s*?\}\}/, "_help}}");
             */

            element.find(":input:first").each(function () {
                var $this = $(this);
                if (name && !$this.attr("name"))
                    $this.attr({name: name});
                if (model && !$this.attr("ng-model"))
                    $this.attr({"ng-model": attributes.model});
                if (required)
                    $this.attr({"ng-required": required});
                $this.attr("id", id).addClass("form-control");
            });


            var content = element.html();

            var html = '<div class="control-group form-group ' + className + '" ' + (model ? 'ng-class="{error: ' + onerror + '}"' : '') + '>' +
                ((label || attributes.i18nLabel || attributes.checkbox) ? '<label class="control-label col-sm-2" ng-class="{required: ' + required + '}" ' +
                    'label=true ' + (attributes.i18nLabel ? 'i18n="' + attributes.i18nLabel + '"' : '') + ' for="' + id + '">' + label + '</label>' : "") +
                '<div class="controls col-sm-10">' + content + (help ? '<i class="help icon-question-sign" title="' + help + '"></i>' : '') + '</div>' +
                '</div>' +
                '</div>';

            element.replaceWith(html);
            //console.log(element[0]);
        }
    }
});

my.filter('startFrom', [function () {
    return function (input, start) {
        return input instanceof Array ? input.slice(start | 0) : input;
    }
}]);


my.filter('timeago', ["$filter", "$locale", function ($filter, $locale) {
    return function (input) {
        var diff = new Date() - new Date(input * 1);
        var seconds = Math.round(diff / 1000);
        var minutes = Math.round(seconds / 60);
        var hours = Math.round(minutes / 60);
        var days = Math.round(hours / 24);
        var months = Math.round(days / 30);
        var years = Math.round(days / 365);

        function plural(n, obj) {
            var s = obj[$locale.pluralCat(n)];
            return s.replace("{}", n);
        }

        var s = seconds < 45 && i18n.datetime.minute.lessThan ||
            seconds < 90 && i18n.datetime.minute[1] ||
            minutes < 45 && plural(minutes, i18n.datetime.minute) ||
            minutes < 90 && i18n.datetime.hour[1] ||
            hours < 24 && plural(hours, i18n.datetime.hour) ||
            hours < 42 && i18n.datetime.day[1] ||
            days < 30 && plural(days, i18n.datetime.day) ||
            days < 45 && i18n.datetime.month[1] ||
            days < 365 && plural(months, i18n.datetime.month) ||
            years < 1.5 && i18n.datetime.year[1] ||
            plural(years, i18n.datetime.year);

        return s;
    }
}]);

my.directive('onEnter', [function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if (event.which === 13) {
                scope.$apply(function () {
                    scope.$eval(attrs.onEnter);
                });
                event.preventDefault();
            }
        });
    };
}]);

my.filter('datetime', ["$filter", function ($filter) {
    return function (input, returnDiffDays) {
        var d = new Date(input * 1);
        var todayDate = new Date();
        var yesterdayDate = new Date(today - 1000 * 60 * 60 * 24);
        var dt = d.getDate() + "." + d.getMonth() + "." + d.getFullYear();
        var today = todayDate.getDate() + "." + todayDate.getMonth() + "." + todayDate.getFullYear();
        var yesterday = yesterdayDate.getDate() + "." + yesterdayDate.getMonth() + "." + yesterdayDate.getFullYear();

        if (returnDiffDays) {
            if (dt == today)
                return "0";
            else if (dt == yesterday)
                return "1";
            else
                return Math.ceil(((new Date()) - d) / (1000 * 60 * 60 * 24)) + "";
        }
        else {
            if (dt == today)
                return i18n.datetime.todayAt + " " + $filter('date')(d, 'shortTime');
            else if (dt == yesterday)
                return i18n.datetime.yesterdayAt + " " + $filter('date')(d, 'shortTime');
            else
                return $filter('date')(d, 'longDate');
        }
    }
}]);


my.directive('autogrow', [function () {
    return function (scope, element, attr) {
        element.css({resize: "none"});
        var style = window.getComputedStyle ? window.getComputedStyle(element[0], null) : element[0].currentStyle;
        var marginTop = -(parseInt(style.paddingTop) + parseInt(style.paddingBottom)) + "px";
        var clone = $("<textarea></textarea>").attr({'class': element.attr("class"), style: element.attr("style")})
        //.css({height: 0, minHeight: 0, display: "block", visibility: 'hidden', overflow: "hidden", position: "relative", marginTop: marginTop, marginBottom: 0})
        clone.css({height: 0, minHeight: 0});
        var wrap = $("<div style='height: 0; overflow: hidden;'></div>");
        clone.appendTo(wrap);
        element.after(wrap);
        element.on('input', resize);
        scope.$watch(attr.ngModel, resize);
        var prev = 0;

        function resize() {
            clone.val(element.val());
            var newh = clone[0].scrollHeight + 30;
            if (prev - newh) {
                element.css({"height": newh});
            }
            prev = newh;
        }
    }
}]);

my.directive('placeholder', [function () {
    return function (scope, element, attr) {
        if (typeof element[0].placeholder == 'undefined') {
            var placeholder = attr.placeholder;
            setTimeout(function () {
                element.val(placeholder);
            })
            element.on("blur", function () {
                if (element.val() == "")
                    element.val(placeholder);
            })
            element.on("focus", function () {
                if (element.val() == placeholder)
                    element.val("");
            })
        }
    }
}]);


my.directive('timepicker', function ($locale, $filter) {
    function timeFormat(time) {
        var dt = new Date("2000/01/01 " + time);
        return time && dt.getTime() ? $filter('date')(dt, 'shortTime') : "";
    }

    function normalTime(dt) {
        return dt.getTime() ? $filter('date')(dt, 'HH:mm:00') : "";
    }

    return {
        restrict: "EA",
        require: 'ngModel',
        scope: {
            minTime: "=",
            maxTime: "="
        },
        link: function (scope, elem, attr, ngModel) {
            scope.$watch(function () {return ngModel.$modelValue}, function () {
                //if (ngModel.$modelValue);
                //console.log("Model change", ngModel.$modelValue);
                var dt = new Date("2000/01/01 " + ngModel.$modelValue);
                if (dt.getTime()) {
                    //elem.timepicker("setTime", dt);
                }
                else {
                    //ngModel.$setViewValue('');
                }
            });

            scope.$watch("minTime", function (val) {
                elem.timepicker("option", {minTime: val});
            });
            scope.$watch("maxTime", function (val) {
                elem.timepicker("option", {maxTime: val});
            });

            ngModel.$formatters.push(function (modelValue) {
                //console.log("Formatters", modelValue, timeFormat(modelValue));
                return timeFormat(modelValue);
            });

            ngModel.$parsers.push(function (viewValue) {
                if (viewValue) {
                    var dt = normalTime(new Date("2000/1/1 " + viewValue.replace(/([ap]m)/i, " $1")));
                }
                //console.log("Parser", viewValue, dt);
                ngModel.$setValidity("timeError", dt);
                return dt;
            });

            elem.on("blur", function () {
                //elem.val(timeFormat(ngModel.$modelValue));
                setTimeout(function () {
                    //console.log("Blur", ngModel.$modelValue, timeFormat(ngModel.$modelValue));
                    elem.val(timeFormat(ngModel.$modelValue)).change();
                }, 10);
                //scope.$apply();
            });

            elem.timepicker({
                timeFormat: $locale.DATETIME_FORMATS.shortTime.replace(/mm/, "i").replace(/HH/, "H"),
                step: 30
            });
        }
    }
});

my.directive('colorpicker', function () {
    return {
        restrict: "EA",
        require: 'ngModel',
        scope: {},
        link: function (scope, elem, attr, ngModel) {
            scope.$watch(function () {return ngModel.$modelValue}, function () {
                //if (ngModel.$modelValue)
                elem.spectrum("set", ngModel.$modelValue || '#FFF');
                //else;
                //ngModel.$setViewValue('#fff');
            });


            elem.spectrum({
                //color: '#FFF',
                preferredFormat: "hex",
                showPalette: true,
                palette: [
                    ['#ffffff'],
                    ['#e1f8db'],
                    ['#e1e6ec'],
                    ['#c7eafd'],
                    ['#ffd3e0'],
                    ['#fff3c3'],
                    []
                ],
                showInput: true,
                allowEmpty: false,
                clickoutFiresChange: true
            });
            $(".sp-button-container").remove();
        }
    }
});

my.directive('datepicker', function ($filter, $locale, $timeout) {
    DPGlobal.dates.months = $locale.DATETIME_FORMATS.MONTH.slice();
    DPGlobal.dates.monthsShort = $locale.DATETIME_FORMATS.SHORTMONTH.slice();
    DPGlobal.dates.days = $locale.DATETIME_FORMATS.DAY.slice();
    DPGlobal.dates.daysShort = $locale.DATETIME_FORMATS.SHORTDAY.slice();
    DPGlobal.dates.daysMin = $locale.DATETIME_FORMATS.SHORTDAY.slice();
    function normalizeMonthNames(array) {
        for (var i = 0; i < 12; i++) {
            array[i] = array[i].charAt(0).toUpperCase() + array[i].slice(1).replace(/я$/, "ь").replace(/аь$/, "ай").replace(/а$/, "").replace(".", "");
        }
    }

    normalizeMonthNames(DPGlobal.dates.months);
    normalizeMonthNames(DPGlobal.dates.monthsShort);

    return {
        restrict: "EA",
        require: "ngModel",
        scope: {
            minDate: "=",
            maxDate: "=",
            periodFrom: "=",
            periodTo: "="
        },
        link: function (scope, elem, attr, ngModel) {
            ngModel.$formatters.push(function (modelValue) {
                return modelValue && modelValue.getTime() ? $filter('date')(modelValue, 'shortDate') : '';
            });
            ngModel.$parsers.push(function (viewValue) {
                viewValue = viewValue || "";
                viewValue = viewValue.replace(/[\.\-]/g, "/");
                viewValue = viewValue.replace(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, "$3/$2/$1");
                console.log(viewValue);
                var date = new Date(viewValue).shiftToUTC();
                var datesec = date.getTime();

                //ngModel.$setValidity('valid', !!datesec);

                if (datesec) {
                    if (scope.periodFrom && scope.periodFrom > date)
                        scope.periodFrom = new Date(datesec);
                    if (scope.periodTo && scope.periodTo < date)
                        scope.periodTo = new Date(datesec);
                }

                return date;
            });

            var params = {
                format: $locale.DATETIME_FORMATS.shortDate.toLowerCase()
            };
            params.onRender = function (date) {
                if (scope.minDate && scope.minDate > date)
                    return "disabled";

                if (scope.maxDate && scope.maxDate < date)
                    return "disabled";

                return '';
            };

            elem.on("blur", function () {
                var date = ngModel.$modelValue;
                elem.val((date && date.getTime()) ? $filter('date')(date, 'shortDate') : "").change();
            });

            elem.datepicker(params);

            elem.addClass("span2");
            var $icon = $('<span class="add-on"><i class="icon-calendar"></i></span>');
            elem.after($icon);

            var $parent = $icon.parent();
            $parent.addClass('input-append');
            if (attr.noblock)
                $parent.css("display", "block");

            elem.focus(function () {
                elem.trigger("showcalendar");
            });
            $icon.click(function () {
                elem.focus();
            });

        }
    }
});

/*
 my.directive('datepicker1', ["$filter", "$timeout", "$locale",
 function ($filter, $timeout, $locale) {
 DPGlobal.dates.months = $locale.DATETIME_FORMATS.MONTH.slice();
 DPGlobal.dates.monthsShort = $locale.DATETIME_FORMATS.SHORTMONTH.slice();
 DPGlobal.dates.days = $locale.DATETIME_FORMATS.DAY.slice();
 DPGlobal.dates.daysShort = $locale.DATETIME_FORMATS.SHORTDAY.slice();
 DPGlobal.dates.daysMin = $locale.DATETIME_FORMATS.SHORTDAY.slice();
 function normalizeMonthNames(array) {
 for (var i = 0; i < 12; i++) {
 array[i] = array[i].charAt(0).toUpperCase() + array[i].slice(1).replace(/я$/, "ь").replace(/аь$/, "ай").replace(/а$/, "").replace(".", "");
 }
 }

 normalizeMonthNames(DPGlobal.dates.months);
 normalizeMonthNames(DPGlobal.dates.monthsShort);
 return {
 restrict: 'EA',
 priority: 10,
 require: "ngModel",

 scope: {
 model: '=datepicker',
 minDate: '=',
 maxDate: '=',
 periodFrom: '=',
 periodTo: '=',

 callback: '&change',

 */
/* angular, wtf? *//*

 ngDisabled: '=',
 ngReadonly: '=',
 ngShow: '=',
 ngHide: '='
 },
 link: function (scope, element, attrs, ngModel) {
 console.log("DATEPICKER", ngModel);
 if ($.fn.datepicker) {
 var input = element.find("input");

 scope.$watch("ngDisabled", function (val) {
 input.attr("disabled", val);
 });

 function setDate() {
 if (scope.model instanceof Date && scope.model.getTime()) {
 input.data("date", scope.model.getTime());
 input.val($filter('date')(scope.model, 'shortDate'));
 //input.trigger("update");
 }
 else {
 input.val("");
 }
 }

 function getDay(date) {
 if (date instanceof Date) {
 var day = date.getFullYear() * 10000 + date.getMonth() * 100 + date.getDate();
 return day;
 }
 }

 scope.$watch(function () {return scope.model && scope.model.getTime()}, function (current, prev) {
 setDate();
 });


 var params = $.extend({}, attrs);
 params.onRender = function (date) {
 if (scope.minDate && scope.minDate > date)
 return "disabled";

 if (scope.maxDate && scope.maxDate < date)
 return "disabled";
 return '';
 };

 //params.format = params.format.toLowerCase();
 //params.format = $locale.DATETIME_FORMATS.shortDate.toLowerCase();
 params.format = "yyyy-mm-dd";
 //input.data("date", scope.model && scope.model.toISOString() || "");
 input.data("date", new Date().getTime());
 setDate();
 input.datepicker(params);
 input.focus(function () {
 input.trigger("showcalendar");
 });
 element.find(".add-on").click(function () {
 input.focus();
 });
 input.change(function () {
 if (!scope.model)
 scope.model = new Date();
 //
 //

 //scope.$apply(function () {
 var date = new Date(input.data("date"));
 scope.model.setTime(date);
 setDate();

 var rawDate = date.getTime();
 var dayInt = date.getDayInt();
 if (dayInt) {
 scope.model.setTime(rawDate);
 if (scope.periodFrom && scope.periodFrom.getDayInt() > dayInt)
 scope.periodFrom.setTime(rawDate);
 if (scope.periodTo && scope.periodTo.getDayInt() < dayInt)
 scope.periodTo.setTime(rawDate);
 $timeout(scope.callback);
 }
 else
 console.error("error date");
 //});
 });
 }
 else
 console.error("datepicker is not defined");
 }
 }
 }]);
 */


my.directive('barChart', [function () {
    return {
        restrict: 'E',
        replace: true,
        template: '<div class="chart"></div>',
        scope: {
            width: '@',
            height: '@',
            ytitle: "@",
            xtitle: "@",
            data: '=data',
            hovered: '=hovered'
        },
        link: function (scope, element, attrs) {
            var chart = d3.custom.barChart();
            var chartEl = d3.select(element[0]);
            chartEl.select(".y-axis-title").text("fuck");

            //scope.ytitle = "asdfasfaf";

            chart.on('customHoverIn', function (d, i) {
                scope.hovered = d;
                scope.$apply();
            });

            chart.on('customHoverOut', function (d, i) {
                scope.hovered = null;
                scope.$apply();
            });

            scope.$watch('data', function (newVal, oldVal) {
                chartEl.datum(newVal).call(chart);
            });

            scope.$watch('width', function (d, i) {
                chartEl.call(chart.width(scope.width));
            })
            scope.$watch('ytitle', function (d, i) {
                chartEl.call(chart.ytitle(scope.ytitle));
            })

            scope.$watch('height', function (d, i) {
                chartEl.call(chart.height(scope.height));
            })
        }
    }
}]);


my.directive('spin', [function () {
    return {
        restrict: 'EA',
        scope: {
            config: "&spin"
        },
        link: function (scope, element, attrs) {
            scope.config = scope.config() || {};
            var defaults = {
                width: 4,
                length: 4,
                lines: 11,
                radius: 7
            };
            angular.extend(defaults, scope.config);
            var size = (defaults.width + defaults.length + defaults.radius) * 2;
            element.css({display: "inline-block", verticalAlign: "top", width: size + "px", height: size + "px"});
            console.log(scope.config);

            new Spinner(defaults).spin(element[0]);
        }
    }
}]);


my.directive('ngBlur', [function () {
    return {
        restrict: 'A',
        link: function postLink(scope, element, attrs) {
            element.bind('blur', function () {
                scope.$apply(attrs.ngBlur);
            });
        }
    };
}]);


my.directive("button", function ($compile) {
    return {
        restrict: "E",
        link: function (scope, elem, attr) {
            //console.log("BUTTON", attr);
            if (attr.type == "submit" && elem.hasClass("btn")) {
                var form = elem[0].form;
                if (form && form.name) {
                    scope.$watchCollection("[process, " + form.name + ".$invalid]", function (val) {
                        elem.attr("disabled", scope.process || scope[form.name].$invalid);
                        elem.toggleClass("process", scope.process);
                        elem.toggleClass("btn-primary", !scope[form.name].$invalid);
                    });
                    //var clone = elem.clone();
                    //clone.removeClass("ng-binding");
                    //elem.replaceWith(clone);
                    //$compile(elem.contents())(scope);
                }
            }
        }
    }
});


/**
 * Fix browser autofill
 */
my.directive('autoFillSync', function ($timeout) {
    return {
        require: 'ngModel',
        link: function (scope, elem, attrs, ngModel) {
            var origVal = elem.val();

            function setVal() {
                var newVal = elem.val();
                if (ngModel.$pristine && origVal !== newVal) {
                    ngModel.$setViewValue(newVal);
                }
            }

            $timeout(setVal, 500);
            elem.on("blur focus", function () {
                $("[auto-fill-sync]").trigger("change");
                //console.log($("[auto-fill-sync]").not(this));
                ngModel.$setViewValue(elem.val());
                scope.$apply();
                //$timeout(setVal, 500);
            });
        }
    }
});


my.directive("modal", function () {
    var $backdrop = $("<div class='modal-backdrop f1ade'>");
    return {
        scope: {
            modal: "="
        },
        link: function (scope, elem, attr) {
            var $close = $('<a class="close">&times;</a>');
            elem.wrapInner('<div class="modal-dialog"></div>');

            $backdrop.hide()//.appendTo(elem);
//            elem.appendTo("body");

            var $modalDialog = elem.find('.modal-dialog');
            elem.find(".modal-header").prepend($close);
            elem.hide().addClass("mymodal");
            if (attr.width)
                $modalDialog.css("width", attr.width);
            elem.on("transitionend", function (e) {
                if (e.originalEvent.propertyName == "opacity" && elem.css("opacity") == 0) {
                    //console.log(e.originalEvent);
                    elem.hide();
                    $backdrop.hide();
                    $("body").removeClass('noscroll')//.css({marginRight: 0});
                }
            });
            scope.$watch("modal", function () {
                if (scope.modal) {
                    if (window.innerWidth)
                        $("body")/*.css({marginRight: window.innerWidth - document.body.offsetWidth + "px"})*/.addClass('noscroll');
                    $backdrop.show();
                    elem.show();
                    setTimeout(function () {
                        elem.addClass("in");
                        $backdrop.addClass("in");
                        var scrollTop = $(window).scrollTop();
                        $(window).bind("scroll.modal", function () {
                            window.scrollTo(0, scrollTop);
                        });
                    }, 20);
                }
                else {
                    elem.removeClass("in");
                    $backdrop.removeClass("in");
                    $(window).unbind("scroll.modal");
                }
            });

            elem.on("click touchend", ".close, .cancel", function () {
                scope.modal = false;
                scope.$apply();
            });

            $(document).keydown(function (e) {
                if (e.keyCode == 27) { // Esc
                    $(document).trigger("click");
                    scope.modal = false;
                    scope.$apply();
                }
            });

            $backdrop.on("click touchend", function () {
                scope.modal = false;
                scope.$apply();
            })
        }
    }
});


my.directive("checkboxlist", function ($timeout, $compile, $parse) {
    return {
        require: 'ngModel',
        scope: true,
        compile: function (elem, attr) {
            elem.hide();
            var $list = $("<div>");
            elem.after($list);

            var html = '';
            if (attr.all) {
                html += '<div><label><input ng-disabled="disabled" ng-change="change(\'0\')" ng-model="data[0]" type="checkbox"/> ' + attr.all + ' </label></div>\n';
            }
            if (attr.ngOptions) {
                var m = attr.ngOptions.split(' for ');
                if (m.length) {
                    var mm = m[0].split(' as ');
                    if (mm) {

                        var value = mm[0];
                        var label = mm[1];
                        var repeat = m[1];
                        var list_model = repeat.split(' in ').pop();
                        html += '<div ng-show="(' + list_model + ').length>10 && data[' + value + ']" ng-repeat="' + repeat + '"><label><input ng-disabled="disabled" ng-change="change(\'' + value + '\')" ng-model="data[' + value + ']" type="checkbox"/> {{' + label + '}} </label></div>\n';
                        html += '<div ng-show="(' + list_model + ').length<=10 || !data[' + value + ']" ng-repeat="' + repeat + '"><label><input ng-disabled="disabled" ng-change="change(\'' + value + '\')" ng-model="data[' + value + ']" type="checkbox"/> {{' + label + '}} </label></div>\n';
                        /*

                         if (attr.dontmove) {
                         html += '<div ng-repeat="' + repeat + '"><label><input ng-disabled="disabled" ng-change="change(\'' + value + '\')" ng-model="data[' + value + ']" type="checkbox"/> {{' + label + '}} </label></div>\n';
                         }
                         else {
                         html += '<div ng-show="data[' + value + ']" ng-repeat="' + repeat + '"><label><input ng-disabled="disabled" ng-change="change(\'' + value + '\')" ng-model="data[' + value + ']" type="checkbox"/> {{' + label + '}} </label></div>\n';
                         html += '<div ng-show="!data[' + value + ']" ng-repeat="' + repeat + '"><label><input ng-disabled="disabled" ng-change="change(\'' + value + '\')" ng-model="data[' + value + ']" type="checkbox"/> {{' + label + '}} </label></div>\n';
                         }
                         */
                    }
                    else
                        console.error('select ng-options not format << VALUE as LABEL for ITEM as ITEMS >>');
                }
                else
                    console.error('select ng-options not format << VALUE as LABEL for ITEM as ITEMS >>');
            }
            else {
                console.error('select ng-options attribute undefined');
            }


            /*html = html.replace(/<option([^>]*)>([\s\S]*)<\/option>/ig, function (m, attrs, text) {
             var res = m.match(/ value=['"]?([^'" ]+?)['" ]/i);
             if (res) {
             var value = res[1].replace('{{', '').replace('}}', '');
             return '<div ' + attrs + '><label><input ng-change="change(\'' + value + '\')" ng-model="data[' + value + ']" type="checkbox"/> ' + text + '</label></div>\n';
             }
             });*/

            //html.replace(/<option/g, '<div><label><input').replace(/<\/option>/, '</label></div>');

            /* var repeatOption = elem.find('optgroup[ng-repeat], optgroup[data-ng-repeat], option[ng-repeat], option[data-ng-repeat]');
             if (repeatOption.length) {
             var repeatAttr = repeatOption.attr('ng-repeat') || repeatOption.attr('data-ng-repeat');
             var watch = jQuery.trim(repeatAttr.split('|')[0]).split(' ').pop();
             }*/

            return function (scope, elem, attr, ngModel) {
                scope.data = {};
                var init = false;
                scope.disabled = false;
                /*scope.$watch('attr.ngDisabled', function (val) {
                 scope.disabled = val;
                 console.log(val);
                 });*/

                scope.$watch($parse(attr.ngDisabled), function (newValue) {
                    scope.disabled = newValue;
                });

                scope.$watchCollection("data", function (ddd) {
                    //console.log("FFFFFDSAFAS", ddd);
                    var list = [];
                    for (var id in scope.data) {
                        if (scope.data.hasOwnProperty(id)) {
                            var num = +id;
                            if (scope.data[id] && num !== 0) {
                                list.push(num == id ? num : id);
                            }
                        }
                        //elem.find("option[value='" + id + "']").attr("selected", scope.data[id]);
                    }
                    if (init) {
                        //console.log("$setViewValue");
                        ngModel.$setViewValue(list);
                    }
                    init = true;
                });


                $list.html(html);
                $compile($list)(scope);

                scope.$watchCollection(function () {return ngModel.$modelValue}, function (values) {
                    //console.log(ngModel.$modelValue, values);
                    scope.data = {};
                    if (values instanceof Array) {
                        values.forEach(function (val) {
                            scope.data[val] = true;
                        });
                        if (!values.length)
                            scope.data[0] = true;
                    }

                });
                scope.change = function (value) {
                    if (+value === 0) {
                        scope.data = {0: true};
                    }
                    else
                        scope.data[0] = false;
                };

                /*scope.$watchCollection(watch, function (coll) {
                 setTimeout(function () {
                 scope.$apply();
                 setTimeout(function () {
                 var html = '';
                 var items = [];
                 if (attr.all) {
                 items.push([0, attr.all]);
                 }
                 for (var i = 0; i < elem[0].options.length; i++) {
                 var option = elem[0].options[i];
                 items.push([option.value, option.text]);
                 }
                 console.log("Watch", watch, items);
                 for (var i = 0; i < items.length; i++) {
                 html += '<div><label><input ng-change="change(\'' + items[i][0] + '\')" ng-model="data.' + items[i][0] + '" type="checkbox"/> ' + items[i][1] + '</label></div>';
                 }

                 $list.html(html);
                 $compile($list)(scope);
                 scope.$apply();
                 });
                 });
                 })*/
            };

        }
    }
});


my.directive('dropdown', function () {
    return {
        restrict: "A",
        link: function (scope, elem, attr) {
            //console.log("DROPDOWN", elem);
            var $dropdownMenu = elem.find(".dropdown-menu");
            $(document).mousedown(function () {
                $dropdownMenu.hide();
            });
            $dropdownMenu.mousedown(function (e) {
                e.stopPropagation();
            });
            $dropdownMenu.click(function (e) {
                $dropdownMenu.hide();
            });
            elem.find(".dropdown-link").click(function () {
                $dropdownMenu.toggle();
            });

        }
    }
});


my.directive('uploadfile', function ($parse, $compile) {
    var template = '<div class="file">\
    <label onclick="if(navigator.userAgent.match(/(presto|firefox)/i)){$(this).prev().click()}" class="btn">\
    <input style="position: absolute; left: -1000px; top: -1000px;" class="inputFile" onchange="angular.element(this).scope().selectFile(this)" type="file"/>\
    __select_file__\
    </label>\
    <div>\
        <img valign=top style="margin: 5px 0 0 0; vertical-align: top; max-width: 200px; max-height: 100px;">\
        <i class="icon-remove img-remove"></i>\
    </div>\
    <span ng-show="file.name" class="filename"><span class=""></span> {{file.name}}</span>\
    </div>';
    return {
        scope: true,
        //transclude: true,
        //replace: true,
        //scope: {},
        require: '^ngModel',
        //template: template,
        compile: function ($element, $attrs) {
            $element.hide();
            template = template.replace('__select_file__', $attrs.buttonText);
            var $tmpl = $(template);
            $element.after($tmpl);
            var $label = $tmpl.find('label');
            var $file = $tmpl.find('input[type=file]');

            var $remove = $tmpl.find('.img-remove');

            //elem.after(template);
            return function postLink($scope, $element, $attrs, ngModel) {
                $compile($tmpl)($scope);


                $remove.click(function () {
                    if (!$attrs.confirmDelete || $attrs.confirmDelete && confirm($attrs.confirmDelete)) {
                        $file.replaceWith($file = $file.clone());
                        $tmpl.find('img').attr('src', '');
                        $remove.hide();
                        ngModel.$setViewValue('');
                        ngModel.$render();
                    }
                });

                $scope.$watch(function () {return ngModel.$modelValue}, function (val) {
                    if (val) {
                        $tmpl.find('img').attr('src', $attrs.baseUrl + val);
                        $remove.show();
                    }
                    else {
                        $tmpl.find('img').attr('src', '');
                        $remove.hide();
                    }
                });
                $scope.selectFile = function (input) {
                    var file = input.files[0];
                    if (file) {
                        function next() {
                            $label.addClass('disabled process');
                            var xhr = new XMLHttpRequest();
                            xhr.onreadystatechange = function (e) {
                                if (4 == this.readyState) {
                                    $label.removeClass('disabled process');
                                    if (status >= 400) {
                                        return alert("Error corrupted when load the file");
                                    }
                                    try {var fileObj = JSON.parse(this.response)} catch (e) {}
                                    $tmpl.find('img').attr('src', $attrs.baseUrl + fileObj.id);
                                    $remove.show();
                                    ngModel.$setViewValue(fileObj.id);
                                    ngModel.$render();

                                    //$scope.$apply();
                                }
                            };
                            xhr.open('post', $attrs.postUrl, true);
                            //xhr.setRequestHeader("Content-Type","multipart/form-data");
                            var formData = new FormData();
                            formData.append("file", file);
                            xhr.send(formData);
                        }
                    }
                    $scope.$apply(function () {
                        var fn = $parse($attrs.beforeUpload);
                        fn($scope, { file: file, next: next });
                    });
                };

                //ngModel.$setViewValue(value);
            }
        }
    }
});


my.directive('onlyNumbers', function () {
    return {
        require: "ngModel",
        link: function (scope, elem, attrs, ngModel) {
            scope.$watch(function () { return ngModel.$modelValue}, function (val) {
                elem.addClass("only-numbers");
                elem.toggleClass('negate', val < 0);
                elem.toggleClass('filled', Number.isFinite(val));
            });
            elem.on('keydown', function (e) {

                if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190, 187, 189, 190]) !== -1 ||
                    // Allow: Ctrl+A
                    (e.keyCode == 65 && e.ctrlKey === true) ||
                    // Allow: home, end, left, right
                    (e.keyCode >= 35 && e.keyCode <= 39)) {
                    // let it happen, don't do anything
                    return;
                }
                // Ensure that it is a number and stop the keypress
                if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                    e.preventDefault();
                }
            });
            ngModel.$parsers.push(function (val) {
                val = parseFloat(val, 10);
                return Number.isFinite(val) ? val : '';
            });

            /*ngModel.$formatters.push(function (val) {
             return Math.random();
             });*/

            elem.on("blur", function () {
                elem.val(ngModel.$modelValue);
            });

        }
    }
});

my.directive('tabs', function ($compile) {
    return {
        restrict: "EA",
        //replace: true,
        //transclude: true,
        //template: '<ul class="nav nav-tabs"><li ng-class="{active: ngModel==tab.value}" ng-repeat="tab in tabs"><a ng-click="$parent.ngModel=tab.value">{{tab.title}}</a></li></ul><div class="tabs" n1g-transclude></div>',
        scope: {
            ngModel: '=?'
        },
        //priority: 0,
        controller: function ($scope, $attrs) {
            this.$scope = $scope;
            this.$attrs = $attrs;
            $scope.tabs = [];

        },
        link: function (scope, elem) {
            var $ul = $('<ul class="nav nav-tabs"><li ng-class="{active: ngModel==tab.ngValue}" ng-repeat="tab in tabs track by tab.$id"><a ng-click="$parent.ngModel=tab.ngValue">{{tab.ngTitle}}</a></li></ul>');
            elem.prepend($ul);
            $compile($ul)(scope);
        }
    }
});
my.directive('tab', function () {
    return {
        restrict: "EA",
        //replace: true,
        //transclude: true,
        require: "^tabs",
        //priority: 100,
        /*scope: {
         ngTitle: "=",
         ngValue: "=?"
         },*/
        scope: true,
        //template: '<div class="tab" n1g-show="activeTab == ngValue" ng-transclude></div>',
        link: function (scope, elem, attrs, tabsController) {
            scope.ngValue = attrs.ngValue;
            scope.ngTitle = attrs.ngTitle;
            if (!scope.ngValue) {
                scope.ngValue = Math.random();//'tab' + tabsController.$scope.tabs.length - 1;
            }
            tabsController.$scope.$watch('ngModel', function (tab) {
                scope.activeTab = tab;
                elem.toggleClass('ng-hide', tab != scope.ngValue);
            });
            tabsController.$scope.tabs.push(scope);

            if (attrs.active || typeof tabsController.$scope.ngModel == 'undefined') {
                tabsController.$scope.ngModel = scope.ngValue;
            }
            scope.$on('$destroy', function () {
                var index = tabsController.$scope.tabs.indexOf(scope);
                if (index > -1)
                    tabsController.$scope.tabs.splice(index, 1);
            });
        }
    }
});

/**
 * @ngdoc directive
 * @name ng.directive:i18n
 * @element ANY
 * @param {expression} i18n
 */
my.directive('i18n', function () {
    return {
        restrict: "EA",
        link: function (scope, elem, attr) {
            var text = scope.$eval("i18n['" + attr.i18n + "']");
            if (attr.label)
                text += ':';
            elem.text(text);
        }
    }
});

my.directive('delayedEvent', function () {
    return {
        require: "ngModel",
        scope: {
            event: '&delayedEvent'
        },
        link: function (scope, element, attrs, ngModel) {
            /* scope.$watch(function () {return ngModel.$modelValue}, function () {
             });*/

            var timeout;
            element.on('keyup paste search', function () {
                clearTimeout(timeout);
                timeout = setTimeout(function () {
                    scope.event(ngModel.$modelValue);
                    scope.$apply();
                }, attrs.delay || 500);
            });
        }
    };
});

my.directive("dynamicName", function ($compile) {
    return {
        restrict: "A",
        terminal: true,
        priority: 1000,
        link: function (scope, element, attrs) {
            element.attr('name', scope.$eval(attrs.dynamicName));
            element.removeAttr("dynamic-name");
            $compile(element)(scope);
        }
    };
});


my.directive('dropfiles', function ($parse) {
    return {
        link: function (scope, elem, attrs) {
            elem.bind("dragover", function () {
                elem.addClass('hover');
                return false;
            });

            elem.bind("dragleave", function () {
                elem.removeClass('hover');
                return false;
            });

            elem.bind("drop", function (event) {
                event.originalEvent;
                event.originalEvent.preventDefault();
                elem.removeClass('hover');
                elem.addClass('drop');
                var fn = $parse(attrs.dropfiles);

                fn(scope, { files: event.originalEvent.dataTransfer.files });
            });

        }
    }
});

my.directive('navTabs', function ($route, $location) {
    return {
        restrict: 'A',
        link: function (scope, element) {
            var $ul = $(element);
            var $body = $("body");

            function changeLocation() {
                if (!$route.current)
                    return;

                var regexp = $route.current.$$route.regexp;
                for (var i in $route.routes) {
                    var temp = $route.routes[i].templateUrl || '';
                    var className = temp.split('/').pop().split('.').shift();
                    if (temp) {
                        $body.removeClass(className);
                    }
                }
                var className = $route.current.$$route.templateUrl.split('/').pop().split('.').shift();
                $body.addClass(className);

                var a = $ul.find('a[href]');
                $ul.find("li.active").removeClass("active");
                for (var i = 0; i < a.length; i++) {
                    var $a = $(a[i]);
                    var href = $a.attr('href');
                    var test = regexp.test($(a[i]).attr('href'));
                    if (test) {
                        $a.parent().addClass("active");
                        break;
                    }
                }
            }

            scope.$on('$locationChangeSuccess', changeLocation);
            changeLocation();
        }

    };
});


my.directive('imageUploader', function (growl, File) {
    return {
        template: '\
    <div dropfiles="selectFile(files)" class="upload_images">\
        <label class="upload_image animate" ng-style="{backgroundImage: \'url(\'+img.thumb + \')\'}" \
                ng-class="{error: img.error, uploading: !img.uploaded, active: useActiveImage && activeImage == img}" \
                ng-repeat="img in imgList">\
            <a ng-click="removeImage(img)" class="close_button"></a>\
            <span class="icon-star"></span>\
            <div ng-if="!img.uploaded" class="spin" spin="{color: \'#FFF\', shadow: true}"></div>\
            <input ng-disabled="!img.uploaded" ng-model="$parent.activeImage" ng-value="img" type="radio"/>\
        </label>\
        <label ng-hide="hideAddButton" class="add_button square_button">\
            <span class="button_label"></span>\
            <input style="position: absolute; left: -1000px;"  multiple accept="image/*" type="file" ng-model="file[$index]"/>\
        </label>\
    </div>',
        scope: {
            images: '=images',
            limit: '@',
            activeImage: '=?'
        },
        controller: function ($scope, $attrs) {
            $scope.limit = $scope.limit || 10;
            $scope.imgList = [];

            $scope.singleMod = $scope.limit == 1;
            $scope.$watch('imgList', function () {
                if ($scope.singleMod)
                    $scope.images = $scope.imgList[0];
                else
                    $scope.images = $scope.imgList.slice();
            });


            if (!($scope.imgList instanceof Array))
                $scope.imgList = [];

            $scope.useActiveImage = typeof $attrs.activeImage != 'undefined';

            $scope.removeImage = function (file) {
                var index = $scope.imgList.indexOf(file);
                if (index > -1) {
                    $scope.imgList.splice(index, 1);
                    if ($scope.useActiveImage && $scope.activeImage == file)
                        $scope.activeImage = $scope.imgList[0] || null;
                }
                file.remove();
                checkCount();
            };

            function checkCount(apply) {
                $scope.hideAddButton = $scope.imgList.length >= $scope.limit;
                if (apply)
                    $scope.$apply();
                return !$scope.hideAddButton;
            }

            $scope.selectFile = this.selectFile = function (files) {
                console.log(files);


                for (var i = 0; i < files.length; i++) {
                    (function (htmlFile) {
                        if (!htmlFile.name.match(/(jpe?g|png|gif)$/i)) {
                            growl.addErrorMessage(i18n.__uploader_not_image.replace("__filename__", htmlFile.name));
                            $scope.$apply();
                            return;
                        }
                        if (htmlFile.size > 10000000) {
                            growl.addErrorMessage(i18n.__uploader_big_file.replace("__filename__", htmlFile.name));
                            $scope.$apply();
                            return;
                        }

                        var reader = new FileReader();
                        reader.onload = function (e) {
                            if ($scope.limit > $scope.imgList.length) {
                                var file = new File({file: htmlFile, url: e.target.result});
                                $scope.imgList.push(file);

                                checkCount();

                                file.save().then(function () {
                                    if ($scope.useActiveImage && !$scope.activeImage)
                                        $scope.activeImage = file;
                                }, function () {
                                    $scope.removeImage(file);
                                });
                            }
                            $scope.$apply();
                        };
                        reader.readAsDataURL(htmlFile);
                    })(files[i])
                }
            };
        },
        link: function (scope, elem, attrs, ctrl) {

            var button_label = scope.$root.$eval(attrs.i18nButton);
            elem.find(".button_label").text(button_label);

            var inputFile = elem.find("input[type=file]");
            inputFile.on('change', function () {
                ctrl.selectFile(inputFile[0].files);
            });
        }
    }
});


my.directive('fancybox', function () {
    return {
        link: function (scope, elem, attrs) {
            var rel = attrs.fancybox || Math.random().toString(33).substr(2, 5);
            elem.addClass("fancybox");
            elem.attr("rel", rel);
            elem.fancybox();
            elem.click(function () {
                var urls = [elem.attr("href")];
                $(".fancybox[rel=" + rel + "]").each(function () {
                    var url = $(this).attr("href");
                    if (url && urls.indexOf(url) === -1) {
                        urls.push(url);
                    }
                });
                if (urls.length > 1)
                    $.fancybox.open(urls, {
                        prevEffect: 'none',
                        nextEffect: 'none'
                    });
                return false;
            });
        }
    }
});


/**
 * @ngdoc directive
 * @name ng.directive:scroller
 * @element ANY
 * @param {expression} scroller
 */

my.directive('scroller', function () {
    return {
        link: function (scope, elem, attrs) {
            var verticalMode = typeof attrs.verticalMode != 'undefined';

            var className = attrs.class.split(" ").shift();
            var $arrows_h = elem.prevAll("." + className + "_arrow_h");
            var $arrows_v = elem.prevAll("." + className + "_arrow_v");
            var $left = elem.prevAll("." + className + "_left");
            var $right = elem.prevAll("." + className + "_right");
            var $top = elem.prevAll("." + className + "_top");
            var $bottom = elem.prevAll("." + className + "_bottom");

            var width = attrs.scrollWidth || 100;
            var height = attrs.scrollHeight || 100;
            var duration = attrs.scrollDuration || 200;

            elem.parent().addClass(verticalMode ? "vertical" : "horizontal");


            function recalc() {

                var scrollWidth = elem[0].scrollWidth;
                var scrollHeight = elem[0].scrollHeight;
                var scrollTop = elem[0].scrollTop;
                var scrollLeft = elem[0].scrollLeft;
                var elWidth = elem.width();
                var elHeight = elem.height();

                $top.toggleClass("active", scrollTop != 0);
                $bottom.toggleClass("active", scrollTop + elHeight < scrollHeight);

                $left.toggleClass("active", scrollLeft != 0);
                $right.toggleClass("active", scrollLeft + elWidth < scrollWidth);

                $arrows_h.toggle(scrollWidth < elWidth);
                $arrows_v.toggle(scrollHeight < elHeight);
            }

            elem.on("mouseenter", recalc);
            elem.on("scroll", recalc);

            $left.click(function () {
                elem.animate({scrollLeft: "-=" + width}, duration);
            });
            $right.click(function () {
                elem.animate({scrollLeft: "+=" + width}, duration);
            });
            $top.click(function () {
                elem.animate({scrollTop: "-=" + height}, duration);
            });
            $bottom.click(function () {
                elem.animate({scrollTop: "+=" + height}, duration);
            });
        }
    }
});

my.filter('walkdistance', function () {
    return function walkdistance(input) {
        var walkMPH = 3000;
        var busMPH = 15000;
        var walkTime = Math.max(5, Math.round(input / walkMPH * 60 / 5) * 5);
        var busTime = Math.max(5, Math.round(input / busMPH * 60 / 5) * 5);
        if (busTime > 40)
            busTime = '40+';

        if (walkTime <= 20) {
            return  i18n.__walk_time.replace('__time__', walkTime);
        }
        else {
            return  i18n.__bus_time.replace('__time__', busTime);
        }
    }
});

/**
 * @ngdoc directive
 * @name ng.directive:ngTitle
 * @element ANY
 * @param {expression} ngTitle
 */
/**
 * @ngdoc directive
 * @name ng.directive:ngValue
 * @element ANY
 * @param {expression} ngValue
 */
/**
 * @ngdoc directive
 * @name ng.directive:ngModel
 * @element ANY
 * @param {expression} ngModel
 */
my.directive('selectBox', function () {
    return {
        replace: true,
        template: '<label class="btn" ng-disabled="disabled()" ng-class="{active: ngModel==ngValue && !disabled()}">\
        <span bo-text="ngTitle"></span>\
        <input ng-model="ngModel" ng-change="onchange()" ng-disabled="disabled()" ng-value="ngValue" type="radio"/>\
        </label>',
        scope: {
            ngTitle: '=',
            ngModel: '=',
            ngValue: '=',
            change: '&',
            disabled: '&'
        },
        controller: function ($scope, $timeout) {
            $scope.onchange = function () {
                setTimeout(function () {
                    $scope.change();
                });
            }
        },
        link: function (scope, elem, attrs) {

        }
    }
});

my.filter('youtubeId', function () {
    return function (input) {
        return ((input || '').match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]{11}).*/) || [null, null, null])[2];
    }
});

my.filter('youtubeThumb', function () {
    return function (id, type, isBg) {
        var url = "";
        type = type || 'thumb';
        if (id)
            switch (type) {
                case "thumb":
                    url = 'http://img.youtube.com/vi/' + id + '/default.jpg';
                    break;
                case "big":
                    url = 'http://img.youtube.com/vi/' + id + '/hqdefault.jpg';
                    break;
            }
        if (isBg)
            url = 'url(' + url + ')';
        return url;
    }
});

my.directive("likes", function (Like) {
    return {
        restrict: "A",
        template: '<i class="icon-heart"></i> <span class="likes_num"></span>',
        link: function (scope, elem, attrs) {

            var $likesNum = elem.find(".likes_num");
            var obj = scope.$eval(attrs.likes);
            $likesNum.text(obj.likes);
            elem.toggleClass("active", Like.isMy(obj));
            elem.addClass("likes").click(function () {
                Like(obj).then(function (data) {
                    elem.toggleClass("active", data.is_like);
                    $likesNum.text(data.likes);
                });
            });
        }
    }
});

my.directive("passwordVerify", function () {
    return {
        require: "ngModel",
        scope: {
            passwordVerify: '='
        },
        link: function (scope, element, attrs, ctrl) {
            scope.$watch(function () {
                var combined;

                if (scope.passwordVerify || ctrl.$viewValue) {
                    combined = scope.passwordVerify + '_' + ctrl.$viewValue;
                }
                return combined;
            }, function (value) {
                if (value) {
                    ctrl.$parsers.unshift(function (viewValue) {
                        var origin = scope.passwordVerify;
                        if (origin !== viewValue) {
                            ctrl.$setValidity("passwordVerify", false);
                            return false;
                        } else {
                            ctrl.$setValidity("passwordVerify", true);
                            return viewValue;
                        }
                    });
                }
            });
        }
    };
});


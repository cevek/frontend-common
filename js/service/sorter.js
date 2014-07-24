angular.module("sorter", []).factory('Sorter', [function () {

    function Sorter() {
        this.predicate = "";
        this.reverse = false;
    }

    Sorter.prototype = {
        th: function (field, reverse) {
            if (this.predicate != field)
                this.reverse = reverse;
            this.reverse = !this.reverse;
            this.predicate = field;
        },
        icon: function (field) {
            return {
                "icon-caret-up": field == this.predicate && !this.reverse,
                "icon-caret-down": field == this.predicate && this.reverse
            }
        },
        orderBy: function () {
            return (this.reverse ? "-" : "+") + this.predicate;
        }
    }
    return Sorter;
}]);
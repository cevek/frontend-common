angular.module("paginator", []).factory("Paginator", [function () {

    function Paginator() {
        this.itemsCount = 0;
        this.perPage = 20;
        this.current = 1;
        this.pagesCount = 1;
        this.limit = 9;
        this.dotTemplate = "...";
        this.dotClass = "markers";
        this.list = [];
    }

    Paginator.prototype = {
        pageChange: function () {},
        getCurrent: function () {
            return this.current;
        },
        isCurrent: function (page) {
            return this.current == page;
        },
        isFirst: function (page) {
            return (page || this.current) == 1;
        },
        isLast: function (page) {
            return (page || this.current) == this.pagesCount;
        },
        getPerPage: function () {
            return this.perPage;
        },
        getPagesCount: function () {
            return this.pagesCount;
        },
        getList: function () {
            return this.list;
        },

        generateList: function () {
            this.list = [];
            var start = this.current - (this.limit / 2 | 0);
            start = this.pagesCount - start < this.limit ? this.pagesCount - this.limit + 1 : start;
            start = Math.max(1, start);
            for (var i = start; i <= Math.min(start + this.limit - 1, this.pagesCount); i++)
                this.list.push({value: i, text: i + ""});

            if (this.list.length > 1) {
                if (this.list[0].value != 1) {
                    this.list[0] = {value: 1, text: "1"};
                    this.list[1].text = this.dotTemplate;
                    this.list[1].className = this.dotClass;
                }

                var last = this.list.length - 1;
                if (this.list[last - 1].value != this.pagesCount - 1) {
                    this.list[last - 1].text = this.dotTemplate;
                    this.list[last - 1].className = this.dotClass;
                    this.list[last] = {value: this.pagesCount, text: this.pagesCount + ""};
                }
            }
        },

        next: function () {
            if (this.current < this.pagesCount)
                this.setPage(this.current + 1);
        },
        prev: function () {
            if (this.current > 1)
                this.setPage(this.current - 1);
        },
        setPage: function (page) {
            this.current = arguments[0] = Math.max(1, page | 0);
            this.generateList();
            this.pageChange.apply(null, arguments);
        },
        onPage: function (callback) {
            this.pageChange = callback;
        },
        setItemsCount: function (itemsCount) {
            this.itemsCount = itemsCount;
            this.calcPagesCount();
        },
        setPerPage: function (perPage) {
            this.perPage = perPage;
            this.calcPagesCount();
        },
        calcPagesCount: function () {
            this.pagesCount = Math.ceil(this.itemsCount / this.perPage);
            this.generateList();
        }
    };

    return Paginator;
}]);
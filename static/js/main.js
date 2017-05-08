var item_list = [];
var show_set = new Set();

/// The contents of the table row which gets added for each new package that is tracked
var DEFAULT_TR_CONTENTS = '<tr class="listRow" id="row{UUID}"><td><div class="checkbox"><label><input type="checkbox" name="{UUID}" onchange="modifyCart(this.name, this.checked)" id="checkbox{UUID}"></label></div></td><td class="uuid" id="uuid{UUID}">{UUID}</td><td class="name" id="name{UUID}">{NAME}</td><td class="location" id="location{UUID}">{LOCATION}</td><td id="total{UUID}">{TOTAL}</td><td id="quantity{UUID}"><input type="number" name="quantity{UUID}"></td></tr>';

function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

Set.prototype.isSuperset = function(subset) {
    for (var elem of subset) {
        if (!this.has(elem)) {
            return false;
        }
    }
    return true;
};

Set.prototype.union = function(setB) {
    var union = new Set(this);
    for (var elem of setB) {
        union.add(elem);
    }
    return union;
};

Set.prototype.intersection = function(setB) {
    var intersection = new Set();
    for (var elem of setB) {
        if (this.has(elem)) {
            intersection.add(elem);
        }
    }
    return intersection;
};

Set.prototype.difference = function(setB) {
    var difference = new Set(this);
    for (var elem of setB) {
        difference.delete(elem);
    }
    return difference;
};

$(function() {
    $.get("/get_all", function(data) {
        item_list = JSON.parse(data);
        $.each(item_list, addItemToList)
    });
});

function sendSearch() {
    $.get("/search", {"query": $("#search").text()}, function(data) {
        console.log("searching");
        var new_show = new Set(JSON.parse(data));
        var unhide = show_set.intersection(new_show);
        var hide = show_set.difference(new_show);
        for(var x of unhide) {
            showById(x);
        }
        for(var x of hide) {
            hideById(x);
        }
        show_set = new_show;
    });
}

function addItemToList(id, item) {
    if(item === 0) {
        return;
    } else {
        var ourRow = DEFAULT_TR_CONTENTS;
        ourRow = replaceAll(ourRow, "{UUID}", id);
        ourRow = replaceAll(ourRow, "{NAME}", item[0]);
        ourRow = replaceAll(ourRow, "{LOCATION}", item[3]);
        ourRow = replaceAll(ourRow, "{QUANTITY}", 0);
        ourRow = replaceAll(ourRow, "{TOTAL}", item[1]);
        $("#inventoryBody").append(ourRow);
        show_set.add(id);
    }
}

function showById(id) {
    $("#row" + id).show();
}

function hideById(id) {
    $("#row" + id).hide();
}
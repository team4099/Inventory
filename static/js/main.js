var item_list = [];
var show_list = [];

var cart = [];

/// The contents of the table row which gets added for each new package that is tracked
var DEFAULT_TR_CONTENTS = '<tr class="listRow" id="row{UUID}"><td><div class="checkbox"><label><input type="checkbox" name="{UUID}" onchange="modifyCart(this.name, this.checked)" id="checkbox{UUID}"></label></div></td><td class="uuid" id="uuid{UUID}">{DISPLAYUUID}</td><td class="name" id="name{UUID}">{NAME}</td><td class="location" id="location{UUID}">{LOCATION}</td><td class="notes" id="notes{UUID}">{NOTES}</td><td id="total{UUID}">{TOTAL}</td><td><input type="number" id="quantity{UUID}" name="quantity{UUID}" min="0" max="{TOTAL}" onkeyup="checkValidity({UUID})"></td></tr>';

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
    console.log("query: " + $("#search").val());
    $.get("/search", {"query": $("#search").val()}, function(data) {
        var new_order = JSON.parse(data);
        console.log(new_order);
        reorderTable(new_order);
        show_list = new_order;
    });
}

function addItemToList(id, item) {
    if(item === 0) {
        return;
    } else {
        var ourRow = DEFAULT_TR_CONTENTS;
        var str = "" + id;
        var pad = "0000";

        ourRow = replaceAll(ourRow, "{DISPLAYUUID}", pad.substring(0, pad.length - str.length) + str);
        ourRow = replaceAll(ourRow, "{UUID}", id);
        if(item[4] !== "") {
            ourRow = replaceAll(ourRow, "{NAME}", '<a target="_blank" href="' + item[4] + '">' + item[0] + '</a>');
        } else {
            ourRow = replaceAll(ourRow, "{NAME}", item[0]);
        }
        ourRow = replaceAll(ourRow, "{LOCATION}", item[3]);
        ourRow = replaceAll(ourRow, "{NOTES}", item[2]);
        ourRow = replaceAll(ourRow, "{QUANTITY}", 0);
        ourRow = replaceAll(ourRow, "{TOTAL}", item[1]);
        $("#inventoryBody").append(ourRow);

        var quantityPicker = $("#quantity" + id);
        quantityPicker.val(0);
        quantityPicker.keypress(function(e) {
            e.preventDefault();
        });

        show_list.push(id);
    }
}

function reorderTable(new_order) {
    for(var i = 0; i < new_order.length; i++) {
        // console.log("i: " + i + " new_order[i]:" + new_order[i]);
        $("#row" + new_order[i]).insertBefore("#inventoryBody tr:nth-child(" + (i + 1) + ")");
        // console.log($("#row" + new_order[i]).html());
    }
}

function checkValidity(uuid) {
    var quantityInput = $("#quantity" + uuid);
    if(quantityInput.val() > quantityInput.attr("max")) {
        quantityInput.val(quantityInput.attr("max"));
    } else if(quantityInput.val() < quantityInput.attr("min")) {
        quantityInput.val(quantityInput.attr("min"));
    }
}

function modifyCart(name, checked) {
    console.log("name: " + name + " checked: " + checked);
    var inCart = cart.indexOf(name);
    if(checked) {
        if(inCart < 0) {
            cart.push(name);
        }
    } else {
        if(inCart > -1) {
            cart.splice(inCart, 1);
        }
    }
}

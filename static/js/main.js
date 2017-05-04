var item_list = [];

/// The contents of the table row which gets added for each new package that is tracked
var DEFAULT_TR_CONTENTS = '<tr class="listRow" id="row{UUID}"><td><div class="checkbox"><label><input type="checkbox" name="{UUID}" onchange="modifyCart(this.name, this.checked)" id="checkbox{UUID}"></label></div></td><td class="uuid" id="uuid{UUID}">{UUID}</td><td class="name" id="name{UUID}">{NAME}</td><td class="location" id="location{UUID}">{LOCATION}</td><td id="quantity{UUID}"><input type="number" name="quantity{UUID}"></td></tr>';

function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

$(function() {
    $.get("/get_all", function(data) {
        item_list = JSON.parse(data);
        $.each(item_list, addItemToList)
    });
});

function addItemToList(id, item) {
    if(item === 0) {
        return;
    } else {
        var ourRow = DEFAULT_TR_CONTENTS;
        ourRow = replaceAll(ourRow, "{UUID}", id);
        ourRow = replaceAll(ourRow, "{NAME}", item[0]);
        ourRow = replaceAll(ourRow, "{LOCATION}", item[1]);
        ourRow = replaceAll(ourRow, "{QUANTITY}", 0);
        $("#inventoryBody").append(ourRow);
    }
}
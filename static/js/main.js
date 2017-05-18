var item_list = [];
var show_list = [];

var cart = [];

/// The contents of the table row which gets added for each new package that is tracked
var DEFAULT_TR_CONTENTS = '<tr class="listRow" id="row{UUID}">' +
    '<td><div class="checkbox"><label><input type="checkbox" name="{UUID}" onchange="modifyCart(this.name, this.checked)" id="checkbox{UUID}"></label></div></td>' +
    '<td class="uuid" id="uuid{UUID}">{DISPLAYUUID}</td>' +
    '<td class="name" id="name{UUID}">{NAME}</td>' +
    '<td class="location" id="location{UUID}">{LOCATION}</td>' +
    '<td class="notes" id="notes{UUID}">{NOTES}</td>' +
    '<td id="total{UUID}">{TOTAL}</td>' +
    '<td><input type="number" id="quantity{UUID}" name="quantity{UUID}" min="0" max="{TOTAL}" onkeyup="checkCheckbox({UUID})"></td>' +
    '</tr>';

var CART_TR_CONTENTS = '<tr id="cartRow{UUID}">' +
    '<td id="cartUUID{UUID}">{DISPLAYUUID}</td>' +
    '<td id="cartName{UUID}">{NAME}</td>' +
    '<td id="cartLocation{UUID}">{LOCATION}</td>' +
    '<td id="cartNotes{UUID}">{NOTES}</td>' +
    '<td id="cartTotal{UUID}">{TOTAL}</td>' +
    '<td id="cartQuantity{UUID}">{QUANTITY}</td>' +
    '</tr>';

var SHOW_ID_CONTENTS = '<div class="alert alert-success">' +
    '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span> </button>' +
    '<strong>Success!</strong> Added {QUANTITY} of {NAME} with ID {UUID} to location {LOCATION}' +
    '</div>';

var CHECK_IN_OUT_CONTENTS = '<div class="alert alert-success">' +
    '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span> </button>' +
    '<strong>Success!</strong> Checked {IN} {QUANTITY} of {NAME} with ID {UUID} {FROM} location {LOCATION}' +
    '</div>';

function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

function commonReplacements(replace, uuid, name, location, notes, total, quantity, from, in_out) {
    var str = "" + uuid;
    var pad = "0000";

    replace = replaceAll(replace, "{DISPLAYUUID}", pad.substring(0, pad.length - str.length) + str);
    replace = replaceAll(replace, "{NAME}", name);
    replace = replaceAll(replace, "{UUID}", uuid);
    replace = replaceAll(replace, "{LOCATION}", location);
    replace = replaceAll(replace, "{NOTES}", notes);
    replace = replaceAll(replace, "{QUANTITY}", quantity);
    replace = replaceAll(replace, "{TOTAL}", total);
    replace = replaceAll(replace, "{IN}", in_out);
    replace = replaceAll(replace, "{FROM}", from);
    return replace;
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
    $('#addItem').modal({
       show: false
    });
    $.get("/get_all", function(data) {
        item_list = JSON.parse(data);
        $.each(item_list, addItemToList)
    });
    $("#currentQuantity").change(function() {
        console.log("changed quantity in add");
        if($("#currentQuantity").val() < $("#currentQuantity").attr("min")) {
            $("#currentQuantity").val(0);
        }
    });
    $("#checkInQuantity").change(function() {
        console.log("changed quantity in checkin");
        if($("#checkInQuantity").val() < $("#checkInQuantity").attr("min")) {
            $("#checkInQuantity").val(0);
        }
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
        var name = "";
        if(item[4] !== "") {
            name = '<a target="_blank" href="' + item[4] + '">' + item[0] + '</a>';
        } else {
            name = item[0];
        }
        var ourRow = commonReplacements(DEFAULT_TR_CONTENTS, id, name, item[3], item[2], item[1], 0, "", "");

        $("#inventoryBody").append(ourRow);

        var quantityPicker = $("#quantity" + id);
        quantityPicker.val(0);
        // quantityPicker.keypress(function(e) {
        //     e.preventDefault();
        // });
        quantityPicker.change(validityCheckCallback(id));

        show_list.push(id);
    }
}

function validityCheckCallback(id) {
    return function() {
        var domElement = $("#quantity" + id);
        if(domElement.val() < domElement.attr("min")) {
            domElement.val(0);
        }
        if(domElement.val() > domElement.attr("max")) {
            console.log("changing " + domElement.val() + " greater than " + domElement.attr("max"));
            domElement.val(domElement.attr("max"));
        }
        checkCheckbox(id);
    }
}

function reorderTable(new_order) {
    for(var i = 0; i < new_order.length; i++) {
        // console.log("i: " + i + " new_order[i]:" + new_order[i]);
        $("#row" + new_order[i]).insertBefore("#inventoryBody tr:nth-child(" + (i + 1) + ")");
        // console.log($("#row" + new_order[i]).html());
    }
}

function checkCheckbox(uuid) {
    console.log("checking validity");
    var quantityInput = $("#quantity" + uuid);
    console.log("uuid: " + uuid + " quantity changed");
    if(quantityInput.val() > 0) {
        $("#checkbox" + uuid).attr("checked", true);
    } else {
        $("#checkbox" + uuid).attr("checked", false);
    }
}

function modifyCart(name, checked) {
    console.log("name: " + name + " checked: " + checked);
    var inCart = cart.indexOf(name);
    if(checked) {
        if(inCart < 0) {
            cart.push(name);
        }
        if($("#quantity" + name).val() == 0) {
            $("#quantity" + name).val(1);
        }
    } else {
        if(inCart > -1) {
            cart.splice(inCart, 1);
        }
        if($("#quantity" + name).val() > 0) {
            $("#quantity" + name).val(0);
        }
    }
}

function viewCart() {
    $("#cart").modal('toggle');
    var table = $("#cartTableBody");
    var tableContents = "";
    for(var i = 0; i < cart.length; i++) {
        console.log("id: " + cart[i]);
        var currentTr = commonReplacements(CART_TR_CONTENTS,
            cart[i],
            $("#name" + cart[i]).text(),
            $("#location" + cart[i]).text(),
            $("#notes" + cart[i]).text(),
            $("#total" + cart[i]).text(),
            $("#quantity" + cart[i]).val(),
            "",
            ""
        );
        console.log(currentTr);
        tableContents += currentTr + "\n";
    }
    table.html(tableContents);
}

function checkOutSubmit() {
    for(var i = 0; i < cart.length; i++) {
        var submit = {
            code: cart[i],
            amount: $("#quantity" + cart[i]).val(),
            checkout: 1,
            user: $("#checkOutUser").val()
        };
        $.post("/change_quantity", submit, checkOutCallback(
            cart[i],
            $("#name" + cart[i]).text(),
            $("#location" + cart[i]).text(),
            submit["amount"]
        ));
    }
    $("#checkOutUser").val("");
}

function checkOutCallback(uuid, name, location, quantity) {
    return function(data) {
        var alert = commonReplacements(CHECK_IN_OUT_CONTENTS, uuid, name, location, "", "", quantity, "from", "out");
        $("#placeToPutIds").html(alert + $("#placeToPutIds").html());
        $("#total" + uuid).text($("#total" + uuid).text() - quantity);
    }
}

function showAddItemsModal() {
    $("#addItem").modal('toggle');
}

function checkInItemsModal() {
    $("#checkIn").modal('toggle');
}

function retrieveCheckInData() {
    $.get("/get_info", {code: $("#checkInItemId").val()}, function(data) {
        var data = JSON.parse(data);
        if(data['data'] == 0) {
            $("#invalidIdAlert").show();
            $("#invalidIdAlert").fadeTo(2000, 500).slideUp(500, function(){
                $("#invalidIdAlert").hide();
            });
        } else {
            $("#checkInItemFinalId").text(data['uuid']);
            $("#checkInItemName").text(data['data'][0]);
            $("#checkInItemLocation").text(data['data'][3]);
            $("#checkInItemNotes").val(data['data'][2]);
            $("#checkInQuantity").val(1);
            $("#checkInTable").show();
        }
    });
}

function checkInItem() {
    var submit = {
        code: $("#checkInItemFinalId").text(),
        amount: $("#checkInQuantity").val(),
        notes: $("#checkInItemNotes").val(),
        checkout: 0,
        user: $("#checkInUser").val()
    };
    console.log("submit: " + submit);
    if(submit["code"] == "") {
        $("#noIdAlert").show();
        $("#noIdAlert").fadeTo(2000, 500).slideUp(500, function(){
            $("#noIdAlert").hide();
        });
    } else {
        $("#checkIn").modal("hide");
        $.post("/change_quantity", submit, function(data) {
            $("#checkInTable").hide();
            var uuid = $("#checkInItemFinalId").text();
            var quantityAdded = $("#checkInQuantity").val();
            var alert = commonReplacements(CHECK_IN_OUT_CONTENTS, uuid, $("#checkInItemName").text(), $("#checkInItemLocation").text(), "", "", quantityAdded, "to", "in");
            $("#placeToPutIds").html(alert + $("#placeToPutIds").html());
            $("#total" + uuid).text($("#total" + uuid).text() - -quantityAdded);
            $("#notes" + uuid).text($("#checkInItemNotes").val());
        });
    }
}

function submitAddItem() {
    var submit = {
        name: $("#addItemName").val(),
        quantity: $("#currentQuantity").val(),
        notes: $("#notes").val(),
        location: $("#location").val(),
        purchase_link: $("#buyLink").val(),
        image_link: $("#imageLink").val()
    };
    if(submit["name"] == "") {
        $("#addItemsError").text("You must enter a name.");
        showAddItemsError();
        return;
    } else if(submit["location"] == "") {
        showAddItemsError();
        $("#addItemsError").text("You must enter a location.");
        return;
    }
    $.post("/add", submit, addItemsCallback(submit["name"], submit["quantity"], submit["location"]));
    $("#addItem").modal("hide");
    $("#addItemName").val("");
    $("#currentQuantity").val(0);
    $("#notes").val("");
    $("#location").val("");
    $("#buyLink").val("");
    $("#imageLink").val("");
}

function addItemsCallback(name, quantity, location) {
    return function(data) {
        var data = JSON.parse(data);
        var placeForIds = $("#placeToPutIds");
        var currentText = commonReplacements(SHOW_ID_CONTENTS, data["uuid"], name, location, "", "", quantity, "", "");
        placeForIds.html(placeForIds.html() + currentText);
        $.get("/get_info", {code: data["uuid"]}, function(data) {
            var thing = JSON.parse(data);
            addItemToList(thing["uuid"], thing["data"]);
        })
    }
}

function showAddItemsError() {
    $("#invalidItemsThing").show();
    $("#invalidItemsThing").fadeTo(2000, 500).slideUp(500, function(){
        $("#invalidItemsThing").hide();
    });
}
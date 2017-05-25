#!/usr/bin/env python3
"""
Inventory system for FRC Team 4099.
"""

from flask import Flask, render_template, request, Response, session
from flask_session import Session
from flask_bower import Bower
from json import load, dump, dumps, decoder
from jellyfish import jaro_winkler

app = Flask(__name__)
bower = Bower(app)
sess = Session(app)

ITEM_DATA = "items.json"
LOG_FILE = "log.log"
MAX_ITEMS = 10000


@app.route("/login", methods=["POST"])
def login():
    passwd = request.form.get("passwd")
    # print("passwd:", request.args.get("passwd"))
    if passwd == "8d56e58b448bcda2cf79b94abb3451d7":
        session["admin"] = True
    else:
        session["admin"] = False
    return dumps({"success": session["admin"]})


@app.route("/search", methods=["GET"])
def search():
    print("request.args:", request.args)
    query = request.args.get("query")
    print("query:", query)
    if query.startswith("$"):
        num = query[1:]
        try:
            if int(num) > 9999:
                return [], 200
            return dumps([i for i in range(MAX_ITEMS) if str(i).startswith(num) or ("%04d" % str(i)).startswith(num)]), 200
        except:
            return dumps([]), 200
    else:
        return dumps(sorted(list(filter(lambda i: data[i], range(MAX_ITEMS))), key=lambda i: jaro_winkler(data[i][0], query),
                      reverse=True)), 200


@app.route("/add", methods=["POST"])
def add():
    if not session.get("admin", False):
        print("non admin tried to add item")
        return
    global data
    for code, l in enumerate(data):
        if l == 0:
            break
    name = request.form.get("name", "")
    quantity = int(request.form.get("quantity", "1"))
    notes = request.form.get("notes", "")
    location = request.form.get("location", "")
    purchase_link = request.form.get("purchase_link", "")
    image_link = request.form.get("image_link", "")
    data[code] = [name, quantity, notes, location, purchase_link, image_link]
    print(data[code])
    with open(ITEM_DATA, "w") as file:
        dump(data, file)
    with open(LOG_FILE, "a") as log:
        log.write("Admin added " + str(quantity) + " of item #" + str(code) + " (" + name + ").\n")
    return dumps({"uuid": code}), 200


@app.route("/remove", methods=["POST"])
def remove():
    if not session.get("admin", False):
        return
    global data
    code = int(request.form.get("code"))
    with open(LOG_FILE, "a") as log:
        log.write("Admin removed item #" + str(code) + " (" + data[code][0] + ").\n")
    data[code] = None
    with open(ITEM_DATA, "w") as file:
        dump(data, file)
    return "success", 200


@app.route("/get_info")
def get_info():
    code = int(request.args.get("code"))
    return dumps({"uuid": code, "data": data[code]}), 200


@app.route("/get_all")
def get_all():
    return dumps(data), 200


@app.route("/change_quantity", methods=["POST"])
def change_quantity():
    global data
    code = int(request.form['code'])
    amount = int(request.form['amount'])
    checkout = int(request.form['checkout']) != 0
    notes = request.form.get('notes', "")
    user = request.form.get('user', "")
    print("code;", code)
    print("data[code]:", data[code])
    if checkout:
        data[code][1] -= amount
    else:
        data[code][1] += amount
    if notes != "":
        data[code][2] = notes
    with open(ITEM_DATA, "w") as file:
        dump(data, file)
    with open(LOG_FILE, "a") as log:
        if user is None:
            log.write(user + " changed the quantity of item #" + str(code) + " (" + data[code][0] + ") by " + "-" * checkout + str(data[code][1]) + ".\n")
        else:
            log.write("Quantity of item #" + str(code) + " (" + data[code][0] + ") changed by " + "-" * checkout + str(data[code][1]) + ".\n")
    return "success", 200


@app.route("/log")
def get_log():
    try:
        with open(LOG_FILE, "r") as log:
            return log.read(), 200
    except:
        open(LOG_FILE, "w").close()
        return "", 404


@app.route("/")
def index():
    """
    The Flask endpoint for main page for video streamer
    :return: the rendered form of the index.html page
    """
    return render_template("index.html")

if __name__ == "__main__":
    with open(ITEM_DATA) as file:
        try:
            data = load(file)
        except decoder.JSONDecodeError:
            data = [0]*10000
            open(ITEM_DATA, "w").close()
    app.secret_key = b'\xfa\xb3\xecwR\xcfh\xa8\xd1\x16A\xb0A\x1e\x1d\xa0?\xfe\x88IP\xf3\x8c\xf1'
    app.config['SESSION_TYPE'] = 'filesystem'
    sess.init_app(app)

    app.run("0.0.0.0", debug=True, port=8080, threaded=True)

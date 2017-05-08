#!/usr/bin/env python3
"""
Inventory system for FRC Team 4099.
"""

from flask import Flask, render_template, request, Response
from flask_bower import Bower
from json import load, dump, dumps, decoder
from jellyfish import jaro_winkler

app = Flask(__name__)
Bower(app)

ITEM_DATA = "items.json"
LOG_FILE = "log.log"
MAX_ITEMS = 10000


@app.route("/search", methods=['GET'])
def search():
    query = request.args['query']
    if query.startswith("#"):
        num = query[1:]
        try:
            if int(num) > 9999:
                return [], 200
            return [i for i in range(MAX_ITEMS) if str(i).startswith(num) or ("%04d" % str(i)).startswith(num)], 200
        except:
            return [], 200
    else:
        return sorted(list(range(MAX_ITEMS)), key=lambda i: jaro_winkler(data[i][0], query), reverse=True), 200


@app.route("/add", methods=['POST'])
def add():
    global data
    for code, l in enumerate(data):
        if l == 0:
            break
    name = request.form.get('name', '')
    quantity = int(request.form.get('quantity', '1'))
    notes = request.form.get('notes', '')
    location = request.form.get('location', '')
    purchase_link = request.form.get('purchase_link', '')
    image_link = request.form.get('image_link', '')
    data[code] = [name, quantity, notes, location, purchase_link, image_link]
    print(data[code])
    with open(ITEM_DATA, "w") as file:
        dump(data, file)
    with open(LOG_FILE, "a") as log:
        log.write("Admin added " + str(quantity) + " of item #" + str(code) + " (" + name + ").")
    return "", 200


@app.route("/remove", methods=['POST'])
def remove():
    global data
    code = int(request.form['code'])
    with open(LOG_FILE, "a") as log:
        log.write("Admin removed item #" + str(code) + " (" + data[code][0] + ").")
    data[code] = None
    with open(ITEM_DATA, "w") as file:
        dump(data, file)


@app.route("/get_info")
def get_info(code: int):
    return data[code]


@app.route("/get_all")
def get_all():
    return dumps(data)


@app.route("/change_quantity")
def change_quantity(code: int, amount: int, checkout: bool=True, user: str=None):
    global data
    if checkout:
        data[code] -= amount
    else:
        data[code] += amount
    with open(ITEM_DATA, "w") as file:
        dump(data, file)
    with open(LOG_FILE, "a") as log:
        if user is None:
            log.write(user + " changed the quantity of item #" + str(code) + " (" + data[code][0] + ") by " + "-" * checkout + str(data[code][1]) + ".")
        else:
            log.write("Quantity of item #" + str(code) + " (" + data[code][0] + ") changed by " + "-" * checkout + str(data[code][1]) + ".")


@app.route("/log")
def get_log():
    try:
        with open(LOG_FILE, "r") as log:
            return log.read()
    except:
        open(LOG_FILE, "w").close()
        return ""


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
    app.run("0.0.0.0", debug=True, port=8080, threaded=True)

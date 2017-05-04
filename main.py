#!/usr/bin/env python3
"""
Inventory system for FRC Team 4099.
"""

from flask import Flask, render_template, Response
from flask.ext.bower import Bower
from json import load, dump, dumps
from jellyfish import jaro_winkler

app = Flask(__name__)
ITEM_DATA = "items.json"
LOG_FILE = ".log"
MAX_ITEMS = 10000

def search(query: str):
    if query.startswith("#"):
        num = query[1:]
        try:
            if int(num) > 9999:
                return []
            return [i for i in range(MAX_ITEMS) if str(i).startswith(num) or ("%04d" % str(i)).startswith(num)]
        except:
            return []
    else:
        return sorted(list(range(MAX_ITEMS)), key=lambda i: jaro_winkler(data[i][0], query), reverse=True)

def add(code: int, name: str, quantity: int=1, description: str=""):
    global data
    data[code] = [name, quantity, description]
    with open(ITEM_DATA, "w") as file:
        json.dump(file)
    with open(LOG_FILE, "a") as log:
        log.write("Admin added " + str(quantity) + " of item #" + str(code) + " (" + name + ").")

def remove(code: int):
    global data
    with open(LOG_FILE, "a") as log:
        log.write("Admin removed item #" + str(code) + " (" + data[code][0] + ").")
    data[code] = None
    with open(ITEM_DATA, "w") as file:
        json.dump(file)

def get_info(code: int):
    return data[code]

def get_all():
    return dumps(data)

def change_quantity(code: int, amount: int, checkout: bool=True, user: str=None):
    global data
    if checkout:
        data[code] -= amount
    else:
        data[code] += amount
    with open(ITEM_DATA, "w") as file:
        json.dump(file)
    with open(LOG_FILE, "a") as log:
        if user != None:
            log.write(user + " changed the quantity of item #" + str(code) + " (" + name + ") by " + "-" * checkout + str(quantity) + ".")
        else:
            log.write("Quantity of item #" + str(code) + " (" + name + ") changed by " + "-" * checkout + str(quantity) + ".")

def get_log():
    try:
        with open(LOG_FILE, "r") as log:
            return log.read()
    except:
        open(LOG_FILE, "w").close()
        return ""

@app.errorhandler(Exception)
def all_exception_handler(error):
    print(error)
    return "-1", 500

@app.route("/")
def index():
    """
    The Flask endpoint for main page for video streamer
    :return: the rendered form of the index.html page
    """
    return render_template("index.html")

if __name__ == "__main__":
    try:
        with open(ITEM_DATA):
            data = load(file)
    except FileNotFoundError:
        data = [0]*10000
        open(ITEM_DATA, "w").close()
    app.run("0.0.0.0", debug=True, port=8080, threaded=True)

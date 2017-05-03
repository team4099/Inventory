#!/usr/bin/env python3
"""

"""

from flask import Flask, render_template, Response
from flask.ext.bower import Bower

app = Flask(__name__)


@app.errorhandler(Exception)
def all_exception_handler(error):
    """
    Flask endpoint for catching all errors to prevent crashes on robot or streamer
    :param error: Error that was caught
    :return: -1 and error code
    """
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
    app.run("0.0.0.0", debug=True, port=8080, threaded=True)

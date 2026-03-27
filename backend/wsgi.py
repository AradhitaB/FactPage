"""
PythonAnywhere WSGI entry point.

PythonAnywhere's free tier runs WSGI servers. FastAPI is ASGI.
a2wsgi wraps the ASGI app transparently — no features are lost for this app
(we don't use WebSockets or long-polling).

PythonAnywhere WSGI config should point to this file and set
the working directory to the backend/ folder.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from a2wsgi import ASGIMiddleware  # noqa: E402
from main import app               # noqa: E402

application = ASGIMiddleware(app)

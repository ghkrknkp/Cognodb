import os
from contextlib import asynccontextmanager
from neo4j import GraphDatabase, exceptions as neo4j_exc
from dotenv import load_dotenv

load_dotenv()

COGNODB_URI = os.getenv("COGNODB_URI", "")
COGNODB_USER = os.getenv("COGNODB_USER", "cognodb")
COGNODB_PASSWORD = os.getenv("COGNODB_PASSWORD", "")

_driver = None


def get_driver():
    global _driver
    if _driver is None:
        if not COGNODB_URI or not COGNODB_PASSWORD:
            raise EnvironmentError(
                "COGNODB_URI and COGNODB_PASSWORD must be set in environment variables."
            )
        _driver = GraphDatabase.driver(
            COGNODB_URI,
            auth=(COGNODB_USER, COGNODB_PASSWORD),
            max_connection_pool_size=20,
            connection_timeout=10,
        )
    return _driver


def close_driver():
    global _driver
    if _driver:
        _driver.close()
        _driver = None


def get_session():
    return get_driver().session()

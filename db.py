
import mysql.connector

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="Sivaram@2008",
        database="mystery_room"
    )

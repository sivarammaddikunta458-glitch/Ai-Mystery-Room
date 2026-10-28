from flask import Flask, jsonify, request
from db import get_db_connection

app = Flask(__name__)

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response

@app.route("/")
def home():
    return jsonify({
        "message": "Welcome to AI Mystery Room!",
        "status": "Backend is running"
    })

@app.route("/api/health")
def health():
    return jsonify({
        "status": "success",
        "message": "AI Mystery Room API is working!"
    })


@app.route("/api/cases", methods=["POST"])
def create_case():
    data = request.get_json(silent=True) or {}
    difficulty = data.get("difficulty", "Easy")

    settings = {
        "Easy": {"suspects": 3, "clues": 5, "hints": 2},
        "Medium": {"suspects": 4, "clues": 7, "hints": 3},
        "Hard": {"suspects": 5, "clues": 9, "hints": 3}
    }

    if difficulty not in settings:
        return jsonify({"error": "Choose Easy, Medium, or Hard."}), 400

    story = "A valuable diamond disappeared from the royal museum last night."

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        sql = """
            INSERT INTO game_progress (difficulty, story)
            VALUES (%s, %s)
        """

        cursor.execute(sql, (difficulty, story))
        connection.commit()

        game_id = cursor.lastrowid

        return jsonify({
            "message": "Mystery created and saved!",
            "game_id": game_id,
            "difficulty": difficulty,
            "settings": settings[difficulty],
            "story": story,
            "suspects": [
                {"id": 1, "name": "Alex", "role": "Museum guard"},
                {"id": 2, "name": "Maya", "role": "Museum researcher"},
                {"id": 3, "name": "Ryan", "role": "Museum visitor"}
            ]
        }), 201

    except Exception as e:
        app.logger.exception("Could not save game progress")
        return jsonify({
            "error": "Could not save game to MySQL. Check the backend terminal."
        }), 500

    finally:
        if cursor is not None:
            cursor.close()
        if connection is not None and connection.is_connected():
            connection.close()
            
@app.route("/api/solve", methods=["POST"])
def solve_case():
    data = request.get_json(silent=True) or {}

    game_id = data.get("game_id")
    chosen_suspect = data.get("chosen_suspect")

    if not game_id or chosen_suspect not in ["Alex", "Maya", "Ryan"]:
        return jsonify({"error": "Invalid game ID or suspect."}), 400

    is_solved = chosen_suspect == "Maya"

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        sql = """
            UPDATE game_progress
            SET chosen_suspect = %s, is_solved = %s
            WHERE id = %s
        """

        cursor.execute(sql, (chosen_suspect, is_solved, game_id))
        connection.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "Game not found."}), 404

        return jsonify({
            "message": "Answer saved successfully!",
            "chosen_suspect": chosen_suspect,
            "is_solved": is_solved
        })

    except Exception:
        app.logger.exception("Could not save answer")
        return jsonify({"error": "Could not save answer to MySQL."}), 500

    finally:
        if cursor is not None:
            cursor.close()
        if connection is not None and connection.is_connected():
            connection.close()


if __name__ == "__main__":
    app.run(debug=True)

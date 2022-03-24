from decouple import config
from flask import abort, Blueprint, jsonify, \
                  make_response, request, session
import mysql.connector.pooling


bp = Blueprint("apis_bp", __name__)

CONFIG = {
    "user": config("MYSQLUSER"),
    "password": config("PASSWORD"),
    "host": config("HOST"),
    "database": config("DATABASE")
}

cnx_pool = mysql.connector.pooling.MySQLConnectionPool(
    pool_name = "mypool",
    pool_size = 5,
    **CONFIG
)


def query(cmd, content):
    try:
        cnx = cnx_pool.get_connection()
        cursor = cnx.cursor()
        cursor.execute(cmd, content)
        return cursor.fetchall()
    finally:
        if cnx.is_connected():
            cursor.close()
        if cnx:
            cnx.close()


def update(cmd, content):
    try:
        cnx = cnx_pool.get_connection()
        cursor = cnx.cursor()
        cursor.execute(cmd, content)
        cnx.commit()
    except:
        cnx.rollback()
    finally:
        if cnx.is_connected():
            cursor.close()
        if cnx:
            cnx.close()


@bp.route("/api/attractions", methods=["GET"])
def get_attractions():
    page = int(request.args.get("page", 0))
    keyword = request.args.get("keyword", '')
    
    query_cmd = '''
        SELECT * FROM taipei_attractions 
        WHERE locate(%(keyword)s, name)
        LIMIT %(start)s, %(end)s;
    ''' 
    query_content = {
        "keyword": keyword,
        "start": 12*page,
        "end": 12+1
    }
    query_results = query(query_cmd, query_content)
    if len(query_results) > 12:
        next_page = page+1
        query_results = query_results[:-1]
    else:
        next_page = None
    res = {"nextPage": next_page, "data": []}
    for query_result in query_results:
        res["data"].append({
            "id":  query_result[0],
            "name":  query_result[1],
            "category":  query_result[2],
            "description":  query_result[3],
            "address":  query_result[4],
            "transport":  query_result[5],
            "mrt":  query_result[6],
            "latitude":  query_result[7],
            "longitude":  query_result[8],
            "images": [f"https://{url}" for url in query_result[9].split("https://")[1:]]
        })
    
    return jsonify(res)
    

@bp.route("/api/attraction/<attractionId>", methods=["GET"])
def get_attraction_by_id(attractionId):
    attraction_id = int(attractionId)

    query_cmd = '''
        SELECT * FROM taipei_attractions 
        WHERE id=%(id)s
        LIMIT 1;
    ''' 
    query_content = {
        "id": attraction_id
    }
    query_results = query(query_cmd, query_content)

    if query_results:
        query_result = query_results[0]
        res = {"data": {
            "id":  query_result[0],
            "name":  query_result[1],
            "category":  query_result[2],
            "description":  query_result[3],
            "address":  query_result[4],
            "transport":  query_result[5],
            "mrt":  query_result[6],
            "latitude":  query_result[7],
            "longitude":  query_result[8],
            "images": [f"https://{url}" for url in query_result[9].split("https://")[1:]]
        }}
        
        return jsonify(res)
    else:
        abort(400, {"msg": "景點編號不正確"})


@bp.route("/api/user", methods=["GET"])
def get_signin_info():
    is_logging_in = session.get("is_logging_in", False)
    data = {"data": None}
    if is_logging_in:
        data["data"] = {
            "id": session["id"],
            "name": session["name"],
            "email": session["username"]
        }
    response = make_response(jsonify(data), 200)   
    response.headers["Content-Type"] = "application/json"
    return response


@bp.route("/api/user", methods=["POST"])
def signup_new_user():
    req = request.json
    name = req["name"]
    email = req["email"]
    pswd = req["password"]

    if not (name and email and pswd):
        abort(400, {"msg": "資料填寫不完整"})

    query_cmd = '''
        SELECT *
        FROM member 
        WHERE username=%(username)s;
    ''' 
    query_content = {
        "username": email
    }
    query_result = query(query_cmd, query_content)
    if not query_result:
        insert_cmd = '''
        INSERT INTO member (name, username, password) 
                    values (%(name)s, %(username)s, %(password)s);
        ''' 
        insert_content = {
            "name": name,
            "username": email,
            "password": pswd
        }
        update(insert_cmd, insert_content)
        response = make_response(jsonify({"ok": True}), 200)   
        response.headers["Content-Type"] = "application/json"
        return response
    else:
        abort(400, {"msg": "此 Email 已註冊過帳戶"})


@bp.route("/api/user", methods=["PATCH"])
def signin_user():
    req = request.json
    email = req["email"]
    pswd = req["password"]

    if not (email and pswd):
        abort(400, {"msg": "請輸入帳號及密碼"})

    query_cmd = '''
        SELECT id, name, username, password
        FROM member 
        WHERE username=%(username)s;
    ''' 
    query_content = {
        "username": email,
    }
    query_result = query(query_cmd, query_content)
    if not query_result:
        abort(400, {"msg": "查無此帳號，請重新輸入"})
    else:
        q_id, q_name, q_acct, q_pswd = query_result[0]

        if q_pswd != pswd:
            abort(400, {"msg": "密碼錯誤，請重新輸入"})
        else:
            session["id"] = q_id
            session["name"] = q_name
            session["username"] = q_acct
            session["is_logging_in"] = True

            response = make_response(jsonify({"ok": True}), 200)   
            response.headers["Content-Type"] = "application/json"
            return response


@bp.route("/api/user", methods=["DELETE"])
def logout_user():
    session["id"] = ''
    session["name"] = ''
    session["username"] = ''
    session["is_logging_in"] = False

    response = make_response(jsonify({"ok": True}), 200)   
    response.headers["Content-Type"] = "application/json"
    return response


@bp.errorhandler(400)
def internal_server_error(error):
    error_msg = {
        "error": True,
        "message": error.description["msg"]
    }
    return error_msg


@bp.errorhandler(500)
def internal_server_error(error):
    error_msg = {
        "error": True,
        "message": "伺服器內部錯誤"
    }
    return error_msg

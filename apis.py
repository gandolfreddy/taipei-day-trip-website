from decouple import config
from flask import abort, Blueprint, jsonify, \
                  make_response, request, session
import mysql.connector.pooling
import json


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

        session["attraction_name"] = res["data"]["name"]
        session["attraction_address"] = res["data"]["address"]
        session["attraction_image"] = res["data"]["images"][0]
        
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
    session["id"] = None
    session["name"] = None
    session["username"] = None
    session["is_logging_in"] = False

    response = make_response(jsonify({"ok": True}), 200)   
    response.headers["Content-Type"] = "application/json"
    return response


@bp.route("/api/booking", methods=["GET"])
def get_unbooking_schedule():
    is_logging_in = session.get("is_logging_in", False)

    if not is_logging_in:
        abort(403, {"msg": "未登入系統，拒絕存取"})

    query_cmd = '''
        SELECT content FROM schedule
        INNER JOIN member 
        ON schedule.member_id=%(member_id)s limit 1;
    ''' 
    query_content = {
        "member_id": session["id"],
    }
    query_result = query(query_cmd, query_content)

    data = {"data": None}
    if is_logging_in and query_result:
        schedule = json.loads(query_result[0][0])["data"]

        data["data"] = {
            "attraction": {
                "id": schedule["attraction"]["attraction_id"],
                "name": schedule["attraction"]["attraction_name"],
                "address": schedule["attraction"]["attraction_address"],
                "image": schedule["attraction"]["attraction_image"]
            },
            "date": schedule["date"],
            "time": schedule["time"],
            "price": schedule["price"]
        }

    response = make_response(jsonify(data), 200)   
    response.headers["Content-Type"] = "application/json"
    return response


@bp.route("/api/booking", methods=["POST"])
def build_new_schedule():
    req = request.json
    attraction_id = req["attractionId"]
    date = req["date"]
    time = req["time"]
    price = req["price"]

    '''
    Create this table first.

        create table schedule (
            id bigint auto_increment, 
            member_id bigint not null,
            content text not null, 
            time datetime not null default (now()), 
            primary key (id),
            foreign key (member_id) references member (id)
        );

    '''

    if date:
        schedule = {
            "data": {
                "attraction": {
                    "attraction_id": attraction_id,
                    "attraction_name": session["attraction_name"],
                    "attraction_address": session["attraction_address"],
                    "attraction_image": session["attraction_image"]
                },
                "date": date,
                "time": time,
                "price":  price
            }
        }

        session["attraction_name"] = ''
        session["attraction_address"] = ''
        session["attraction_image"] = ''

        schedule_jsonify = json.dumps(schedule)

        insert_cmd = '''
        INSERT INTO schedule (member_id, content) 
                    values (%(member_id)s, %(content)s);
        ''' 
        insert_content = {
            "member_id": session["id"],
            "content": schedule_jsonify
        }
        update(insert_cmd, insert_content)

        response = make_response(jsonify({"ok": True}), 200)   
        response.headers["Content-Type"] = "application/json"
        return response
    abort(400, {"msg": "未選擇預約日期"})


@bp.route("/api/booking", methods=["DELETE"])
def delete_current_schedule():
    delete_cmd = '''
    DELETE FROM schedule 
    WHERE member_id=%(member_id)s;
    ''' 
    delete_content = {
        "member_id": session["id"],
    }
    update(delete_cmd, delete_content)

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


@bp.errorhandler(403)
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

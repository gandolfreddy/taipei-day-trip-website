from datetime import datetime
from decouple import config
from flask import abort, Blueprint, jsonify, \
                  make_response, request, session
import mysql.connector.pooling
import json
import requests



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
    update_result = False
    try:
        cnx = cnx_pool.get_connection()
        cursor = cnx.cursor()
        cursor.execute(cmd, content)
        cnx.commit()
        update_result = True
    except:
        cnx.rollback()
    finally:
        if cnx.is_connected():
            cursor.close()
        if cnx:
            cnx.close()
        return update_result


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


@bp.route("/api/orders", methods=["POST"])
def create_new_order():
    is_logging_in = session.get("is_logging_in", False)
    if not is_logging_in:
        abort(403, {"msg": "未登入系統，拒絕存取"})

    '''req
    {
        "prime": "前端從第三方金流 TapPay 取得的交易碼",
        "order": {
            "price": 2000,
            "trip": {
                "attraction": {
                    "id": 10,
                    "name": "平安鐘",
                    "address": "臺北市大安區忠孝東路 4 段",
                    "image": "https://yourdomain.com/images/attraction/10.jpg"
                },
                "date": "2022-01-31",
                "time": "afternoon"
            },
            "contact": {
                "name": "彭彭彭",
                "email": "ply@ply.com",
                "phone": "0912345678"
            }
        }
    }
    '''
    req = request.json
    contact_phone = req["order"]["contact"]["phone"]
    contact_name = req["order"]["contact"]["name"]
    contact_email = req["order"]["contact"]["email"]
    if not (contact_phone and contact_name and contact_email):
        abort(400, {"msg": "訂單建立失敗，請輸入完整聯絡資訊"})
    
    '''tappay_req_body
    {
        "prime": String,
        "partner_key": String,
        "merchant_id": "merchantA",
        "amount": 100,
        "details":"TapPay Test",
        "cardholder": {
            "phone_number": "+886923456789",
            "name": "王小明",
            "email": "LittleMing@Wang.com"
        }
    }
    '''
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    tappay_req_body = {
        "prime": req["prime"],
        "partner_key": config("PARTNER_KEY"),
        "merchant_id": "gandolfreddy_CTBC",
        # "merchant_id": "gandolfreddy_EASY_WALLET", ## for testing fail to pay
        "amount": req["order"]["price"],
        "details": f"{timestamp}",
        "cardholder": {
            "phone_number": contact_phone,
            "name": contact_name,
            "email": contact_email
        }
    }

    '''data
    {
        "data": {
            "number": "20210425121135",
            "payment": {
                "status": 0,
                "message": "付款成功"
            }
        }
    }
    '''
    data = {
        "data": {
            "number": f"{timestamp}",
            "payment": {
                "status": 1, ## for not paid yet
                "message": ""
            }
        }
    }
    
    url = "https://sandbox.tappaysdk.com/tpc/payment/pay-by-prime"
    headers = {
        "Content-Type": "application/json",
        "x-api-key": config("PARTNER_KEY"),
    }
    tappay_res = requests.post(url, json=tappay_req_body, headers=headers).json()

    '''tappay_res
    {
        'status': 0, 
        'msg': 'Success', 
        'amount': 2000, 
        'acquirer': 'TW_TAISHIN', 
        'currency': 'TWD', 
        'rec_trade_id': 'D20220406FrCIQx', 
        'bank_transaction_id': 'TP20220406FrCIQx', 
        'order_number': '', 
        'auth_code': '085289', 
        'card_info': {
            'issuer': '', 
            'funding': 0, 
            'type': 1, 
            'level': '', 
            'country': 'UNITED KINGDOM', 
            'last_four': '4242', 
            'bin_code': '424242', 
            'issuer_zh_tw': '', 
            'bank_id': '', 
            'country_code': 'GB'
        }, 
        'transaction_time_millis': 1649270426071, 
        'bank_transaction_time': {
            'start_time_millis': '1649270426114', 
            'end_time_millis': '1649270426114'
        }, 
        'bank_result_code': '', 
        'bank_result_msg': '', 
        'card_identifier': '4bb1f87f3e0d40b1be156560fdf1c1e9', 
        'merchant_id': 'gandolfreddy_TAISHIN', 
        'is_rba_verified': False, 
        'transaction_method_details': {
            'transaction_method_reference': 'REQUEST', 
            'transaction_method': 'FRICTIONLESS'
        }
    }
    '''
    if tappay_res["status"] == 0:
        '''Create this table first.

            create table orders (
                id bigint auto_increment, 
                order_id bigint not null,
                content text not null, 
                time datetime not null default (now()), 
                primary key (id)
            );

        '''
        data["data"]["payment"]["status"] = 0
        data["data"]["payment"]["message"] = "付款成功"

        order_jsonify = json.dumps({
            "number": data["data"]["number"],
            "price": req["order"]["price"],
            "trip": req["order"]["trip"],
            "contact": req["order"]["contact"],
            "status": data["data"]["payment"]["status"]
        })

        insert_cmd = '''
        INSERT INTO orders (order_id, content) 
                    values (%(order_id)s, %(content)s);
        ''' 
        insert_content = {
            "order_id": data["data"]["number"],
            "content": order_jsonify
        }
        if update(insert_cmd, insert_content):
            delete_cmd = '''
            DELETE FROM schedule 
            WHERE member_id=%(member_id)s;
            ''' 
            delete_content = {
                "member_id": session["id"],
            }
            update(delete_cmd, delete_content)
    else:
        data["data"]["payment"]["status"] = 1
        data["data"]["payment"]["message"] = "付款失敗"

    response = make_response(jsonify(data), 200)
    response.headers["Content-Type"] = "application/json"
    return response


@bp.route("/api/order/<orderNumber>", methods=["GET"])
def get_order_detail(orderNumber):
    order_number = orderNumber
    is_logging_in = session.get("is_logging_in", False)
    if not is_logging_in:
        abort(403, {"msg": "未登入系統，拒絕存取"})

    query_cmd = '''
        SELECT content FROM orders
        WHERE order_id=%(order_id)s limit 1;
    ''' 
    query_content = {
        "order_id": order_number,
    }
    query_result = query(query_cmd, query_content)

    data = {"data": None}
    if query_result:
        data["data"] = json.loads(query_result[0][0])

    response = make_response(jsonify(data), 200)   
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

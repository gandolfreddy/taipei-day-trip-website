from decouple import config
from flask import Blueprint, jsonify
from flask import request
from flask import abort
import mysql.connector.pooling


bp = Blueprint("apis_bp", __name__)

CONFIG = {
    "user": config("USER"),
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
        WHERE locate(%(keyword)s, name);
    ''' 
    query_content = {
        "keyword": keyword
    }
    query_results = query(query_cmd, query_content)[12*page:12*(page+1)]
    
    next_page = page+1 if len(query_results)==12 else None
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
        WHERE id=%(id)s;
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
        abort(400)



@bp.errorhandler(400)
def internal_server_error(error):
    error_msg = {
        "error": True,
        "message": "景點編號不正確"
    }
    return error_msg


@bp.errorhandler(500)
def internal_server_error(error):
    error_msg = {
        "error": True,
        "message": "伺服器內部錯誤"
    }
    return error_msg
